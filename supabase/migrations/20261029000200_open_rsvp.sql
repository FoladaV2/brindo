-- Open RSVP and every kind of event (SPEC.md "Open RSVP").
--
-- One link per invitation replaces personal links: guests type their own first name and surname,
-- so `responses` replaces `guests` and `rsvps`. Existing answers are carried over before the old
-- tables are dropped. Invitations gain an event type and a party-size cap per reply.

-- Invitations -----------------------------------------------------------------

alter table public.invitations
  add column event_type text not null default 'wedding'
    constraint invitations_event_type_known
    check (event_type in ('wedding', 'engagement', 'birthday', 'christening', 'anniversary', 'corporate', 'other')),
  add column max_party_size smallint not null default 6
    constraint invitations_max_party_size_range check (max_party_size between 1 and 10);

grant insert (event_type, max_party_size) on public.invitations to authenticated;
grant update (event_type, max_party_size) on public.invitations to authenticated;

-- Responses -------------------------------------------------------------------
-- One row per answer. Only what the guest typed and chose; no phone numbers, no emails.
-- The guest's browser keeps a random edit token; only its SHA-256 is stored.

create table public.responses (
  id              uuid primary key default gen_random_uuid(),
  invitation_id   uuid not null references public.invitations (id) on delete cascade,
  first_name      text not null
                  constraint responses_first_name_length check (char_length(btrim(first_name)) between 1 and 40),
  -- Empty only for answers carried over from personal links, where the surname was never asked.
  last_name       text not null default ''
                  constraint responses_last_name_length check (char_length(last_name) <= 60),
  attending       boolean not null,
  party_size      smallint
                  constraint responses_party_size_range check (party_size between 1 and 10),
  edit_token_hash text not null unique
                  constraint responses_edit_token_hash_format check (edit_token_hash ~ '^[0-9a-f]{64}$'),
  created_at      timestamptz not null default clock_timestamp(),
  updated_at      timestamptz not null default now(),
  -- Coming means at least the guest; not coming means no count at all.
  constraint responses_party_size_matches_attending
    check ((attending and party_size is not null) or (not attending and party_size is null))
);

create index responses_invitation_id_idx on public.responses (invitation_id, created_at);

create trigger responses_set_updated_at
  before update on public.responses
  for each row execute function public.set_updated_at();

-- A reply may not bring more people than the invitation allows.
create function public.check_response_party_size()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  max_size smallint;
begin
  if new.party_size is null then
    return new;
  end if;
  select i.max_party_size into max_size from public.invitations i where i.id = new.invitation_id;
  if new.party_size > max_size then
    raise exception 'party_size % exceeds max_party_size %', new.party_size, max_size
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger responses_check_party_size
  before insert or update on public.responses
  for each row execute function public.check_response_party_size();

revoke execute on function public.check_response_party_size() from public, anon, authenticated;

-- Carry over answers given through personal links: the stored name becomes the first name.
-- The old token's hash keeps each row unique; nobody holds a way to edit these rows any more.
insert into public.responses (invitation_id, first_name, attending, party_size, edit_token_hash, created_at)
select g.invitation_id,
       left(btrim(g.name), 40),
       r.attending,
       case when r.attending then least(greatest(r.party_size, 1), 10) end,
       encode(extensions.digest(g.token, 'sha256'), 'hex'),
       r.created_at
from public.rsvps r
join public.guests g on g.id = r.guest_id;

-- Personal links are gone (SPEC.md "Explicitly NOT in v1").
drop table public.rsvps;
drop table public.guests;
drop function public.check_rsvp_party_size();
drop function public.check_guest_max_party_size();

-- Access ------------------------------------------------------------------------
-- Hosts read and delete the answers to their own invitations. Guests never touch the table:
-- answers are written only by the RSVP route with the service-role key.

alter table public.responses enable row level security;
revoke all on table public.responses from anon, authenticated;
grant select, delete on public.responses to authenticated;

create policy "Hosts read answers to their own invitations"
  on public.responses for select to authenticated
  using (exists (
    select 1 from public.invitations i
    where i.id = responses.invitation_id and i.owner_id = (select auth.uid())
  ));

create policy "Hosts delete answers to their own invitations"
  on public.responses for delete to authenticated
  using (exists (
    select 1 from public.invitations i
    where i.id = responses.invitation_id and i.owner_id = (select auth.uid())
  ));
