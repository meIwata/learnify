-- Quiz System Tables for SwiftUI Learning
-- Student quiz functionality with scoring system

-- Quiz questions table - stores SwiftUI questions with multiple choice answers
CREATE TABLE quiz_questions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    question_text text NOT NULL,
    question_category text NOT NULL DEFAULT 'swiftui', -- For future categorization
    difficulty_level smallint NOT NULL DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 3),
    option_a text NOT NULL,
    option_b text NOT NULL,
    option_c text NOT NULL,
    option_d text NOT NULL,
    correct_answer char(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation text, -- Optional explanation for learning
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Student quiz attempts table - tracks individual question attempts
CREATE TABLE student_quiz_attempts (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id text NOT NULL,
    student_uuid uuid REFERENCES students(id),
    question_id bigint NOT NULL REFERENCES quiz_questions(id),
    selected_answer char(1) NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
    is_correct boolean NOT NULL,
    points_earned smallint NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
    attempt_time_seconds smallint, -- Time taken to answer in seconds
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Student quiz scores table - aggregated scores per student
CREATE TABLE student_quiz_scores (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id text NOT NULL,
    student_uuid uuid REFERENCES students(id),
    total_questions_attempted integer NOT NULL DEFAULT 0,
    total_correct_answers integer NOT NULL DEFAULT 0,
    total_points integer NOT NULL DEFAULT 0,
    accuracy_percentage decimal(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_questions_attempted = 0 THEN 0 
            ELSE ROUND((total_correct_answers::decimal / total_questions_attempted) * 100, 2)
        END
    ) STORED,
    last_quiz_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(student_id) -- One record per student
);

-- Performance indexes
CREATE INDEX idx_quiz_questions_category ON quiz_questions(question_category);
CREATE INDEX idx_quiz_questions_difficulty ON quiz_questions(difficulty_level);
CREATE INDEX idx_quiz_questions_active ON quiz_questions(is_active);
CREATE INDEX idx_student_quiz_attempts_student_id ON student_quiz_attempts(student_id, created_at DESC);
CREATE INDEX idx_student_quiz_attempts_uuid ON student_quiz_attempts(student_uuid, created_at DESC);
CREATE INDEX idx_student_quiz_attempts_question ON student_quiz_attempts(question_id);
CREATE INDEX idx_student_quiz_scores_student_id ON student_quiz_scores(student_id);
CREATE INDEX idx_student_quiz_scores_points ON student_quiz_scores(total_points DESC);


-- Insert initial SwiftUI quiz questions
INSERT INTO quiz_questions (question_text, difficulty_level, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES

-- Beginner Level Questions (Difficulty 1)
('What is the correct way to create a simple Text view in SwiftUI?', 1, 
 'Text("Hello World")', 'TextView("Hello World")', 'Label("Hello World")', 'String("Hello World")', 
 'A', 'Text is the fundamental view for displaying strings in SwiftUI.'),

('Which property wrapper is used for simple state management in SwiftUI?', 1,
 '@State', '@Binding', '@Observable', '@Published',
 'A', '@State is used for managing simple local state within a view.'),

('How do you apply a background color to a view in SwiftUI?', 1,
 '.backgroundColor(.blue)', '.background(Color.blue)', '.color(.blue)', '.fill(.blue)',
 'B', 'The .background() modifier is used to apply background colors or views.'),

('What is the correct syntax for creating a Button in SwiftUI?', 1,
 'Button("Title") { // action }', 'Button(action: { }, label: "Title")', 'UIButton("Title", action: { })', 'ActionButton("Title") { }',
 'A', 'The most common Button syntax uses a string title and trailing closure for the action.'),

('Which navigation container should you use for iOS 16+ SwiftUI apps?', 1,
 'NavigationView', 'NavigationStack', 'NavigationController', 'StackNavigation',
 'B', 'NavigationStack is the modern replacement for NavigationView in iOS 16+.'),

-- Intermediate Level Questions (Difficulty 2)
('What is the difference between @State and @Binding?', 2,
 '@State is for local state, @Binding creates a two-way connection', '@State is deprecated, use @Binding instead', 'They are identical in functionality', '@State is for ObservableObject, @Binding is for simple values',
 'A', '@State manages local state, while @Binding creates a two-way connection to state owned by another view.'),

('How do you properly use the new @Observable macro in iOS 17+?', 2,
 'class MyModel: @Observable { }', '@Observable class MyModel { }', 'class MyModel { @Observable var data }', '@Observable var model = MyModel()',
 'B', 'The @Observable macro is applied to the class declaration itself.'),

('What is the correct way to handle optional values in SwiftUI views?', 2,
 'if let unwrapped = optional { Text(unwrapped) }', 'Text(optional ?? "Default")', 'Both A and B are correct', 'Use @State for all optionals',
 'C', 'Both if-let unwrapping and nil-coalescing operator are valid approaches for handling optionals in SwiftUI.'),

('How do you create a List with custom row content in SwiftUI?', 2,
 'List(items) { item in CustomRow(item) }', 'List { ForEach(items) { CustomRow($0) } }', 'ListView(items, content: CustomRow)', 'Both A and B are correct',
 'D', 'Both direct List initialization with closure and List with ForEach are valid patterns.'),

('What is the purpose of the @Bindable property wrapper?', 2,
 'It replaces @State in all cases', 'It creates bindings to @Observable objects', 'It binds to @Published properties only', 'It is used for Core Data objects',
 'B', '@Bindable is used to create bindings to properties of @Observable objects.'),

-- Advanced Level Questions (Difficulty 3)
('How do you properly implement custom view modifiers in SwiftUI?', 3,
 'struct MyModifier: ViewModifier { func body(content: Content) -> some View { } }', 'extension View { func myModifier() -> some View { } }', 'Both A and B are correct approaches', 'Custom modifiers are not supported',
 'C', 'Both creating a ViewModifier struct and extending View are valid ways to create custom modifiers.'),

('What is the correct pattern for sharing @Observable objects across multiple views?', 3,
 'Use @State to pass the object down', 'Use @Environment to inject the object', 'Use @Bindable in child views', 'All of the above can be appropriate depending on the use case',
 'D', 'The choice depends on the architecture: @State for local sharing, @Environment for app-wide objects, and @Bindable for creating bindings.'),

('How do you implement proper animation with the new SwiftUI animation APIs?', 3,
 'withAnimation { } for state changes', '.animation(.default, value: stateValue) for view-specific animations', 'Both A and B are correct modern approaches', 'Use .animation() without parameters',
 'C', 'Modern SwiftUI uses withAnimation for explicit animations and .animation(_:value:) for implicit animations tied to specific values.'),

('What is the best practice for handling complex state in SwiftUI with iOS 17+?', 3,
 'Always use @StateObject', 'Use @Observable classes with @State for object storage', 'Use @Published properties exclusively', 'Avoid state management altogether',
 'B', 'iOS 17+ recommends @Observable classes stored in @State, replacing the older @ObservableObject/@StateObject pattern.'),

('How do you properly implement custom Transferable types for drag and drop?', 3,
 'Conform to Transferable protocol with transferRepresentation property', 'Use NSItemProvider directly', 'Implement Codable protocol only', 'Custom transfers are not supported in SwiftUI',
 'A', 'The Transferable protocol with transferRepresentation is the SwiftUI way to implement drag and drop.'),

-- Practical Application Questions
('Which gesture modifier allows for simultaneous recognition with other gestures?', 2,
 '.gesture(.simultaneous)', '.simultaneousGesture()', '.allowsHitTesting(true)', '.gesture(.exclusive)',
 'B', 'The .simultaneousGesture() modifier allows gestures to be recognized alongside other gestures.'),

('How do you create a custom Shape in SwiftUI?', 2,
 'struct MyShape: Shape { func path(in rect: CGRect) -> Path { } }', 'class MyShape: UIBezierPath { }', 'extension Shape { static var myShape { } }', 'Shapes cannot be customized',
 'A', 'Custom shapes conform to the Shape protocol and implement the path(in:) method.'),

('What is the correct way to handle form validation in SwiftUI?', 3,
 'Use @State variables to track validation state', 'Implement custom view modifiers for validation', 'Use computed properties for validation logic', 'All of the above are valid approaches',
 'D', 'Form validation can be implemented using various SwiftUI patterns depending on complexity and requirements.'),

('How do you implement proper accessibility support in SwiftUI?', 2,
 '.accessibilityLabel() and .accessibilityHint()', '.accessibility(label: Text())', 'Both A and B work but A is preferred', 'Accessibility is automatic in SwiftUI',
 'C', 'Both syntaxes work, but the .accessibilityLabel() modifier is the more modern approach.'),

('What is the recommended pattern for navigation in large SwiftUI apps?', 3,
 'Use NavigationStack with path binding for programmatic navigation', 'Rely only on NavigationLink', 'Use UINavigationController', 'Avoid deep navigation hierarchies',
 'A', 'NavigationStack with path binding provides the most flexible and programmatic navigation control for complex apps.');

-- Update the updated_at timestamp function for quiz_questions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at for quiz_questions
CREATE TRIGGER trigger_quiz_questions_updated_at
    BEFORE UPDATE ON quiz_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at for student_quiz_scores  
CREATE TRIGGER trigger_quiz_scores_updated_at
    BEFORE UPDATE ON student_quiz_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update student quiz scores after each attempt
CREATE OR REPLACE FUNCTION update_student_quiz_scores()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update student quiz scores
    INSERT INTO student_quiz_scores (
        student_id, 
        student_uuid, 
        total_questions_attempted, 
        total_correct_answers, 
        total_points,
        last_quiz_date
    )
    VALUES (
        NEW.student_id,
        NEW.student_uuid,
        1,
        CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        NEW.points_earned,
        NEW.created_at
    )
    ON CONFLICT (student_id) 
    DO UPDATE SET
        total_questions_attempted = student_quiz_scores.total_questions_attempted + 1,
        total_correct_answers = student_quiz_scores.total_correct_answers + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        total_points = student_quiz_scores.total_points + NEW.points_earned,
        last_quiz_date = NEW.created_at,
        updated_at = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update scores when new attempt is recorded
CREATE TRIGGER trigger_update_student_quiz_scores
    AFTER INSERT ON student_quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_student_quiz_scores();