-- Fix RLS policies on projects table to allow access to shared projects
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create new policies that allow access to shared projects
-- Users can view projects they own OR have permission to access
CREATE POLICY "Users can view accessible projects" ON projects
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM project_permissions 
      WHERE project_permissions.project_id = projects.id 
      AND project_permissions.user_id = auth.uid()
    )
  );

-- Users can insert their own projects
CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update projects they own OR have edit/admin permission
CREATE POLICY "Users can update accessible projects" ON projects
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM project_permissions 
      WHERE project_permissions.project_id = projects.id 
      AND project_permissions.user_id = auth.uid()
      AND project_permissions.permission_type IN ('edit', 'admin')
    )
  );

-- Users can delete only their own projects (not shared ones)
CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (user_id = auth.uid());
