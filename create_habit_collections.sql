-- Create table for Habit Collections
create table if not exists habit_collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table habit_collections enable row level security;

-- Policies
create policy "Users can view their own collections"
  on habit_collections for select using (auth.uid() = user_id);

create policy "Users can insert their own collections"
  on habit_collections for insert with check (auth.uid() = user_id);

create policy "Users can update their own collections"
  on habit_collections for update using (auth.uid() = user_id);

create policy "Users can delete their own collections"
  on habit_collections for delete using (auth.uid() = user_id);

-- Add collection_id to user_habits
alter table user_habits 
add column if not exists collection_id uuid references habit_collections(id) on delete set null;
