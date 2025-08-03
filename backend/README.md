# Learnify Backend

Node.js + TypeScript + Express backend for the Learnify gamified learning system.

## Features

- ✅ Auto-registration check-in API (no cooldown)
- ✅ **Smart Learning Quiz System** with adaptive question selection
- ✅ Supabase integration with local development support
- ✅ Student ID-based authentication (no JWT required)
- ✅ TypeScript for type safety
- ✅ Comprehensive error handling
- ✅ Zeabur deployment ready

### 🧠 Smart Learning Quiz System
Intelligent quiz system that adapts to student learning patterns, ensuring mastery of SwiftUI fundamentals through targeted practice and second chances.

**📖 [Complete Quiz System Documentation](../QUIZ_SYSTEM.md)**

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Supabase credentials
vim .env
```

### Development

```bash
# Start local Supabase stack (first time)
npm run supabase:start

# Start development server (local Supabase)
npm run dev:local

# Start development server (remote Supabase)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Stop local Supabase
npm run supabase:stop

# Reset local database
npm run supabase:reset
```

## API Endpoints

### Primary API (Auto-Registration)

### POST /api/auto/check-in
Create a new check-in with automatic student registration.

**Request Body:**
```json
{
  "student_id": "ALICE2025",
  "full_name": "Alice Johnson"  // Optional for auto-registration
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "check_in_id": 1,
    "student_id": "ALICE2025",
    "student_name": "Alice Johnson",
    "checked_in_at": "2025-06-29T10:33:06.122Z",
    "is_new_student": true
  },
  "message": "Check-in recorded for Alice Johnson"
}
```

### GET /api/auto/check-ins/:student_id
Get check-in history for a specific student.

**Query Parameters:**
- `limit`: Number of records (default: 10)
- `offset`: Pagination offset (default: 0)

### GET /api/auto/students
Get all registered students (admin use).

### GET /health
Health check endpoint for monitoring.

### Quiz API Endpoints

#### GET /api/quiz/questions/random
Get smart quiz questions with adaptive learning algorithm.

**Query Parameters:**
- `count`: Number of questions (default: 5, max: 20)
- `difficulty`: Difficulty level 1-3 (optional)
- `student_id`: **Required for smart learning algorithm**

#### POST /api/quiz/submit-answer
Submit quiz answer and get immediate feedback.

**Request Body:**
```json
{
  "student_id": "ALICE2025",
  "full_name": "Alice Johnson",
  "question_id": 1,
  "selected_answer": "A",
  "attempt_time_seconds": 15
}
```

#### GET /api/quiz/student/:student_id/scores
Get student's quiz performance statistics.

See `API_DESIGN.md` and **[QUIZ_SYSTEM.md](../QUIZ_SYSTEM.md)** for complete API documentation.

## Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=http://127.0.0.1:54321  # Local development
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Server Configuration
PORT=3000
NODE_ENV=local  # Use 'local' for local Supabase
```

### Environment Files
- `.env` - **Production environment** (remote Supabase cloud for deployment)
- `.env.local` - **Local development** with local Supabase instance
- `.env.example` - Template for environment setup

**Important**: The `.env` file is configured for production deployment with Supabase cloud. For local development, use `npm run dev:local` which loads `.env.local` with localhost URLs.

## Deployment

### Zeabur Deployment

1. Connect your GitHub repository to Zeabur
2. Set environment variables in Zeabur dashboard
3. Deploy automatically on git push

### Manual Deployment

```bash
# Build the project
npm run build

# Start production server
npm start
```

## Database Schema

Current schema includes student management and smart quiz system:

```sql
-- Students table - Auto-registration support
CREATE TABLE students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id text UNIQUE NOT NULL,
    full_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Student check-ins table - Check-in tracking
CREATE TABLE student_check_ins (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id text NOT NULL,
    student_uuid uuid REFERENCES students(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Performance indexes
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_student_check_ins_student_id ON student_check_ins(student_id);
CREATE INDEX idx_student_check_ins_created ON student_check_ins(created_at DESC);
```

**Quiz System Tables:**
- `quiz_questions` - SwiftUI questions with multiple choice answers
- `student_quiz_attempts` - Individual question attempts with scoring
- `student_quiz_scores` - Aggregated performance statistics

See **[QUIZ_SYSTEM.md](../QUIZ_SYSTEM.md)** for complete schema documentation.

Migrations are managed in `supabase/migrations/` directory.

## Architecture

```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript types
└── index.ts         # Main server file
```

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "next_available": "2025-06-29T16:00:00Z" // Optional
}
```

## Security

- Student ID-based authentication (simplified)
- CORS protection
- Helmet security headers
- Request size limits
- Input validation with Zod
- Auto-registration with basic validation

## Local Development URLs

- **Backend API**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323 (Database admin UI)
- **Health Check**: http://localhost:3000/health