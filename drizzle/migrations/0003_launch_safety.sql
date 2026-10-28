ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false;
ALTER TABLE public.payment_events ADD COLUMN IF NOT EXISTS processed_at timestamptz;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS stripe_payment_link_id text;
CREATE TABLE public.automation_locks (key text PRIMARY KEY, owner uuid NOT NULL, expires_at timestamptz NOT NULL);
GRANT ALL ON public.automation_locks TO service_role;
ALTER TABLE public.automation_locks ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.ai_gateway_state (id text PRIMARY KEY, paused boolean NOT NULL DEFAULT false, status integer, message text, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.ai_gateway_state TO service_role;
ALTER TABLE public.ai_gateway_state ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.acquire_automation_lock(lock_key text, lock_owner uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE claimed text;
BEGIN
 INSERT INTO public.automation_locks(key,owner,expires_at) VALUES(lock_key,lock_owner,now()+interval '10 minutes') ON CONFLICT(key) DO UPDATE SET owner=EXCLUDED.owner,expires_at=EXCLUDED.expires_at WHERE automation_locks.expires_at < now() RETURNING key INTO claimed;
 RETURN claimed IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.acquire_automation_lock(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_automation_lock(text,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.consume_rate_limit(p_subject text,p_action text,p_limit integer,p_window_seconds integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE used integer;
BEGIN
 INSERT INTO public.rate_limits(subject,action,count,window_start) VALUES(p_subject,p_action,1,now()) ON CONFLICT(subject,action) DO UPDATE SET count=CASE WHEN rate_limits.window_start <= now()-make_interval(secs=>p_window_seconds) THEN 1 ELSE rate_limits.count+1 END,window_start=CASE WHEN rate_limits.window_start <= now()-make_interval(secs=>p_window_seconds) THEN now() ELSE rate_limits.window_start END RETURNING count INTO used;
 RETURN used <= p_limit;
END $$;
REVOKE ALL ON FUNCTION public.consume_rate_limit(text,text,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text,text,integer,integer) TO service_role;
CREATE OR REPLACE FUNCTION public.invoices_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE owner uuid;
BEGIN
 SELECT user_id INTO owner FROM public.clients WHERE id=new.client_id;
 IF owner IS NULL OR owner<>new.user_id THEN RAISE EXCEPTION 'client does not belong to this user'; END IF;
 IF new.file_path IS NOT NULL AND (left(new.file_path::text,length(new.user_id::text)+1) <> new.user_id::text||'/' OR position('..' in new.file_path)>0) THEN RAISE EXCEPTION 'invalid document owner'; END IF;
 IF current_setting('role',true)='authenticated' THEN
  IF tg_op='INSERT' THEN
   new.status:='pending'; new.payment_link_url:=NULL; new.stripe_payment_link_id:=NULL; new.stripe_session_id:=NULL; new.stripe_payment_intent_id:=NULL; new.paid_at:=NULL; new.receipt_path:=NULL;
   new.public_token:=encode(gen_random_bytes(32),'hex');
  ELSE
   new.user_id:=old.user_id; new.client_id:=old.client_id; new.public_token:=old.public_token; new.payment_link_url:=old.payment_link_url; new.stripe_payment_link_id:=old.stripe_payment_link_id; new.stripe_session_id:=old.stripe_session_id; new.stripe_payment_intent_id:=old.stripe_payment_intent_id; new.paid_at:=old.paid_at; new.receipt_path:=old.receipt_path;
   new.amount_cents:=old.amount_cents; new.currency:=old.currency;
   IF new.status<>old.status AND (new.status<>'cancelled' OR old.status='paid') THEN new.status:=old.status; END IF;
  END IF;
 END IF;
 new.updated_at:=now(); RETURN new;
END $$;
CREATE OR REPLACE FUNCTION public.profiles_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF current_setting('role',true)='authenticated' THEN
  IF tg_op='INSERT' THEN new.stripe_account_id:=NULL; new.stripe_onboarding_complete:=false;
  ELSE new.user_id:=old.user_id; new.stripe_account_id:=old.stripe_account_id; new.stripe_onboarding_complete:=old.stripe_onboarding_complete; END IF;
 END IF;
 new.updated_at:=now(); RETURN new;
END $$;
CREATE TRIGGER profiles_insert_guard_trg BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_guard();
CREATE OR REPLACE FUNCTION public.clients_owner_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF new.user_id<>old.user_id THEN RAISE EXCEPTION 'payer owner is immutable'; END IF; RETURN new; END $$;
CREATE TRIGGER clients_owner_guard_trg BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.clients_owner_guard();
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.invoices_guard() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.profiles_guard() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.create_owned_invoice(p_input jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE payer uuid; invoice uuid; uid uuid:=auth.uid();
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'sign in required'; END IF;
 SELECT id INTO payer FROM public.clients WHERE user_id=uid AND name=p_input->>'name' AND email IS NOT DISTINCT FROM nullif(p_input->>'email','') AND whatsapp_number IS NOT DISTINCT FROM nullif(p_input->>'whatsapp','') ORDER BY created_at LIMIT 1;
 IF payer IS NULL THEN INSERT INTO public.clients(user_id,name,email,whatsapp_number) VALUES(uid,p_input->>'name',nullif(p_input->>'email',''),nullif(p_input->>'whatsapp','')) RETURNING id INTO payer; END IF;
 INSERT INTO public.invoices(user_id,client_id,reference,amount_cents,currency,description,due_date,source,file_path,preferred_channel) VALUES(uid,payer,nullif(p_input->>'reference',''),(p_input->>'amountCents')::bigint,p_input->>'currency',nullif(p_input->>'description',''),(p_input->>'dueDate')::date,(p_input->>'source')::public.invoice_source,nullif(p_input->>'filePath',''),CASE WHEN nullif(p_input->>'whatsapp','') IS NOT NULL THEN 'whatsapp'::public.msg_channel ELSE 'email'::public.msg_channel END) RETURNING id INTO invoice;
 RETURN invoice;
END $$;
REVOKE ALL ON FUNCTION public.create_owned_invoice(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_owned_invoice(jsonb) TO authenticated;
CREATE INDEX IF NOT EXISTS clients_email_lookup_idx ON public.clients(email);
CREATE INDEX IF NOT EXISTS clients_whatsapp_lookup_idx ON public.clients(whatsapp_number);