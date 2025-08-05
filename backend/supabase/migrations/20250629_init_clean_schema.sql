-- Clean Learnify Database Schema
-- Simple student check-in system without authentication dependencies
-- Students can check-in directly with student_id (auto-registration)

-- Students table for auto-registration
CREATE TABLE students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id text UNIQUE NOT NULL,
    full_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Index for fast student_id lookups
CREATE INDEX idx_students_student_id ON students(student_id);

-- Student check-ins table
CREATE TABLE student_check_ins (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id text NOT NULL,
    student_uuid uuid REFERENCES students(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_student_check_ins_student_id ON student_check_ins(student_id, created_at DESC);
CREATE INDEX idx_student_check_ins_uuid ON student_check_ins(student_uuid, created_at DESC);

-- No RLS needed - using service role for all operations

-- Insert seed data for testing
INSERT INTO students (student_id, full_name) 
VALUES ('STU', 'Test Student') 
ON CONFLICT (student_id) DO NOTHING;