import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow images and common document formats
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and documents are allowed.'));
        }
    }
});

// Validation schemas
const createSubmissionSchema = z.object({
    student_id: z.string().min(1, 'Student ID is required'),
    full_name: z.string().optional(),
    submission_type: z.enum(['screenshot', 'github_repo']),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    github_url: z.string().url().optional(),
    lesson_id: z.string().optional()
});

const getSubmissionsSchema = z.object({
    student_id: z.string().optional(),
    submission_type: z.enum(['screenshot', 'github_repo']).optional(),
    lesson_id: z.string().optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    offset: z.string().regex(/^\d+$/).optional()
});

// Helper function to ensure student exists
async function ensureStudentExists(studentId: string, fullName?: string) {
    try {
        // Check if student exists
        const { data: existingStudent } = await supabase
            .from('students')
            .select('id')
            .eq('student_id', studentId)
            .single();

        if (existingStudent) {
            return existingStudent.id;
        }

        // Create new student if they don't exist
        const { data: newStudent, error } = await supabase
            .from('students')
            .insert({
                student_id: studentId,
                full_name: fullName || studentId
            })
            .select('id')
            .single();

        if (error) {
            throw error;
        }

        return newStudent.id;
    } catch (error) {
        console.error('Error ensuring student exists:', error);
        throw error;
    }
}

// Helper function to upload file to Supabase Storage
async function uploadFileToStorage(file: Express.Multer.File, studentId: string): Promise<string> {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${studentId}/${uuidv4()}${fileExtension}`;
    
    const { data, error } = await supabase.storage
        .from('submissions')
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });

    if (error) {
        console.error('Storage upload error:', error);
        throw new Error('Failed to upload file to storage');
    }

    return fileName;
}

// POST /api/submissions - Create a new submission
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const validation = createSubmissionSchema.safeParse(req.body);
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: validation.error.issues
            });
        }

        const { student_id, full_name, submission_type, title, description, github_url, lesson_id } = validation.data;

        // Ensure student exists
        const studentUuid = await ensureStudentExists(student_id, full_name);

        let filePath = null;
        let fileName = null;
        let fileSize = null;
        let mimeType = null;

        // Handle file upload if present
        if (req.file && submission_type === 'screenshot') {
            try {
                filePath = await uploadFileToStorage(req.file, student_id);
                fileName = req.file.originalname;
                fileSize = req.file.size;
                mimeType = req.file.mimetype;
            } catch (uploadError) {
                console.error('File upload failed:', uploadError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to upload file',
                    message: 'File upload to storage failed'
                });
            }
        }

        // Validate that github_url is provided for github_repo type
        if (submission_type === 'github_repo' && !github_url) {
            return res.status(400).json({
                success: false,
                error: 'GitHub URL is required for github_repo submission type'
            });
        }

        // Validate that file is provided for screenshot type
        if (submission_type === 'screenshot' && !req.file) {
            return res.status(400).json({
                success: false,
                error: 'File is required for screenshot submission type'
            });
        }

        // Create submission record
        const { data: submission, error: submissionError } = await supabase
            .from('submissions')
            .insert({
                student_id,
                student_uuid: studentUuid,
                submission_type,
                title,
                description,
                file_path: filePath,
                file_name: fileName,
                file_size: fileSize,
                mime_type: mimeType,
                github_url,
                lesson_id
            })
            .select(`
                *,
                students!inner(full_name)
            `)
            .single();

        if (submissionError) {
            console.error('Submission creation error:', submissionError);
            return res.status(500).json({
                success: false,
                error: 'Failed to create submission',
                message: submissionError.message
            });
        }

        // Generate public URL for file if uploaded
        let fileUrl = null;
        if (filePath) {
            const { data: urlData } = supabase.storage
                .from('submissions')
                .getPublicUrl(filePath);
            fileUrl = urlData.publicUrl;
        }

        res.status(201).json({
            success: true,
            data: {
                submission: {
                    ...submission,
                    file_url: fileUrl,
                    student_name: submission.students.full_name
                }
            },
            message: 'Submission created successfully'
        });

    } catch (error) {
        console.error('Create submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /api/submissions - Get all submissions with optional filters
router.get('/', async (req: Request, res: Response) => {
    try {
        const validation = getSubmissionsSchema.safeParse(req.query);
        
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid query parameters',
                details: validation.error.issues
            });
        }

        const { student_id, submission_type, lesson_id, limit = '50', offset = '0' } = validation.data;

        let query = supabase
            .from('submissions')
            .select(`
                *,
                students!inner(full_name)
            `)
            .order('created_at', { ascending: false });

        // Apply filters
        if (student_id) {
            query = query.eq('student_id', student_id);
        }
        if (submission_type) {
            query = query.eq('submission_type', submission_type);
        }
        if (lesson_id) {
            query = query.eq('lesson_id', lesson_id);
        }

        // Apply pagination
        const limitNum = parseInt(limit);
        const offsetNum = parseInt(offset);
        query = query.range(offsetNum, offsetNum + limitNum - 1);

        const { data: submissions, error, count } = await query;

        if (error) {
            console.error('Get submissions error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch submissions',
                message: error.message
            });
        }

        // Add file URLs to submissions
        const submissionsWithUrls = submissions.map(submission => {
            let fileUrl = null;
            if (submission.file_path) {
                const { data: urlData } = supabase.storage
                    .from('submissions')
                    .getPublicUrl(submission.file_path);
                fileUrl = urlData.publicUrl;
            }

            return {
                ...submission,
                file_url: fileUrl,
                student_name: submission.students.full_name
            };
        });

        res.json({
            success: true,
            data: {
                submissions: submissionsWithUrls,
                total: count || submissions.length,
                showing: {
                    limit: limitNum,
                    offset: offsetNum,
                    student_id_filter: student_id,
                    submission_type_filter: submission_type,
                    lesson_id_filter: lesson_id
                }
            }
        });

    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /api/submissions/:id - Get a specific submission
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const submissionId = req.params.id;

        const { data: submission, error } = await supabase
            .from('submissions')
            .select(`
                *,
                students!inner(full_name)
            `)
            .eq('id', submissionId)
            .single();

        if (error) {
            console.error('Get submission error:', error);
            return res.status(404).json({
                success: false,
                error: 'Submission not found',
                message: error.message
            });
        }

        // Add file URL if present
        let fileUrl = null;
        if (submission.file_path) {
            const { data: urlData } = supabase.storage
                .from('submissions')
                .getPublicUrl(submission.file_path);
            fileUrl = urlData.publicUrl;
        }

        res.json({
            success: true,
            data: {
                submission: {
                    ...submission,
                    file_url: fileUrl,
                    student_name: submission.students.full_name
                }
            }
        });

    } catch (error) {
        console.error('Get submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// DELETE /api/submissions/:id - Delete a submission
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const submissionId = req.params.id;

        // First get the submission to check if it has a file
        const { data: submission, error: fetchError } = await supabase
            .from('submissions')
            .select('file_path')
            .eq('id', submissionId)
            .single();

        if (fetchError) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found',
                message: fetchError.message
            });
        }

        // Delete the file from storage if it exists
        if (submission.file_path) {
            const { error: storageError } = await supabase.storage
                .from('submissions')
                .remove([submission.file_path]);

            if (storageError) {
                console.error('Storage deletion error:', storageError);
                // Continue with database deletion even if storage deletion fails
            }
        }

        // Delete the submission record
        const { error: deleteError } = await supabase
            .from('submissions')
            .delete()
            .eq('id', submissionId);

        if (deleteError) {
            console.error('Delete submission error:', deleteError);
            return res.status(500).json({
                success: false,
                error: 'Failed to delete submission',
                message: deleteError.message
            });
        }

        res.json({
            success: true,
            message: 'Submission deleted successfully'
        });

    } catch (error) {
        console.error('Delete submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;