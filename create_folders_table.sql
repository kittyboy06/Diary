-- 1. Create Folders Table
create table if not exists public.folders (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    name text not null,
    color text default 'zinc', -- to store tailwind color name like 'red', 'blue' etc.
    is_secret boolean default false, -- to separate folders for secret log vs daily log if needed, or just allow mixing.
    created_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.folders enable row level security;

-- 3. Policies
create policy "Users can view own folders" on public.folders
  for select using (auth.uid() = user_id);

create policy "Users can insert own folders" on public.folders
  for insert with check (auth.uid() = user_id);

create policy "Users can update own folders" on public.folders
  for update using (auth.uid() = user_id);

create policy "Users can delete own folders" on public.folders
  for delete using (auth.uid() = user_id);

-- 4. Update Entries Table
alter table public.entries 
add column if not exists folder_id uuid references public.folders(id) on delete set null;
