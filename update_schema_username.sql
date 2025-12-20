-- Create a profiles table to store usernames
-- This table mimics the public.users pattern often used with Supabase Auth
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  email text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
-- Anyone can read usernames (needed for login check? No, we use RPC for that)
-- Actually, we only need the RPC for checking email. 
-- But let's allow users to read their own profile.
create policy "Users can read own profile" 
on public.profiles for select 
using (auth.uid() = id);

create policy "Users can update own profile" 
on public.profiles for update 
using (auth.uid() = id);

create policy "Users can insert own profile" 
on public.profiles for insert 
with check (auth.uid() = id);

-- Secure RPC function to get email by username
-- This is SECURITY DEFINER so it bypasses RLS to look up the email
-- BUT it only returns the email if the username exists
create or replace function public.get_email_by_username(p_username text)
returns text
language plpgsql
security definer
as $$
declare
  v_email text;
begin
  select email into v_email
  from public.profiles
  where username = p_username;
  
  return v_email;
end;
$$;
