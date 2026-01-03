-- Enable Cascade Deletion
-- Running this script will allow you to delete Users from the Supabase Dashboard.
-- It works by ensuring that when a User is deleted, all their Entries and Settings are automatically deleted too.

-- 1. Update 'entries' table constraints
alter table public.entries
drop constraint if exists entries_user_id_fkey;

alter table public.entries
add constraint entries_user_id_fkey
foreign key (user_id)
references auth.users(id)
on delete cascade;

-- 2. Update 'user_settings' table constraints
alter table public.user_settings
drop constraint if exists user_settings_user_id_fkey;

alter table public.user_settings
add constraint user_settings_user_id_fkey
foreign key (user_id)
references auth.users(id)
on delete cascade;
