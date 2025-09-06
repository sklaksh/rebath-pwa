-- Add is_active field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing profiles to be active by default
UPDATE profiles 
SET is_active = true 
WHERE is_active IS NULL;

-- Add RLS policy for is_active field
DO $$ 
BEGIN
    -- Allow users to view their own active status
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can view own active status'
    ) THEN
        CREATE POLICY "Users can view own active status" ON profiles
            FOR SELECT USING (auth.uid() = id);
    END IF;

    -- Allow admins to update active status
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Admins can update active status'
    ) THEN
        CREATE POLICY "Admins can update active status" ON profiles
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND role = 'admin'
                )
            );
    END IF;
END $$;
