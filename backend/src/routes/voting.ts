import express from 'express';
import { supabase } from '../config/supabase';

const router = express.Router();

// Get public vote counts for all projects
router.get('/projects/:projectType/votes', async (req, res) => {
    try {
        const { projectType } = req.params;

        if (!['midterm', 'final'].includes(projectType)) {
            return res.status(400).json({
                error: 'Invalid project type. Must be "midterm" or "final"'
            });
        }

        const { data, error } = await supabase
            .from('public_vote_counts')
            .select('*')
            .eq('project_type', projectType);

        if (error) {
            console.error('Error fetching vote counts:', error);
            return res.status(500).json({ error: 'Failed to fetch vote counts' });
        }

        res.json({
            success: true,
            projects: data || []
        });

    } catch (error) {
        console.error('Error in /projects/:projectType/votes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get student's voting status
router.get('/student/:studentId/voting-status', async (req, res) => {
    try {
        const { studentId } = req.params;

        const { data, error } = await supabase
            .rpc('get_student_remaining_votes', { p_student_id: studentId });

        if (error) {
            console.error('Error fetching voting status:', error);
            return res.status(500).json({ error: 'Failed to fetch voting status' });
        }

        res.json({
            success: true,
            voting_status: data || []
        });

    } catch (error) {
        console.error('Error in /student/:studentId/voting-status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cast a vote for a project
router.post('/vote', async (req, res) => {
    try {
        const { student_id, submission_id, project_type } = req.body;

        // Validate required fields
        if (!student_id || !submission_id || !project_type) {
            return res.status(400).json({
                error: 'Missing required fields: student_id, submission_id, project_type'
            });
        }

        // Validate project type
        if (!['midterm', 'final'].includes(project_type)) {
            return res.status(400).json({
                error: 'Invalid project type. Must be "midterm" or "final"'
            });
        }

        // Check if submission exists and matches project type
        const { data: submission, error: submissionError } = await supabase
            .from('submissions')
            .select('id, project_type, is_public, student_id')
            .eq('id', submission_id)
            .eq('submission_type', 'project')
            .single();

        if (submissionError || !submission) {
            return res.status(404).json({ error: 'Project submission not found' });
        }

        if (submission.project_type !== project_type) {
            return res.status(400).json({
                error: `Project type mismatch. Expected ${project_type}, got ${submission.project_type}`
            });
        }

        if (!submission.is_public) {
            return res.status(400).json({ error: 'Cannot vote for non-public projects' });
        }

        // Prevent students from voting for their own projects
        if (submission.student_id === student_id) {
            return res.status(400).json({ error: 'Cannot vote for your own project' });
        }

        // Get student UUID for the vote record
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('id')
            .eq('student_id', student_id)
            .single();

        if (studentError || !student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Insert vote (unique constraint will prevent duplicate votes)
        const { data, error } = await supabase
            .from('project_votes')
            .insert({
                student_id,
                student_uuid: student.id,
                submission_id,
                project_type
            })
            .select();

        if (error) {
            // Check if it's a unique constraint violation (student already voted)
            if (error.code === '23505') {
                return res.status(409).json({
                    error: `You have already voted for a ${project_type} project`
                });
            }
            console.error('Error casting vote:', error);
            return res.status(500).json({ error: 'Failed to cast vote' });
        }

        res.json({
            success: true,
            message: `Vote cast successfully for ${project_type} project`,
            vote_id: data[0].id
        });

    } catch (error) {
        console.error('Error in /vote:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove a vote (if student wants to change their vote)
router.delete('/vote', async (req, res) => {
    try {
        const { student_id, project_type } = req.body;

        // Validate required fields
        if (!student_id || !project_type) {
            return res.status(400).json({
                error: 'Missing required fields: student_id, project_type'
            });
        }

        // Validate project type
        if (!['midterm', 'final'].includes(project_type)) {
            return res.status(400).json({
                error: 'Invalid project type. Must be "midterm" or "final"'
            });
        }

        const { data, error } = await supabase
            .from('project_votes')
            .delete()
            .eq('student_id', student_id)
            .eq('project_type', project_type)
            .select();

        if (error) {
            console.error('Error removing vote:', error);
            return res.status(500).json({ error: 'Failed to remove vote' });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                error: `No vote found for ${project_type} projects`
            });
        }

        res.json({
            success: true,
            message: `Vote removed successfully for ${project_type} project`
        });

    } catch (error) {
        console.error('Error in DELETE /vote:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;