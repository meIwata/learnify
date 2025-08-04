-- Add project submissions support
-- Extend submissions table to support project types (midterm/final)

-- Add new columns to submissions table
ALTER TABLE submissions 
ADD COLUMN project_type text CHECK (project_type IN ('midterm', 'final')),
ADD COLUMN is_public boolean DEFAULT false NOT NULL;

-- Update submission_type to include project types
ALTER TABLE submissions 
DROP CONSTRAINT submissions_submission_type_check;

ALTER TABLE submissions 
ADD CONSTRAINT submissions_submission_type_check 
CHECK (submission_type IN ('screenshot', 'github_repo', 'project'));

-- Create index for public project submissions
CREATE INDEX idx_submissions_public_projects ON submissions(is_public, project_type, created_at DESC) 
WHERE submission_type = 'project';

-- Create index for project types
CREATE INDEX idx_submissions_project_type ON submissions(project_type, created_at DESC) 
WHERE submission_type = 'project';

-- Update existing data - this is safe as no existing data should have project_type
UPDATE submissions SET is_public = false WHERE is_public IS NULL;