-- Add user_name field to projects table
ALTER TABLE projects 
ADD COLUMN user_name TEXT;

-- Update existing projects with user names from profiles
UPDATE projects 
SET user_name = profiles.full_name
FROM profiles 
WHERE projects.user_id = profiles.id 
AND profiles.full_name IS NOT NULL;

-- For projects where full_name is null, use email
UPDATE projects 
SET user_name = profiles.email
FROM profiles 
WHERE projects.user_id = profiles.id 
AND projects.user_name IS NULL;
