-- Add support for multiple screenshots per project submission
-- Create a separate table for submission files to support multiple files per submission

-- Create submission_files table
CREATE TABLE submission_files (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    submission_id bigint NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    file_path text NOT NULL,
    file_name text NOT NULL,
    file_size bigint,
    mime_type text,
    file_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_submission_files_submission_id ON submission_files(submission_id);
CREATE INDEX idx_submission_files_order ON submission_files(submission_id, file_order);

-- Enable RLS (Row Level Security)
ALTER TABLE submission_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - allow all operations since we handle authorization at API level
CREATE POLICY "Allow all operations on submission_files" ON submission_files
    FOR ALL USING (true) WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_submission_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_submission_files_updated_at
    BEFORE UPDATE ON submission_files
    FOR EACH ROW
    EXECUTE FUNCTION update_submission_files_updated_at();

-- Migrate existing single file data to the new structure
INSERT INTO submission_files (submission_id, file_path, file_name, file_size, mime_type, file_order, created_at, updated_at)
SELECT 
    id as submission_id,
    file_path,
    file_name,
    file_size,
    mime_type,
    0 as file_order,
    created_at,
    updated_at
FROM submissions 
WHERE file_path IS NOT NULL AND file_path != '';

-- Note: Keep the original file columns in submissions table for backward compatibility
-- We can remove them in a future migration after confirming the new system works