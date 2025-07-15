-- Add lessons table to store "Introduction to SwiftUI and iOS App Development" curriculum
-- Updated lesson plans with correct dates and content
-- Progress is tracked at class level, not per student

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_number integer UNIQUE NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    scheduled_date date NOT NULL,
    status text NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'skipped', 'cancelled')),
    topic_name text NOT NULL,
    icon text NOT NULL DEFAULT 'fas fa-book',
    color text NOT NULL DEFAULT 'from-blue-500 to-purple-600',
    button_color text NOT NULL DEFAULT 'text-blue-600 hover:text-blue-700',
    further_reading_url text,
    lesson_content text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Lesson plan items table (checklist items for each lesson)
CREATE TABLE IF NOT EXISTS lesson_plan_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
    title text NOT NULL,
    is_required boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Class-wide lesson progress table (shared progress for all students)
CREATE TABLE IF NOT EXISTS class_lesson_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_plan_item_id uuid REFERENCES lesson_plan_items(id) ON DELETE CASCADE,
    completed boolean NOT NULL DEFAULT false,
    completed_at timestamp with time zone,
    completed_by_teacher_id text, -- Teacher who marked it as complete
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(lesson_plan_item_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lessons_scheduled_date ON lessons(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_lessons_lesson_number ON lessons(lesson_number);
CREATE INDEX IF NOT EXISTS idx_lesson_plan_items_lesson_id ON lesson_plan_items(lesson_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_class_lesson_progress_item ON class_lesson_progress(lesson_plan_item_id);
CREATE INDEX IF NOT EXISTS idx_class_lesson_progress_completed ON class_lesson_progress(completed);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_class_lesson_progress_updated_at ON class_lesson_progress;
CREATE TRIGGER update_class_lesson_progress_updated_at BEFORE UPDATE ON class_lesson_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for easy lesson progress querying
CREATE OR REPLACE VIEW lesson_progress_view AS
SELECT 
    l.id as lesson_id,
    l.lesson_number,
    l.name as lesson_name,
    l.scheduled_date,
    l.status as lesson_status,
    lpi.id as lesson_plan_item_id,
    lpi.title as item_title,
    lpi.is_required,
    lpi.sort_order,
    COALESCE(clp.completed, false) as completed,
    clp.completed_at,
    clp.completed_by_teacher_id
FROM lessons l
LEFT JOIN lesson_plan_items lpi ON l.id = lpi.lesson_id
LEFT JOIN class_lesson_progress clp ON lpi.id = clp.lesson_plan_item_id
ORDER BY l.lesson_number, lpi.sort_order;

-- Function to calculate lesson completion percentage
CREATE OR REPLACE FUNCTION get_lesson_completion_percentage(lesson_uuid uuid)
RETURNS integer AS $$
DECLARE
    total_items integer;
    completed_items integer;
    percentage integer;
BEGIN
    -- Get total lesson plan items for this lesson
    SELECT COUNT(*) INTO total_items
    FROM lesson_plan_items 
    WHERE lesson_id = lesson_uuid;
    
    -- If no items, return 0
    IF total_items = 0 THEN
        RETURN 0;
    END IF;
    
    -- Get completed items
    SELECT COUNT(*) INTO completed_items
    FROM lesson_plan_items lpi
    JOIN class_lesson_progress clp ON lpi.id = clp.lesson_plan_item_id
    WHERE lpi.lesson_id = lesson_uuid AND clp.completed = true;
    
    -- Calculate percentage
    percentage := ROUND((completed_items::decimal / total_items::decimal) * 100);
    
    RETURN percentage;
END;
$$ LANGUAGE plpgsql;

-- Clear existing data
DELETE FROM class_lesson_progress;
DELETE FROM lesson_plan_items;
DELETE FROM lessons;

-- Insert updated lesson data - Introduction to SwiftUI and iOS App Development
INSERT INTO lessons (lesson_number, name, description, scheduled_date, status, topic_name, icon, color, button_color, lesson_content) VALUES
(1, 'Lesson 1: Introduction to Mobile App Development', 'Course overview and setup', '2025-07-01', 'normal', 'Introduction to Mobile App Development', 'fas fa-mobile-alt', 'from-blue-500 to-purple-600', 'text-blue-600 hover:text-blue-700', ARRAY['Course Structure', 'Marking Scheme', 'Learnify check-in', 'Share learning resources']),
(2, 'Lesson 2: [Break/Holiday]', 'No class scheduled', '2025-07-05', 'skipped', 'Break', 'fas fa-calendar-times', 'from-gray-400 to-gray-500', 'text-gray-500', ARRAY[]::text[]),
(3, 'Lesson 3: Mobile Application Innovation Contest', 'Introduction to MAIC', '2025-07-08', 'normal', 'Mobile Application Innovation Contest', 'fas fa-trophy', 'from-yellow-500 to-orange-600', 'text-yellow-600 hover:text-yellow-700', ARRAY['Mobile Application Innovation Contest']),
(4, 'Lesson 4: Introduction to SwiftUI', 'SwiftUI basics and MAIC team reviews', '2025-07-12', 'normal', 'Introduction to SwiftUI', 'fas fa-code', 'from-blue-500 to-indigo-600', 'text-blue-600 hover:text-blue-700', ARRAY['Primitive types (Text, Image)', 'App Reviews on MAIC teams']),
(5, 'Lesson 5: SwiftUI Fundamentals', 'Advanced SwiftUI concepts and team collaboration', '2025-07-15', 'normal', 'SwiftUI Fundamentals', 'fas fa-layer-group', 'from-purple-500 to-blue-600', 'text-purple-600 hover:text-purple-700', ARRAY['Team Discussion - Ideation', 'Primitive types (Color, Shape)', 'Container views (VStack, HStack, ZStack)', 'View Modifiers']),
(6, 'Lesson 6: Xcode & Development Tools', 'Development environment and AI tools', '2025-07-19', 'normal', 'Xcode & Development Tools', 'fas fa-tools', 'from-green-500 to-teal-600', 'text-green-600 hover:text-green-700', ARRAY['Xcode', 'Copilot', 'ChatGPT', 'Claude', 'Swift fundamentals (variables, data types, control flow, functions)', 'Practice of sample project']),
(7, 'Lesson 7: Lists and Dynamic Content', 'Dynamic content and user interaction', '2025-07-22', 'normal', 'Lists and Dynamic Content', 'fas fa-list', 'from-indigo-500 to-purple-600', 'text-indigo-600 hover:text-indigo-700', ARRAY['Lists in SwiftUI: Dynamic Content and Data Models', 'State management', 'List vs ScrollView', 'User Input controls']),
(8, 'Lesson 8: Navigation and UI/UX', 'Navigation patterns and design principles', '2025-07-26', 'normal', 'Navigation and UI/UX', 'fas fa-compass', 'from-pink-500 to-red-600', 'text-pink-600 hover:text-pink-700', ARRAY['Navigation and Presentations', 'UI/UX principles', 'Guest speech on Design Thinking']),
(9, 'Lesson 9: Project Ideation', 'Project planning and presentation skills', '2025-07-29', 'normal', 'Project Ideation', 'fas fa-lightbulb', 'from-yellow-500 to-orange-600', 'text-yellow-600 hover:text-yellow-700', ARRAY['Project Ideation and Presentation Prep']),
(10, 'Lesson 10: Midterm Presentations', 'Project presentations and feedback', '2025-08-02', 'normal', 'Midterm Presentations', 'fas fa-presentation', 'from-blue-500 to-purple-600', 'text-blue-600 hover:text-blue-700', ARRAY['Midterm Project Presentations', 'Feedback', 'Final Project Kickoff']),
(11, 'Lesson 11: SwiftUI View Tree', 'Advanced SwiftUI architecture', '2025-08-05', 'normal', 'SwiftUI View Tree', 'fas fa-sitemap', 'from-green-500 to-blue-600', 'text-green-600 hover:text-green-700', ARRAY['SwiftUI View Tree', 'Identity', 'Best Practices']),
(12, 'Lesson 12: Animations & Transitions', 'Creating engaging user experiences', '2025-08-09', 'normal', 'Animations & Transitions', 'fas fa-magic', 'from-purple-500 to-pink-600', 'text-purple-600 hover:text-purple-700', ARRAY['Animations & View Transitions', 'Custom animations', 'Text Effects']),
(13, 'Lesson 13: Observation Framework', 'Modern data flow patterns', '2025-08-12', 'normal', 'Observation Framework', 'fas fa-eye', 'from-cyan-500 to-blue-600', 'text-cyan-600 hover:text-cyan-700', ARRAY['Observation Framework', 'App Structure', 'Data Flow']),
(14, 'Lesson 14: Gestures & Interactive Views', 'Touch interactions and gestures', '2025-08-16', 'normal', 'Gestures & Interactive Views', 'fas fa-hand-pointer', 'from-orange-500 to-red-600', 'text-orange-600 hover:text-orange-700', ARRAY['Gestures & Custom Interactive Views', 'Choice of gestures']),
(15, 'Lesson 15: Networking Basics', 'Remote data and async programming', '2025-08-19', 'normal', 'Networking Basics', 'fas fa-network-wired', 'from-teal-500 to-green-600', 'text-teal-600 hover:text-teal-700', ARRAY['Networking Basics: Fetching & Displaying Remote Data', 'URL session', 'Swift Concurrency basics']),
(16, 'Lesson 16: Data Persistence', 'Local data storage solutions', '2025-08-23', 'normal', 'Data Persistence', 'fas fa-database', 'from-indigo-500 to-purple-600', 'text-indigo-600 hover:text-indigo-700', ARRAY['Data Persistence: UserDefaults, SwiftData', 'In-memory states', 'AppStorage', 'SwiftData']),
(17, 'Lesson 17: App Polishing & Deployment', 'App Store preparation and deployment', '2025-08-26', 'normal', 'App Polishing & Deployment', 'fas fa-rocket', 'from-emerald-500 to-green-600', 'text-emerald-600 hover:text-emerald-700', ARRAY['App Polishing, Deployment & Presentation Prep', 'App Store Deployment', 'Metadata and screenshots', 'TestFlight']),
(18, 'Lesson 18: Final Presentations', 'Final project showcase', '2025-08-30', 'normal', 'Final Presentations', 'fas fa-trophy', 'from-yellow-500 to-amber-600', 'text-yellow-600 hover:text-yellow-700', ARRAY['Final Project Presentations', 'Feedback', 'Voting']);

-- Insert lesson plan items for each lesson based on the new curriculum

-- Lesson 1: Introduction to Mobile App Development
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order) 
SELECT id, 'Course Structure', true, 1 FROM lessons WHERE lesson_number = 1;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order) 
SELECT id, 'Marking Scheme', true, 2 FROM lessons WHERE lesson_number = 1;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order) 
SELECT id, 'Learnify check-in', true, 3 FROM lessons WHERE lesson_number = 1;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order) 
SELECT id, 'Share learning resources', false, 4 FROM lessons WHERE lesson_number = 1;

-- Lesson 3: Mobile Application Innovation Contest
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'MAIC Introduction', true, 1 FROM lessons WHERE lesson_number = 3;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Project Guidelines', true, 2 FROM lessons WHERE lesson_number = 3;

-- Lesson 4: Introduction to SwiftUI
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Primitive types (Text, Image)', true, 1 FROM lessons WHERE lesson_number = 4;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'App Reviews on MAIC teams', true, 2 FROM lessons WHERE lesson_number = 4;

-- Lesson 5: SwiftUI Fundamentals
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Team Discussion - Ideation', true, 1 FROM lessons WHERE lesson_number = 5;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Primitive types (Color, Shape)', true, 2 FROM lessons WHERE lesson_number = 5;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Container views (VStack, HStack, ZStack)', true, 3 FROM lessons WHERE lesson_number = 5;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'View Modifiers', true, 4 FROM lessons WHERE lesson_number = 5;

-- Lesson 6: Xcode & Development Tools
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Xcode Introduction', true, 1 FROM lessons WHERE lesson_number = 6;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'AI Tools (Copilot, ChatGPT, Claude)', true, 2 FROM lessons WHERE lesson_number = 6;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Swift fundamentals (variables, data types, control flow, functions)', true, 3 FROM lessons WHERE lesson_number = 6;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Practice of sample project', false, 4 FROM lessons WHERE lesson_number = 6;

-- Lesson 7: Lists and Dynamic Content
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Lists in SwiftUI: Dynamic Content and Data Models', true, 1 FROM lessons WHERE lesson_number = 7;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'State management', true, 2 FROM lessons WHERE lesson_number = 7;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'List vs ScrollView', true, 3 FROM lessons WHERE lesson_number = 7;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'User Input controls', true, 4 FROM lessons WHERE lesson_number = 7;

-- Lesson 8: Navigation and UI/UX
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Navigation and Presentations', true, 1 FROM lessons WHERE lesson_number = 8;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'UI/UX principles', true, 2 FROM lessons WHERE lesson_number = 8;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Guest speech on Design Thinking', false, 3 FROM lessons WHERE lesson_number = 8;

-- Lesson 9: Project Ideation
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Project Ideation', true, 1 FROM lessons WHERE lesson_number = 9;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Presentation Prep', true, 2 FROM lessons WHERE lesson_number = 9;

-- Lesson 10: Midterm Presentations
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Midterm Project Presentations', true, 1 FROM lessons WHERE lesson_number = 10;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Feedback', true, 2 FROM lessons WHERE lesson_number = 10;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Final Project Kickoff', true, 3 FROM lessons WHERE lesson_number = 10;

-- Lesson 11: SwiftUI View Tree
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'SwiftUI View Tree', true, 1 FROM lessons WHERE lesson_number = 11;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Identity', true, 2 FROM lessons WHERE lesson_number = 11;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Best Practices', true, 3 FROM lessons WHERE lesson_number = 11;

-- Lesson 12: Animations & Transitions
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Animations & View Transitions', true, 1 FROM lessons WHERE lesson_number = 12;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Custom animations', true, 2 FROM lessons WHERE lesson_number = 12;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Text Effects', false, 3 FROM lessons WHERE lesson_number = 12;

-- Lesson 13: Observation Framework
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Observation Framework', true, 1 FROM lessons WHERE lesson_number = 13;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'App Structure', true, 2 FROM lessons WHERE lesson_number = 13;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Data Flow', true, 3 FROM lessons WHERE lesson_number = 13;

-- Lesson 14: Gestures & Interactive Views
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Gestures & Custom Interactive Views', true, 1 FROM lessons WHERE lesson_number = 14;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Choice of gestures', true, 2 FROM lessons WHERE lesson_number = 14;

-- Lesson 15: Networking Basics
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Networking Basics: Fetching & Displaying Remote Data', true, 1 FROM lessons WHERE lesson_number = 15;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'URL session', true, 2 FROM lessons WHERE lesson_number = 15;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Swift Concurrency basics', true, 3 FROM lessons WHERE lesson_number = 15;

-- Lesson 16: Data Persistence
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Data Persistence: UserDefaults, SwiftData', true, 1 FROM lessons WHERE lesson_number = 16;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'In-memory states', true, 2 FROM lessons WHERE lesson_number = 16;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'AppStorage', true, 3 FROM lessons WHERE lesson_number = 16;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'SwiftData', true, 4 FROM lessons WHERE lesson_number = 16;

-- Lesson 17: App Polishing & Deployment
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'App Polishing, Deployment & Presentation Prep', true, 1 FROM lessons WHERE lesson_number = 17;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'App Store Deployment', true, 2 FROM lessons WHERE lesson_number = 17;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Metadata and screenshots', true, 3 FROM lessons WHERE lesson_number = 17;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'TestFlight', false, 4 FROM lessons WHERE lesson_number = 17;

-- Lesson 18: Final Presentations
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Final Project Presentations', true, 1 FROM lessons WHERE lesson_number = 18;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Feedback', true, 2 FROM lessons WHERE lesson_number = 18;
INSERT INTO lesson_plan_items (lesson_id, title, is_required, sort_order)
SELECT id, 'Voting', false, 3 FROM lessons WHERE lesson_number = 18;

-- Initialize progress for all lesson plan items (all uncompleted initially)
INSERT INTO class_lesson_progress (lesson_plan_item_id, completed)
SELECT id, false
FROM lesson_plan_items
ON CONFLICT (lesson_plan_item_id) DO NOTHING;