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

// Reflection interfaces
export interface ReflectionRequest {
  student_id: string;
  mobile_app_name: string;
  reflection_text: string;
}

export interface ReflectionResponse {
  success: boolean;
  data: {
    reflection_id: number;
    student_id: string;
    student_name: string;
    mobile_app_name: string;
    reflection_text: string;
    submitted_at: string;
  };
  message: string;
}

export interface StudentReflection {
  id: number;
  student_id: string;
  mobile_app_name: string;
  reflection_text: string;
  created_at: string;
  students?: {
    full_name: string;
  };
}

export interface ReflectionsResponse {
  success: boolean;
  data: {
    reflections: StudentReflection[];
    total_reflections: number;
    showing: {
      limit: number;
      offset: number;
      app_name_filter?: string;
    };
  };
}

export interface StudentReflectionsResponse {
  success: boolean;
  data: {
    student: {
      student_id: string;
      full_name: string;
      uuid: string;
    };
    reflections: StudentReflection[];
    total_reflections: number;
    showing: {
      limit: number;
      offset: number;
    };
  };
}

// Reflection API functions
export const submitReflection = async (data: ReflectionRequest): Promise<ReflectionResponse> => {
  const response = await api.post<ReflectionResponse>('/api/reflections', data);
  return response.data;
};

export const getStudentReflections = async (studentId: string, params?: { limit?: number; offset?: number }): Promise<StudentReflectionsResponse> => {
  const response = await api.get<StudentReflectionsResponse>(`/api/reflections/${studentId}`, { params });
  return response.data;
};

export const getAllReflections = async (params?: { limit?: number; offset?: number; app_name?: string }): Promise<ReflectionsResponse['data']> => {
  const response = await api.get<ReflectionsResponse>('/api/reflections', { params });
  return response.data.data;
};

export default api;