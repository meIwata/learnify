# Smart Learning Quiz System

Learnify's intelligent quiz system that adapts to student learning patterns, ensuring they master SwiftUI fundamentals through targeted practice and second chances.

## 🧠 Overview

The Smart Learning Quiz System goes beyond traditional random quizzing by implementing an intelligent algorithm that prioritizes questions based on individual student performance. This ensures students get multiple opportunities to learn from their mistakes while still being exposed to new concepts.

## ✨ Key Features

### **Adaptive Question Selection**
- **60% Priority Questions**: Previously incorrect answers that haven't been mastered recently
- **30% New Questions**: Concepts the student hasn't encountered yet  
- **10% Reinforcement**: Recently correct answers for knowledge retention

### **Learning-Focused Design**
- **Second Chances**: Students can retry questions they got wrong until they master them
- **Mastery Tracking**: Questions become lower priority once answered correctly
- **Progressive Learning**: Balanced introduction of new concepts while reinforcing weak areas
- **Spaced Repetition**: Natural intervals between question re-appearances

### **Cross-Platform Implementation**
- **Web Interface**: React-based quiz interface with real-time timer
- **iOS Native**: SwiftUI implementation with modern @Observable patterns
- **Smart API**: Intelligent backend that tracks learning progress

## 📊 How It Works

### **First Quiz Experience**
```
Student starts → Gets random questions → Performance tracked
No history exists → All questions equally likely
```

### **Subsequent Quizzes (Smart Algorithm)**
```
Student requests quiz → Backend analyzes history → Categorizes questions:
├── High Priority (60%): Previously incorrect, not recently mastered
├── Medium Priority (30%): Never attempted before  
└── Low Priority (10%): Recently correct answers
```

### **Question Selection Algorithm**
1. **Analyze Student History**: Review all previous quiz attempts
2. **Categorize Questions**: Sort by learning priority
3. **Apply Weighted Selection**: Use 60/30/10 distribution
4. **Shuffle Results**: Randomize order to avoid predictability
5. **Fallback**: Use random selection if no student history exists

## 🏗️ Architecture

### **Database Schema**

```sql
-- Quiz questions with SwiftUI content
CREATE TABLE quiz_questions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    question_text text NOT NULL,
    question_category text NOT NULL DEFAULT 'swiftui',
    difficulty_level smallint CHECK (difficulty_level >= 1 AND difficulty_level <= 3),
    option_a text NOT NULL,
    option_b text NOT NULL, 
    option_c text NOT NULL,
    option_d text NOT NULL,
    correct_answer char(1) CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Individual question attempts
CREATE TABLE student_quiz_attempts (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id text NOT NULL,
    student_uuid uuid REFERENCES students(id),
    question_id bigint REFERENCES quiz_questions(id),
    selected_answer char(1) CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
    is_correct boolean NOT NULL,
    points_earned smallint DEFAULT 0,
    attempt_time_seconds smallint,
    created_at timestamp with time zone DEFAULT now()
);

-- Aggregated student performance
CREATE TABLE student_quiz_scores (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    student_id text UNIQUE NOT NULL,
    student_uuid uuid REFERENCES students(id),
    total_questions_attempted integer DEFAULT 0,
    total_correct_answers integer DEFAULT 0,
    total_points integer DEFAULT 0,
    accuracy_percentage decimal(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_questions_attempted = 0 THEN 0 
            ELSE ROUND((total_correct_answers::decimal / total_questions_attempted) * 100, 2)
        END
    ) STORED,
    last_quiz_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

### **API Endpoints**

#### **GET /api/quiz/questions/random**
Smart question selection endpoint with learning algorithm.

**Parameters:**
- `count` (int): Number of questions (max 20, default 5)
- `difficulty` (int): Filter by difficulty level (1-3, optional)
- `student_id` (string): **Required for smart selection**

**Response:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": 1,
        "question_text": "What is @State used for in SwiftUI?",
        "difficulty_level": 1,
        "option_a": "Managing local state",
        "option_b": "Binding to parent views", 
        "option_c": "Observing external objects",
        "option_d": "Creating computed properties"
      }
    ],
    "total_available": 25,
    "selection_method": "smart_learning"
  }
}
```

#### **POST /api/quiz/submit-answer**
Submit answer and get immediate feedback with scoring.

**Request:**
```json
{
  "student_id": "ALICE2025",
  "full_name": "Alice Johnson",
  "question_id": 1,
  "selected_answer": "A",
  "attempt_time_seconds": 15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "is_correct": true,
    "points_earned": 5,
    "correct_answer": "A",
    "explanation": "@State is used for managing simple local state within a view."
  },
  "message": "Correct! You earned 5 points."
}
```

#### **GET /api/quiz/student/:student_id/scores**
Get student's quiz performance statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "student": {
      "student_id": "ALICE2025",
      "full_name": "Alice Johnson"
    },
    "quiz_scores": {
      "total_questions_attempted": 45,
      "total_correct_answers": 38,
      "total_points": 190,
      "accuracy_percentage": 84.44,
      "last_quiz_date": "2025-07-31T14:30:00Z"
    }
  }
}
```

## 💻 Implementation Details

### **Backend (Node.js + TypeScript)**

#### **Smart Selection Algorithm**
```typescript
// Prioritize questions student got wrong but haven't mastered recently
const priorityQuestions = allQuestions.filter(q => 
  incorrectQuestionIds.has(q.id) && !recentlyCorrectIds.has(q.id)
);

// Questions never attempted by this student  
const newQuestions = allQuestions.filter(q => !attemptedQuestionIds.has(q.id));

// Recently correct questions for reinforcement
const recentlyCorrectQuestions = allQuestions.filter(q => recentlyCorrectIds.has(q.id));

// Apply 60/30/10 weighted distribution
const priorityCount = Math.ceil(count * 0.6);
const newCount = Math.ceil(count * 0.3);  
const reinforcementCount = count - priorityCount - newCount;
```

#### **Auto-Registration Integration**
- Seamlessly works with existing student auto-registration system
- No additional authentication required
- Automatic score tracking and aggregation via database triggers

### **Web Frontend (React + TypeScript)**

#### **API Integration**
```typescript
// Smart question loading with student context
const loadQuestions = async () => {
  const questionsData = await getRandomQuizQuestions(5, undefined, studentId);
  setQuestions(questionsData);
};

// Answer submission with immediate feedback
const submitAnswer = async () => {
  const result = await submitQuizAnswer({
    student_id: studentId,
    full_name: studentName,
    question_id: currentQuestion.id,
    selected_answer: selectedAnswer,
    attempt_time_seconds: attemptTime
  });
};
```

#### **Features**
- 10-minute quiz timer with automatic submission
- Real-time progress tracking
- Immediate feedback after each answer
- Comprehensive results screen with statistics
- Responsive design for mobile and desktop

### **iOS Frontend (SwiftUI)**

#### **Modern SwiftUI Implementation**
```swift
@Observable
class QuizViewModel {
    var questions: [QuizQuestion] = []
    var currentQuestionIndex = 0
    var selectedAnswer: String? = nil
    var quizResults: [QuizResult] = []
    
    func loadQuestions(studentId: String? = nil) async {
        // Use smart learning algorithm
        questions = try await APIService.shared.getRandomQuizQuestions(
            count: 5, 
            studentId: studentId
        )
    }
}
```

#### **Features**
- Native SwiftUI interface with modern @Observable patterns
- 10-minute countdown timer
- Progress indicators and difficulty badges
- Statistics dashboard with performance metrics
- Seamless integration with existing TabView navigation

## 📚 SwiftUI Knowledge Base

The system includes **20 carefully crafted questions** covering:

### **Beginner Level (Difficulty 1)**
- Basic Text and Button views
- @State property wrapper
- Background colors and modifiers
- NavigationStack vs NavigationView

### **Intermediate Level (Difficulty 2)**  
- @State vs @Binding differences
- @Observable macro usage (iOS 17+)
- Optional value handling in views
- List creation with custom content
- @Bindable property wrapper

### **Advanced Level (Difficulty 3)**
- Custom ViewModifier implementation
- @Observable object sharing patterns
- Modern animation APIs
- Complex state management strategies
- Custom Transferable types for drag & drop

### **Practical Applications**
- Gesture recognition and simultaneousGesture
- Custom Shape creation
- Form validation patterns
- Accessibility support implementation
- Navigation architecture for large apps

## 🎯 Learning Benefits

### **For Students**
- **Personalized Learning**: Questions adapt to individual weak areas
- **Mastery Focus**: Repeat practice until concepts are understood
- **Progress Tracking**: Clear visibility into learning progress
- **Confidence Building**: Success reinforcement through point system

### **For Instructors**
- **Learning Analytics**: Detailed insights into student progress
- **Curriculum Effectiveness**: Identify commonly missed concepts
- **Individual Support**: See which students need help with specific topics
- **Engagement Metrics**: Track quiz participation and improvement

## 🚀 Getting Started

### **Prerequisites**
- Existing Learnify backend setup
- Student auto-registration system active
- Supabase database with quiz migrations applied

### **Database Setup**
```bash
# Apply quiz system migration
npm run supabase:start
supabase db push
```

### **Web Frontend Usage**
1. Student logs in with student ID
2. Navigates to Quiz section
3. System automatically loads personalized questions
4. Takes quiz and receives immediate feedback
5. Scores are automatically tracked and applied to leaderboard

### **iOS Frontend Usage**  
1. Student opens iOS app and navigates to Quiz tab
2. System loads smart questions based on learning history
3. Completes quiz with native SwiftUI interface
4. Results sync with backend for cross-platform continuity

## 📈 Performance & Scalability

### **Database Optimization**
- Comprehensive indexing on frequently queried columns
- Generated columns for automatic accuracy calculation
- Efficient query patterns for question selection
- Minimal API calls through intelligent caching

### **Smart Algorithm Efficiency**
- O(n) time complexity for question categorization
- Minimal database queries per quiz session  
- Fallback to random selection prevents failures
- Batch processing for improved performance

### **Cross-Platform Sync**
- Real-time progress synchronization
- Consistent learning experience across devices
- Automatic score aggregation and leaderboard updates

## 🔧 Configuration & Customization

### **Algorithm Tuning**
```typescript
// Adjustable distribution weights
const priorityCount = Math.ceil(count * 0.6);    // 60% priority questions
const newCount = Math.ceil(count * 0.3);         // 30% new questions  
const reinforcementCount = count - priorityCount - newCount; // 10% reinforcement
```

### **Scoring System**
- **Points per Correct Answer**: 5 points (configurable)
- **Integration**: Automatic leaderboard updates
- **Tracking**: Individual and aggregate statistics

### **Question Management**
- Add new questions via database inserts
- Update existing questions while preserving history
- Deactivate questions without losing student progress
- Category-based filtering for focused learning

## 🎊 Conclusion

The Smart Learning Quiz System transforms traditional multiple-choice testing into an adaptive learning experience. By ensuring students encounter their weak areas while still learning new concepts, it maximizes educational value and helps students truly master SwiftUI development fundamentals.

The system's intelligence grows with usage, becoming more effective at identifying learning patterns and providing personalized educational experiences for each student.