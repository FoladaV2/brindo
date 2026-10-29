-- Admin: anonymous page views for the site funnel, unlimited access for chosen hosts, and the
-- read-only aggregates /admin shows. Everything here is server-only: no table is readable or
-- writable with the anon key or a host's session, and every function runs only for service_role.

-- Page views ---------------------------------------------------------------------
-- Cookieless and anonymous: `visitor` is a SHA-256 of a daily salt, the IP and the user agent,
-- computed on the server, so the same browser counts once per day and can't be followed across
-- days. No IP, no user agent and no user id is stored. Paths are normalized (ids and slugs removed).

create table public.page_views (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  visitor       text not null
                constraint page_views_visitor_format check (visitor ~ '^[0-9a-f]{64}$'),
  path          text not null
                constraint page_views_path_format check (path ~ '^/[A-Za-z0-9/:_-]{0,120}$'),
  referrer_host text
                constraint page_views_referrer_length check (char_length(referrer_host) between 1 and 100),
  device        text not null
                constraint page_views_device_known check (device in ('mobile', 'tablet', 'desktop'))
);

create index page_views_created_at_idx on public.page_views (created_at);

alter table public.page_views enable row level security;
revoke all on table public.page_views from anon, authenticated;

-- Unlimited access -----------------------------------------------------------------
-- Hosts the owner chose to let publish without paying, any number of times. Granted and revoked
-- only in /admin (service role).

create table public.entitlements (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  note       text
             constraint entitlements_note_length check (char_length(note) <= 200),
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;
revoke all on table public.entitlements from anon, authenticated;

-- Invitations published through unlimited access, so revenue and free publishes stay apart.
-- Hosts have no column privilege on it (see the rls migration); only the server sets it.
alter table public.invitations add column published_free boolean not null default false;

-- Aggregates for /admin ---------------------------------------------------------------------
-- security definer: they read auth.users, which the API can't reach otherwise. Executable only by
-- service_role, which the admin page uses after checking that the signed-in user is an admin.

create function public.admin_traffic(p_since timestamptz)
returns table (day date, views bigint, visitors bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select (created_at at time zone 'Asia/Tbilisi')::date as day, count(*), count(distinct visitor)
  from public.page_views
  where created_at >= p_since
  group by 1
  order by 1;
$$;

create function public.admin_breakdown(p_since timestamptz, p_dimension text)
returns table (label text, views bigint, visitors bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select case p_dimension
           when 'path' then path
           when 'referrer' then coalesce(referrer_host, '')
           when 'device' then device
         end as label,
         count(*),
         count(distinct visitor)
  from public.page_views
  where created_at >= p_since and p_dimension in ('path', 'referrer', 'device')
  group by 1
  order by 3 desc, 2 desc
  limit 20;
$$;

-- Distinct visitors over the period who reached one of p_paths (null: any page).
create function public.admin_visitors_on(p_since timestamptz, p_paths text[])
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct visitor)
  from public.page_views
  where created_at >= p_since and (p_paths is null or path = any (p_paths));
$$;

-- Hosts who registered since p_since, and how far each got.
create function public.admin_funnel(p_since timestamptz)
returns table (
  registered bigint,
  onboarded bigint,
  onboarding_skipped bigint,
  created_event bigint,
  started_payment bigint,
  published bigint,
  got_answer bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with hosts as (select id from auth.users where created_at >= p_since)
  select
    (select count(*) from hosts),
    (select count(*) from public.onboarding o join hosts h on h.id = o.user_id where not o.skipped),
    (select count(*) from public.onboarding o join hosts h on h.id = o.user_id where o.skipped),
    (select count(distinct i.owner_id) from public.invitations i join hosts h on h.id = i.owner_id),
    (select count(distinct i.owner_id) from public.orders r join public.invitations i on i.id = r.invitation_id join hosts h on h.id = i.owner_id),
    (select count(distinct i.owner_id) from public.invitations i join hosts h on h.id = i.owner_id where i.status = 'published'),
    (select count(distinct i.owner_id) from public.responses s join public.invitations i on i.id = s.invitation_id join hosts h on h.id = i.owner_id);
$$;

-- Totals over the period: what happened, whoever it happened to.
create function public.admin_totals(p_since timestamptz)
returns table (
  events_created bigint,
  published_paid bigint,
  published_free bigint,
  revenue_minor bigint,
  answers bigint,
  people_coming bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.invitations where created_at >= p_since),
    (select count(*) from public.invitations where paid_at >= p_since and status = 'published' and not published_free),
    (select count(*) from public.invitations where paid_at >= p_since and status = 'published' and published_free),
    (select coalesce(sum(amount), 0) from public.orders where status = 'paid' and updated_at >= p_since),
    (select count(*) from public.responses where created_at >= p_since),
    (select coalesce(sum(party_size), 0) from public.responses where created_at >= p_since and attending);
$$;

-- Onboarding answers over the period: one row per question and answer.
create function public.admin_onboarding_answers(p_since timestamptz)
returns table (question text, answer text, hosts bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select a.key, a.value, count(*)
  from public.onboarding o, jsonb_each_text(o.answers) a
  where o.completed_at >= p_since
  group by 1, 2
  order by 1, 3 desc;
$$;

-- Unlimited access with the host's email, for the list in /admin.
create function public.admin_entitlements()
returns table (user_id uuid, email text, note text, granted_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select e.user_id, u.email::text, e.note, e.granted_at
  from public.entitlements e
  join auth.users u on u.id = e.user_id
  order by e.granted_at desc;
$$;

-- An account's id by email, to grant access by email.
create function public.admin_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users where lower(email) = lower(btrim(p_email)) limit 1;
$$;

revoke execute on function
  public.admin_traffic(timestamptz),
  public.admin_breakdown(timestamptz, text),
  public.admin_visitors_on(timestamptz, text[]),
  public.admin_funnel(timestamptz),
  public.admin_totals(timestamptz),
  public.admin_onboarding_answers(timestamptz),
  public.admin_entitlements(),
  public.admin_user_id_by_email(text)
from public, anon, authenticated;

grant execute on function
  public.admin_traffic(timestamptz),
  public.admin_breakdown(timestamptz, text),
  public.admin_visitors_on(timestamptz, text[]),
  public.admin_funnel(timestamptz),
  public.admin_totals(timestamptz),
  public.admin_onboarding_answers(timestamptz),
  public.admin_entitlements(),
  public.admin_user_id_by_email(text)
to service_role;
