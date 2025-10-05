-- supabase_items_schema.sql
-- Migration for Clipit: saved_items table for syncing user articles
-- Includes metadata, reading state, favorites, archive, and tags

-- === Create saved_items table ===
create table if not exists public.saved_items (
  id text primary key,
  user_id text not null,
  url text not null,
  title text,
  excerpt text,
  content text,
  thumbnail text,
  type text default 'Article',
  reading_time integer,
  word_count integer,
  read_progress integer default 0,
  is_read boolean default false,
  is_favorite boolean default false,
  is_archived boolean default false,
  tags text[] default array[]::text[],
  notes text,
  last_read timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- === Indexes for performance ===
create index if not exists idx_saved_items_user on public.saved_items (user_id);
create index if not exists idx_saved_items_url on public.saved_items (url);
create index if not exists idx_saved_items_created on public.saved_items (created_at desc);
create index if not exists idx_saved_items_updated on public.saved_items (updated_at desc);
create index if not exists idx_saved_items_favorite on public.saved_items (user_id, is_favorite) where is_favorite = true;
create index if not exists idx_saved_items_archived on public.saved_items (user_id, is_archived) where is_archived = true;
create index if not exists idx_saved_items_read on public.saved_items (user_id, is_read);
create index if not exists idx_saved_items_tags on public.saved_items using gin (tags);

-- === updated_at trigger for saved_items ===
drop trigger if exists trg_set_updated_at_saved_items on public.saved_items;
create trigger trg_set_updated_at_saved_items
  before update on public.saved_items
  for each row
  execute function public.set_updated_at_column();

-- === Row Level Security (RLS) for saved_items ===
alter table public.saved_items enable row level security;

-- Drop existing policies
drop policy if exists saved_items_select_own on public.saved_items;
drop policy if exists saved_items_insert_own on public.saved_items;
drop policy if exists saved_items_update_own on public.saved_items;
drop policy if exists saved_items_delete_own on public.saved_items;

-- Create new policies
create policy saved_items_select_own on public.saved_items
  for select
  using (user_id = auth.uid()::text);

create policy saved_items_insert_own on public.saved_items
  for insert
  with check (user_id = auth.uid()::text);

create policy saved_items_update_own on public.saved_items
  for update
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

create policy saved_items_delete_own on public.saved_items
  for delete
  using (user_id = auth.uid()::text);

-- === Helper views for common queries ===

-- View for unread items
create or replace view public.unread_items as
select * from public.saved_items 
where is_read = false and is_archived = false;

-- View for favorite items
create or replace view public.favorite_items as
select * from public.saved_items 
where is_favorite = true and is_archived = false;

-- View for archived items
create or replace view public.archived_items as
select * from public.saved_items 
where is_archived = true;

-- === Optional: Add search function using full-text search ===
alter table public.saved_items add column if not exists search_vector tsvector;

-- Create index for full-text search
create index if not exists idx_saved_items_search on public.saved_items using gin (search_vector);

-- Function to update search vector
create or replace function public.update_saved_items_search_vector()
returns trigger as $$
begin
  new.search_vector := 
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.notes, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(new.tags, ' ')), 'D');
  return new;
end;
$$ language plpgsql;

-- Trigger to update search vector
drop trigger if exists trg_update_search_vector on public.saved_items;
create trigger trg_update_search_vector
  before insert or update on public.saved_items
  for each row
  execute function public.update_saved_items_search_vector();

-- End of migration