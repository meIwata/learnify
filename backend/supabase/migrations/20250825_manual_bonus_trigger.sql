-- Update bonus system to be manually triggered and ignore cutoff date
-- Remove automatic trigger and update function to count all votes

-- Drop the automatic trigger
DROP TRIGGER IF EXISTS award_bonus_on_vote ON project_votes;
DROP FUNCTION IF EXISTS check_and_award_bonus();

-- Update the award_vote_winner_bonus function to ignore cutoff date
CREATE OR REPLACE FUNCTION award_vote_winner_bonus(p_project_type text)
RETURNS TABLE(
    submission_id bigint,
    bonus_awarded integer,
    vote_count bigint
) AS $$
DECLARE
    winning_submission_id bigint;
    max_votes bigint;
BEGIN
    -- Find the submission with the most votes (count ALL votes, no cutoff date)
    SELECT s.id, COUNT(pv.id) as votes
    INTO winning_submission_id, max_votes
    FROM submissions s
    LEFT JOIN project_votes pv ON s.id = pv.submission_id 
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

-- Update the public_vote_counts view to remove bonus cutoff logic
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
    COALESCE(COUNT(pv.id), 0) as vote_count
FROM submissions s
LEFT JOIN project_votes pv ON s.id = pv.submission_id
WHERE s.submission_type = 'project' 
  AND s.is_public = true
  AND s.project_type IS NOT NULL
GROUP BY s.id, s.title, s.description, s.student_id, s.project_type, s.github_url, s.file_path, s.created_at, s.bonus_points, s.bonus_awarded_date
ORDER BY vote_count DESC, s.created_at DESC;