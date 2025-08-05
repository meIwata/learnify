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

// GET /api/project-notes/:submissionId - Get the single note for a submission by a student
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

        // Get the single note created by this student for this submission
        const { data: note, error } = await supabase
            .from('project_notes')
            .select('*')
            .eq('submission_id', submissionId)
            .eq('student_id', studentId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Get note error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch note',
                message: error.message
            });
        }

        res.json({
            success: true,
            data: {
                note: note || null,
                submission_id: submissionId,
                student_id: studentId,
                has_note: !!note
            }
        });

    } catch (error) {
        console.error('Get note error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// POST /api/project-notes - Create or update a student's note for a project (upsert)
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

        // Check if note already exists
        const { data: existingNote } = await supabase
            .from('project_notes')
            .select('id')
            .eq('submission_id', submission_id)
            .eq('student_id', student_id)
            .single();

        let note;
        let operation;

        if (existingNote) {
            // Update existing note
            const { data: updatedNote, error } = await supabase
                .from('project_notes')
                .update({ 
                    note_text,
                    is_private,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingNote.id)
                .select()
                .single();

            if (error) {
                console.error('Update note error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to update note',
                    message: error.message
                });
            }

            note = updatedNote;
            operation = 'updated';
        } else {
            // Create new note
            const { data: newNote, error } = await supabase
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

            note = newNote;
            operation = 'created';
        }

        res.status(operation === 'created' ? 201 : 200).json({
            success: true,
            data: {
                note
            },
            message: `Note ${operation} successfully`
        });

    } catch (error) {
        console.error('Upsert note error:', error);
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