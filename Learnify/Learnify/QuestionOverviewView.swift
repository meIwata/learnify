//
//  QuestionOverviewView.swift
//  Learnify
//
//  Created by Claude on 2025/8/3.
//

import SwiftUI

@Observable
class QuestionOverviewViewModel {
    var questionsData: AllQuestionsData?
    var isLoading = false
    var errorMessage: String?
    var selectedDifficulty: Int? = nil // nil = all
    
    var filteredQuestions: [QuestionWithAttempts] {
        guard let questions = questionsData?.questions else { return [] }
        
        if let difficulty = selectedDifficulty {
            return questions.filter { $0.difficulty_level == difficulty }
        }
        return questions
    }
    
    func loadQuestionData(studentId: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            questionsData = try await APIService.shared.getAllQuestionsWithAttempts(studentId: studentId)
        } catch {
            errorMessage = "Failed to load question data: \(error.localizedDescription)"
        }
        
        isLoading = false
    }
    
    func getStatusColor(status: String) -> Color {
        switch status {
        case "mastered": return .green
        case "needs_practice": return .orange
        case "never_attempted": return .gray
        default: return .gray
        }
    }
    
    func getStatusText(status: String) -> String {
        switch status {
        case "mastered": return "Mastered"
        case "needs_practice": return "Needs Practice"
        case "never_attempted": return "Not Attempted"
        default: return "Unknown"
        }
    }
    
    func getDifficultyColor(level: Int) -> Color {
        switch level {
        case 1: return .green
        case 2: return .orange
        case 3: return .red
        default: return .gray
        }
    }
    
    func getDifficultyText(level: Int) -> String {
        switch level {
        case 1: return "Beginner"
        case 2: return "Intermediate"
        case 3: return "Advanced"
        default: return "Unknown"
        }
    }
}

struct QuestionOverviewView: View {
    @State private var viewModel = QuestionOverviewViewModel()
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
                } else {
                    contentView
                }
            }
            .navigationTitle("Question Overview")
            .navigationBarTitleDisplayMode(.large)
        }
        .task {
            await viewModel.loadQuestionData(studentId: studentId)
        }
    }
    
    private var loadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading question overview...")
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
            
            Text("Error")
                .font(.title2)
                .fontWeight(.bold)
            
            Text(message)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
            
            Button("Try Again") {
                Task {
                    await viewModel.loadQuestionData(studentId: studentId)
                }
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var contentView: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Summary Statistics
                if let summary = viewModel.questionsData?.summary {
                    summaryView(summary)
                }
                
                // Difficulty Filter
                difficultyFilterView
                
                // Questions List
                questionsListView
            }
        }
    }
    
    private func summaryView(_ summary: QuestionsSummary) -> some View {
        GroupBox("Progress Summary") {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 16) {
                StatCard(
                    title: "Total Questions",
                    value: "\(summary.total_questions)",
                    color: .blue
                )
                StatCard(
                    title: "Mastered",
                    value: "\(summary.mastered_questions)",
                    color: .green
                )
                StatCard(
                    title: "Need Practice",
                    value: "\(summary.attempted_questions - summary.mastered_questions)",
                    color: .orange
                )
                StatCard(
                    title: "Not Attempted",
                    value: "\(summary.never_attempted)",
                    color: .gray
                )
                StatCard(
                    title: "Overall Accuracy",
                    value: "\(summary.overall_accuracy)%",
                    color: .purple
                )
            }
        }
        .padding(.horizontal)
    }
    
    private var difficultyFilterView: some View {
        GroupBox("Filter by Difficulty") {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 12) {
                FilterCard(
                    title: "All",
                    count: viewModel.questionsData?.questions.count ?? 0,
                    color: .blue,
                    isSelected: viewModel.selectedDifficulty == nil
                ) {
                    viewModel.selectedDifficulty = nil
                }
                
                FilterCard(
                    title: "Beginner",
                    count: viewModel.questionsData?.questions.filter { $0.difficulty_level == 1 }.count ?? 0,
                    color: .green,
                    isSelected: viewModel.selectedDifficulty == 1
                ) {
                    viewModel.selectedDifficulty = 1
                }
                
                FilterCard(
                    title: "Intermediate",
                    count: viewModel.questionsData?.questions.filter { $0.difficulty_level == 2 }.count ?? 0,
                    color: .orange,
                    isSelected: viewModel.selectedDifficulty == 2
                ) {
                    viewModel.selectedDifficulty = 2
                }
                
                FilterCard(
                    title: "Advanced",
                    count: viewModel.questionsData?.questions.filter { $0.difficulty_level == 3 }.count ?? 0,
                    color: .red,
                    isSelected: viewModel.selectedDifficulty == 3
                ) {
                    viewModel.selectedDifficulty = 3
                }
            }
        }
        .padding(.horizontal)
    }
    
    private var questionsListView: some View {
        VStack(spacing: 16) {
            ForEach(Array(viewModel.filteredQuestions.enumerated()), id: \.element.id) { index, question in
                questionCard(question: question, index: index + 1)
            }
            
            if viewModel.filteredQuestions.isEmpty && viewModel.questionsData != nil {
                VStack(spacing: 16) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 50))
                        .foregroundColor(.gray)
                    
                    Text("No Questions Found")
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text("No questions match the selected difficulty filter.")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal)
            }
        }
    }
    
    private func questionCard(question: QuestionWithAttempts, index: Int) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            // Question Header
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        Text("Question \(index)")
                            .font(.headline)
                            .fontWeight(.bold)
                        
                        DifficultyBadge(level: question.difficulty_level)
                        
                        StatusBadge(status: question.attempt_summary.status)
                    }
                    
                    Text(question.question_text)
                        .font(.body)
                        .fixedSize(horizontal: false, vertical: true)
                }
                
                Spacer()
                
                // Performance Summary
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Performance")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.secondary)
                    
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("Attempts: \(question.attempt_summary.total_attempts)")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        
                        Text("Correct: \(question.attempt_summary.correct_attempts)")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        
                        Text("Accuracy: \(question.attempt_summary.accuracy_percentage)%")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                        
                        Text("Points: \(question.attempt_summary.total_points)")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(8)
                .background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 8))
            }
            
            // Answer Options
            VStack(spacing: 8) {
                ForEach(Array(question.options.enumerated()), id: \.offset) { optionIndex, option in
                    let optionLetter = ["A", "B", "C", "D"][optionIndex]
                    let isCorrect = optionLetter == question.correct_answer
                    let isLastSelected = optionLetter == question.attempt_summary.latest_attempt?.selected_answer
                    
                    HStack(spacing: 12) {
                        // Option Letter Circle
                        Text(optionLetter)
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(isCorrect ? .white : isLastSelected ? .white : .secondary)
                            .frame(width: 28, height: 28)
                            .background(
                                Circle()
                                    .fill(isCorrect ? Color.green : isLastSelected ? Color.red : Color.gray.opacity(0.2))
                            )
                        
                        Text(option)
                            .font(.body)
                            .foregroundColor(.primary)
                            .fixedSize(horizontal: false, vertical: true)
                        
                        Spacer()
                        
                        if isCorrect {
                            Image(systemName: "checkmark")
                                .foregroundColor(.green)
                                .font(.headline)
                        } else if isLastSelected {
                            Image(systemName: "xmark")
                                .foregroundColor(.red)
                                .font(.headline)
                        }
                    }
                    .padding(12)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(isCorrect ? Color.green.opacity(0.1) : isLastSelected ? Color.red.opacity(0.1) : Color.clear)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(isCorrect ? Color.green : isLastSelected ? Color.red : Color.gray.opacity(0.3), lineWidth: isCorrect || isLastSelected ? 2 : 1)
                            )
                    )
                }
            }
            
            // Explanation
            if let explanation = question.explanation {
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
            
            // Last Attempt Info
            if let latestAttempt = question.attempt_summary.latest_attempt {
                HStack {
                    Text("Last attempted:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text(formatDate(latestAttempt.created_at))
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("•")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text(latestAttempt.is_correct ? "Correct" : "Incorrect")
                        .font(.caption)
                        .foregroundColor(latestAttempt.is_correct ? .green : .red)
                    
                    Text("•")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("Points: \(latestAttempt.points_earned)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
        .padding(.horizontal)
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .short
            displayFormatter.timeStyle = .none
            return displayFormatter.string(from: date)
        }
        return dateString
    }
}

struct StatusBadge: View {
    let status: String
    
    var body: some View {
        Text(statusText)
            .font(.caption)
            .fontWeight(.medium)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(backgroundColor, in: Capsule())
            .foregroundColor(textColor)
    }
    
    private var statusText: String {
        switch status {
        case "mastered": return "Mastered"
        case "needs_practice": return "Needs Practice"
        case "never_attempted": return "Not Attempted"
        default: return "Unknown"
        }
    }
    
    private var backgroundColor: Color {
        switch status {
        case "mastered": return .green.opacity(0.2)
        case "needs_practice": return .orange.opacity(0.2)
        case "never_attempted": return .gray.opacity(0.2)
        default: return .gray.opacity(0.2)
        }
    }
    
    private var textColor: Color {
        switch status {
        case "mastered": return .green
        case "needs_practice": return .orange
        case "never_attempted": return .gray
        default: return .gray
        }
    }
}

struct FilterCard: View {
    let title: String
    let count: Int
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
                
                Text("\(count) questions")
                    .font(.caption)
                    .foregroundColor(isSelected ? .white.opacity(0.9) : .secondary)
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

#Preview {
    QuestionOverviewView()
}