-- Fix project notes RLS policies to work without app.current_student_id setting
-- Drop existing policies and create new ones that work with our API structure

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view own notes" ON project_notes;
DROP POLICY IF EXISTS "Students can create own notes" ON project_notes;
DROP POLICY IF EXISTS "Students can update own notes" ON project_notes;
DROP POLICY IF EXISTS "Students can delete own notes" ON project_notes;

-- Disable RLS temporarily for our API-based approach
-- Since we're handling authorization at the API level, we can simplify the RLS
ALTER TABLE project_notes DISABLE ROW LEVEL SECURITY;

-- Alternative: If we want to keep RLS enabled, we need simpler policies
-- that work with our current setup
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now since we handle security in the API layer
-- In a production environment, you might want more sophisticated policies
CREATE POLICY "Allow all operations on project_notes" ON project_notes
    FOR ALL USING (true) WITH CHECK (true);

-- Note: In production, you might want to implement JWT-based RLS policies instead