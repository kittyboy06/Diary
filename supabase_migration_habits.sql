-- Migration to add 'habits' column to 'entries' table
-- This column will store a JSON object with boolean flags for habits
-- Example: {"exercise": true, "water": false, "learning": true}

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'entries'
        AND column_name = 'habits'
    ) THEN
        ALTER TABLE entries ADD COLUMN habits JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;
