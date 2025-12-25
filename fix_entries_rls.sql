-- Ensure the column exists
ALTER TABLE entries ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Enable RLS on entries if not already enabled
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies to be safe (or create new ones if missing)
-- We will consolidate into a comprehensive policy for the owner

DROP POLICY IF EXISTS "Users can manage own entries" ON entries;
DROP POLICY IF EXISTS "Users can view own entries" ON entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON entries;
DROP POLICY IF EXISTS "Users can update own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON entries;

-- Create a comprehensive policy for full CRUD access to own entries
CREATE POLICY "Users can manage own entries" ON entries
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Explicitly ensure UPDATE is working
-- The above FOR ALL covers SELECT, INSERT, UPDATE, DELETE
