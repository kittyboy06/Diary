-- Comprehensive Fix for Entries Table
-- Run this in Supabase SQL Editor

-- 1. Ensure 'entries' table exists
create table if not exists public.entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text,
  content text,
  date timestamptz default now()
);

-- 2. Add missing columns (Safe Idempotent Operations)
do $$
begin
    -- image_url
    if not exists (select 1 from information_schema.columns where table_name = 'entries' and column_name = 'image_url') then
        alter table public.entries add column image_url text;
    end if;

    -- is_secret
    if not exists (select 1 from information_schema.columns where table_name = 'entries' and column_name = 'is_secret') then
        alter table public.entries add column is_secret boolean default false;
    end if;

    -- mood
    if not exists (select 1 from information_schema.columns where table_name = 'entries' and column_name = 'mood') then
        alter table public.entries add column mood text;
    end if;

    -- is_favorite
    if not exists (select 1 from information_schema.columns where table_name = 'entries' and column_name = 'is_favorite') then
        alter table public.entries add column is_favorite boolean default false;
    end if;

    -- folder_id (FK to folders)
    if not exists (select 1 from information_schema.columns where table_name = 'entries' and column_name = 'folder_id') then
        alter table public.entries add column folder_id uuid references public.folders(id) on delete set null;
    end if;
end $$;

-- 3. Reset RLS Policies to ensure write access
alter table public.entries enable row level security;

-- Drop old policies to avoid conflicts
drop policy if exists "Users can manage own entries" on entries;
drop policy if exists "Users can view own entries" on entries;
drop policy if exists "Users can insert own entries" on entries;
drop policy if exists "Users can update own entries" on entries;
drop policy if exists "Users can delete own entries" on entries;

-- Create Unified CRUD Policy
create policy "Users can manage own entries" on entries
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 4. Ensure Folders table exists (dependency for folder_id)
create table if not exists public.folders (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    name text not null,
    color text default 'zinc',
    is_secret boolean default false,
    created_at timestamptz default now()
);

alter table public.folders enable row level security;

drop policy if exists "Users can manage own folders" on folders;
create policy "Users can manage own folders" on folders
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
