//
//  QuizView.swift
//  Learnify
//
//  Created by Claude on 2025/7/31.
//

import SwiftUI

@Observable
class QuizViewModel {
    var questions: [QuizQuestion] = []
    var currentQuestionIndex = 0
    var selectedAnswer: String? = nil
    var quizResults: [QuizResult] = []
    var isLoading = false
    var isSubmitting = false
    var showResults = false
    var showReview = false
    var quizStarted = false
    var timeRemaining = 10 * 60 // 10 minutes in seconds
    var questionStartTime = Date()
    var studentStats: StudentQuizScoresData?
    var errorMessage: String?
    var selectedDifficulty: Int? = nil // nil = mixed
    var selectedQuestionType: String = "smart" // "smart", "random", "wrong_only"
    var questionStats: [QuestionStatItem] = []
    var totalQuestions: Int = 0
    
    var currentQuestion: QuizQuestion? {
        guard currentQuestionIndex < questions.count else { return nil }
        return questions[currentQuestionIndex]
    }
    
    var progress: Double {
        guard !questions.isEmpty else { return 0 }
        return Double(currentQuestionIndex + 1) / Double(questions.count)
    }
    
    var totalScore: Int {
        quizResults.reduce(0) { $0 + $1.pointsEarned }
    }
    
    var totalCorrect: Int {
        quizResults.filter(\.isCorrect).count
    }
    
    var accuracy: Double {
        guard !questions.isEmpty else { return 0 }
        return Double(totalCorrect) / Double(questions.count) * 100
    }
    
    func loadQuestions(studentId: String? = nil) async {
        isLoading = true
        errorMessage = nil
        
        do {
            // Use smart learning algorithm by passing student_id
            questions = try await APIService.shared.getRandomQuizQuestions(count: 5, difficulty: selectedDifficulty, studentId: studentId, questionType: selectedQuestionType)
        } catch {
            errorMessage = "Failed to load quiz questions: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    func loadStudentStats(studentId: String) async {
        do {
            studentStats = try await APIService.shared.getStudentQuizScores(studentId: studentId)
        } catch {
            print("Failed to load student stats: \(error)")
        }
    }
    
    func loadQuestionStats() async {
        do {
            let stats = try await APIService.shared.getQuestionStats()
            questionStats = stats.difficulty_breakdown
            totalQuestions = stats.total_questions
        } catch {
            print("Failed to load question stats: \(error)")
            // Fallback to actual database values if API fails
            questionStats = [
                QuestionStatItem(difficulty_level: 1, difficulty_name: "Beginner", question_count: 5),
                QuestionStatItem(difficulty_level: 2, difficulty_name: "Intermediate", question_count: 8),
                QuestionStatItem(difficulty_level: 3, difficulty_name: "Advanced", question_count: 7)
            ]
            totalQuestions = 20
        }
    }
    
    func startQuiz() {
        quizStarted = true
        questionStartTime = Date()
    }
    
    func selectAnswer(_ answer: String) {
        selectedAnswer = answer
    }
    
    func submitAnswer(studentId: String, fullName: String) async {
        guard let currentQuestion = currentQuestion,
              let selectedAnswer = selectedAnswer else { return }
        
        isSubmitting = true
        
        let attemptTime = Int(Date().timeIntervalSince(questionStartTime))
        
        do {
            let result = try await APIService.shared.submitQuizAnswer(
                studentId: studentId,
                fullName: fullName,
                questionId: currentQuestion.id,
                selectedAnswer: selectedAnswer,
                attemptTimeSeconds: attemptTime
            )
            
            let quizResult = QuizResult(
                questionId: currentQuestion.id,
                selectedAnswer: selectedAnswer,
                correctAnswer: result.correct_answer,
                isCorrect: result.is_correct,
                pointsEarned: result.points_earned,
                explanation: result.explanation
            )
            
            quizResults.append(quizResult)
            
            // Move to next question or finish
            if currentQuestionIndex < questions.count - 1 {
                currentQuestionIndex += 1
                self.selectedAnswer = nil
                questionStartTime = Date()
            } else {
                completeQuiz()
            }
            
        } catch {
            errorMessage = "Failed to submit answer: \(error.localizedDescription)"
        }
        
        isSubmitting = false
    }
    
    func completeQuiz() {
        showResults = true
    }
    
    func resetQuiz() {
        currentQuestionIndex = 0
        selectedAnswer = nil
        quizResults = []
        quizStarted = false
        showResults = false
        showReview = false
        timeRemaining = 10 * 60
        questionStartTime = Date()
        errorMessage = nil
        questions = []
        // Keep the same difficulty setting when resetting
    }
    
    func formatTime(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let remainingSeconds = seconds % 60
        return String(format: "%02d:%02d", minutes, remainingSeconds)
    }
}

struct QuizResult {
    let questionId: Int
    let selectedAnswer: String
    let correctAnswer: String
    let isCorrect: Bool
    let pointsEarned: Int
    let explanation: String?
}

struct QuizView: View {
    @State private var viewModel = QuizViewModel()
    @State private var timer: Timer?
    @AppStorage("student_id") private var studentId: String = ""
    @AppStorage("student_name") private var studentName: String = ""
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemGroupedBackground)
                    .ignoresSafeArea()
                
                if viewModel.isLoading {
                    loadingView
                } else if let errorMessage = viewModel.errorMessage {
                    errorView(errorMessage)
                } else if !viewModel.quizStarted {
                    welcomeView
                } else if viewModel.showReview {
                    reviewView
                } else if viewModel.showResults {
                    resultsView
                } else {
                    quizView
                }
            }
            .navigationTitle("SwiftUI Quiz")
            .navigationBarTitleDisplayMode(.large)
        }
        .task {
            await viewModel.loadQuestions(studentId: studentId)
            await viewModel.loadStudentStats(studentId: studentId)
            await viewModel.loadQuestionStats()
        }
        .onAppear {
            startTimer()
        }
        .onDisappear {
            timer?.invalidate()
        }
    }
    
    private var loadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading quiz questions...")
                .font(.headline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private func errorView(_ message: String) -> some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 50))
                .foregroundColor(.red)
            
            Text("Quiz Error")
                .font(.title2)
                .fontWeight(.bold)
            
            Text(message)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
            
            Button("Try Again") {
                Task {
                    await viewModel.loadQuestions(studentId: studentId)
                }
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var welcomeView: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 16) {
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 60))
                        .foregroundStyle(.blue.gradient)
                    
                    Text("SwiftUI Knowledge Quiz")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .multilineTextAlignment(.center)
                    
                    Text("Test your SwiftUI knowledge with \(viewModel.questions.count) carefully crafted questions covering basics to advanced concepts.")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding()
                
                // Student Stats
                if let stats = viewModel.studentStats {
                    GroupBox("Your Quiz Statistics") {
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 16) {
                            StatCard(
                                title: "Total Points",
                                value: "\(stats.quiz_scores?.total_points ?? 0)",
                                color: .blue
                            )
                            StatCard(
                                title: "Correct Answers",
                                value: "\(stats.quiz_scores?.total_correct_answers ?? 0)",
                                color: .green
                            )
                            StatCard(
                                title: "Questions Attempted",
                                value: "\(stats.quiz_scores?.total_questions_attempted ?? 0)",
                                color: .orange
                            )
                            StatCard(
                                title: "Accuracy",
                                value: "\(Int(stats.quiz_scores?.accuracy_percentage ?? 0))%",
                                color: .purple
                            )
                        }
                        
                        // View All Questions Button
                        let questionsAttempted = stats.quiz_scores?.total_questions_attempted ?? 0
                        let allQuestionsAttempted = questionsAttempted >= viewModel.totalQuestions
                        
                        if allQuestionsAttempted {
                            NavigationLink(destination: QuestionOverviewView()) {
                                HStack {
                                    Image(systemName: "list.bullet.rectangle")
                                    Text("View All Questions & Results")
                                        .fontWeight(.medium)
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.purple)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                            }
                            .padding(.top, 8)
                        } else {
                            HStack {
                                Image(systemName: "list.bullet.rectangle")
                                Text("View All Questions & Results")
                                    .fontWeight(.medium)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.gray.opacity(0.3))
                            .foregroundColor(.gray)
                            .cornerRadius(12)
                            .padding(.top, 8)
                        }
                        
                        Text(allQuestionsAttempted 
                            ? "Review your performance on all quiz questions"
                            : "Attempt all \(viewModel.totalQuestions) questions to unlock this feature (\(questionsAttempted)/\(viewModel.totalQuestions) completed)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.top, 4)
                    }
                    .padding(.horizontal)
                }
                
                // Difficulty Selection
                GroupBox("Choose Difficulty Level") {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                        DifficultyCard(
                            title: "Mixed",
                            subtitle: "All levels",
                            detail: "\(viewModel.totalQuestions) questions",
                            color: .blue,
                            isSelected: viewModel.selectedDifficulty == nil
                        ) {
                            viewModel.selectedDifficulty = nil
                        }
                        
                        DifficultyCard(
                            title: "Beginner",
                            subtitle: "Level 1",
                            detail: "\(viewModel.questionStats.first(where: { $0.difficulty_level == 1 })?.question_count ?? 0) questions",
                            color: .green,
                            isSelected: viewModel.selectedDifficulty == 1
                        ) {
                            viewModel.selectedDifficulty = 1
                        }
                        
                        DifficultyCard(
                            title: "Intermediate",
                            subtitle: "Level 2",
                            detail: "\(viewModel.questionStats.first(where: { $0.difficulty_level == 2 })?.question_count ?? 0) questions",
                            color: .orange,
                            isSelected: viewModel.selectedDifficulty == 2
                        ) {
                            viewModel.selectedDifficulty = 2
                        }
                        
                        DifficultyCard(
                            title: "Advanced",
                            subtitle: "Level 3",
                            detail: "\(viewModel.questionStats.first(where: { $0.difficulty_level == 3 })?.question_count ?? 0) questions",
                            color: .red,
                            isSelected: viewModel.selectedDifficulty == 3
                        ) {
                            viewModel.selectedDifficulty = 3
                        }
                    }
                }
                .padding(.horizontal)
                
                // Question Type Selection
                GroupBox("Choose Question Type") {
                    VStack(spacing: 12) {
                        QuestionTypeCard(
                            title: "Smart Learning",
                            subtitle: "Adaptive algorithm",
                            detail: "60% wrong, 30% new, 10% review",
                            color: .purple,
                            isSelected: viewModel.selectedQuestionType == "smart"
                        ) {
                            viewModel.selectedQuestionType = "smart"
                        }
                        
                        QuestionTypeCard(
                            title: "Random",
                            subtitle: "All questions",
                            detail: "Pure random selection",
                            color: .blue,
                            isSelected: viewModel.selectedQuestionType == "random"
                        ) {
                            viewModel.selectedQuestionType = "random"
                        }
                        
                        QuestionTypeCard(
                            title: "Practice Mistakes",
                            subtitle: "Wrong answers only",
                            detail: "Focus on improvement",
                            color: .red,
                            isSelected: viewModel.selectedQuestionType == "wrong_only"
                        ) {
                            viewModel.selectedQuestionType = "wrong_only"
                        }
                    }
                }
                .padding(.horizontal)
                
                // Quiz Info
                GroupBox("Quiz Information") {
                    VStack(spacing: 12) {
                        HStack {
                            Label("\(viewModel.questions.count) Questions", systemImage: "questionmark.circle")
                            Spacer()
                            Text(getDifficultyText())
                                .foregroundColor(.secondary)
                        }
                        
                        HStack {
                            Label("10 Minutes", systemImage: "clock")
                            Spacer()
                            Text("Time limit")
                                .foregroundColor(.secondary)
                        }
                        
                        HStack {
                            Label("5 Points", systemImage: "star.fill")
                            Spacer()
                            Text("Per correct answer")
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding(.horizontal)
                
                if studentId.isEmpty {
                    VStack(spacing: 12) {
                        Text("Student ID Required")
                            .font(.headline)
                            .foregroundColor(.red)
                        
                        Text("Please set your student ID in Settings before taking the quiz.")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        
                        NavigationLink(destination: SettingsView()) {
                            HStack {
                                Image(systemName: "gear")
                                Text("Go to Settings")
                            }
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.large)
                    }
                    .padding()
                    .background(Color.red.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal)
                } else {
                    Button {
                        Task {
                            // Load questions with current settings before starting
                            await viewModel.loadQuestions(studentId: studentId)
                            viewModel.startQuiz()
                        }
                    } label: {
                        Text("Start Quiz")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .padding(.horizontal)
                }
            }
        }
    }
    
    private var quizView: some View {
        VStack(spacing: 0) {
            // Header
            VStack(spacing: 16) {
                HStack {
                    VStack(alignment: .leading) {
                        Text("Question \(viewModel.currentQuestionIndex + 1) of \(viewModel.questions.count)")
                            .font(.headline)
                        Text("SwiftUI Quiz")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing) {
                        Text(viewModel.formatTime(viewModel.timeRemaining))
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                        Text("Time Remaining")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                ProgressView(value: viewModel.progress)
                    .progressViewStyle(LinearProgressViewStyle(tint: .blue))
            }
            .padding()
            .background(Color(.systemBackground))
            
            Divider()
            
            // Question Content
            ScrollView {
                if let question = viewModel.currentQuestion {
                    VStack(alignment: .leading, spacing: 24) {
                        // Question
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Text("\(viewModel.currentQuestionIndex + 1)")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                    .frame(width: 32, height: 32)
                                    .background(Color.blue, in: Circle())
                                
                                VStack(alignment: .leading) {
                                    Text(question.question_text)
                                        .font(.headline)
                                    
                                    DifficultyBadge(level: question.difficulty_level)
                                }
                                
                                Spacer()
                            }
                        }
                        
                        // Answer Options
                        VStack(spacing: 12) {
                            ForEach(Array(question.options.enumerated()), id: \.offset) { index, option in
                                AnswerOption(
                                    letter: ["A", "B", "C", "D"][index],
                                    text: option,
                                    isSelected: viewModel.selectedAnswer == ["A", "B", "C", "D"][index]
                                ) {
                                    viewModel.selectAnswer(["A", "B", "C", "D"][index])
                                }
                            }
                        }
                    }
                    .padding()
                }
            }
            
            Divider()
            
            // Bottom Actions
            HStack {
                Text(viewModel.selectedAnswer != nil ? "Answer selected" : "Please select an answer")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Button {
                    Task {
                        await viewModel.submitAnswer(studentId: studentId, fullName: studentName.isEmpty ? "Unknown Student" : studentName)
                    }
                } label: {
                    HStack {
                        if viewModel.isSubmitting {
                            ProgressView()
                                .scaleEffect(0.8)
                        }
                        Text(viewModel.currentQuestionIndex == viewModel.questions.count - 1 ? "Complete Quiz" : "Next Question")
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.selectedAnswer == nil || viewModel.isSubmitting || studentId.isEmpty)
            }
            .padding()
            .background(Color(.systemBackground))
        }
    }
    
    private var resultsView: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Results Header
                VStack(spacing: 16) {
                    Image(systemName: "trophy.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.yellow)
                    
                    Text("Quiz Completed!")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Great job! Here are your results:")
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                
                // Score Display
                GroupBox {
                    VStack(spacing: 16) {
                        Text("\(Int(viewModel.accuracy))%")
                            .font(.system(size: 48, weight: .bold))
                            .foregroundColor(.blue)
                        
                        Text("Accuracy Score")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        
                        HStack(spacing: 40) {
                            VStack {
                                Text("\(viewModel.totalCorrect)")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.green)
                                Text("Correct")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            VStack {
                                Text("\(viewModel.questions.count - viewModel.totalCorrect)")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.red)
                                Text("Incorrect")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            VStack {
                                Text("\(viewModel.totalScore)")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                                Text("Points Earned")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding()
                }
                .padding(.horizontal)
                
                // Action Buttons
                VStack(spacing: 12) {
                    Button("Review Answers") {
                        viewModel.showReview = true
                        viewModel.showResults = false
                    }
                    .buttonStyle(.borderedProminent)
                    .frame(maxWidth: .infinity)
                    
                    // Check if all questions have been attempted
                    let questionsAttempted = viewModel.studentStats?.quiz_scores?.total_questions_attempted ?? 0
                    let allQuestionsAttempted = questionsAttempted >= viewModel.totalQuestions
                    
                    if allQuestionsAttempted {
                        NavigationLink(destination: QuestionOverviewView()) {
                            Text("View All Questions")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .foregroundColor(.purple)
                    } else {
                        VStack(spacing: 4) {
                            Text("View All Questions")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.gray.opacity(0.1))
                                .foregroundColor(.gray)
                                .cornerRadius(8)
                            
                            Text("Attempt all \(viewModel.totalQuestions) questions to unlock (\(questionsAttempted)/\(viewModel.totalQuestions))")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                    }
                    
                    Button("Take Another Quiz") {
                        viewModel.resetQuiz()
                        Task {
                            await viewModel.loadQuestions(studentId: studentId)
                        }
                    }
                    .buttonStyle(.bordered)
                    .frame(maxWidth: .infinity)
                }
                .padding(.horizontal)
            }
        }
        .navigationBarBackButtonHidden()
    }
    
    private var reviewView: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Review Header
                    VStack(spacing: 12) {
                        HStack {
                            Button("← Back to Results") {
                                viewModel.showReview = false
                                viewModel.showResults = true
                            }
                            .foregroundColor(.blue)
                            
                            Spacer()
                        }
                        .padding(.horizontal)
                        
                        Text("Quiz Review")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Text("Review all questions, your answers, and explanations")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        
                        // Summary Stats
                        HStack(spacing: 40) {
                            VStack {
                                Text("\(viewModel.totalCorrect)")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.green)
                                Text("Correct")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            VStack {
                                Text("\(viewModel.questions.count - viewModel.totalCorrect)")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.red)
                                Text("Incorrect")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            VStack {
                                Text("\(Int(viewModel.accuracy))%")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(.blue)
                                Text("Accuracy")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding()
                        .background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 12))
                    }
                    .padding(.horizontal)
                    
                    // Questions Review
                    ForEach(Array(viewModel.questions.enumerated()), id: \.element.id) { questionIndex, question in
                        let result = viewModel.quizResults[questionIndex]
                        
                        VStack(alignment: .leading, spacing: 16) {
                            // Question Header
                            HStack(alignment: .top, spacing: 12) {
                                // Correct/Incorrect Icon
                                Image(systemName: result.isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill")
                                    .foregroundColor(result.isCorrect ? .green : .red)
                                    .font(.title2)
                                
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Text("Question \(questionIndex + 1)")
                                            .font(.headline)
                                            .fontWeight(.bold)
                                        
                                        Spacer()
                                        
                                        DifficultyBadge(level: question.difficulty_level)
                                    }
                                    
                                    Text(question.question_text)
                                        .font(.body)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                            
                            // Answer Options
                            VStack(spacing: 8) {
                                ForEach(Array(question.options.enumerated()), id: \.offset) { optionIndex, option in
                                    let optionLetter = ["A", "B", "C", "D"][optionIndex]
                                    let isCorrect = optionLetter == result.correctAnswer
                                    let isSelected = optionLetter == result.selectedAnswer
                                    
                                    HStack(spacing: 12) {
                                        // Option Letter Circle
                                        optionLetterCircle(letter: optionLetter, isCorrect: isCorrect, isSelected: isSelected)
                                        
                                        Text(option)
                                            .font(.body)
                                            .foregroundColor(.primary)
                                            .fixedSize(horizontal: false, vertical: true)
                                        
                                        Spacer()
                                        
                                        if isCorrect {
                                            Image(systemName: "checkmark")
                                                .foregroundColor(.green)
                                                .font(.headline)
                                        } else if isSelected {
                                            Image(systemName: "xmark")
                                                .foregroundColor(.red)
                                                .font(.headline)
                                        }
                                    }
                                    .padding(12)
                                    .background(optionBackground(isCorrect: isCorrect, isSelected: isSelected))
                                }
                            }
                            
                            // Explanation
                            if let explanation = result.explanation {
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Image(systemName: "lightbulb.fill")
                                            .foregroundColor(.blue)
                                        Text("Explanation")
                                            .font(.headline)
                                            .fontWeight(.medium)
                                            .foregroundColor(.blue)
                                    }
                                    
                                    Text(explanation)
                                        .font(.body)
                                        .foregroundColor(.secondary)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .padding()
                                .background(Color.blue.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
                            }
                        }
                        .padding()
                        .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 12))
                        .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
                        .padding(.horizontal)
                    }
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Review")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
    
    private func getDifficultyText() -> String {
        let difficultyText: String
        switch viewModel.selectedDifficulty {
        case nil:
            difficultyText = "Mixed difficulty levels"
        case 1:
            difficultyText = "Beginner level"
        case 2:
            difficultyText = "Intermediate level"
        case 3:
            difficultyText = "Advanced level"
        default:
            difficultyText = "Mixed difficulty levels"
        }
        
        let typeText: String
        switch viewModel.selectedQuestionType {
        case "smart":
            typeText = "Smart learning"
        case "random":
            typeText = "Random questions"
        case "wrong_only":
            typeText = "Practice mistakes"
        default:
            typeText = "Smart learning"
        }
        
        return "\(difficultyText) • \(typeText)"
    }
    
    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            if viewModel.quizStarted && !viewModel.showResults && viewModel.timeRemaining > 0 {
                viewModel.timeRemaining -= 1
                if viewModel.timeRemaining <= 0 {
                    viewModel.completeQuiz()
                }
            }
        }
    }
    
    // MARK: - Helper Functions for Complex Views
    
    private func optionLetterCircle(letter: String, isCorrect: Bool, isSelected: Bool) -> some View {
        Text(letter)
            .font(.headline)
            .fontWeight(.bold)
            .foregroundColor(isCorrect ? .white : isSelected ? .white : .secondary)
            .frame(width: 28, height: 28)
            .background(
                Circle()
                    .fill(isCorrect ? Color.green : isSelected ? Color.red : Color.gray.opacity(0.2))
            )
    }
    
    private func optionBackground(isCorrect: Bool, isSelected: Bool) -> some View {
        let fillColor = isCorrect ? Color.green.opacity(0.1) : isSelected ? Color.red.opacity(0.1) : Color.clear
        let strokeColor = isCorrect ? Color.green : isSelected ? Color.red : Color.gray.opacity(0.3)
        let lineWidth: CGFloat = isCorrect || isSelected ? 2 : 1
        
        return RoundedRectangle(cornerRadius: 8)
            .fill(fillColor)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(strokeColor, lineWidth: lineWidth)
            )
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
    }
}

struct DifficultyBadge: View {
    let level: Int
    
    var body: some View {
        Text(difficultyText)
            .font(.caption)
            .fontWeight(.medium)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor, in: Capsule())
            .foregroundColor(textColor)
    }
    
    private var difficultyText: String {
        switch level {
        case 1: return "Beginner"
        case 2: return "Intermediate"
        case 3: return "Advanced"
        default: return "Unknown"
        }
    }
    
    private var backgroundColor: Color {
        switch level {
        case 1: return .green.opacity(0.2)
        case 2: return .orange.opacity(0.2)
        case 3: return .red.opacity(0.2)
        default: return .gray.opacity(0.2)
        }
    }
    
    private var textColor: Color {
        switch level {
        case 1: return .green
        case 2: return .orange
        case 3: return .red
        default: return .gray
        }
    }
}

struct AnswerOption: View {
    let letter: String
    let text: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                // Radio button
                Circle()
                    .stroke(isSelected ? Color.blue : Color.gray, lineWidth: 2)
                    .frame(width: 20, height: 20)
                    .overlay(
                        Circle()
                            .fill(Color.blue)
                            .frame(width: 8, height: 8)
                            .opacity(isSelected ? 1 : 0)
                    )
                
                // Option letter
                Text(letter)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(isSelected ? .white : .secondary)
                    .frame(width: 24, height: 24)
                    .background(
                        Circle()
                            .fill(isSelected ? Color.blue : Color.gray.opacity(0.2))
                    )
                
                // Option text
                Text(text)
                    .font(.body)
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.leading)
                
                Spacer()
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.blue : Color.gray.opacity(0.3), lineWidth: isSelected ? 2 : 1)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(isSelected ? Color.blue.opacity(0.1) : Color(.systemBackground))
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct DifficultyCard: View {
    let title: String
    let subtitle: String
    let detail: String
    let color: Color
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Text(title)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(isSelected ? .white : color)
                
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(isSelected ? .white.opacity(0.9) : .secondary)
                
                Text(detail)
                    .font(.caption2)
                    .foregroundColor(isSelected ? .white.opacity(0.7) : .secondary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? color : color.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(color, lineWidth: isSelected ? 2 : 1)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct QuestionTypeCard: View {
    let title: String
    let subtitle: String
    let detail: String
    let color: Color
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                // Icon circle
                Circle()
                    .fill(isSelected ? color : color.opacity(0.2))
                    .frame(width: 12, height: 12)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .fontWeight(.medium)
                        .foregroundColor(isSelected ? color : .primary)
                    
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Text(detail)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(color)
                        .font(.title2)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? color.opacity(0.1) : Color(.systemGray6))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(isSelected ? color : Color.clear, lineWidth: 2)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    QuizView()
}