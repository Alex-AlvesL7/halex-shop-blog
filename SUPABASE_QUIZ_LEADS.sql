create table if not exists public.quiz_leads (
  id text primary key,
  name text not null,
  email text not null,
  phone text,
  goal text,
  weight double precision,
  height double precision,
  age integer,
  gender text,
  activity_level text,
  restrictions text,
  recommended_product_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists quiz_leads_email_idx on public.quiz_leads (lower(email));
create index if not exists quiz_leads_created_at_idx on public.quiz_leads (created_at desc);

alter table public.quiz_leads enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quiz_leads'
      and policyname = 'quiz_leads_select_policy'
  ) then
    create policy quiz_leads_select_policy on public.quiz_leads
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quiz_leads'
      and policyname = 'quiz_leads_insert_policy'
  ) then
    create policy quiz_leads_insert_policy on public.quiz_leads
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quiz_leads'
      and policyname = 'quiz_leads_update_policy'
  ) then
    create policy quiz_leads_update_policy on public.quiz_leads
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end $$;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.quiz_leads to anon, authenticated;

comment on table public.quiz_leads is 'Leads gerados pelo quiz comercial da L7 Fitness.';