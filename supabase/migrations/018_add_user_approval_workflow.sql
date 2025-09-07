-- Add user approval workflow
-- Add is_active field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Update existing users to be active (except for new ones)
UPDATE profiles SET is_active = true WHERE created_at < NOW() - INTERVAL '1 hour';

-- Add RLS policy to prevent inactive users from accessing data
-- Users can only access their own profile if they are active
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Active users can view their own profile" ON profiles
  FOR SELECT USING (id = auth.uid() AND is_active = true);

CREATE POLICY "Active users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid() AND is_active = true);

-- Admins can view and update all profiles (including inactive ones)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin' 
      AND p.is_active = true
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin' 
      AND p.is_active = true
    )
  );

-- Add RLS policy to prevent inactive users from accessing projects
-- Users can only access projects if they are active
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

CREATE POLICY "Active users can view their own projects" ON projects
  FOR SELECT USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can update their own projects" ON projects
  FOR UPDATE USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can delete their own projects" ON projects
  FOR DELETE USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

-- Add RLS policy to prevent inactive users from accessing assessments
DROP POLICY IF EXISTS "Users can view their own assessments" ON assessments;
DROP POLICY IF EXISTS "Users can insert their own assessments" ON assessments;
DROP POLICY IF EXISTS "Users can update their own assessments" ON assessments;
DROP POLICY IF EXISTS "Users can delete their own assessments" ON assessments;

CREATE POLICY "Active users can view their own assessments" ON assessments
  FOR SELECT USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can insert their own assessments" ON assessments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can update their own assessments" ON assessments
  FOR UPDATE USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can delete their own assessments" ON assessments
  FOR DELETE USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

-- Add RLS policy to prevent inactive users from accessing quotes
DROP POLICY IF EXISTS "Users can view their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON quotes;

CREATE POLICY "Active users can view their own quotes" ON quotes
  FOR SELECT USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can insert their own quotes" ON quotes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can update their own quotes" ON quotes
  FOR UPDATE USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Active users can delete their own quotes" ON quotes
  FOR DELETE USING (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_active = true)
  );
