//
//  LoginView.swift
//  Learnify
//
//  Created by Claude on 2025/8/14.
//

import SwiftUI

struct LoginView: View {
    @Environment(AuthenticationService.self) var authService
    @State private var studentId: String = ""
    @FocusState private var isStudentIdFocused: Bool
    
    private var isFormValid: Bool {
        !studentId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        studentId.trimmingCharacters(in: .whitespacesAndNewlines).count >= 3
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 32) {
                    Spacer()
                    
                    // Header Section
                    VStack(spacing: 16) {
                        // App Icon
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(
                                        colors: [.blue, .purple],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 80, height: 80)
                            
                            Image(systemName: "graduationcap.fill")
                                .font(.system(size: 36))
                                .foregroundStyle(.white)
                        }
                        
                        Text("Learnify")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundStyle(.primary)
                        
                        Text("Enter your Student ID to continue")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    
                    // Login Form
                    VStack(spacing: 24) {
                        // Student ID Field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Student ID")
                                .font(.headline)
                                .foregroundStyle(.primary)
                            
                            TextField("Enter your student ID (e.g., STUDENT2025)", text: $studentId)
                                .textFieldStyle(.roundedBorder)
                                .font(.body)
                                .focused($isStudentIdFocused)
                                #if os(iOS)
                                .autocapitalization(.allCharacters)
                                .disableAutocorrection(true)
                                .submitLabel(.done)
                                #endif
                                .onSubmit {
                                    if isFormValid {
                                        Task {
                                            await authService.login(studentId: studentId)
                                        }
                                    }
                                }
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(
                                            authService.loginError != nil ? Color.red : Color.clear,
                                            lineWidth: 1
                                        )
                                )
                        }
                        
                        // Error Message
                        if let error = authService.loginError {
                            VStack(spacing: 8) {
                                HStack {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .foregroundStyle(.red)
                                        .font(.caption)
                                    
                                    Text(error)
                                        .font(.caption)
                                        .foregroundStyle(.red)
                                        .multilineTextAlignment(.leading)
                                    
                                    Spacer()
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(Color.red.opacity(0.1))
                                .cornerRadius(8)
                            }
                        }
                        
                        // Validation Hint
                        if !studentId.isEmpty && studentId.trimmingCharacters(in: .whitespacesAndNewlines).count < 3 {
                            HStack {
                                Image(systemName: "info.circle")
                                    .foregroundStyle(.orange)
                                    .font(.caption)
                                
                                Text("Student ID must be at least 3 characters long")
                                    .font(.caption)
                                    .foregroundStyle(.orange)
                                
                                Spacer()
                            }
                        }
                        
                        // Sign In Button
                        Button(action: {
                            isStudentIdFocused = false // Dismiss keyboard
                            Task {
                                await authService.login(studentId: studentId)
                            }
                        }) {
                            HStack(spacing: 12) {
                                if authService.isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .scaleEffect(0.8)
                                } else {
                                    Image(systemName: "person.badge.key.fill")
                                        .font(.title3)
                                }
                                
                                Text(authService.isLoading ? "Validating..." : "Sign In")
                                    .font(.headline)
                                    .fontWeight(.semibold)
                            }
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(
                                LinearGradient(
                                    colors: isFormValid ? [.blue, .purple] : [.gray, .gray],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(12)
                            .shadow(color: isFormValid ? .blue.opacity(0.3) : .clear, radius: 8, x: 0, y: 4)
                        }
                        .disabled(!isFormValid || authService.isLoading)
                        .animation(.easeInOut(duration: 0.2), value: isFormValid)
                    }
                    .padding(.horizontal, 24)
                    
                    // Help Text
                    VStack(spacing: 8) {
                        if authService.loginError != nil {
                            HStack {
                                Image(systemName: "person.fill.xmark")
                                    .foregroundStyle(.red)
                                    .font(.caption)
                                
                                Text("Student ID not found? Contact your instructor to get registered.")
                                    .font(.caption)
                                    .foregroundStyle(.red)
                                    .multilineTextAlignment(.center)
                            }
                        } else {
                            HStack {
                                Image(systemName: "questionmark.circle")
                                    .foregroundStyle(.secondary)
                                    .font(.caption)
                                
                                Text("Don't have a Student ID? Contact your instructor.")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .multilineTextAlignment(.center)
                            }
                        }
                    }
                    .padding(.horizontal, 24)
                    
                    // Features Preview
                    VStack(spacing: 16) {
                        Text("What you can do:")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .fontWeight(.medium)
                        
                        HStack(spacing: 24) {
                            FeatureItem(icon: "checkmark.circle", title: "Check-ins", color: .blue)
                            FeatureItem(icon: "star.fill", title: "Reviews", color: .purple)
                            FeatureItem(icon: "trophy.fill", title: "Leaderboard", color: .green)
                        }
                    }
                    .padding(.horizontal, 24)
                    
                    Spacer()
                }
            }
            .background(Color(.systemGroupedBackground))
            .onTapGesture {
                isStudentIdFocused = false // Dismiss keyboard when tapping outside
            }
        }
    }
}

struct FeatureItem: View {
    let icon: String
    let title: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Circle()
                .fill(color.opacity(0.2))
                .frame(width: 32, height: 32)
                .overlay(
                    Image(systemName: icon)
                        .font(.caption)
                        .foregroundStyle(color)
                )
            
            Text(title)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }
}

#Preview {
    LoginView()
        .environment(AuthenticationService())
}
