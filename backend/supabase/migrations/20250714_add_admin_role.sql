-- Add admin role functionality to students table
-- This migration adds an is_admin column and marks T14004 as admin

-- Add is_admin column to students table
ALTER TABLE students 
ADD COLUMN is_admin boolean DEFAULT false NOT NULL;

-- Mark student T14004 as admin
UPDATE students 
SET is_admin = true 
WHERE student_id = 'T14004';

-- Create index for admin queries
CREATE INDEX idx_students_is_admin ON students(is_admin) WHERE is_admin = true;

-- Comments for documentation
COMMENT ON COLUMN students.is_admin IS 'Whether the student has admin privileges';