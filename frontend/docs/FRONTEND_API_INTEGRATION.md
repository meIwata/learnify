# Frontend API Integration Guide

This document describes how the Learnify frontend fetches data from the backend API.

## Overview

The frontend is built with React + TypeScript + Vite and uses Axios for HTTP requests to communicate with the Node.js/Express backend. The backend provides auto-registration API endpoints that work with student IDs without requiring JWT authentication.

## API Client Configuration

### Base Setup

The API client is configured in `src/lib/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Environment Variables

- **Development**: Uses `http://localhost:3000` (backend dev server)
- **Production**: Set `VITE_API_URL` environment variable to production backend URL

## TypeScript Interfaces

All API responses are typed with TypeScript interfaces:

```typescript
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
```

## Available API Functions

### 1. Get All Students

```typescript
export const getAllStudents = async (): Promise<Student[]> => {
  const response = await api.get<Student[]>('/api/students');
  return response.data;
};
```

**Endpoint**: `GET /api/students`
**Description**: Fetches all registered students
**Authentication**: None required

### 2. Student Check-In (Auto-Registration)

```typescript
export const checkInStudent = async (data: CheckInRequest): Promise<CheckInResponse> => {
  const response = await api.post<CheckInResponse>('/api/auto/check-in', data);
  return response.data;
};
```

**Endpoint**: `POST /api/auto/check-in`
**Description**: Auto-registers student if not exists, then records check-in
**Authentication**: None required
**Payload**:
```json
{
  "student_id": "STUDENT2025",
  "full_name": "Student Name" // Optional, for auto-registration
}
```

### 3. Get Student Check-ins

```typescript
export const getStudentCheckIns = async (studentId: string): Promise<StudentCheckIn[]> => {
  const response = await api.get<StudentCheckIn[]>(`/api/students/${studentId}/check-ins`);
  return response.data;
};
```

**Endpoint**: `GET /api/students/:studentId/check-ins`
**Description**: Fetches check-in history for a specific student
**Authentication**: None required

## Component Integration Examples

### Students Overview Component

The `StudentsOverview` component demonstrates how to fetch and display student data:

```typescript
import React, { useState, useEffect } from 'react';
import { getAllStudents, Student } from '../lib/api';

const StudentsOverview: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const studentsData = await getAllStudents();
        setStudents(studentsData);
      } catch (err) {
        setError('Failed to fetch students');
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Render logic with loading, error, and success states
};
```

### Key Patterns

1. **Loading States**: Always show loading indicators during API calls
2. **Error Handling**: Catch and display user-friendly error messages
3. **TypeScript**: Use typed interfaces for all API responses
4. **useEffect**: Fetch data on component mount
5. **State Management**: Use React useState for local component state

## Auto-Registration Flow

The backend supports automatic student registration, which simplifies the frontend:

1. **Student Check-In**: Frontend sends student ID + optional name
2. **Backend Logic**: 
   - Checks if student exists in database
   - Creates new student record if not found
   - Records the check-in
   - Returns success response with student data
3. **Frontend Response**: Updates UI with confirmation and student points

## Error Handling

```typescript
try {
  const result = await checkInStudent({ 
    student_id: 'STUDENT2025', 
    full_name: 'John Doe' 
  });
  
  // Handle success
  console.log('Check-in successful:', result.message);
  
} catch (error) {
  // Handle different error types
  if (error.response?.status === 400) {
    console.error('Bad request:', error.response.data.message);
  } else if (error.response?.status === 500) {
    console.error('Server error:', error.response.data.message);
  } else {
    console.error('Network error:', error.message);
  }
}
```

## Development vs Production

### Development Setup
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173` (Vite dev server)
- CORS: Configured to allow frontend origin

### Production Deployment
- Set `VITE_API_URL` environment variable to production backend URL
- Build static assets with `npm run build`
- Deploy dist folder to static hosting (Vercel, Netlify, etc.)
- Backend should be deployed separately (Zeabur, Railway, etc.)

## CORS Configuration

The backend is configured to accept requests from the frontend:

```javascript
// Backend CORS setup
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5173' // Vite dev server
  ]
}));
```

## Database Schema

The API interacts with these Supabase PostgreSQL tables:

- **students**: Student records with auto-registration
- **student_check_ins**: Daily check-in tracking
- No authentication tables required (simplified student ID-based system)

## Future Enhancements

Potential API extensions:
- Student points and leaderboard endpoints
- Quiz submission and grading APIs
- File upload for screenshots and assignments
- Real-time notifications via WebSockets