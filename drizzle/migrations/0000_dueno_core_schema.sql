-- ========== ENUMS ==========
create type public.app_role as enum ('admin', 'user');
create type public.invoice_status as enum ('pending','active','overdue','pending_manual_confirmation','paid','cancelled');
create type public.invoice_source as enum ('manual','excel_upload');
create type public.msg_channel as enum ('whatsapp','email','system');
create type public.msg_direction as enum ('outbound','inbound','system');
create type public.followup_stage as enum ('first','followup_1','followup_2','final');

-- ========== ROLES ==========
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- ========== PROFILES ==========
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text,
  business_name text,
  contact_details text,
  logo_path text,
  stripe_account_id text,
  stripe_onboarding_complete boolean not null default false,
  receipt_fields jsonb not null default '{"business_name":true,"logo":false,"invoice_ref":true,"amount_paid":true,"date_paid":true,"payer_name":true,"thank_you":"Thank you for your payment.","contact_details":false}'::jsonb,
  receipt_template_complete boolean not null default false,
  digest_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (user_id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Protect sensitive/server-owned columns from client writes
create or replace function public.profiles_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_setting('role', true) = 'authenticated' then
    new.user_id := old.user_id;
    new.stripe_account_id := old.stripe_account_id;
    new.stripe_onboarding_complete := old.stripe_onboarding_complete;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger profiles_guard_trg before update on public.profiles
for each row execute function public.profiles_guard();

-- Auto-create profile + default role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email, business_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email,''), '@', 1)))
  on conflict (user_id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ========== CLIENTS ==========
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  whatsapp_number text,
  email text,
  created_at timestamptz not null default now(),
  constraint clients_contact_required check (
    coalesce(nullif(trim(whatsapp_number), ''), nullif(trim(email), '')) is not null
  ),
  constraint clients_name_len check (char_length(trim(name)) between 1 and 200)
);
create index clients_user_idx on public.clients(user_id);
grant select, insert, update, delete on public.clients to authenticated;
grant all on public.clients to service_role;
alter table public.clients enable row level security;
create policy "own clients select" on public.clients for select to authenticated using (user_id = auth.uid());
create policy "own clients insert" on public.clients for insert to authenticated with check (user_id = auth.uid());
create policy "own clients update" on public.clients for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own clients delete" on public.clients for delete to authenticated using (user_id = auth.uid());

-- ========== INVOICES ==========
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  client_id uuid not null references public.clients(id) on delete cascade,
  reference text,
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 100000000000),
  currency text not null default 'usd' check (char_length(currency) = 3),
  description text,
  due_date date not null,
  status public.invoice_status not null default 'pending',
  source public.invoice_source not null default 'manual',
  file_path text,
  preferred_channel public.msg_channel,
  payment_link_url text,
  stripe_session_id text,
  stripe_payment_intent_id text,
  public_token text not null default encode(gen_random_bytes(32), 'hex'),
  paid_at timestamptz,
  receipt_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index invoices_public_token_idx on public.invoices(public_token);
create index invoices_user_idx on public.invoices(user_id);
create index invoices_client_idx on public.invoices(client_id);
grant select, insert, update on public.invoices to authenticated;
grant all on public.invoices to service_role;
alter table public.invoices enable row level security;
create policy "own invoices select" on public.invoices for select to authenticated using (user_id = auth.uid());
create policy "own invoices insert" on public.invoices for insert to authenticated with check (user_id = auth.uid());
create policy "own invoices update" on public.invoices for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Enforce cross-table ownership: an invoice's client must belong to the same user.
create or replace function public.invoices_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from public.clients where id = new.client_id;
  if owner is null or owner <> new.user_id then
    raise exception 'client does not belong to this user';
  end if;
  if tg_op = 'UPDATE' and current_setting('role', true) = 'authenticated' then
    new.user_id := old.user_id;
    new.client_id := old.client_id;
    new.public_token := old.public_token;
    new.payment_link_url := old.payment_link_url;
    new.stripe_session_id := old.stripe_session_id;
    new.stripe_payment_intent_id := old.stripe_payment_intent_id;
    new.paid_at := old.paid_at;
    new.receipt_path := old.receipt_path;
    -- users may only cancel; all other status transitions are server-owned
    if new.status <> old.status and new.status <> 'cancelled' then
      new.status := old.status;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger invoices_guard_trg before insert or update on public.invoices
for each row execute function public.invoices_guard();

-- ========== MESSAGES (append-only) ==========
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  channel public.msg_channel not null,
  direction public.msg_direction not null,
  body text not null,
  template_key text,
  attachment_path text,
  provider_message_id text,
  created_at timestamptz not null default now()
);
create index messages_invoice_idx on public.messages(invoice_id, created_at);
grant select on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "own messages select" on public.messages for select to authenticated using (user_id = auth.uid());

-- ========== WHATSAPP TEMPLATE VARIANTS ==========
create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  stage public.followup_stage not null,
  template_key text not null,
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (template_key)
);
grant select on public.message_templates to authenticated;
grant all on public.message_templates to service_role;
alter table public.message_templates enable row level security;
create policy "templates readable" on public.message_templates for select to authenticated using (true);
create policy "admins manage templates" on public.message_templates for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

insert into public.message_templates (stage, template_key, body) values
 ('first','dueno_first_v1','Hi {{payer}}, this is DuenoPay on behalf of {{business}}. Invoice {{ref}} for {{amount}} is due {{due}}. You can pay here: {{link}}. Any questions?'),
 ('first','dueno_first_v2','Hello {{payer}} — DuenoPay here, messaging for {{business}}. {{amount}} is outstanding on invoice {{ref}}, due {{due}}. Secure payment link: {{link}}. Does that look right to you?'),
 ('followup_1','dueno_f1_v1','Hi {{payer}}, a quick nudge from DuenoPay for {{business}}: invoice {{ref}} ({{amount}}) is still open. Pay here: {{link}}. Anything holding it up?'),
 ('followup_1','dueno_f1_v2','Hello {{payer}}, DuenoPay following up for {{business}} on {{amount}} for invoice {{ref}}. Link to settle: {{link}}. Let me know if you need it resent.'),
 ('followup_2','dueno_f2_v1','Hi {{payer}}, invoice {{ref}} for {{business}} is now {{overdue_days}} days overdue ({{amount}}). Payment link: {{link}}. Is there a date you expect to pay?'),
 ('followup_2','dueno_f2_v2','Hello {{payer}} — {{amount}} remains unpaid on invoice {{ref}} for {{business}}, {{overdue_days}} days past due. You can pay here: {{link}}.'),
 ('final','dueno_final_v1','Hi {{payer}}, final reminder from DuenoPay for {{business}}: {{amount}} on invoice {{ref}} is {{overdue_days}} days overdue. Please settle here: {{link}}.'),
 ('final','dueno_final_v2','Hello {{payer}}, this is the last automated reminder for invoice {{ref}} ({{amount}}) for {{business}}. Payment link: {{link}}. Reply if you need anything.');

-- ========== FOLLOW-UP SCHEDULES ==========
create table public.follow_up_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  invoice_id uuid not null references public.invoices(id) on delete cascade unique,
  next_send_at timestamptz not null,
  stage public.followup_stage not null default 'first',
  attempts int not null default 0,
  active boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index followups_due_idx on public.follow_up_schedules(next_send_at) where active;
grant select on public.follow_up_schedules to authenticated;
grant all on public.follow_up_schedules to service_role;
alter table public.follow_up_schedules enable row level security;
create policy "own schedules select" on public.follow_up_schedules for select to authenticated using (user_id = auth.uid());

-- ========== PAYMENT EVENTS (audit) ==========
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  invoice_id uuid references public.invoices(id) on delete set null,
  provider text not null default 'stripe',
  event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
grant select on public.payment_events to authenticated;
grant all on public.payment_events to service_role;
alter table public.payment_events enable row level security;
create policy "own payment events select" on public.payment_events for select to authenticated using (user_id = auth.uid());

-- ========== AI / MESSAGING AUDIT (guardrail trail) ==========
create table public.ai_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  invoice_id uuid references public.invoices(id) on delete cascade,
  kind text not null,
  model text,
  blocked boolean not null default false,
  block_reason text,
  detail jsonb,
  created_at timestamptz not null default now()
);
grant select on public.ai_events to authenticated;
grant all on public.ai_events to service_role;
alter table public.ai_events enable row level security;
create policy "own ai events select" on public.ai_events for select to authenticated using (user_id = auth.uid());

-- ========== RATE LIMITS (abuse protection) ==========
create table public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  action text not null,
  window_start timestamptz not null default now(),
  count int not null default 0,
  unique (subject, action)
);
grant all on public.rate_limits to service_role;
alter table public.rate_limits enable row level security;
