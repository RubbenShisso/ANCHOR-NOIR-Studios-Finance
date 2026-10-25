-- Anchor Noir Studios finance tracker: initial schema.
-- Access model: only emails listed in public.team_members can read or write data.
-- Public sign-ups should be disabled in Supabase Auth; team members are invited.

create table public.team_members (
  email text primary key check (email = lower(email)),
  role text not null default 'member' check (role in ('admin', 'member')),
  added_at timestamptz not null default now()
);

create or replace function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.is_team_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and role = 'admin'
  );
$$;

revoke execute on function public.is_team_member() from public, anon;
revoke execute on function public.is_team_admin() from public, anon;
grant execute on function public.is_team_member() to authenticated;
grant execute on function public.is_team_admin() to authenticated;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  client text,
  description text,
  budget numeric(14, 2) not null default 0 check (budget >= 0),
  status text not null default 'active'
    check (status in ('planning', 'active', 'on_hold', 'completed')),
  start_date date,
  end_date date,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount > 0),
  occurred_on date not null default current_date,
  category text not null,
  description text,
  project_id uuid references public.projects (id) on delete set null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index transactions_occurred_on_idx on public.transactions (occurred_on desc);
create index transactions_project_id_idx on public.transactions (project_id);
create index transactions_created_by_idx on public.transactions (created_by);
create index projects_created_by_idx on public.projects (created_by);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  target_amount numeric(14, 2) not null check (target_amount > 0),
  target_date date,
  notes text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Positive amounts are deposits, negative amounts are withdrawals.
create table public.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.savings_goals (id) on delete cascade,
  amount numeric(14, 2) not null check (amount <> 0),
  contributed_on date not null default current_date,
  note text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index savings_contributions_goal_id_idx on public.savings_contributions (goal_id);
create index savings_contributions_created_by_idx on public.savings_contributions (created_by);
create index savings_goals_created_by_idx on public.savings_goals (created_by);

-- Row level security
alter table public.team_members enable row level security;
alter table public.projects enable row level security;
alter table public.transactions enable row level security;
alter table public.savings_goals enable row level security;
alter table public.savings_contributions enable row level security;

create policy "members read team" on public.team_members
  for select to authenticated using ((select public.is_team_member()));
create policy "admins add team" on public.team_members
  for insert to authenticated with check ((select public.is_team_admin()));
create policy "admins update team" on public.team_members
  for update to authenticated
  using ((select public.is_team_admin())) with check ((select public.is_team_admin()));
create policy "admins remove team" on public.team_members
  for delete to authenticated using ((select public.is_team_admin()));

create policy "members manage projects" on public.projects
  for all to authenticated
  using ((select public.is_team_member())) with check ((select public.is_team_member()));
create policy "members manage transactions" on public.transactions
  for all to authenticated
  using ((select public.is_team_member())) with check ((select public.is_team_member()));
create policy "members manage savings goals" on public.savings_goals
  for all to authenticated
  using ((select public.is_team_member())) with check ((select public.is_team_member()));
create policy "members manage savings contributions" on public.savings_contributions
  for all to authenticated
  using ((select public.is_team_member())) with check ((select public.is_team_member()));
