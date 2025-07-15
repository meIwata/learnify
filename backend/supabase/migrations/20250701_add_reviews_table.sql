-- Create student_reviews table for mobile app review submissions
CREATE TABLE student_reviews (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id text NOT NULL,
    student_uuid uuid REFERENCES students(id),
    mobile_app_name text NOT NULL,
    review_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Performance indexes
CREATE INDEX idx_student_reviews_student_id ON student_reviews(student_id);
CREATE INDEX idx_student_reviews_app_name ON student_reviews(mobile_app_name);
CREATE INDEX idx_student_reviews_created ON student_reviews(created_at DESC);

-- RLS policies (if needed later)
-- ALTER TABLE student_reviews ENABLE ROW LEVEL SECURITY;

-- Comments for documentation
COMMENT ON TABLE student_reviews IS 'Student reviews on chosen mobile applications';
COMMENT ON COLUMN student_reviews.student_id IS 'Student identifier (e.g., ALICE2025)';
COMMENT ON COLUMN student_reviews.student_uuid IS 'Foreign key to students table';
COMMENT ON COLUMN student_reviews.mobile_app_name IS 'Name of the mobile app being reviewed';
COMMENT ON COLUMN student_reviews.review_text IS 'Student thoughts and review text';
COMMENT ON COLUMN student_reviews.created_at IS 'When the review was submitted';
COMMENT ON COLUMN student_reviews.updated_at IS 'When the review was last modified';