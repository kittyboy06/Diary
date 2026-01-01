-- Create todo_folders table
create table public.todo_folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add folder_id to todos table
alter table public.todos 
add column if not exists folder_id uuid references public.todo_folders(id) on delete set null;

-- RLS Policies for todo_folders
alter table public.todo_folders enable row level security;

create policy "Users can view their own todo folders"
  on public.todo_folders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own todo folders"
  on public.todo_folders for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own todo folders"
  on public.todo_folders for delete
  using (auth.uid() = user_id);
