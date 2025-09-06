-- Fix remaining infinite recursion issues in project_permissions

-- Drop all existing policies on project_permissions to start fresh
DROP POLICY IF EXISTS "Users can view their own permissions" ON project_permissions;
DROP POLICY IF EXISTS "Project owners can view project permissions" ON project_permissions;
DROP POLICY IF EXISTS "Project owners can grant permissions" ON project_permissions;
DROP POLICY IF EXISTS "Project owners can update permissions" ON project_permissions;
DROP POLICY IF EXISTS "Project owners can revoke permissions" ON project_permissions;
DROP POLICY IF EXISTS "Admins can view all project permissions" ON project_permissions;
DROP POLICY IF EXISTS "Admins can grant project permissions" ON project_permissions;
DROP POLICY IF EXISTS "Admins can update project permissions" ON project_permissions;
DROP POLICY IF EXISTS "Admins can revoke project permissions" ON project_permissions;

-- Recreate policies with simpler logic to avoid recursion
-- Users can view their own permissions
CREATE POLICY "Users can view their own permissions" ON project_permissions
  FOR SELECT USING (user_id = auth.uid());

-- Project owners can view all permissions for their projects (simplified)
CREATE POLICY "Project owners can view project permissions" ON project_permissions
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Project owners can grant permissions (simplified)
CREATE POLICY "Project owners can grant permissions" ON project_permissions
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Project owners can update permissions (simplified)
CREATE POLICY "Project owners can update permissions" ON project_permissions
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Project owners can revoke permissions (simplified)
CREATE POLICY "Project owners can revoke permissions" ON project_permissions
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Admin policies (simplified to avoid recursion)
CREATE POLICY "Admins can view all project permissions" ON project_permissions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can grant project permissions" ON project_permissions
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can update project permissions" ON project_permissions
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Admins can revoke project permissions" ON project_permissions
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );
