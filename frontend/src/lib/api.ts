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
  checked_in_at: string;
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

export default api;