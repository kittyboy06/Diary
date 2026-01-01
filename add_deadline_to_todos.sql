-- Add deadline column to todos table
alter table public.todos 
add column if not exists deadline timestamp with time zone;

-- Create index for faster querying of deadlines
create index if not exists todos_deadline_idx on public.todos (deadline);
