-- Prevent duplicate project submissions
-- Each student can only submit one midterm and one final project
-- Add unique constraint to prevent duplicates

-- Create unique constraint to prevent duplicate project submissions
-- This ensures each student can only have one submission per project type
CREATE UNIQUE INDEX idx_unique_student_project_type 
ON submissions(student_id, project_type) 
WHERE submission_type = 'project' AND project_type IS NOT NULL;

-- Add comment to document the constraint purpose
COMMENT ON INDEX idx_unique_student_project_type IS 
'Ensures each student can only submit one midterm and one final project';