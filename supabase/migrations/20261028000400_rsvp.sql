-- Guest RSVP: party-size limits, guest ordering, and the rate limiter the RSVP route uses.

-- Guests -----------------------------------------------------------------------
-- An invitation covers at most six people. Couples write guests directly (through RLS), so the
-- database enforces the limit as well as the editor.
alter table public.guests drop constraint guests_max_party_size_range;
alter table public.guests add constraint guests_max_party_size_range check (max_party_size between 1 and 6);

-- now() is the same for every row of one statement; clock_timestamp() advances, so a pasted list
-- keeps its order when sorted by created_at.
alter table public.guests alter column created_at set default clock_timestamp();

-- A couple may not lower a guest's limit below the number of people that guest already confirmed.
create function public.check_guest_max_party_size()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  confirmed smallint;
begin
  select r.party_size into confirmed from public.rsvps r where r.guest_id = new.id;
  if confirmed is not null and confirmed > new.max_party_size then
    raise exception 'max_party_size % is below the confirmed party_size %', new.max_party_size, confirmed
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger guests_check_max_party_size
  before update of max_party_size on public.guests
  for each row execute function public.check_guest_max_party_size();

revoke execute on function public.check_guest_max_party_size() from public, anon, authenticated;

-- Rate limits --------------------------------------------------------------------
-- Fixed windows. The caller passes the window start (so it can tell the client when the window
-- ends); the function counts the hit atomically and returns the count so far in that window.
-- Expired windows (older than a day) are removed along the way.

create index rate_limits_window_start_idx on public.rate_limits (window_start);

create function public.hit_rate_limit(p_key text, p_window_start timestamptz)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  hits integer;
begin
  delete from public.rate_limits where window_start < p_window_start - interval '1 day';

  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, p_window_start, 1)
  on conflict (key, window_start) do update set count = r.count + 1
  returning r.count into hits;

  return hits;
end;
$$;

-- Server code only (service role). Supabase grants execute on new functions to everyone by default.
revoke execute on function public.hit_rate_limit(text, timestamptz) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, timestamptz) to service_role;
