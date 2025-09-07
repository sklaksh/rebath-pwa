-- Re-enable RLS on projects table with proper admin access policies
-- This migration re-enables RLS while ensuring admins can still access all projects

-- First, drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Admins can update all projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete all projects" ON projects;

-- Re-enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for projects table

-- 1. Users can view their own projects
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (user_id = auth.uid());

-- 2. Users can create projects
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. Users can update their own projects
CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (user_id = auth.uid());

-- 4. Users can delete their own projects
CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (user_id = auth.uid());

-- 5. Admins can view all projects
CREATE POLICY "Admins can view all projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 6. Admins can update all projects
CREATE POLICY "Admins can update all projects" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 7. Admins can delete all projects
CREATE POLICY "Admins can delete all projects" ON projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 8. Users can view projects they have been granted access to via project_permissions
CREATE POLICY "Users can view shared projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_permissions 
      WHERE project_permissions.project_id = projects.id 
      AND project_permissions.user_id = auth.uid()
    )
  );

-- 9. Users can update projects they have edit or admin permissions for
CREATE POLICY "Users can update shared projects" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_permissions 
      WHERE project_permissions.project_id = projects.id 
      AND project_permissions.user_id = auth.uid()
      AND project_permissions.permission_type IN ('edit', 'admin')
    )
  );

-- 10. Users can delete projects they have admin permissions for
CREATE POLICY "Users can delete shared projects" ON projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_permissions 
      WHERE project_permissions.project_id = projects.id 
      AND project_permissions.user_id = auth.uid()
      AND project_permissions.permission_type = 'admin'
    )
  );
