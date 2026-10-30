-- /admin/users and /admin/results: every account with how far it got, and every event with its
-- answers. Same rules as the admin migration: security definer (they read auth.users), and
-- executable only by service_role, which the admin pages use after checking ADMIN_EMAILS.
-- Guests' names never leave the database here; only counts do.

-- Every account, newest first, with its onboarding and what it made.
create function public.admin_users()
returns table (
  user_id          uuid,
  email            text,
  created_at       timestamptz,
  last_sign_in_at  timestamptz,
  onboarding       text,        -- 'done', 'skipped' or 'none'
  city             text,        -- onboarding answer, if given
  planning         text,        -- onboarding answer "what are you planning", if given
  events           bigint,
  published        bigint,
  answers          bigint,
  people_coming    bigint,
  unlimited        boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    case when o.user_id is null then 'none' when o.skipped then 'skipped' else 'done' end,
    o.answers ->> 'city',
    o.answers ->> 'eventType',
    coalesce(i.events, 0),
    coalesce(i.published, 0),
    coalesce(r.answers, 0),
    coalesce(r.people_coming, 0),
    e.user_id is not null
  from auth.users u
  left join public.onboarding o on o.user_id = u.id
  left join public.entitlements e on e.user_id = u.id
  left join lateral (
    select count(*) as events, count(*) filter (where status = 'published') as published
    from public.invitations
    where owner_id = u.id
  ) i on true
  left join lateral (
    select count(*) as answers, coalesce(sum(s.party_size) filter (where s.attending), 0) as people_coming
    from public.responses s
    join public.invitations v on v.id = s.invitation_id
    where v.owner_id = u.id
  ) r on true
  order by u.created_at desc
  limit 5000;
$$;

-- Every event, newest first, with its host's email and its answers counted.
create function public.admin_events()
returns table (
  invitation_id  uuid,
  email          text,
  event_type     text,
  template_id    text,
  title          text,
  starts_at      text,        -- wall-clock time in Tbilisi, YYYY-MM-DDTHH:MM, if set
  status         text,
  published_free boolean,
  created_at     timestamptz,
  paid_at        timestamptz,
  answers        bigint,
  coming         bigint,
  not_coming     bigint,
  people_coming  bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.id,
    u.email::text,
    i.event_type,
    i.template_id,
    coalesce(
      nullif(i.content ->> 'title', ''),
      nullif(concat_ws(' & ', i.content -> 'partners' ->> 0, i.content -> 'partners' ->> 1), '')
    ),
    i.content ->> 'startsAt',
    i.status,
    i.published_free,
    i.created_at,
    i.paid_at,
    count(s.id),
    count(s.id) filter (where s.attending),
    count(s.id) filter (where not s.attending),
    coalesce(sum(s.party_size) filter (where s.attending), 0)
  from public.invitations i
  join auth.users u on u.id = i.owner_id
  left join public.responses s on s.invitation_id = i.id
  group by i.id, u.email
  order by i.created_at desc
  limit 5000;
$$;

revoke execute on function public.admin_users(), public.admin_events() from public, anon, authenticated;
grant execute on function public.admin_users(), public.admin_events() to service_role;
