import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase';

const router = Router();

// Validation schemas
const createNoteSchema = z.object({
    submission_id: z.number().positive(),
    student_id: z.string().min(1, 'Student ID is required'),
    note_text: z.string().min(1, 'Note text is required'),
    is_private: z.boolean().optional().default(true)
});

const updateNoteSchema = z.object({
    note_text: z.string().min(1, 'Note text is required')
});

// Helper function to ensure student exists
async function getStudentUuid(studentId: string): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('id')
            .eq('student_id', studentId)
            .single();

        if (error || !data) {
            return null;
        }

        return data.id;
    } catch (error) {
        console.error('Error getting student UUID:', error);
        return null;
    }
}

// GET /api/project-notes/:submissionId - Get all notes for a submission (filtered by student)
router.get('/:submissionId', async (req: Request, res: Response) => {
    try {
        const submissionId = parseInt(req.params.submissionId);
        const studentId = req.query.student_id as string;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                error: 'Student ID is required'
            });
        }

        // Get only the notes created by this student
        const { data: notes, error } = await supabase
            .from('project_notes')
            .select('*')
            .eq('submission_id', submissionId)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get notes error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch notes',
                message: error.message
            });
        }

        res.json({
            success: true,
            data: {
                notes: notes || [],
                submission_id: submissionId,
                student_id: studentId
            }
        });

    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// POST /api/project-notes - Create a new note
router.post('/', async (req: Request, res: Response) => {
    try {
        const validation = createNoteSchema.safeParse(req.body);
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: validation.error.issues
            });
        }

        const { submission_id, student_id, note_text, is_private } = validation.data;

        // Get student UUID
        const studentUuid = await getStudentUuid(student_id);
        if (!studentUuid) {
            return res.status(400).json({
                success: false,
                error: 'Student not found'
            });
        }

        // Create the note
        const { data: note, error } = await supabase
            .from('project_notes')
            .insert({
                submission_id,
                student_id,
                student_uuid: studentUuid,
                note_text,
                is_private
            })
            .select()
            .single();

        if (error) {
            console.error('Create note error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to create note',
                message: error.message
            });
        }

        res.status(201).json({
            success: true,
            data: {
                note
            },
            message: 'Note created successfully'
        });

    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// PUT /api/project-notes/:noteId - Update a note
router.put('/:noteId', async (req: Request, res: Response) => {
    try {
        const noteId = parseInt(req.params.noteId);
        const studentId = req.query.student_id as string;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                error: 'Student ID is required'
            });
        }

        const validation = updateNoteSchema.safeParse(req.body);
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: validation.error.issues
            });
        }

        const { note_text } = validation.data;

        // Update the note (only if it belongs to the student)
        const { data: note, error } = await supabase
            .from('project_notes')
            .update({ note_text })
            .eq('id', noteId)
            .eq('student_id', studentId)
            .select()
            .single();

        if (error) {
            console.error('Update note error:', error);
            return res.status(404).json({
                success: false,
                error: 'Note not found or access denied',
                message: error.message
            });
        }

        res.json({
            success: true,
            data: {
                note
            },
            message: 'Note updated successfully'
        });

    } catch (error) {
        console.error('Update note error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// DELETE /api/project-notes/:noteId - Delete a note
router.delete('/:noteId', async (req: Request, res: Response) => {
    try {
        const noteId = parseInt(req.params.noteId);
        const studentId = req.query.student_id as string;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                error: 'Student ID is required'
            });
        }

        // Delete the note (only if it belongs to the student)
        const { error } = await supabase
            .from('project_notes')
            .delete()
            .eq('id', noteId)
            .eq('student_id', studentId);

        if (error) {
            console.error('Delete note error:', error);
            return res.status(404).json({
                success: false,
                error: 'Note not found or access denied',
                message: error.message
            });
        }

        res.json({
            success: true,
            message: 'Note deleted successfully'
        });

    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;