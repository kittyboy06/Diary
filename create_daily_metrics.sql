-- Create daily_metrics table
create table if not exists daily_metrics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  date date not null,
  screen_time_minutes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- Enable RLS
alter table daily_metrics enable row level security;

-- Policies
create policy "Users can view their own metrics" 
  on daily_metrics for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own metrics" 
  on daily_metrics for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own metrics" 
  on daily_metrics for update 
  using (auth.uid() = user_id);
