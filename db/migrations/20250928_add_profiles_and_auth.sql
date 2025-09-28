-- 2025-09-28 - Add profiles table and auth-related helpers
-- Creates a public.profiles table linked to auth.users and RLS policies

-- Create profiles table (uuid PK referencing auth.users.id)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  metadata jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Index for lookups
create index if not exists idx_profiles_email on public.profiles (email);

-- Trigger helper: create or replace set_updated_at_column
create or replace function public.set_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach updated_at trigger
drop trigger if exists trg_set_updated_at_profiles on public.profiles;
create trigger trg_set_updated_at_profiles
  before update on public.profiles
  for each row
  execute function public.set_updated_at_column();

-- Row Level Security for profiles
alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_delete_own on public.profiles;

create policy profiles_select_own on public.profiles
  for select
  using (id = auth.uid()::uuid);

create policy profiles_insert_own on public.profiles
  for insert
  with check (id = auth.uid()::uuid);

create policy profiles_update_own on public.profiles
  for update
  using (id = auth.uid()::uuid)
  with check (id = auth.uid()::uuid);

create policy profiles_delete_own on public.profiles
  for delete
  using (id = auth.uid()::uuid);

-- Convenience view exposing auth.sessions in public schema for easy queries
-- Note: auth.sessions is managed by Supabase. This view is read-only and intended
-- for admin queries or debugging. Do not use it to bypass auth policies.
create or replace view public.user_sessions as
select * from auth.sessions;

-- Optional: function to upsert profile when a new auth.user is created.
-- This is commented-out because deploying it may require placing the function
-- in the auth schema or wiring an auth trigger in the Supabase dashboard.
--
-- create or replace function public.create_profile_on_auth_insert()
-- returns trigger language plpgsql as $$
-- begin
--   insert into public.profiles (id, email, created_at)
--   values (new.id, new.email, now())
--   on conflict (id) do nothing;
--   return new;
-- end;
-- $$;

-- End of migration
