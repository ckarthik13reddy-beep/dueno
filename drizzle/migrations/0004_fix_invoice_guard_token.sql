CREATE OR REPLACE FUNCTION public.invoices_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public, extensions AS $$
DECLARE owner uuid;
BEGIN
 SELECT user_id INTO owner FROM public.clients WHERE id=new.client_id;
 IF owner IS NULL OR owner<>new.user_id THEN RAISE EXCEPTION 'client does not belong to this user'; END IF;
 IF new.file_path IS NOT NULL AND (left(new.file_path::text,length(new.user_id::text)+1) <> new.user_id::text||'/' OR position('..' in new.file_path)>0) THEN RAISE EXCEPTION 'invalid document owner'; END IF;
 IF current_setting('role',true)='authenticated' THEN
  IF tg_op='INSERT' THEN
   new.status:='pending'; new.payment_link_url:=NULL; new.stripe_payment_link_id:=NULL; new.stripe_session_id:=NULL; new.stripe_payment_intent_id:=NULL; new.paid_at:=NULL; new.receipt_path:=NULL;
   new.public_token:=encode(extensions.gen_random_bytes(32),'hex');
  ELSE
   new.user_id:=old.user_id; new.client_id:=old.client_id; new.public_token:=old.public_token; new.payment_link_url:=old.payment_link_url; new.stripe_payment_link_id:=old.stripe_payment_link_id; new.stripe_session_id:=old.stripe_session_id; new.stripe_payment_intent_id:=old.stripe_payment_intent_id; new.paid_at:=old.paid_at; new.receipt_path:=old.receipt_path;
   new.amount_cents:=old.amount_cents; new.currency:=old.currency;
   IF new.status<>old.status AND (new.status<>'cancelled' OR old.status='paid') THEN new.status:=old.status; END IF;
  END IF;
 END IF;
 new.updated_at:=now(); RETURN new;
END $$;
REVOKE EXECUTE ON FUNCTION public.invoices_guard() FROM PUBLIC,anon,authenticated;