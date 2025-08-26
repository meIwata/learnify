import axios from 'axios';

// Use empty string for development to use Vite proxy, or full URL for production
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://learnify-api.zeabur.app');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// TypeScript interfaces
export interface Student {
  id: string;
  student_id: string;
  full_name: string;
  created_at: string;
  updated_at: string;
  is_admin?: boolean;
  has_midterm_project?: boolean;
  has_final_project?: boolean;
  midterm_project_count?: number;
  final_project_count?: number;
}

export interface CheckInRequest {
  student_id: string;
  full_name?: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  student?: Student;
  points_earned?: number;
  total_points?: number;
}

export interface StudentCheckIn {
  id: string;
  student_id: string;
  created_at: string;
}

export interface LeaderboardEntry {
  student_id: string;
  full_name: string;
  total_marks: number;
  total_check_ins: number;
  latest_check_in: string | null;
  rank: number;
  points_breakdown?: {
    check_in_points: number;
    review_points: number;
    midterm_project_points: number;
    final_project_points: number;
    project_notes_points: number;
    voting_points: number;
    quiz_points: number;
    bonus_points: number;
  };
}

// API functions
export const getAllStudents = async (): Promise<Student[]> => {
  const response = await api.get<{success: boolean, data: {students: Student[], total: number}}>('/api/auto/students');
  if (!response.data.success || !response.data.data.students) {
    throw new Error('Failed to fetch students');
  }
  return response.data.data.students;
};

export const getStudent = async (studentId: string): Promise<Student> => {
  const response = await api.get<{success: boolean, data: {student: Student}}>(`/api/auto/students/${studentId}`);
  if (!response.data.success || !response.data.data.student) {
    throw new Error('Failed to fetch student information');
  }
  return response.data.data.student;
};

export const checkInStudent = async (data: CheckInRequest): Promise<CheckInResponse> => {
  try {
    const response = await api.post<CheckInResponse>('/api/auto/check-in', data);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 403 && error?.response?.data?.error === 'STUDENT_NOT_REGISTERED') {
      throw new Error(error.response.data.message || 'Student ID not registered. Please contact your instructor.');
    }
    throw error;
  }
};

export const getStudentCheckIns = async (studentId: string): Promise<StudentCheckIn[]> => {
  const response = await api.get<{success: boolean, data: {check_ins: StudentCheckIn[]}}>(`/api/auto/check-ins/${studentId}`);
  return response.data.data.check_ins;
};

// Review interfaces
export interface ReviewRequest {
  student_id: string;
  mobile_app_name: string;
  review_text: string;
}

export interface ReviewResponse {
  success: boolean;
  data: {
    review_id: number;
    student_id: string;
    student_name: string;
    mobile_app_name: string;
    review_text: string;
    submitted_at: string;
  };
  message: string;
}

export interface StudentReview {
  id: number;
  student_id: string;
  mobile_app_name: string;
  review_text: string;
  created_at: string;
  students?: {
    full_name: string;
  };
}

export interface ReviewsResponse {
  success: boolean;
  data: {
    reviews: StudentReview[];
    total_reviews: number;
    showing: {
      limit: number;
      offset: number;
      app_name_filter?: string;
    };
  };
}

export interface StudentReviewsResponse {
  success: boolean;
  data: {
    student: {
      student_id: string;
      full_name: string;
      uuid: string;
    };
    reviews: StudentReview[];
    total_reviews: number;
    showing: {
      limit: number;
      offset: number;
    };
  };
}

// Review API functions
export const submitReview = async (data: ReviewRequest): Promise<ReviewResponse> => {
  const response = await api.post<ReviewResponse>('/api/reviews', data);
  return response.data;
};

export const getStudentReviews = async (studentId: string, params?: { limit?: number; offset?: number }): Promise<StudentReviewsResponse> => {
  const response = await api.get<StudentReviewsResponse>(`/api/reviews/${studentId}`, { params });
  return response.data;
};

export const getAllReviews = async (params?: { limit?: number; offset?: number; app_name?: string }): Promise<ReviewsResponse['data']> => {
  const response = await api.get<ReviewsResponse>('/api/reviews', { params });
  return response.data.data;
};

export const getLeaderboard = async (limit: number = 50, offset: number = 0): Promise<LeaderboardEntry[]> => {
  const response = await api.get<{success: boolean, data: {leaderboard: LeaderboardEntry[]}}>('/api/leaderboard', {
    params: { limit, offset }
  });
  if (!response.data.success || !response.data.data.leaderboard) {
    throw new Error('Failed to fetch leaderboard');
  }
  return response.data.data.leaderboard;
};

export const getStudentLeaderboardData = async (studentId: string): Promise<LeaderboardEntry> => {
  const response = await api.get<{success: boolean, data: {student: LeaderboardEntry}}>(`/api/leaderboard/student/${studentId}`);
  if (!response.data.success || !response.data.data.student) {
    throw new Error('Failed to fetch student leaderboard data');
  }
  return response.data.data.student;
};

// Admin API functions
export interface AdminStatus {
  admin: Student;
  permissions: string[];
}

export const getAdminStatus = async (studentId: string): Promise<AdminStatus> => {
  const response = await api.get<{success: boolean, data: AdminStatus}>('/api/admin/status', {
    headers: { 'x-student-id': studentId }
  });
  if (!response.data.success) {
    throw new Error('Failed to get admin status');
  }
  return response.data.data;
};

export const getAllStudentsAsAdmin = async (studentId: string): Promise<Student[]> => {
  const response = await api.get<{success: boolean, data: Student[]}>('/api/admin/students', {
    headers: { 'x-student-id': studentId }
  });
  if (!response.data.success) {
    throw new Error('Failed to fetch students');
  }
  return response.data.data;
};

export const deleteStudent = async (adminStudentId: string, targetStudentId: string): Promise<{message: string, deleted_student: Student}> => {
  const response = await api.delete<{success: boolean, message: string, data: {deleted_student: Student}}>(`/api/admin/students/${targetStudentId}`, {
    headers: { 'x-student-id': adminStudentId }
  });
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete student');
  }
  return {
    message: response.data.message,
    deleted_student: response.data.data.deleted_student
  };
};

// Lessons interfaces
export interface LessonPlanItem {
  id: string;
  title: string;
  required: boolean;
  completed: boolean;
}

export interface Lesson {
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
  plan?: LessonPlanItem[];
}

export interface LessonsResponse {
  success: boolean;
  data: Lesson[];
}

export interface LessonResponse {
  success: boolean;
  data: Lesson;
}

// Lessons API functions
export const getAllLessons = async (params?: { status?: string; include_plan?: boolean }): Promise<Lesson[]> => {
  const response = await api.get<LessonsResponse>('/api/lessons', { params });
  if (!response.data.success) {
    throw new Error('Failed to fetch lessons');
  }
  return response.data.data;
};

export const getCurrentLesson = async (): Promise<Lesson | null> => {
  const response = await api.get<LessonResponse>('/api/lessons/current');
  if (!response.data.success) {
    throw new Error('Failed to fetch current lesson');
  }
  return response.data.data;
};

export const getLesson = async (lessonId: string): Promise<Lesson> => {
  const response = await api.get<LessonResponse>(`/api/lessons/${lessonId}`);
  if (!response.data.success) {
    throw new Error('Failed to fetch lesson');
  }
  return response.data.data;
};

export const updateLessonStatus = async (lessonId: string, status: 'normal' | 'skipped' | 'cancelled'): Promise<Lesson> => {
  const response = await api.put<LessonResponse>(`/api/lessons/${lessonId}/status`, { status });
  if (!response.data.success) {
    throw new Error('Failed to update lesson status');
  }
  return response.data.data;
};

export const updateLessonProgress = async (
  lessonId: string, 
  teacherId: string, 
  lessonPlanItemId: string, 
  completed: boolean
): Promise<any> => {
  const response = await api.post(`/api/lessons/${lessonId}/progress`, {
    teacher_id: teacherId,
    lesson_plan_item_id: lessonPlanItemId,
    completed
  });
  if (!response.data.success) {
    throw new Error('Failed to update lesson progress');
  }
  return response.data.data;
};

export const updateLessonUrl = async (
  lessonId: string,
  teacherId: string,
  furtherReadingUrl: string
): Promise<Lesson> => {
  const response = await api.put<LessonResponse>(`/api/lessons/${lessonId}/url`, {
    teacher_id: teacherId,
    further_reading_url: furtherReadingUrl
  });
  if (!response.data.success) {
    throw new Error('Failed to update lesson URL');
  }
  return response.data.data;
};

export const updateLessonTitle = async (
  lessonId: string,
  teacherId: string,
  title: string
): Promise<Lesson> => {
  const response = await api.put<LessonResponse>(`/api/lessons/${lessonId}/title`, {
    teacher_id: teacherId,
    name: title
  });
  if (!response.data.success) {
    throw new Error('Failed to update lesson title');
  }
  return response.data.data;
};

export const updateLessonDate = async (
  lessonId: string,
  teacherId: string,
  scheduledDate: string
): Promise<Lesson> => {
  const response = await api.put<LessonResponse>(`/api/lessons/${lessonId}/date`, {
    teacher_id: teacherId,
    scheduled_date: scheduledDate
  });
  if (!response.data.success) {
    throw new Error('Failed to update lesson date');
  }
  return response.data.data;
};

export const moveLessonPlanItem = async (
  itemId: string,
  teacherId: string,
  targetLessonId: string,
  newSortOrder?: number
): Promise<{moved_item: any, source_lesson_id: string, target_lesson_id: string}> => {
  const response = await api.put(`/api/lessons/plan-items/${itemId}/move`, {
    teacher_id: teacherId,
    target_lesson_id: targetLessonId,
    new_sort_order: newSortOrder
  });
  if (!response.data.success) {
    throw new Error('Failed to move lesson plan item');
  }
  return response.data.data;
};

export const reorderLessonPlanItems = async (
  lessonId: string,
  teacherId: string,
  itemId: string,
  newSortOrder: number
): Promise<{lesson_id: string, reordered_items: any[]}> => {
  const response = await api.put(`/api/lessons/${lessonId}/plan-items/reorder`, {
    teacher_id: teacherId,
    item_id: itemId,
    new_sort_order: newSortOrder
  });
  if (!response.data.success) {
    throw new Error('Failed to reorder lesson plan items');
  }
  return response.data.data;
};

// Submission file interface
export interface SubmissionFile {
  id: number;
  submission_id: number;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_order: number;
  file_url: string;
  created_at: string;
  updated_at: string;
}

// Submissions interfaces
export interface Submission {
  id: number;
  student_id: string;
  student_name: string;
  submission_type: 'screenshot' | 'github_repo' | 'project';
  title: string;
  description?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  github_url?: string;
  lesson_id?: string;
  file_url?: string;
  files?: SubmissionFile[];
  project_type?: 'midterm' | 'final';
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubmissionsResponse {
  success: boolean;
  data: {
    submissions: Submission[];
    total: number;
  };
  error?: string;
}

export interface SubmissionUploadResponse {
  success: boolean;
  data: {
    submission: Submission;
  };
  error?: string;
}

// Submissions API functions
export const getSubmissions = async (params?: {
  student_id?: string;
  lesson_id?: string;
  submission_type?: string;
}): Promise<SubmissionsResponse['data']> => {
  const response = await api.get<SubmissionsResponse>('/api/submissions', { params });
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to fetch submissions');
  }
  return response.data.data;
};

export const uploadSubmission = async (formData: FormData): Promise<Submission> => {
  const response = await api.post<SubmissionUploadResponse>('/api/submissions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to upload submission');
  }
  return response.data.data.submission;
};

export const getSubmission = async (submissionId: number): Promise<Submission> => {
  const response = await api.get<{success: boolean, data: {submission: Submission}}>(`/api/submissions/${submissionId}`);
  if (!response.data.success) {
    throw new Error('Failed to fetch submission');
  }
  return response.data.data.submission;
};

export const deleteSubmission = async (submissionId: number): Promise<void> => {
  const response = await api.delete(`/api/submissions/${submissionId}`);
  if (response.status !== 200) {
    throw new Error('Failed to delete submission');
  }
};

// Update project information (title, description, GitHub URL, visibility)
export const updateProject = async (
  submissionId: number, 
  studentId: string, 
  updates: {
    title?: string;
    description?: string;
    github_url?: string;
    is_public?: boolean;
  }
): Promise<Submission> => {
  const response = await api.put<{
    success: boolean;
    data: {submission: Submission};
    message: string;
    changes: string[];
  }>(`/api/submissions/${submissionId}`, {
    student_id: studentId,
    ...updates
  });
  
  if (!response.data.success) {
    throw new Error('Failed to update project');
  }
  return response.data.data.submission;
};

// Update project with new screenshots
export const updateProjectScreenshots = async (submissionId: number, studentId: string, formData: FormData): Promise<Submission> => {
  // Add student_id to formData
  formData.append('student_id', studentId);
  
  const response = await api.put<SubmissionUploadResponse>(`/api/submissions/${submissionId}/screenshots`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to add project screenshots');
  }
  return response.data.data.submission;
};

// Delete a specific screenshot from a project
export const deleteProjectScreenshot = async (submissionId: number, fileId: number, studentId: string): Promise<{remaining_files: number}> => {
  const response = await api.delete<{success: boolean, data: {remaining_files: number}, message: string}>(`/api/submissions/${submissionId}/files/${fileId}`, {
    params: { student_id: studentId }
  });
  if (!response.data.success) {
    throw new Error('Failed to delete screenshot');
  }
  return response.data.data;
};

// Get public projects for showcase
export const getPublicProjects = async (params?: {
  project_type?: 'midterm' | 'final';
  limit?: number;
  offset?: number;
}): Promise<Submission[]> => {
  const response = await api.get<SubmissionsResponse>('/api/submissions/projects/public', { params });
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to fetch public projects');
  }
  return response.data.data.submissions;
};

// Quiz interfaces
export interface QuizQuestion {
  id: number;
  question_text: string;
  question_category: string;
  difficulty_level: number;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: number;
  student_id: string;
  student_uuid: string;
  question_id: number;
  selected_answer: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  points_earned: number;
  attempt_time_seconds?: number;
  created_at: string;
}

export interface QuizScore {
  id: number;
  student_id: string;
  student_uuid: string;
  total_questions_attempted: number;
  total_correct_answers: number;
  total_points: number;
  accuracy_percentage: number;
  last_quiz_date?: string;
  created_at: string;
  updated_at: string;
}

export interface RandomQuestionsResponse {
  success: boolean;
  data: {
    questions: QuizQuestion[];
    total_available: number;
  };
}

export interface QuizSubmissionRequest {
  student_id: string;
  full_name?: string;
  question_id: number;
  selected_answer: 'A' | 'B' | 'C' | 'D';
  attempt_time_seconds?: number;
}

export interface QuizSubmissionResponse {
  success: boolean;
  data: {
    attempt: QuizAttempt;
    is_correct: boolean;
    points_earned: number;
    correct_answer: 'A' | 'B' | 'C' | 'D';
    explanation?: string;
  };
  message: string;
}

export interface StudentQuizScoresResponse {
  success: boolean;
  data: {
    student: {
      student_id: string;
      full_name: string;
      uuid: string;
    };
    quiz_scores: QuizScore;
    recent_attempts: QuizAttempt[];
    total_attempts: number;
    showing: {
      limit: number;
      offset: number;
    };
  };
}

export interface StudentQuizAttemptsResponse {
  success: boolean;
  data: {
    student: {
      student_id: string;
      full_name: string;
      uuid: string;
    };
    attempts: QuizAttempt[];
    total_attempts: number;
    showing: {
      limit: number;
      offset: number;
    };
  };
}

export interface QuestionStats {
  difficulty_level: number;
  difficulty_name: string;
  question_count: number;
}

export interface QuestionStatsResponse {
  success: boolean;
  data: {
    total_questions: number;
    difficulty_breakdown: QuestionStats[];
    last_updated: string;
  };
}

// Quiz API functions
export const getRandomQuizQuestions = async (
  count: number = 5, 
  difficulty?: number, 
  studentId?: string, 
  questionType?: string
): Promise<QuizQuestion[]> => {
  const params: any = { count };
  if (difficulty) params.difficulty = difficulty;
  if (studentId) params.student_id = studentId;
  if (questionType) params.question_type = questionType;
  
  const response = await api.get<RandomQuestionsResponse>('/api/quiz/questions/random', { params });
  if (!response.data.success) {
    throw new Error('Failed to fetch quiz questions');
  }
  return response.data.data.questions;
};

export const submitQuizAnswer = async (data: QuizSubmissionRequest): Promise<QuizSubmissionResponse['data']> => {
  try {
    const response = await api.post<QuizSubmissionResponse>('/api/quiz/submit-answer', data);
    if (!response.data.success) {
      throw new Error('Failed to submit quiz answer');
    }
    return response.data.data;
  } catch (error: any) {
    if (error?.response?.status === 403 && error?.response?.data?.error === 'STUDENT_NOT_REGISTERED') {
      throw new Error(error.response.data.message || 'Student ID not registered. Please contact your instructor.');
    }
    throw error;
  }
};

export const getStudentQuizScores = async (studentId: string): Promise<StudentQuizScoresResponse['data']> => {
  const response = await api.get<StudentQuizScoresResponse>(`/api/quiz/student/${studentId}/scores`);
  if (!response.data.success) {
    throw new Error('Failed to fetch student quiz scores');
  }
  return response.data.data;
};

export const getStudentQuizAttempts = async (
  studentId: string, 
  params?: { limit?: number; offset?: number }
): Promise<StudentQuizAttemptsResponse['data']> => {
  const response = await api.get<StudentQuizAttemptsResponse>(`/api/quiz/student/${studentId}/attempts`, { params });
  if (!response.data.success) {
    throw new Error('Failed to fetch student quiz attempts');
  }
  return response.data.data;
};

export const getQuestionStats = async (): Promise<QuestionStatsResponse['data']> => {
  const response = await api.get<QuestionStatsResponse>('/api/quiz/questions/stats');
  if (!response.data.success) {
    throw new Error('Failed to fetch question statistics');
  }
  return response.data.data;
};

export interface QuestionWithAttempts {
  id: number;
  question_text: string;
  question_category: string;
  difficulty_level: number;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  attempt_summary: {
    total_attempts: number;
    correct_attempts: number;
    accuracy_percentage: number;
    total_points: number;
    latest_attempt: {
      selected_answer: 'A' | 'B' | 'C' | 'D';
      is_correct: boolean;
      points_earned: number;
      created_at: string;
    } | null;
    status: 'never_attempted' | 'mastered' | 'needs_practice';
  };
}

export interface AllQuestionsResponse {
  success: boolean;
  data: {
    student: {
      student_id: string;
      full_name: string;
      uuid: string;
    };
    questions: QuestionWithAttempts[];
    summary: {
      total_questions: number;
      attempted_questions: number;
      mastered_questions: number;
      never_attempted: number;
      overall_accuracy: number;
    };
  };
}

export const checkStudentExists = async (studentId: string): Promise<boolean> => {
  try {
    // Try a lightweight check by fetching student's check-in history
    const response = await api.get(`/api/auto/check-ins/${studentId}`);
    return response.data.success;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return false;
    }
    if (error?.response?.status === 403 && error?.response?.data?.error === 'STUDENT_NOT_REGISTERED') {
      return false;
    }
    // For other errors, assume student might exist but there's a different issue
    return true;
  }
};

export const getAllQuestionsWithAttempts = async (studentId: string): Promise<AllQuestionsResponse['data']> => {
  const url = `/api/quiz/questions/all/${encodeURIComponent(studentId)}`;
  console.log('Making API request to:', url);
  console.log('Full API base URL:', API_BASE_URL);
  
  try {
    const response = await api.get<AllQuestionsResponse>(url);
    console.log('Response received:', response.status, response.data.success);
    if (!response.data.success) {
      throw new Error('Failed to fetch all questions with attempts');
    }
    return response.data.data;
  } catch (error: any) {
    console.error('API Error details:', error);
    console.error('Request URL:', url);
    console.error('Error status:', error?.response?.status);
    console.error('Error data:', error?.response?.data);
    throw error;
  }
};

// Project Notes interfaces
export interface ProjectNote {
  id: number;
  submission_id: number;
  student_id: string;
  student_uuid: string;
  note_text: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectNotesResponse {
  success: boolean;
  data: {
    note: ProjectNote | null;
    submission_id: number;
    student_id: string;
    has_note: boolean;
  };
}

export interface CreateProjectNoteRequest {
  submission_id: number;
  student_id: string;
  note_text: string;
  is_private?: boolean;
}

export interface CreateProjectNoteResponse {
  success: boolean;
  data: {
    note: ProjectNote;
  };
  message: string;
}

// Project Notes API functions
export const getProjectNote = async (submissionId: number, studentId: string): Promise<{ note: ProjectNote | null; hasNote: boolean }> => {
  const response = await api.get<ProjectNotesResponse>(`/api/project-notes/${submissionId}`, {
    params: { student_id: studentId }
  });
  if (!response.data.success) {
    throw new Error('Failed to fetch project note');
  }
  return {
    note: response.data.data.note,
    hasNote: response.data.data.has_note
  };
};

export const createOrUpdateProjectNote = async (data: CreateProjectNoteRequest): Promise<ProjectNote> => {
  const response = await api.post<CreateProjectNoteResponse>('/api/project-notes', data);
  if (!response.data.success) {
    throw new Error('Failed to save project note');
  }
  return response.data.data.note;
};

export const updateProjectNote = async (noteId: number, studentId: string, noteText: string): Promise<ProjectNote> => {
  const response = await api.put<CreateProjectNoteResponse>(`/api/project-notes/${noteId}`, 
    { note_text: noteText },
    { params: { student_id: studentId } }
  );
  if (!response.data.success) {
    throw new Error('Failed to update project note');
  }
  return response.data.data.note;
};

export const deleteProjectNote = async (noteId: number, studentId: string): Promise<void> => {
  const response = await api.delete(`/api/project-notes/${noteId}`, {
    params: { student_id: studentId }
  });
  if (!response.data.success) {
    throw new Error('Failed to delete project note');
  }
};

// Voting interfaces
export interface ProjectVoteStatus {
  project_type: 'midterm' | 'final';
  can_vote: boolean;
  voted_for_submission_id?: number;
}

export interface VotingStatusResponse {
  success: boolean;
  voting_status: ProjectVoteStatus[];
}

export interface ProjectWithVotes {
  submission_id: number;
  title: string;
  description?: string;
  project_author: string;
  project_type: 'midterm' | 'final';
  github_url?: string;
  file_path?: string;
  submission_date: string;
  vote_count: number;
}

export interface ProjectVotesResponse {
  success: boolean;
  projects: ProjectWithVotes[];
}

export interface VoteRequest {
  student_id: string;
  submission_id: number;
  project_type: 'midterm' | 'final';
}

export interface VoteResponse {
  success: boolean;
  message: string;
  vote_id?: number;
}

// Voting API functions
export const getProjectVotes = async (projectType: 'midterm' | 'final'): Promise<ProjectWithVotes[]> => {
  const response = await api.get<ProjectVotesResponse>(`/api/voting/projects/${projectType}/votes`);
  if (!response.data.success) {
    throw new Error('Failed to fetch project votes');
  }
  return response.data.projects;
};

export const getStudentVotingStatus = async (studentId: string): Promise<ProjectVoteStatus[]> => {
  const response = await api.get<VotingStatusResponse>(`/api/voting/student/${studentId}/voting-status`);
  if (!response.data.success) {
    throw new Error('Failed to fetch voting status');
  }
  return response.data.voting_status;
};

export const castVote = async (data: VoteRequest): Promise<VoteResponse> => {
  const response = await api.post<VoteResponse>('/api/voting/vote', data);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to cast vote');
  }
  return response.data;
};

export const removeVote = async (studentId: string, projectType: 'midterm' | 'final'): Promise<VoteResponse> => {
  const response = await api.delete<VoteResponse>('/api/voting/vote', {
    data: { student_id: studentId, project_type: projectType }
  });
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to remove vote');
  }
  return response.data;
};

// Bonus calculation
export interface BonusCalculationResponse {
  success: boolean;
  message: string;
  data?: {
    submission_id: number;
    bonus_awarded: number;
    vote_count: number;
    project_type: string;
  } | null;
}

export const calculateBonusPoints = async (projectType: 'midterm' | 'final'): Promise<BonusCalculationResponse> => {
  const response = await api.post<BonusCalculationResponse>(`/api/calculate-bonus/${projectType}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to calculate bonus points');
  }
  return response.data;
};

// Quiz score fix interface
export interface QuizScoreFixResponse {
  success: boolean;
  message: string;
  data: {
    students_processed: number;
    total_points_corrected: number;
    quiz_system_info: {
      total_active_questions: number;
      points_per_question: number;
      max_possible_points: number;
    };
    details: Array<{
      student_id: string;
      old_points: number;
      new_points: number;
      points_corrected: number;
      unique_questions_answered: number;
      total_attempts: number;
    }>;
  };
}

// Fix quiz scores - remove duplicate scoring
export const fixQuizScores = async (adminStudentId: string): Promise<QuizScoreFixResponse> => {
  const response = await api.post<QuizScoreFixResponse>('/api/admin/fix-quiz-scores', {}, {
    headers: { 'x-student-id': adminStudentId }
  });
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fix quiz scores');
  }
  return response.data;
};

// Feedback System API

export interface FeedbackTopic {
  id: string;
  category: 'current' | 'improvement' | 'future';
  topic_name: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface FeedbackTopicsResponse {
  success: boolean;
  data: {
    topics: {
      current: FeedbackTopic[];
      improvement: FeedbackTopic[];
      future: FeedbackTopic[];
    };
    total: number;
  };
}

export interface StudentFeedback {
  id: string;
  student_id: string;
  student_uuid: string;
  semester_feedback?: string;
  overall_rating?: number;
  liked_topics: string[];
  improvement_topics: string[];
  future_topics: string[];
  additional_comments?: string;
  created_at: string;
  updated_at: string;
  students?: {
    student_id: string;
    full_name: string;
  };
}

export interface FeedbackSubmissionRequest {
  semester_feedback?: string;
  overall_rating?: number;
  liked_topics: string[];
  improvement_topics: string[];
  future_topics: string[];
  additional_comments?: string;
}

export interface FeedbackSubmissionResponse {
  success: boolean;
  data: {
    feedback: StudentFeedback;
    message: string;
  };
}

export interface MyFeedbackResponse {
  success: boolean;
  data: {
    feedback: StudentFeedback | null;
    has_submitted: boolean;
  };
}

export interface FeedbackAnalytics {
  total_responses: number;
  average_rating: number;
  rating_distribution: { [key: number]: number };
  popular_liked_topics: Array<{ topic: string; count: number }>;
  popular_improvement_topics: Array<{ topic: string; count: number }>;
  popular_future_topics: Array<{ topic: string; count: number }>;
  response_rate?: number;
  improvement_suggestions?: number;
}

export interface FeedbackAnalyticsResponse {
  success: boolean;
  data: FeedbackAnalytics;
}

// Get all feedback topics for form options
export const getFeedbackTopics = async (): Promise<FeedbackTopicsResponse> => {
  const response = await api.get<FeedbackTopicsResponse>('/api/feedback/topics');
  return response.data;
};

// Submit or update student feedback
export const submitFeedback = async (
  studentId: string, 
  feedback: FeedbackSubmissionRequest
): Promise<FeedbackSubmissionResponse> => {
  const response = await api.post<FeedbackSubmissionResponse>('/api/feedback/submit', feedback, {
    headers: { 'x-student-id': studentId }
  });
  return response.data;
};

// Get current student's feedback
export const getMyFeedback = async (studentId: string): Promise<MyFeedbackResponse> => {
  const response = await api.get<MyFeedbackResponse>('/api/feedback/my-feedback', {
    headers: { 'x-student-id': studentId }
  });
  return response.data;
};

// Admin: Get all feedback
export const getAllFeedback = async (adminStudentId: string) => {
  const response = await api.get('/api/feedback/all', {
    headers: { 'x-student-id': adminStudentId }
  });
  return response.data;
};

// Admin: Get feedback analytics
export const getFeedbackAnalytics = async (adminStudentId: string): Promise<FeedbackAnalyticsResponse> => {
  const response = await api.get<FeedbackAnalyticsResponse>('/api/feedback/analytics', {
    headers: { 'x-student-id': adminStudentId }
  });
  return response.data;
};

export default api;