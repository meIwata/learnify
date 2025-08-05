-- Add admin role functionality to students table
-- This migration adds an is_admin column and marks T14004 as admin

-- Add is_admin column to students table
ALTER TABLE students 
ADD COLUMN is_admin boolean DEFAULT false NOT NULL;

-- Insert admin student T14004 if not exists, then mark as admin
INSERT INTO students (student_id, full_name, is_admin, created_at)
VALUES ('T14004', 'Admin User', true, now())
ON CONFLICT (student_id) 
DO UPDATE SET is_admin = true;

-- Create index for admin queries
CREATE INDEX idx_students_is_admin ON students(is_admin) WHERE is_admin = true;

-- Comments for documentation
COMMENT ON COLUMN students.is_admin IS 'Whether the student has admin privileges';