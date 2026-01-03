-- Run this in the Supabase SQL Editor to fix your database schema

-- 1. Create table if it doesn't exist
create table if not exists public.entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text,
  content text,
  image_url text,           -- This is the column that was missing
  is_secret boolean default false,
  mood text,
  date timestamptz default now()
);

-- 2. Add columns if they are missing (safely)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'entries' and column_name = 'image_url') then
        alter table public.entries add column image_url text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'entries' and column_name = 'is_secret') then
        alter table public.entries add column is_secret boolean default false;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'entries' and column_name = 'mood') then
        alter table public.entries add column mood text;
    end if;
end $$;

-- 3. Enable RLS
alter table public.entries enable row level security;

-- 4. Re-create policies (Drop first to avoid 'already exists' error)
drop policy if exists "Users can view own entries" on public.entries;
create policy "Users can view own entries" on public.entries
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own entries" on public.entries;
create policy "Users can insert own entries" on public.entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own entries" on public.entries;
create policy "Users can delete own entries" on public.entries
  for delete using (auth.uid() = user_id);

-- 5. Storage Setup
insert into storage.buckets (id, name, public) 
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "Anything goes for authenticated uploads" on storage.objects;
create policy "Anything goes for authenticated uploads" on storage.objects
  for insert with check (bucket_id = 'images' and auth.role() = 'authenticated');
  
drop policy if exists "Anyone can view images" on storage.objects;
create policy "Anyone can view images" on storage.objects
  for select using (bucket_id = 'images');
