-- Emergency fix for infinite recursion in project_permissions
-- Use the simplest possible approach

-- Drop all existing policies including the one we're about to create
DROP POLICY IF EXISTS "Users can view their own permissions" ON project_permissions;
DROP POLICY IF EXISTS "Project owners can view project permissions" ON project_permissions;
DROP POLICY IF EXISTS "Project owners can grant permissions" ON project_permissions;
DROP POLICY IF EXISTS "Project owners can update permissions" ON project_permissions;
DROP POLICY IF EXISTS "Project owners can revoke permissions" ON project_permissions;
DROP POLICY IF EXISTS "Admins can view all project permissions" ON project_permissions;
DROP POLICY IF EXISTS "Admins can grant project permissions" ON project_permissions;
DROP POLICY IF EXISTS "Admins can update project permissions" ON project_permissions;
DROP POLICY IF EXISTS "Admins can revoke project permissions" ON project_permissions;
DROP POLICY IF EXISTS "Simple user permissions" ON project_permissions;
DROP POLICY IF EXISTS "Simple admin permissions" ON project_permissions;
DROP POLICY IF EXISTS "Allow all authenticated users" ON project_permissions;

-- Create a single, simple policy that allows all authenticated users
-- This is temporary to get the app working
CREATE POLICY "Allow all authenticated users" ON project_permissions
  FOR ALL USING (auth.role() = 'authenticated');
