-- Onboarding answers: 10 single-choice questions right after registration (SPEC.md "Onboarding").
-- One row per host. Hosts write their own row through RLS; answers are validated by zod on the
-- server (src/lib/onboarding/questions.ts) and kept small here.

create table public.onboarding (
  user_id      uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  answers      jsonb not null default '{}'::jsonb
               constraint onboarding_answers_object check (jsonb_typeof(answers) = 'object')
               constraint onboarding_answers_size check (octet_length(answers::text) <= 2048),
  skipped      boolean not null default false,
  completed_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger onboarding_set_updated_at
  before update on public.onboarding
  for each row execute function public.set_updated_at();

alter table public.onboarding enable row level security;

-- Supabase grants everything on new public tables to anon and authenticated by default.
revoke all on table public.onboarding from anon, authenticated;

-- user_id defaults to auth.uid() and cannot be set or changed by the host.
grant select on public.onboarding to authenticated;
grant insert (answers, skipped) on public.onboarding to authenticated;
grant update (answers, skipped) on public.onboarding to authenticated;

create policy "Hosts read their own onboarding"
  on public.onboarding for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Hosts create their own onboarding"
  on public.onboarding for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Hosts update their own onboarding"
  on public.onboarding for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
