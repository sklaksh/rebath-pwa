-- Temporarily disable RLS on projects table to fix sharing issues
-- This will allow all authenticated users to access all projects
-- We can re-enable it later with proper policies

ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
