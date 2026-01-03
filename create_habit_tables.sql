-- Create table for defining habits
create table if not exists user_habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  target_days int default 30,
  color text default 'indigo',
  icon text,
  created_at timestamptz default now()
);

-- Create table for tracking daily completions
create table if not exists habit_completions (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references user_habits on delete cascade not null,
  user_id uuid references auth.users not null,
  date date not null,
  completed_at timestamptz default now(),
  unique(habit_id, date)
);

-- Enable RLS
alter table user_habits enable row level security;
alter table habit_completions enable row level security;

-- Policies for user_habits
create policy "Users can view their own habits"
  on user_habits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own habits"
  on user_habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on user_habits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habits"
  on user_habits for delete
  using (auth.uid() = user_id);

-- Policies for habit_completions
create policy "Users can view their own completions"
  on habit_completions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own completions"
  on habit_completions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own completions"
  on habit_completions for delete
  using (auth.uid() = user_id);
