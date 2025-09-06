-- Create project_permissions table to track user access to projects
CREATE TABLE project_permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission_type TEXT CHECK (permission_type IN ('view', 'edit', 'admin')) DEFAULT 'view' NOT NULL,
  granted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS on project_permissions
ALTER TABLE project_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_permissions (simplified to avoid recursion)
-- Users can view permissions for projects they own or have access to
CREATE POLICY "Users can view their own permissions" ON project_permissions
  FOR SELECT USING (user_id = auth.uid());

-- Project owners can view all permissions for their projects
CREATE POLICY "Project owners can view project permissions" ON project_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_permissions.project_id 
      AND p.user_id = auth.uid()
    )
  );

-- Project owners can grant permissions
CREATE POLICY "Project owners can grant permissions" ON project_permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_permissions.project_id 
      AND p.user_id = auth.uid()
    )
  );

-- Project owners can update permissions
CREATE POLICY "Project owners can update permissions" ON project_permissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_permissions.project_id 
      AND p.user_id = auth.uid()
    )
  );

-- Project owners can revoke permissions
CREATE POLICY "Project owners can revoke permissions" ON project_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_permissions.project_id 
      AND p.user_id = auth.uid()
    )
  );

-- Admin policies (separate to avoid recursion)
-- Admins can view all project permissions
CREATE POLICY "Admins can view all project permissions" ON project_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admins can grant permissions
CREATE POLICY "Admins can grant project permissions" ON project_permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admins can update permissions
CREATE POLICY "Admins can update project permissions" ON project_permissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admins can revoke permissions
CREATE POLICY "Admins can revoke project permissions" ON project_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create index for better performance
CREATE INDEX idx_project_permissions_project_id ON project_permissions(project_id);
CREATE INDEX idx_project_permissions_user_id ON project_permissions(user_id);
