-- 1. Secure Profiles Table
-- Ensure RLS is enabled
alter table public.profiles enable row level security;

-- Policies for Profiles
-- Users should only see their own profile in a private diary app
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- (Insert is handled by trigger usually, but we can add a policy just in case)
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);


-- 2. Secure Avatars Storage
-- The previous policies were "Anyone can upload...", which meant unauthenticated users could spam uploads.

drop policy if exists "Anyone can upload an avatar." on storage.objects;
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

drop policy if exists "Anyone can update an avatar." on storage.objects;
create policy "Users can update own avatars"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid() = owner );

-- Ensure deleting is also covered
drop policy if exists "Users can delete own avatars" on storage.objects;
create policy "Users can delete own avatars"
  on storage.objects for delete
  using ( bucket_id = 'avatars' and auth.uid() = owner );
