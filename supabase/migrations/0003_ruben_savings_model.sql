-- Rebuild around how Anchor Noir actually runs:
-- clients pay Ruben, Ruben transfers an agreed savings percentage of each payment
-- into the business savings, and projects are compared by service and promotion.

drop table public.savings_contributions;
drop table public.savings_goals;
drop table public.transactions;

-- Promotions / campaigns. Projects with no campaign count as regular pricing.
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  starts_on date,
  ends_on date,
  notes text,
  created_at timestamptz not null default now()
);

insert into public.campaigns (name, starts_on, ends_on) values
  ('October Promo', '2026-10-01', '2026-10-31'),
  ('BLACK OUT November', '2026-11-01', '2026-11-30');

-- Projects: reshape the original table in place to keep existing rows.
create sequence public.project_code_seq;

alter table public.projects rename column budget to agreed_price;
alter table public.projects rename column end_date to due_date;
alter table public.projects drop constraint projects_status_check;
update public.projects set status = case status
  when 'active' then 'in_progress'
  when 'planning' then 'quoted'
  else status end;

alter table public.projects
  add column code text unique,
  add column category text,
  add column service text,
  add column standard_price numeric(14, 2) check (standard_price >= 0),
  add column campaign_id uuid references public.campaigns (id) on delete set null,
  add column savings_rate numeric(5, 2) not null default 20 check (savings_rate between 0 and 100),
  add column website_url text,
  add column client_industry text,
  add column lead_source text,
  add column completed_on date,
  add column notes text,
  alter column status set default 'quoted',
  add constraint projects_status_check
    check (status in ('lead', 'quoted', 'in_progress', 'completed', 'on_hold', 'cancelled'));

-- Number existing projects in creation order, then let new ones take the next code.
with numbered as (
  select id, row_number() over (order by created_at) as n from public.projects
)
update public.projects p
set code = 'AN-' || lpad(numbered.n::text, 3, '0')
from numbered where numbered.id = p.id;

select setval('public.project_code_seq', greatest((select count(*) from public.projects), 1),
              (select count(*) from public.projects) > 0);

alter table public.projects
  alter column code set default ('AN-' || lpad(nextval('public.project_code_seq')::text, 3, '0')),
  alter column code set not null,
  alter column client set not null;

grant usage, select on sequence public.project_code_seq to authenticated;

create index projects_campaign_id_idx on public.projects (campaign_id);

-- Client payments received by Ruben. One row per deposit / instalment / final payment.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete restrict,
  received_on date not null default current_date,
  kind text not null default 'deposit' check (kind in ('deposit', 'instalment', 'final', 'other')),
  amount numeric(14, 2) not null check (amount > 0),
  -- Copied from the project when the payment is recorded, so later rate changes don't rewrite history.
  savings_rate numeric(5, 2) not null check (savings_rate between 0 and 100),
  savings_due numeric(14, 2) generated always as (round(amount * savings_rate / 100, 2)) stored,
  reference text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function private.payment_default_savings_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.savings_rate is null then
    select p.savings_rate into new.savings_rate from public.projects p where p.id = new.project_id;
  end if;
  return new;
end;
$$;

revoke execute on function private.payment_default_savings_rate() from public, anon, authenticated;

create trigger payments_default_savings_rate
  before insert on public.payments
  for each row execute function private.payment_default_savings_rate();

create index payments_project_id_idx on public.payments (project_id);
create index payments_received_on_idx on public.payments (received_on desc);
create index payments_created_by_idx on public.payments (created_by);

-- Business savings account: transfers in from Ruben, interest, and withdrawals out.
create table public.savings_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('transfer', 'interest', 'withdrawal')),
  occurred_on date not null default current_date,
  amount numeric(14, 2) not null check (amount > 0),
  project_id uuid references public.projects (id) on delete set null,
  reference text,
  reason text,
  approved_by text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index savings_entries_project_id_idx on public.savings_entries (project_id);
create index savings_entries_occurred_on_idx on public.savings_entries (occurred_on desc);
create index savings_entries_created_by_idx on public.savings_entries (created_by);

-- Direct costs, optionally linked to a project.
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null default current_date,
  project_id uuid references public.projects (id) on delete set null,
  category text not null,
  description text,
  amount numeric(14, 2) not null check (amount > 0),
  paid_by text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index expenses_project_id_idx on public.expenses (project_id);
create index expenses_spent_on_idx on public.expenses (spent_on desc);
create index expenses_created_by_idx on public.expenses (created_by);

alter table public.campaigns enable row level security;
alter table public.payments enable row level security;
alter table public.savings_entries enable row level security;
alter table public.expenses enable row level security;

create policy "members manage campaigns" on public.campaigns
  for all to authenticated
  using ((select private.is_team_member())) with check ((select private.is_team_member()));
create policy "members manage payments" on public.payments
  for all to authenticated
  using ((select private.is_team_member())) with check ((select private.is_team_member()));
create policy "members manage savings entries" on public.savings_entries
  for all to authenticated
  using ((select private.is_team_member())) with check ((select private.is_team_member()));
create policy "members manage expenses" on public.expenses
  for all to authenticated
  using ((select private.is_team_member())) with check ((select private.is_team_member()));

-- The first project from the original tracker was a website.
update public.projects set category = 'Website' where code = 'AN-001' and category is null;
