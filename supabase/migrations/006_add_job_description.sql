-- Add job_description column to projects table
ALTER TABLE projects ADD COLUMN job_description TEXT;

-- Add comment to document the column
COMMENT ON COLUMN projects.job_description IS 'Detailed description of the work to be performed for this project';
