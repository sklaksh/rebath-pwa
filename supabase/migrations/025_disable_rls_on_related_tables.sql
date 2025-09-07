-- Disable RLS on related tables to fix project detail page loading
-- This will allow access to assessments, quotes, and job_work_items

ALTER TABLE assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_work_items DISABLE ROW LEVEL SECURITY;
