-- Add 'started' status to projects table
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
  CHECK (status IN ('assessment', 'quote_ready', 'started', 'in_progress', 'completed', 'cancelled'));
