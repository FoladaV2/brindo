-- Payments: the webhook's state change in one transaction, and a record of what each event did.

-- What each event was and what the handler decided, so refunds, disputes and mismatches can be
-- reviewed by hand. Rows written before this migration keep nulls.
alter table public.webhook_events
  add column event_type text
    constraint webhook_events_event_type_length check (char_length(event_type) <= 100),
  add column provider_payment_id text
    constraint webhook_events_provider_payment_id_length check (char_length(provider_payment_id) <= 255),
  add column outcome text
    constraint webhook_events_outcome_length check (char_length(outcome) <= 100);

create index webhook_events_provider_payment_id_idx on public.webhook_events (provider_payment_id);

-- Applies one verified webhook event. Called only by the webhook route (service role) after the
-- signature check. Everything happens in the function's single transaction:
--   1. Record the event id. If it is already there, this is a retry or replay: change nothing.
--   2. Apply the event:
--      payment_succeeded  pending/failed order with the expected amount and currency -> order paid,
--                         invitation published. Anything else is recorded and changes nothing.
--      payment_failed     pending/failed order -> failed. A late failure never undoes a payment.
--      refund_succeeded   full refund -> order refunded. The invitation stays published: a person
--                         decides whether to unpublish.
--      other              recorded only (disputes, processing, events for other brands).
-- p_amount is in minor units and may include tax (p_tax), depending on how the product is priced.
create function public.apply_payment_event(
  p_event_id      text,
  p_event_type    text,
  p_kind          text,
  p_order_id      uuid,
  p_invitation_id uuid,
  p_payment_id    text,
  p_amount        integer,
  p_tax           integer,
  p_currency      text,
  p_partial       boolean
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  o          public.orders%rowtype;
  inv_status text;
  inv_slug   text;
  result     text;
begin
  if p_kind not in ('payment_succeeded', 'payment_failed', 'refund_succeeded', 'other') then
    raise exception 'unknown payment event kind %', p_kind using errcode = 'invalid_parameter_value';
  end if;

  insert into public.webhook_events (event_id, event_type, provider_payment_id)
  values (p_event_id, p_event_type, p_payment_id)
  on conflict (event_id) do nothing;
  if not found then
    return jsonb_build_object('outcome', 'duplicate');
  end if;

  if p_kind = 'payment_succeeded' then
    select * into o from public.orders where id = p_order_id for update;
    if not found then
      result := 'unknown_order';
    elsif o.status = 'paid' then
      result := case when o.provider_payment_id = p_payment_id then 'already_paid' else 'second_payment_for_order' end;
    elsif o.status = 'refunded' then
      result := 'ignored_refunded_order';
    elsif o.invitation_id is not null and o.invitation_id is distinct from p_invitation_id then
      result := 'invitation_mismatch';
    elsif p_currency is distinct from o.currency
       or p_amount is null
       or not (p_amount = o.amount or p_amount - coalesce(p_tax, 0) = o.amount) then
      result := 'amount_mismatch';
    else
      update public.orders set status = 'paid', provider_payment_id = p_payment_id where id = o.id;

      select status, slug into inv_status, inv_slug from public.invitations where id = o.invitation_id for update;
      if inv_slug is null then
        result := 'paid_invitation_missing';
      else
        update public.invitations
        set status = 'published', paid_at = coalesce(paid_at, now())
        where id = o.invitation_id;
        result := case when inv_status = 'published' then 'paid_already_published' else 'published' end;
      end if;
    end if;

  elsif p_kind = 'payment_failed' then
    select * into o from public.orders where id = p_order_id for update;
    if not found then
      result := 'unknown_order';
    elsif o.status in ('pending', 'failed') then
      update public.orders set status = 'failed' where id = o.id;
      result := 'order_failed';
    else
      result := 'ignored_order_' || o.status;
    end if;

  elsif p_kind = 'refund_succeeded' then
    select * into o from public.orders where provider_payment_id = p_payment_id for update;
    if not found then
      result := 'unknown_payment';
    elsif p_partial then
      result := 'partial_refund_recorded';
    else
      update public.orders set status = 'refunded' where id = o.id;
      result := 'order_refunded';
    end if;
    if o.invitation_id is not null then
      select slug into inv_slug from public.invitations where id = o.invitation_id;
    end if;

  else
    result := 'recorded';
  end if;

  update public.webhook_events set outcome = result where event_id = p_event_id;
  return jsonb_build_object('outcome', result, 'order_id', o.id, 'invitation_id', o.invitation_id, 'slug', inv_slug);
end;
$$;

-- Server code only (service role). Supabase grants execute on new functions to everyone by default.
revoke execute on function public.apply_payment_event(text, text, text, uuid, uuid, text, integer, integer, text, boolean)
  from public, anon, authenticated;
grant execute on function public.apply_payment_event(text, text, text, uuid, uuid, text, integer, integer, text, boolean)
  to service_role;
