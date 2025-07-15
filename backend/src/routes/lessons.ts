import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// Interface for lesson data
interface Lesson {
  id: string;
  lesson_number: number;
  name: string;
  description: string;
  scheduled_date: string;
  status: 'normal' | 'skipped' | 'cancelled';
  topic_name: string;
  icon: string;
  color: string;
  button_color: string;
  further_reading_url?: string;
  lesson_content?: string[];
  created_at: string;
  updated_at: string;
}

interface LessonPlanItem {
  id: string;
  lesson_id: string;
  title: string;
  is_required: boolean;
  sort_order: number;
  created_at: string;
}

interface StudentProgress {
  lesson_plan_item_id: string;
  completed: boolean;
  completed_at?: string;
}

// GET /api/lessons - Get all lessons with optional filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, include_plan } = req.query;
    
    // Build query
    let query = supabase
      .from('lessons')
      .select('*')
      .order('scheduled_date', { ascending: true });
    
    // Filter by status if provided
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }
    
    const { data: lessons, error: lessonsError } = await query;
    
    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch lessons',
        details: lessonsError.message 
      });
    }
    
    // If include_plan is requested, fetch lesson plan items with class progress for each lesson
    if (include_plan === 'true' && lessons) {
      const lessonsWithPlans = await Promise.all(
        lessons.map(async (lesson) => {
          const { data: planData, error: planError } = await supabase
            .from('lesson_progress_view')
            .select('*')
            .eq('lesson_id', lesson.id)
            .order('sort_order', { ascending: true });
          
          if (planError) {
            console.error(`Error fetching plan for lesson ${lesson.id}:`, planError);
            return { ...lesson, plan: [] };
          }
          
          const planWithProgress = (planData || []).map(item => ({
            id: item.lesson_plan_item_id,
            title: item.item_title,
            required: item.is_required,
            completed: item.completed || false
          }));
          
          return { ...lesson, plan: planWithProgress };
        })
      );
      
      return res.json({
        success: true,
        data: lessonsWithPlans
      });
    }
    
    res.json({
      success: true,
      data: lessons || []
    });
    
  } catch (error) {
    console.error('Error in GET /lessons:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// GET /api/lessons/current - Get the current lesson (class-wide progress)
router.get('/current', async (req: Request, res: Response) => {
  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Find the first lesson that is today or in the future and not skipped
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .gte('scheduled_date', today)
      .neq('status', 'skipped')
      .order('scheduled_date', { ascending: true })
      .limit(1);
    
    if (lessonsError) {
      console.error('Error fetching current lesson:', lessonsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch current lesson',
        details: lessonsError.message
      });
    }
    
    if (!lessons || lessons.length === 0) {
      // If no upcoming lessons, get the last non-skipped lesson
      const { data: lastLessons, error: lastError } = await supabase
        .from('lessons')
        .select('*')
        .neq('status', 'skipped')
        .order('scheduled_date', { ascending: false })
        .limit(1);
      
      if (lastError) {
        console.error('Error fetching last lesson:', lastError);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch lessons'
        });
      }
      
      if (!lastLessons || lastLessons.length === 0) {
        return res.json({
          success: true,
          data: null
        });
      }
      
      const lesson = lastLessons[0];
      
      // Get lesson plan items with class progress
      const { data: planData } = await supabase
        .from('lesson_progress_view')
        .select('*')
        .eq('lesson_id', lesson.id)
        .order('sort_order', { ascending: true });
      
      const planWithProgress = (planData || []).map(item => ({
        id: item.lesson_plan_item_id,
        title: item.item_title,
        required: item.is_required,
        completed: item.completed || false
      }));
      
      return res.json({
        success: true,
        data: {
          ...lesson,
          plan: planWithProgress
        }
      });
    }
    
    const lesson = lessons[0];
    
    // Get lesson plan items with class progress
    const { data: planData } = await supabase
      .from('lesson_progress_view')
      .select('*')
      .eq('lesson_id', lesson.id)
      .order('sort_order', { ascending: true });
    
    const planWithProgress = (planData || []).map(item => ({
      id: item.lesson_plan_item_id,
      title: item.item_title,
      required: item.is_required,
      completed: item.completed || false
    }));
    
    res.json({
      success: true,
      data: {
        ...lesson,
        plan: planWithProgress
      }
    });
    
  } catch (error) {
    console.error('Error in GET /lessons/current:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/lessons/:id - Get a specific lesson with class-wide progress
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();
    
    if (lessonError || !lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }
    
    // Get lesson plan items with class progress
    const { data: planData } = await supabase
      .from('lesson_progress_view')
      .select('*')
      .eq('lesson_id', id)
      .order('sort_order', { ascending: true });
    
    const planWithProgress = (planData || []).map(item => ({
      id: item.lesson_plan_item_id,
      title: item.item_title,
      required: item.is_required,
      completed: item.completed || false
    }));
    
    res.json({
      success: true,
      data: {
        ...lesson,
        plan: planWithProgress
      }
    });
    
  } catch (error) {
    console.error('Error in GET /lessons/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/lessons/:id/status - Update lesson status (admin only)
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['normal', 'skipped', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required (normal, skipped, cancelled)'
      });
    }
    
    const { data: lesson, error } = await supabase
      .from('lessons')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating lesson status:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update lesson status',
        details: error.message
      });
    }
    
    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }
    
    res.json({
      success: true,
      data: lesson
    });
    
  } catch (error) {
    console.error('Error in PUT /lessons/:id/status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/lessons/:id/url - Update lesson further reading URL (teacher only)
router.put('/:id/url', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { teacher_id, further_reading_url } = req.body;
    
    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        error: 'teacher_id is required'
      });
    }
    
    // Verify teacher is admin
    const { data: teacher, error: teacherError } = await supabase
      .from('students')
      .select('is_admin')
      .eq('student_id', teacher_id)
      .single();
    
    if (teacherError || !teacher || !teacher.is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Only teachers can update lesson URLs'
      });
    }
    
    // Validate URL format if provided
    if (further_reading_url && further_reading_url.trim() !== '') {
      try {
        new URL(further_reading_url);
      } catch (urlError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid URL format'
        });
      }
    }
    
    const { data: lesson, error } = await supabase
      .from('lessons')
      .update({ further_reading_url: further_reading_url || null })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating lesson URL:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update lesson URL',
        details: error.message
      });
    }
    
    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'Lesson not found'
      });
    }
    
    res.json({
      success: true,
      data: lesson
    });
    
  } catch (error) {
    console.error('Error in PUT /lessons/:id/url:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/lessons/:id/progress - Update class-wide progress on lesson plan item (teacher only)
router.post('/:id/progress', async (req: Request, res: Response) => {
  try {
    const { id: lesson_id } = req.params;
    const { teacher_id, lesson_plan_item_id, completed } = req.body;
    
    if (!teacher_id || !lesson_plan_item_id || typeof completed !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'teacher_id, lesson_plan_item_id, and completed (boolean) are required'
      });
    }
    
    // Verify teacher is admin
    const { data: teacher, error: teacherError } = await supabase
      .from('students')
      .select('is_admin')
      .eq('student_id', teacher_id)
      .single();
    
    if (teacherError || !teacher || !teacher.is_admin) {
      return res.status(403).json({
        success: false,
        error: 'Only teachers can update lesson progress'
      });
    }
    
    // Verify the lesson plan item belongs to this lesson
    const { data: planItem, error: planError } = await supabase
      .from('lesson_plan_items')
      .select('id')
      .eq('id', lesson_plan_item_id)
      .eq('lesson_id', lesson_id)
      .single();
    
    if (planError || !planItem) {
      return res.status(400).json({
        success: false,
        error: 'Invalid lesson plan item for this lesson'
      });
    }
    
    // Upsert class progress record
    const progressData = {
      lesson_plan_item_id,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      completed_by_teacher_id: teacher_id
    };
    
    const { data: progress, error } = await supabase
      .from('class_lesson_progress')
      .upsert(progressData, { 
        onConflict: 'lesson_plan_item_id' 
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error updating class progress:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update progress',
        details: error.message
      });
    }
    
    res.json({
      success: true,
      data: progress
    });
    
  } catch (error) {
    console.error('Error in POST /lessons/:id/progress:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;