-- Security Upgrade: Make Storage Private
-- Run this in Supabase SQL Editor

-- 1. Update Bucket to be Private
update storage.buckets
set public = false
where id = 'images';

-- 2. Drop Insecure Policies
drop policy if exists "Anything goes for authenticated uploads" on storage.objects;
drop policy if exists "Anyone can view images" on storage.objects;

-- 3. Create Strict Policies

-- Allow Uploads (Insert) only to own folder path (userId/filename)
-- We assume the filename convention is "userId/..."
create policy "Users can upload own images"
on storage.objects for insert
with check (
    bucket_id = 'images' 
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow View (Select) only their own files
create policy "Users can view own images"
on storage.objects for select
using (
    bucket_id = 'images' 
    and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow Delete own files
create policy "Users can delete own images"
on storage.objects for delete
using (
    bucket_id = 'images' 
    and auth.uid()::text = (storage.foldername(name))[1]
);
