Of course. Here is a detailed Product Requirements Document (PRD) for a gamified learning system, tailored to your specifications. This document will serve as the blueprint for development.

---

## Product Requirements Document: Project "Learnify"

| **Document Version** | **Date**       | **Author** | **Changes**                               |
| ------------------ | -------------- | ---------- | ----------------------------------------- |
| 1.0                | October 26, 2023 | AI Assistant | Initial Draft                             |
| 1.1                | October 26, 2023 | AI Assistant | Added detail on GitHub & Admin features |

---

### 1. Introduction & Vision

**Project "Learnify"** is a iOS desktop application designed to transform the traditional learning experience into an engaging, interactive, and motivating journey. By incorporating gamification elements such as points, leaderboards, and achievements, we aim to increase student participation, improve knowledge retention, and foster a sense of community and friendly competition. The system will provide students with a clear view of their progress and instructors with valuable insights into class-wide performance.

### 2. Goals & Objectives

#### Business/Educational Goals
*   Increase student engagement and daily participation.
*   Improve student performance on assessments (quizzes).
*   Provide instructors with a real-time, high-level overview of class progress.
*   Create a positive and rewarding learning environment.

#### Success Metrics
*   **Activation:** 90% of students in a course successfully register and log in within the first week.
*   **Engagement:** 75% of active students check-in at least 3 times a week.
*   **Performance:** A 15% increase in average quiz scores compared to previous non-gamified methods.
*   **Retention:** A month-over-month active user rate of 80%.

### 3. User Personas

1.  **Alex (The Student)**
    *   **Age:** 19
    *   **Platform:** MacBook Air
    *   **Goals:** Wants to stay on top of his coursework, enjoys competition, and is motivated by seeing tangible progress. Wants a quick and easy way to submit work and check his standing.
    *   **Frustrations:** Forgetting deadlines, not knowing where he stands compared to peers, and finding traditional learning monotonous.

2.  **Dr. Evans (The Instructor/Admin)**
    *   **Age:** 45
    *   **Platform:** iMac
    *   **Goals:** Wants to monitor the overall progress of her class without manually tracking every student. Needs an efficient way to administer quizzes and review submissions.
    *   **Frustrations:** Students not engaging with the material, difficulty in identifying struggling students early, and the administrative overhead of managing assignments.

### 4. System Architecture & Tech Stack

*   **Client (Frontend):**
    *   **Platform:** iOS (Native App)
    *   **Language/Framework:** Swift / SwiftUI for a modern, responsive UI.
    *   **Key Library:** `supabase-swift` for direct interaction with the Supabase backend.

*   **Backend:**
    *   **Hosting:** **Zeabur**. All services will be deployed and managed through Zeabur for seamless integration and auto-scaling.
    *   **BaaS (Backend-as-a-Service):** **Supabase**.
        *   **Database:** Supabase Postgres for storing all data (users, scores, submissions, etc.).
        *   **Authentication:** Supabase Auth for managing user identity, logins, and JWT-based sessions.
        *   **Storage:** Supabase Storage for handling file uploads like screenshots.
        *   **Edge Functions (Optional):** For complex server-side logic (e.g., nightly leaderboard calculations) if needed, deployed on Zeabur.

#### High-Level Diagram
```
[iOS Client (SwiftUI)] <--- HTTPS/WSS ---> [Supabase API Gateway on Zeabur]
                                                   |
                     +-----------------------------+-----------------------------+
                     |                             |                             |
             [Supabase Auth]              [Supabase Database]            [Supabase Storage]
         (User/Device Mgmt)          (Postgres: Records, Logs)        (Screenshots, Files)
```

### 5. Features & User Stories

#### 5.1. Core Authentication & Profile

*   **User Story (Student):** As Alex, I want to register using my student ID and a password so that I can access the learning platform. The app should remember me on my device so I don't have to log in every time.
*   **Requirements:**
    1.  **Registration:** A student provides their `student_id` (must be unique), `name`, and `password`. The system creates a user record in Supabase Auth.
    2.  **Login:** A student logs in with their `student_id` and `password`.
    3.  **Device Registration:** Upon successful first login on a new device, the app generates a unique device identifier.
    4.  **Session Management:** The Supabase JWT (JSON Web Token) received upon login will be securely stored in the system **Keychain** (`UserDefaults` is acceptable for non-sensitive data, but Keychain is best practice for tokens). This token will be used for all subsequent API requests.
    5.  **Multi-Device Support:** The JWT-based authentication inherently supports multiple devices. A student can be logged in on their MacBook and iMac simultaneously.

#### 5.2. Gamified Engagement

*   **User Story (Student):** As Alex, I want to "check-in" when I start studying to earn points and show my instructor I'm active.
*   **Requirements:**
    1.  **API Check-in:** The client will send a request to a `/check-in` endpoint.
    2.  **Payload:** The request will include the student's JWT for authentication.
    3.  **Logic:** The backend will record a new `check_ins` entry with a timestamp and the `user_id`. To prevent spam, check-ins can be limited to once every few hours (e.g., 4 hours).
    4.  **Rewards:** A successful check-in awards the student a predefined number of points (e.g., 10 points).

#### 5.3. Submissions & Assignments

*   **User Story (Student):** As Alex, when I complete a design task, I want to upload a screenshot as proof of work. For my coding assignments, I want to link my GitHub repository.
*   **Requirements:**
    1.  **Screenshot Submission:**
        *   An interface in the Mac app allows students to select an image file (`.png`, `.jpg`).
        *   The app uploads the file directly to a dedicated **Supabase Storage bucket** named `submissions`.
        *   A record is created in a `submissions` table, linking the `user_id`, the URL to the stored file, a timestamp, and an optional description.
    2.  **GitHub Source Code Submission:**
        *   **(Initial Setup):** Students can link their GitHub account via OAuth within the app settings. The app will store the GitHub `user_id`.
        *   **(Submission):** For a specific assignment, the student selects a repository and a specific commit hash to submit.
        *   The system stores this information in the `submissions` table (type: `github_commit`, content: `repo_url` and `commit_hash`). This avoids storing code directly.

#### 5.4. Quizzes

*   **User Story (Student):** As Alex, I want to take multiple-choice quizzes in the app to test my knowledge and earn points for my score.
*   **Requirements:**
    1.  **Fetch Quizzes:** The app can fetch a list of available quizzes.
    2.  **Quiz Interface:** A clean UI to display a question and multiple-choice answers.
    3.  **Submission:** On completion, the app submits the student's answers to the backend.
    4.  **Grading & Feedback:** The backend grades the quiz, stores the result (score, percentage) in a `quiz_attempts` table, and returns the score to the student. Correct/incorrect answers can be shown post-submission.
    5.  **Points:** The student's score is converted into leaderboard points.

#### 5.5. Progress & History

*   **User Story (Student):** As Alex, I want to see a history of all my activities, like check-ins, submissions, and quiz results, to track my progress.
*   **User Story (Instructor):** As Dr. Evans, I want a dashboard to see a summary of progress for the entire class, so I can quickly identify trends.
*   **Requirements:**
    1.  **Student Activity Log:**
        *   An API endpoint to fetch a chronological list of the logged-in student's "transactions" (check-ins, submissions, points awarded, quizzes taken).
        *   The frontend will display this in a list or timeline view.
    2.  **Instructor's Course Summary (Admin View):**
        *   A special dashboard visible only to users with an `instructor` role.
        *   Displays aggregate data: class-wide average quiz score, total number of submissions this week, a list of students who haven't checked in recently.
        *   This requires Role-Level Security (RLS) in Supabase to protect data.

#### 5.6. Leaderboard & Celebration

*   **User Story (Student):** As Alex, I want to see a leaderboard to know how I rank against my classmates. I also want to be recognized for special achievements.
*   **Requirements:**
    1.  **Leaderboard:**
        *   An API endpoint to fetch the leaderboard.
        *   The leaderboard ranks students based on their total points accumulated over time.
        *   The frontend should offer filters: `This Week`, `This Month`, `All Time`.
    2.  **Student Design Awards:**
        *   A feature to celebrate exceptional work.
        *   An `instructor` can award a special "badge" or "award" to a student (e.g., "Designer of the Week," "Top Innovator").
        *   These awards are stored in an `awards` table and displayed prominently on the student's profile and perhaps on a celebratory "Hall of Fame" page.

### 6. Data Models (Supabase Postgres Schema)

*   `users` (Managed by Supabase Auth, with a `profiles` table for public data)
    *   `id` (uuid, Primary Key, Foreign Key to auth.users.id)
    *   `student_id` (text, unique)
    *   `full_name` (text)
    *   `total_points` (int, default: 0)
    *   `role` (text, default: 'student') -> 'student' or 'instructor'
*   `check_ins`
    *   `id` (bigint, Primary Key)
    *   `user_id` (uuid, Foreign Key to users.id)
    *   `created_at` (timestamp with time zone)
*   `submissions`
    *   `id` (bigint, Primary Key)
    *   `user_id` (uuid, Foreign Key to users.id)
    *   `type` (text) -> 'screenshot' or 'github_commit'
    *   `content` (text) -> file URL or JSON blob with repo/commit info
    *   `description` (text, nullable)
    *   `created_at` (timestamp with time zone)
*   `quizzes`
    *   `id` (bigint, Primary Key)
    *   `title` (text)
    *   `created_by` (uuid, Foreign Key to users.id where role='instructor')
*   `questions` (and `answers`) -> A standard quiz schema.
*   `quiz_attempts`
    *   `id` (bigint, Primary Key)
    *   `user_id` (uuid, Foreign Key to users.id)
    *   `quiz_id` (bigint, Foreign Key to quizzes.id)
    *   `score` (int)
    *   `completed_at` (timestamp with time zone)
*   `awards`
    *   `id` (bigint, Primary Key)
    *   `user_id` (uuid, Foreign Key to users.id)
    *   `awarded_by` (uuid, Foreign Key to users.id)
    *   `title` (text) -> e.g., "Student Design Award 2023"
    *   `description` (text)
    *   `awarded_at` (timestamp with time zone)

### 7. API Endpoints (Conceptual)

While `supabase-swift` will be used, these represent the logical operations. Supabase RLS policies will enforce security.

*   `POST /auth/v1/signup` - Register a new student.
*   `POST /auth/v1/token?grant_type=password` - Log in.
*   `POST /rest/v1/check_ins` - Perform a daily check-in.
*   `GET /rest/v1/submissions?user_id=eq.{user_id}` - Get submission history for a student.
*   `POST /storage/v1/object/submissions/{file_path}` - Upload a screenshot.
*   `GET /rest/v1/quizzes` - Get list of available quizzes.
*   `POST /rest/v1/quiz_attempts` - Submit a completed quiz.
*   `GET /rest/v1/leaderboard_view` - A database view or RPC function to get ranked students.
*   `GET /rest/v1/course_summary_view` (RPC, admin only) - Get aggregate data for the instructor dashboard.

### 8. Out of Scope for MVP (Version 1.0)

*   Real-time chat between students.
*   Direct messaging to the instructor.
*   In-app course content creation (instructors will use the Supabase dashboard to create quizzes initially).
*   Mobile (iOS/iPadOS) clients.
*   Light/Dark mode themes (can be added in a minor update).
