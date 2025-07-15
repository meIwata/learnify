# Learnify Backend API Design

## 🚀 **Primary API (Auto-Registration) - Current Implementation**

### POST /api/auto/check-in
**Purpose**: Student check-in with automatic registration (NO PRE-REGISTRATION REQUIRED)

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "student_id": "ALICE2025",
  "full_name": "Alice Johnson"  // Optional - used for auto-registration
}
```

**Success Response** (201):
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

**Error Responses**:

**400 - Missing Student ID**:
```json
{
  "success": false,
  "error": "MISSING_STUDENT_ID",
  "message": "student_id is required"
}
```

**500 - Server Error**:
```json
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "message": "Internal server error"
}
```

### GET /api/auto/check-ins/:student_id
**Purpose**: Get student's check-in history

**Query Parameters**:
- `limit`: Number of records (default: 10)
- `offset`: Pagination offset (default: 0)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "student": {
      "student_id": "ALICE2025",
      "full_name": "Alice Johnson",
      "uuid": "25844486-2b47-4975-850e-e517871ffbe7"
    },
    "check_ins": [
      {
        "id": 2,
        "created_at": "2025-06-29T10:33:13.857Z"
      },
      {
        "id": 1,
        "created_at": "2025-06-29T10:33:06.122Z"
      }
    ],
    "total_check_ins": 2,
    "showing": {
      "limit": 10,
      "offset": 0
    }
  }
}
```

**404 - Student Not Found**:
```json
{
  "success": false,
  "error": "STUDENT_NOT_FOUND",
  "message": "Student ALICE2025 not found"
}
```

### GET /api/auto/students
**Purpose**: Get all registered students (admin use)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "25844486-2b47-4975-850e-e517871ffbe7",
        "student_id": "ALICE2025",
        "full_name": "Alice Johnson",
        "created_at": "2025-06-29T10:33:06.119Z"
      }
    ],
    "total": 1
  }
}
```

### POST /api/reviews
**Purpose**: Submit a mobile app review

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "student_id": "ALICE2025",
  "mobile_app_name": "Instagram",
  "review_text": "Instagram has become a significant part of my daily routine. I appreciate how it allows me to stay connected with friends and discover new content, but I've noticed it can be quite addictive and sometimes makes me feel pressured to present a perfect image of my life."
}
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "review_id": 1,
    "student_id": "ALICE2025",
    "student_name": "Alice Johnson",
    "mobile_app_name": "Instagram",
    "review_text": "Instagram has become a significant part of my daily routine...",
    "submitted_at": "2025-07-01T10:33:06.122Z"
  },
  "message": "Review on Instagram submitted successfully"
}
```

**Error Responses**:

**400 - Missing Required Field**:
```json
{
  "success": false,
  "error": "MISSING_STUDENT_ID",
  "message": "student_id is required"
}
```

**404 - Student Not Found**:
```json
{
  "success": false,
  "error": "STUDENT_NOT_FOUND",
  "message": "Student ALICE2025 not found"
}
```

### GET /api/reviews/:student_id
**Purpose**: Get student's review history

**Query Parameters**:
- `limit`: Number of records (default: 10)
- `offset`: Pagination offset (default: 0)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "student": {
      "student_id": "ALICE2025",
      "full_name": "Alice Johnson",
      "uuid": "25844486-2b47-4975-850e-e517871ffbe7"
    },
    "reviews": [
      {
        "id": 1,
        "mobile_app_name": "Instagram",
        "review_text": "Instagram has become a significant part of my daily routine...",
        "created_at": "2025-07-01T10:33:06.122Z"
      }
    ],
    "total_reviews": 1,
    "showing": {
      "limit": 10,
      "offset": 0
    }
  }
}
```

### GET /api/reviews
**Purpose**: Get all reviews (admin view)

**Query Parameters**:
- `limit`: Number of records (default: 20)
- `offset`: Pagination offset (default: 0)
- `app_name`: Filter by mobile app name (optional)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": 1,
        "student_id": "ALICE2025",
        "mobile_app_name": "Instagram",
        "review_text": "Instagram has become a significant part of my daily routine...",
        "created_at": "2025-07-01T10:33:06.122Z",
        "students": {
          "full_name": "Alice Johnson"
        }
      }
    ],
    "total_reviews": 1,
    "showing": {
      "limit": 20,
      "offset": 0,
      "app_name_filter": null
    }
  }
}
```

### GET /api/lessons
**Purpose**: Get all lessons with optional filtering

**Query Parameters**:
- `status`: Filter by lesson status (optional): `normal`, `skipped`, `cancelled`
- `include_plan`: Include lesson plan items with progress (default: `true`)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "lessons": [
      {
        "id": 1,
        "lesson_number": 1,
        "name": "Introduction to SwiftUI",
        "description": "Get started with SwiftUI basics and understand the declarative framework",
        "scheduled_date": "2025-07-15T09:00:00.000000Z",
        "status": "normal",
        "topic_name": "Getting Started",
        "icon": "swift",
        "color": "#007AFF",
        "button_color": "#0056CC",
        "further_reading_url": "https://developer.apple.com/swiftui/",
        "lesson_content": "In this lesson, we'll explore the fundamentals of SwiftUI...",
        "created_at": "2025-07-15T08:00:00.000000Z",
        "updated_at": "2025-07-15T08:00:00.000000Z",
        "lesson_plan_items": [
          {
            "id": 1,
            "lesson_id": 1,
            "title": "Overview of SwiftUI framework",
            "is_required": true,
            "sort_order": 1,
            "created_at": "2025-07-15T08:00:00.000000Z",
            "completed": true,
            "completed_at": "2025-07-15T10:30:00.000000Z"
          }
        ],
        "completion_percentage": 75.0
      }
    ],
    "total": 18
  }
}
```

### GET /api/lessons/current
**Purpose**: Get the current lesson (most relevant for today)

**Query Parameters**:
- `include_plan`: Include lesson plan items with progress (default: `true`)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "lesson": {
      "id": 5,
      "lesson_number": 5,
      "name": "State Management with @State and @Binding",
      "description": "Learn how to manage state in SwiftUI applications",
      "scheduled_date": "2025-07-19T09:00:00.000000Z",
      "status": "normal",
      "topic_name": "State Management",
      "icon": "link",
      "color": "#34C759",
      "button_color": "#28A745",
      "further_reading_url": null,
      "lesson_content": "State management is crucial in SwiftUI...",
      "created_at": "2025-07-15T08:00:00.000000Z",
      "updated_at": "2025-07-15T08:00:00.000000Z",
      "lesson_plan_items": [
        {
          "id": 25,
          "lesson_id": 5,
          "title": "Understanding @State property wrapper",
          "is_required": true,
          "sort_order": 1,
          "created_at": "2025-07-15T08:00:00.000000Z",
          "completed": false,
          "completed_at": null
        }
      ],
      "completion_percentage": 40.0
    }
  }
}
```

**No Current Lesson Response** (200):
```json
{
  "success": true,
  "data": {
    "lesson": null
  }
}
```

### GET /api/lessons/:id
**Purpose**: Get a specific lesson by ID

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "lesson": {
      "id": 1,
      "lesson_number": 1,
      "name": "Introduction to SwiftUI",
      "description": "Get started with SwiftUI basics and understand the declarative framework",
      "scheduled_date": "2025-07-15T09:00:00.000000Z",
      "status": "normal",
      "topic_name": "Getting Started",
      "icon": "swift",
      "color": "#007AFF",
      "button_color": "#0056CC",
      "further_reading_url": "https://developer.apple.com/swiftui/",
      "lesson_content": "In this lesson, we'll explore the fundamentals of SwiftUI...",
      "created_at": "2025-07-15T08:00:00.000000Z",
      "updated_at": "2025-07-15T08:00:00.000000Z",
      "lesson_plan_items": [
        {
          "id": 1,
          "lesson_id": 1,
          "title": "Overview of SwiftUI framework",
          "is_required": true,
          "sort_order": 1,
          "created_at": "2025-07-15T08:00:00.000000Z",
          "completed": true,
          "completed_at": "2025-07-15T10:30:00.000000Z"
        }
      ],
      "completion_percentage": 75.0
    }
  }
}
```

**404 - Lesson Not Found**:
```json
{
  "success": false,
  "error": "LESSON_NOT_FOUND",
  "message": "Lesson with ID 999 not found"
}
```

### PUT /api/lessons/:id/status
**Purpose**: Update lesson status (admin/teacher only)

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <admin_jwt_token>
```

**Request Body**:
```json
{
  "status": "skipped"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "lesson": {
      "id": 1,
      "lesson_number": 1,
      "name": "Introduction to SwiftUI",
      "status": "skipped",
      "updated_at": "2025-07-15T12:00:00.000000Z"
    }
  },
  "message": "Lesson status updated to skipped"
}
```

**Error Responses**:

**400 - Invalid Status**:
```json
{
  "success": false,
  "error": "INVALID_STATUS",
  "message": "Status must be one of: normal, skipped, cancelled"
}
```

**403 - Unauthorized**:
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Admin access required"
}
```

### PUT /api/lessons/:id/url
**Purpose**: Update lesson further reading URL (teacher only)

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <teacher_jwt_token>
```

**Request Body**:
```json
{
  "further_reading_url": "https://developer.apple.com/tutorials/swiftui"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "lesson": {
      "id": 1,
      "lesson_number": 1,
      "name": "Introduction to SwiftUI",
      "further_reading_url": "https://developer.apple.com/tutorials/swiftui",
      "updated_at": "2025-07-15T12:00:00.000000Z"
    }
  },
  "message": "Lesson URL updated successfully"
}
```

### POST /api/lessons/:id/progress
**Purpose**: Update class-wide lesson progress (teacher only)

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <teacher_jwt_token>
```

**Request Body**:
```json
{
  "lesson_plan_item_id": 1,
  "completed": true
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "progress": {
      "lesson_plan_item_id": 1,
      "completed": true,
      "completed_at": "2025-07-15T12:00:00.000000Z",
      "completed_by_teacher_id": "uuid-here"
    }
  },
  "message": "Lesson progress updated successfully"
}
```

**Error Responses**:

**404 - Lesson Plan Item Not Found**:
```json
{
  "success": false,
  "error": "LESSON_PLAN_ITEM_NOT_FOUND",
  "message": "Lesson plan item with ID 999 not found"
}
```

**403 - Unauthorized**:
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Teacher access required"
}
```

---

## 🔒 **Legacy APIs (Authentication Required)**

### POST /api/check-in
**Purpose**: Log a student check-in activity (requires JWT authentication)

**Headers**:
```
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "timestamp": "2025-06-29T12:00:00Z" // Optional, defaults to server time
}
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "12345",
    "user_id": "uuid-here",
    "checked_in_at": "2025-06-29T12:00:00Z"
  },
  "message": "Check-in recorded successfully"
}
```

### GET /api/check-ins
**Purpose**: Get user's check-in history (requires JWT authentication)

**Headers**:
```
Authorization: Bearer <supabase_jwt_token>
```

**Query Parameters**:
- `limit`: Number of records (default: 10, max: 100)
- `offset`: Pagination offset (default: 0)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "check_ins": [
      {
        "id": "12345",
        "checked_in_at": "2025-06-29T12:00:00Z"
      }
    ],
    "total": 15
  }
}
```

## Current Database Schema

The check-ins are stored in Supabase using a simplified schema for auto-registration:

```sql
-- students table - Auto-registration support
CREATE TABLE students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id text UNIQUE NOT NULL,
    full_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- student_check_ins table - Check-in tracking
CREATE TABLE student_check_ins (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id text NOT NULL,
    student_uuid uuid REFERENCES students(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- student_reviews table - Mobile app review submissions
CREATE TABLE student_reviews (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id text NOT NULL,
    student_uuid uuid REFERENCES students(id),
    mobile_app_name text NOT NULL,
    review_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- lessons table - Course curriculum management
CREATE TABLE lessons (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    lesson_number integer NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    scheduled_date timestamp with time zone NOT NULL,
    status text NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'skipped', 'cancelled')),
    topic_name text,
    icon text,
    color text,
    button_color text,
    further_reading_url text,
    lesson_content text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- lesson_plan_items table - Checklist items for each lesson
CREATE TABLE lesson_plan_items (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    lesson_id bigint NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title text NOT NULL,
    is_required boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- class_lesson_progress table - Class-wide progress tracking
CREATE TABLE class_lesson_progress (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    lesson_plan_item_id bigint NOT NULL REFERENCES lesson_plan_items(id) ON DELETE CASCADE,
    completed boolean NOT NULL DEFAULT false,
    completed_at timestamp with time zone,
    completed_by_teacher_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- lesson_progress_view - Aggregated view for lesson progress
CREATE VIEW lesson_progress_view AS
SELECT 
    l.id,
    l.lesson_number,
    l.name,
    l.description,
    l.scheduled_date,
    l.status,
    l.topic_name,
    l.icon,
    l.color,
    l.button_color,
    l.further_reading_url,
    l.lesson_content,
    l.created_at,
    l.updated_at,
    COALESCE(
        ROUND(
            (COUNT(CASE WHEN clp.completed = true THEN 1 END) * 100.0) / 
            NULLIF(COUNT(lpi.id), 0), 
            2
        ), 
        0
    ) as completion_percentage
FROM lessons l
LEFT JOIN lesson_plan_items lpi ON l.id = lpi.lesson_id
LEFT JOIN class_lesson_progress clp ON lpi.id = clp.lesson_plan_item_id
GROUP BY l.id, l.lesson_number, l.name, l.description, l.scheduled_date, 
         l.status, l.topic_name, l.icon, l.color, l.button_color, 
         l.further_reading_url, l.lesson_content, l.created_at, l.updated_at;

-- Performance indexes
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_student_check_ins_student_id ON student_check_ins(student_id);
CREATE INDEX idx_student_check_ins_created ON student_check_ins(created_at DESC);
CREATE INDEX idx_student_reviews_student_id ON student_reviews(student_id);
CREATE INDEX idx_student_reviews_app_name ON student_reviews(mobile_app_name);
CREATE INDEX idx_student_reviews_created ON student_reviews(created_at DESC);

-- Lesson indexes
CREATE INDEX idx_lessons_lesson_number ON lessons(lesson_number);
CREATE INDEX idx_lessons_scheduled_date ON lessons(scheduled_date);
CREATE INDEX idx_lessons_status ON lessons(status);
CREATE INDEX idx_lesson_plan_items_lesson_id ON lesson_plan_items(lesson_id);
CREATE INDEX idx_lesson_plan_items_sort_order ON lesson_plan_items(lesson_id, sort_order);
CREATE INDEX idx_class_lesson_progress_item_id ON class_lesson_progress(lesson_plan_item_id);
```

## Current Business Rules

1. **No Cooldown**: Students can check-in multiple times without restrictions
2. **Auto-Registration**: Students are automatically created on first check-in
3. **No Authentication**: Student ID is sufficient for check-ins
4. **Logging Only**: Backend only logs activity, no point calculation
5. **Timezone**: All timestamps in UTC

## Health Check

### GET /health
**Purpose**: Server health check

**Success Response** (200):
```json
{
  "status": "ok",
  "timestamp": "2025-06-29T10:00:00.000Z",
  "service": "learnify-backend"
}
```

### GET /api/leaderboard
**Purpose**: Get ranked leaderboard of all students based on current marks

**Query Parameters**:
- `limit`: Number of records (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "student_id": "ALICE2025",
        "full_name": "Alice Johnson",
        "total_marks": 10,
        "total_check_ins": 5,
        "latest_check_in": "2025-07-01T10:33:06.122Z",
        "rank": 1
      },
      {
        "student_id": "BOB2025",
        "full_name": "Bob Smith",
        "total_marks": 0,
        "total_check_ins": 0,
        "latest_check_in": null,
        "rank": 2
      }
    ],
    "total_students": 2,
    "showing": {
      "limit": 50,
      "offset": 0,
      "total_pages": 1,
      "current_page": 1
    }
  }
}
```

### GET /api/leaderboard/student/:student_id
**Purpose**: Get specific student's ranking and nearby competitors

**Query Parameters**:
- `context`: Number of students above/below to show (default: 5, max: 20)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "student": {
      "student_id": "ALICE2025",
      "full_name": "Alice Johnson",
      "total_marks": 10,
      "total_check_ins": 5,
      "latest_check_in": "2025-07-01T10:33:06.122Z",
      "rank": 1
    },
    "context": [
      {
        "student_id": "ALICE2025",
        "full_name": "Alice Johnson", 
        "total_marks": 10,
        "total_check_ins": 5,
        "latest_check_in": "2025-07-01T10:33:06.122Z",
        "rank": 1
      }
    ],
    "total_students": 10,
    "student_index": 0
  }
}
```

## Leaderboard Ranking Logic

**Primary Scoring** (Current Implementation):
- Check-ins: 10 marks if any check-ins exist, 0 otherwise
- App Review: 10 marks if any app reviews exist, 0 otherwise
- Profile Picture: 10 marks (not implemented yet)  
- GitHub Repository: 10 marks (not implemented yet)
- GitHub Organization: 10 marks (not implemented yet)

**Ranking Tiebreakers**:
1. Total marks (descending)
2. Number of check-ins (descending)
3. Most recent check-in (more recent first)
4. Alphabetical by name

## Base URL

- **Local Development**: http://localhost:3000
- **Production**: TBD (Zeabur deployment)