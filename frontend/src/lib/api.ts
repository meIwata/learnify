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
}

// API functions
export const getAllStudents = async (): Promise<Student[]> => {
  const response = await api.get<{success: boolean, data: {students: Student[], total: number}}>('/api/auto/students');
  if (!response.data.success || !response.data.data.students) {
    throw new Error('Failed to fetch students');
  }
  return response.data.data.students;
};

export const checkInStudent = async (data: CheckInRequest): Promise<CheckInResponse> => {
  const response = await api.post<CheckInResponse>('/api/auto/check-in', data);
  return response.data;
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

// Submissions interfaces
export interface Submission {
  id: number;
  student_id: string;
  student_name: string;
  submission_type: 'screenshot' | 'github_repo';
  title: string;
  description?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  github_url?: string;
  lesson_id?: string;
  file_url?: string;
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

export const deleteSubmission = async (submissionId: number): Promise<void> => {
  const response = await api.delete(`/api/submissions/${submissionId}`);
  if (response.status !== 200) {
    throw new Error('Failed to delete submission');
  }
};

export default api;