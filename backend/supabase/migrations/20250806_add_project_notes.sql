-- Add project notes table for private notes on project submissions
-- Only the note author can see their own notes

CREATE TABLE project_notes (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    submission_id bigint NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    student_id text NOT NULL,
    student_uuid uuid REFERENCES students(id),
    note_text text NOT NULL,
    is_private boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_project_notes_submission_id ON project_notes(submission_id, created_at DESC);
CREATE INDEX idx_project_notes_student_id ON project_notes(student_id, created_at DESC);
CREATE INDEX idx_project_notes_student_uuid ON project_notes(student_uuid, created_at DESC);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_project_notes_updated_at
    BEFORE UPDATE ON project_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for project notes
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;

-- Students can only see their own private notes
CREATE POLICY "Students can view own notes" ON project_notes
    FOR SELECT USING (student_id = current_setting('app.current_student_id', true));

-- Students can only create their own notes
CREATE POLICY "Students can create own notes" ON project_notes
    FOR INSERT WITH CHECK (student_id = current_setting('app.current_student_id', true));

-- Students can only update their own notes
CREATE POLICY "Students can update own notes" ON project_notes
    FOR UPDATE USING (student_id = current_setting('app.current_student_id', true));

-- Students can only delete their own notes
CREATE POLICY "Students can delete own notes" ON project_notes
    FOR DELETE USING (student_id = current_setting('app.current_student_id', true));