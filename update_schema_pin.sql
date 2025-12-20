-- Create a table to store user settings (like the secret PIN)
create table if not exists public.user_settings (
  user_id uuid references auth.users not null primary key,
  secret_pin text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.user_settings enable row level security;

-- Policies
drop policy if exists "Users can view own settings" on public.user_settings;
create policy "Users can view own settings" on public.user_settings
  for select using (auth.uid() = user_id);

drop policy if exists "Users can update own settings" on public.user_settings;
create policy "Users can update own settings" on public.user_settings
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own settings update" on public.user_settings;
create policy "Users can update own settings update" on public.user_settings
  for update using (auth.uid() = user_id);
