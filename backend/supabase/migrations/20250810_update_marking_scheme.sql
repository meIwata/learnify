-- Update marking scheme migration
-- New point system:
-- - Project submissions: 20 points (midterm), 50 points (final)
-- - Project notes: 5 points per note
-- - Project votes: 5 points per vote
-- - Most voted project bonus: 50 points (only from 26 Aug 2025)

-- Add bonus tracking to submissions table (if columns don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='bonus_points') THEN
        ALTER TABLE submissions ADD COLUMN bonus_points integer DEFAULT 0 NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='bonus_awarded_date') THEN
        ALTER TABLE submissions ADD COLUMN bonus_awarded_date timestamp with time zone;
    END IF;
END $$;

-- Create index for bonus tracking (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_submissions_bonus_points ON submissions(bonus_points, bonus_awarded_date) 
WHERE bonus_points > 0;

-- Function to calculate vote winner bonus (only for votes after 26 Aug 2025)
CREATE OR REPLACE FUNCTION award_vote_winner_bonus(p_project_type text)
RETURNS TABLE(
    submission_id bigint,
    bonus_awarded integer,
    vote_count bigint
) AS $$
DECLARE
    bonus_cutoff_date timestamp with time zone := '2025-08-26 00:00:00+00'::timestamp with time zone;
    winning_submission_id bigint;
    max_votes bigint;
BEGIN
    -- Find the submission with the most votes (only counting votes after cutoff date)
    SELECT s.id, COUNT(pv.id) as votes
    INTO winning_submission_id, max_votes
    FROM submissions s
    LEFT JOIN project_votes pv ON s.id = pv.submission_id 
        AND pv.created_at >= bonus_cutoff_date
    WHERE s.submission_type = 'project' 
        AND s.is_public = true
        AND s.project_type = p_project_type
    GROUP BY s.id
    ORDER BY votes DESC, s.created_at ASC  -- If tie, earliest submission wins
    LIMIT 1;
    
    -- Only award bonus if there are actually votes and no bonus already awarded
    IF winning_submission_id IS NOT NULL AND max_votes > 0 THEN
        -- Check if bonus already awarded for this submission
        IF NOT EXISTS (
            SELECT 1 FROM submissions 
            WHERE id = winning_submission_id 
            AND bonus_points > 0
        ) THEN
            -- Award the bonus
            UPDATE submissions 
            SET bonus_points = 50,
                bonus_awarded_date = now()
            WHERE id = winning_submission_id;
            
            RETURN QUERY SELECT winning_submission_id, 50, max_votes;
        END IF;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to get student points breakdown
CREATE OR REPLACE FUNCTION get_student_points_breakdown(p_student_id text)
RETURNS TABLE(
    student_id text,
    check_in_points integer,
    review_points integer,
    midterm_project_points integer,
    final_project_points integer,
    project_notes_points integer,
    voting_points integer,
    quiz_points integer,
    bonus_points integer,
    total_points integer
) AS $$
DECLARE
    v_check_in_points integer := 0;
    v_review_points integer := 0;
    v_midterm_points integer := 0;
    v_final_points integer := 0;
    v_notes_points integer := 0;
    v_voting_points integer := 0;
    v_quiz_points integer := 0;
    v_bonus_points integer := 0;
BEGIN
    -- Check-in points (10 if any check-ins exist)
    SELECT CASE WHEN COUNT(*) > 0 THEN 10 ELSE 0 END
    INTO v_check_in_points
    FROM student_check_ins
    WHERE student_check_ins.student_id = p_student_id;
    
    -- Review points (10 if any reviews exist)
    SELECT CASE WHEN COUNT(*) > 0 THEN 10 ELSE 0 END
    INTO v_review_points
    FROM student_reviews
    WHERE student_reviews.student_id = p_student_id;
    
    -- Midterm project points (20 points per midterm submission)
    SELECT COALESCE(COUNT(*) * 20, 0)
    INTO v_midterm_points
    FROM submissions
    WHERE submissions.student_id = p_student_id
        AND submission_type = 'project'
        AND project_type = 'midterm';
    
    -- Final project points (50 points per final submission)
    SELECT COALESCE(COUNT(*) * 50, 0)
    INTO v_final_points
    FROM submissions
    WHERE submissions.student_id = p_student_id
        AND submission_type = 'project'
        AND project_type = 'final';
    
    -- Notes points (5 points per project note)
    SELECT COALESCE(COUNT(*) * 5, 0)
    INTO v_notes_points
    FROM project_notes
    WHERE project_notes.student_id = p_student_id;
    
    -- Voting points (5 points per vote)
    SELECT COALESCE(COUNT(*) * 5, 0)
    INTO v_voting_points
    FROM project_votes
    WHERE project_votes.student_id = p_student_id;
    
    -- Quiz points (existing logic)
    SELECT COALESCE(MAX(student_quiz_scores.total_points), 0)
    INTO v_quiz_points
    FROM student_quiz_scores
    WHERE student_quiz_scores.student_id = p_student_id;
    
    -- Bonus points (from winning votes)
    SELECT COALESCE(SUM(submissions.bonus_points), 0)
    INTO v_bonus_points
    FROM submissions
    WHERE submissions.student_id = p_student_id
        AND submissions.bonus_points > 0;
    
    RETURN QUERY SELECT 
        p_student_id,
        v_check_in_points,
        v_review_points,
        v_midterm_points,
        v_final_points,
        v_notes_points,
        v_voting_points,
        v_quiz_points,
        v_bonus_points,
        (v_check_in_points + v_review_points + v_midterm_points + v_final_points + 
         v_notes_points + v_voting_points + v_quiz_points + v_bonus_points);
END;
$$ LANGUAGE plpgsql;

-- Update the public_vote_counts view to include bonus information
DROP VIEW IF EXISTS public_vote_counts;
CREATE OR REPLACE VIEW public_vote_counts AS
SELECT 
    s.id as submission_id,
    s.title,
    s.description,
    s.student_id as project_author,
    s.project_type,
    s.github_url,
    s.file_path,
    s.created_at as submission_date,
    s.bonus_points,
    s.bonus_awarded_date,
    COALESCE(COUNT(pv.id), 0) as vote_count,
    -- Count votes only after bonus cutoff date for bonus calculation
    COALESCE(COUNT(CASE WHEN pv.created_at >= '2025-08-26 00:00:00+00'::timestamp with time zone THEN pv.id END), 0) as bonus_eligible_votes
FROM submissions s
LEFT JOIN project_votes pv ON s.id = pv.submission_id
WHERE s.submission_type = 'project' 
  AND s.is_public = true
  AND s.project_type IS NOT NULL
GROUP BY s.id, s.title, s.description, s.student_id, s.project_type, s.github_url, s.file_path, s.created_at, s.bonus_points, s.bonus_awarded_date
ORDER BY vote_count DESC, s.created_at DESC;

-- Create a trigger to automatically calculate bonus when votes are cast (after Aug 26, 2025)
CREATE OR REPLACE FUNCTION check_and_award_bonus()
RETURNS TRIGGER AS $$
DECLARE
    bonus_cutoff_date timestamp with time zone := '2025-08-26 00:00:00+00'::timestamp with time zone;
BEGIN
    -- Only process if this vote is after the cutoff date
    IF NEW.created_at >= bonus_cutoff_date THEN
        -- Award bonus for the project type
        PERFORM award_vote_winner_bonus(NEW.project_type);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on project_votes
DROP TRIGGER IF EXISTS award_bonus_on_vote ON project_votes;
CREATE TRIGGER award_bonus_on_vote
    AFTER INSERT ON project_votes
    FOR EACH ROW
    EXECUTE FUNCTION check_and_award_bonus();