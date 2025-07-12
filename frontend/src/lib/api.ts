import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

export default api;