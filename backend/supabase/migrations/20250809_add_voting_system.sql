-- Add voting system for project submissions
-- Each student can vote twice: once for midterm projects, once for final projects
-- Vote counts are public, individual votes are private

-- Project votes table
CREATE TABLE project_votes (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id text NOT NULL,
    student_uuid uuid REFERENCES students(id),
    submission_id bigint REFERENCES submissions(id) ON DELETE CASCADE,
    project_type text NOT NULL CHECK (project_type IN ('midterm', 'final')),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Ensure student can only vote once per project type
    UNIQUE(student_id, project_type)
);

-- Indexes for performance
CREATE INDEX idx_project_votes_student_id ON project_votes(student_id);
CREATE INDEX idx_project_votes_submission_id ON project_votes(submission_id);
CREATE INDEX idx_project_votes_project_type ON project_votes(project_type, created_at DESC);

-- View for public vote counts (no individual vote data exposed)
CREATE VIEW public_vote_counts AS
SELECT 
    s.id as submission_id,
    s.title,
    s.description,
    s.student_id as project_author,
    s.project_type,
    s.github_url,
    s.file_path,
    s.created_at as submission_date,
    COALESCE(COUNT(pv.id), 0) as vote_count
FROM submissions s
LEFT JOIN project_votes pv ON s.id = pv.submission_id
WHERE s.submission_type = 'project' 
  AND s.is_public = true
  AND s.project_type IS NOT NULL
GROUP BY s.id, s.title, s.description, s.student_id, s.project_type, s.github_url, s.file_path, s.created_at
ORDER BY vote_count DESC, s.created_at DESC;

-- Function to check if student can vote for a project type
CREATE OR REPLACE FUNCTION can_student_vote(p_student_id text, p_project_type text)
RETURNS boolean AS $$
BEGIN
    -- Check if student has already voted for this project type
    RETURN NOT EXISTS (
        SELECT 1 FROM project_votes 
        WHERE student_id = p_student_id 
        AND project_type = p_project_type
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get student's remaining votes
CREATE OR REPLACE FUNCTION get_student_remaining_votes(p_student_id text)
RETURNS TABLE(
    project_type text,
    can_vote boolean,
    voted_for_submission_id bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.type::text as project_type,
        NOT EXISTS(
            SELECT 1 FROM project_votes pv 
            WHERE pv.student_id = p_student_id 
            AND pv.project_type = pt.type
        ) as can_vote,
        pv.submission_id as voted_for_submission_id
    FROM (VALUES ('midterm'::text), ('final'::text)) as pt(type)
    LEFT JOIN project_votes pv ON pv.student_id = p_student_id AND pv.project_type = pt.type;
END;
$$ LANGUAGE plpgsql;