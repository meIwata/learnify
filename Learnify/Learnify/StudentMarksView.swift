//
//  StudentMarksView.swift
//  Learnify
//
//  Created by Claude on 2025/7/11.
//

import SwiftUI

struct StudentMarksView: View {
    let student: Student
    let checkIns: [StudentCheckIn]
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Header with student info
                    VStack(spacing: 16) {
                        ZStack {
                            Circle()
                                .fill(LinearGradient(
                                    gradient: Gradient(colors: [.blue, .purple]),
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ))
                                .frame(width: 80, height: 80)
                            
                            Text(getInitials(from: student.full_name))
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        }
                        
                        VStack(spacing: 4) {
                            Text(student.full_name)
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.primary)
                            
                            Text(student.student_id)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.top)
                    
                    // Total Score Card
                    VStack(spacing: 16) {
                        HStack {
                            Text("Total Score")
                                .font(.headline)
                                .fontWeight(.semibold)
                            
                            Spacer()
                            
                            Text("\(checkIns.isEmpty ? 0 : 10)/50")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.blue)
                        }
                        
                        // Progress Bar
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Progress")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Spacer()
                                Text("\(checkIns.isEmpty ? 0 : 20)%")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            ProgressView(value: checkIns.isEmpty ? 0 : 0.2)
                                .progressViewStyle(LinearProgressViewStyle(tint: .blue))
                                .scaleEffect(x: 1, y: 1.5, anchor: .center)
                        }
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemGroupedBackground))
                    .cornerRadius(12)
                    
                    // Individual Exercise Marks
                    VStack(spacing: 16) {
                        HStack {
                            Text("Exercise Breakdown")
                                .font(.headline)
                                .fontWeight(.semibold)
                            Spacer()
                        }
                        
                        VStack(spacing: 12) {
                            // Check-in Marks
                            ExerciseRowView(
                                title: "Check-in",
                                subtitle: checkIns.isEmpty ? "Not started" : "Completed",
                                icon: "checkmark",
                                iconColor: checkIns.isEmpty ? .gray : .green,
                                backgroundColor: checkIns.isEmpty ? Color.gray.opacity(0.2) : Color.green.opacity(0.2),
                                score: checkIns.isEmpty ? 0 : 10,
                                maxScore: 10,
                                isCompleted: !checkIns.isEmpty
                            )
                            
                            // App Review Marks
                            ExerciseRowView(
                                title: "App Review",
                                subtitle: "Not submitted",
                                icon: "iphone",
                                iconColor: .gray,
                                backgroundColor: Color.gray.opacity(0.2),
                                score: 0,
                                maxScore: 10,
                                isCompleted: false
                            )
                            
                            // Profile Picture Marks
                            ExerciseRowView(
                                title: "Profile Picture",
                                subtitle: "Not submitted",
                                icon: "person.crop.circle",
                                iconColor: .gray,
                                backgroundColor: Color.gray.opacity(0.2),
                                score: 0,
                                maxScore: 10,
                                isCompleted: false
                            )
                            
                            // GitHub Repository Marks
                            ExerciseRowView(
                                title: "GitHub Repository",
                                subtitle: "Not submitted",
                                icon: "chevron.left.forwardslash.chevron.right",
                                iconColor: .gray,
                                backgroundColor: Color.gray.opacity(0.2),
                                score: 0,
                                maxScore: 10,
                                isCompleted: false
                            )
                            
                            // GitHub Organization Marks
                            ExerciseRowView(
                                title: "GitHub Organization",
                                subtitle: "Not submitted",
                                icon: "person.3",
                                iconColor: .gray,
                                backgroundColor: Color.gray.opacity(0.2),
                                score: 0,
                                maxScore: 10,
                                isCompleted: false
                            )
                        }
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemGroupedBackground))
                    .cornerRadius(12)
                    
                    Spacer(minLength: 32)
                }
                .padding()
            }
            .background(Color(UIColor.systemGroupedBackground))
            .navigationTitle("Student Marks")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func getInitials(from name: String) -> String {
        let words = name.split(separator: " ")
        let initials = words.prefix(2).compactMap { $0.first }.map { String($0) }
        return initials.joined().uppercased()
    }
}

struct ExerciseRowView: View {
    let title: String
    let subtitle: String
    let icon: String
    let iconColor: Color
    let backgroundColor: Color
    let score: Int
    let maxScore: Int
    let isCompleted: Bool
    
    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(backgroundColor)
                    .frame(width: 40, height: 40)
                
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(iconColor)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(score)/\(maxScore)")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(isCompleted ? .green : .gray)
                
                if isCompleted {
                    Text("✓")
                        .font(.caption)
                        .foregroundColor(.green)
                } else {
                    Text("—")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(8)
    }
}

#Preview {
    StudentMarksView(
        student: Student(
            id: "1",
            student_id: "STUDENT2025",
            full_name: "John Doe",
            created_at: "2025-07-01T00:14:59.61+00:00"
        ),
        checkIns: [
            StudentCheckIn(id: 1, created_at: "2025-07-01T00:14:59.61+00:00"),
            StudentCheckIn(id: 2, created_at: "2025-07-02T00:14:59.61+00:00")
        ]
    )
}