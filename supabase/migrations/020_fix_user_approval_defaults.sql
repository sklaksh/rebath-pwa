-- Fix user approval workflow defaults
-- Ensure new users are inactive by default and existing users are active

-- First, let's check what the current state is and fix it
-- Set all existing users (created more than 1 hour ago) to active
UPDATE profiles SET is_active = true WHERE created_at < NOW() - INTERVAL '1 hour';

-- Set all new users (created within the last hour) to inactive
UPDATE profiles SET is_active = false WHERE created_at >= NOW() - INTERVAL '1 hour';

-- Make sure the default for new users is false
ALTER TABLE profiles ALTER COLUMN is_active SET DEFAULT false;

-- Add a comment to clarify the column purpose
COMMENT ON COLUMN profiles.is_active IS 'Whether the user account is approved and active. New users default to false until admin approval.';
