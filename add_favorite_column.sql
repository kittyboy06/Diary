-- Add is_favorite column to entries table
ALTER TABLE entries ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Update RLS policies if needed (usually not required for new columns if policy covers 'all')
-- Explicitly allow update on is_favorite for owner (covered by existing policy usually)
