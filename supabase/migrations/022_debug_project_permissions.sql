-- Debug script to check project_permissions table
-- This will help us see what's in the table

-- Check if project_permissions table exists and has data
SELECT 'project_permissions table structure:' as info;
\d project_permissions;

SELECT 'project_permissions data:' as info;
SELECT * FROM project_permissions;

-- Check if there are any permissions for the current user
-- (This will show all permissions, not just for a specific user)
SELECT 'All project permissions:' as info;
SELECT 
  pp.*,
  p.client_name as project_name,
  prof.full_name as user_name,
  prof.email as user_email
FROM project_permissions pp
LEFT JOIN projects p ON pp.project_id = p.id
LEFT JOIN profiles prof ON pp.user_id = prof.id;
