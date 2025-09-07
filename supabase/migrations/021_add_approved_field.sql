-- Add approved field to profiles table if it doesn't exist
-- This field controls whether a user can access the system

-- Add approved column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Set existing users (created more than 1 hour ago) to approved
UPDATE profiles SET approved = true WHERE created_at < NOW() - INTERVAL '1 hour';

-- Set new users (created within the last hour) to not approved
UPDATE profiles SET approved = false WHERE created_at >= NOW() - INTERVAL '1 hour';

-- Add a comment to clarify the column purpose
COMMENT ON COLUMN profiles.approved IS 'Whether the user account is approved by an admin. New users default to false until admin approval.';

-- Update the is_active column comment for clarity
COMMENT ON COLUMN profiles.is_active IS 'Whether the user account is active and can be used. This is separate from approval status.';
