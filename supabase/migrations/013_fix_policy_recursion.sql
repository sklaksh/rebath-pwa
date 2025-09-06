-- Fix syntax error in project_permissions DELETE policy and add missing admin policies

-- First, drop the broken policy
DROP POLICY IF EXISTS "Project owners can revoke permissions" ON project_permissions;

-- Recreate the DELETE policy with correct syntax
CREATE POLICY "Project owners can revoke permissions" ON project_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_permissions.project_id 
      AND p.user_id = auth.uid()
    )
  );

-- Add admin policies for assessments table
CREATE POLICY "Admins can view all assessments" ON assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all assessments" ON assessments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all assessments" ON assessments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Add admin policies for quotes table
CREATE POLICY "Admins can view all quotes" ON quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all quotes" ON quotes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all quotes" ON quotes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Add admin policies for job_work_items table (scope of work)
CREATE POLICY "Admins can view all job work items" ON job_work_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all job work items" ON job_work_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete all job work items" ON job_work_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Note: Photos are stored in Supabase storage (blob storage), not in database tables
