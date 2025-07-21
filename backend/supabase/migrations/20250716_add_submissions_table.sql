-- Add submissions table for screenshot and GitHub repository submissions
-- Students can submit screenshots and GitHub links for assignments

CREATE TABLE submissions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id text NOT NULL,
    student_uuid uuid REFERENCES students(id),
    submission_type text NOT NULL CHECK (submission_type IN ('screenshot', 'github_repo')),
    title text NOT NULL,
    description text,
    file_path text, -- Path to uploaded file in Supabase Storage
    file_name text, -- Original file name
    file_size bigint, -- File size in bytes
    mime_type text, -- MIME type of the file
    github_url text, -- GitHub repository URL (for github_repo type)
    lesson_id text, -- Optional: Link to specific lesson
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_submissions_student_id ON submissions(student_id, created_at DESC);
CREATE INDEX idx_submissions_student_uuid ON submissions(student_uuid, created_at DESC);
CREATE INDEX idx_submissions_type ON submissions(submission_type, created_at DESC);
CREATE INDEX idx_submissions_lesson_id ON submissions(lesson_id, created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for submissions if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for submissions bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'submissions');

-- Allow public read access to submission files
CREATE POLICY "Allow public read access" ON storage.objects
    FOR SELECT USING (bucket_id = 'submissions');

-- Allow users to update their own submissions
CREATE POLICY "Allow users to update own submissions" ON storage.objects
    FOR UPDATE USING (bucket_id = 'submissions');

-- Allow users to delete their own submissions
CREATE POLICY "Allow users to delete own submissions" ON storage.objects
    FOR DELETE USING (bucket_id = 'submissions');