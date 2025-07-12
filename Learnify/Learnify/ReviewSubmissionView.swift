//
//  ReflectionSubmissionView.swift
//  Learnify
//
//  Created by Claude on 2025/7/1.
//

import SwiftUI

struct ReviewSubmissionView: View {
    @AppStorage("student_id") private var storedStudentId: String = ""
    @AppStorage("student_name") private var storedStudentName: String = ""
    @State private var mobileAppName: String = ""
    @State private var reviewText: String = ""
    @State private var isSubmitting: Bool = false
    @State private var showingAlert: Bool = false
    @State private var alertTitle: String = ""
    @State private var alertMessage: String = ""
    @State private var showingSuccess: Bool = false
    @State private var lastSubmissionResponse: ReviewResponse?
    
    private var hasStoredData: Bool {
        !storedStudentId.isEmpty && !storedStudentName.isEmpty
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 30) {
                // Header
                VStack(spacing: 15) {
                    Image(systemName: "bubble.left.and.bubble.right.fill")
                        .font(.system(size: 60))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.blue, .purple],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    
                    Text("App Review")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    Text("Share your thoughts about a mobile app you've been using")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                .padding(.top, 20)
                
                // Form
                VStack(spacing: 25) {
                    // Student Info Display (if available)
                    if hasStoredData {
                        VStack(spacing: 15) {
                            HStack {
                                Text("Student ID:")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                Spacer()
                                Text(storedStudentId)
                                    .font(.body)
                                    .foregroundColor(.secondary)
                                    .padding(.vertical, 8)
                                    .padding(.horizontal, 12)
                                    .background(Color.gray.opacity(0.1))
                                    .cornerRadius(8)
                            }
                            
                            HStack {
                                Text("Student Name:")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                Spacer()
                                Text(storedStudentName)
                                    .font(.body)
                                    .foregroundColor(.secondary)
                                    .padding(.vertical, 8)
                                    .padding(.horizontal, 12)
                                    .background(Color.gray.opacity(0.1))
                                    .cornerRadius(8)
                            }
                        }
                    } else {
                        // Show message to check in first
                        VStack(spacing: 12) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.system(size: 40))
                                .foregroundColor(.orange)
                            
                            Text("Please check in first")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            Text("You need to complete your first check-in to submit a review. Please go to the Check In tab first.")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        .padding()
                        .background(Color.orange.opacity(0.1))
                        .cornerRadius(12)
                    }
                    
                    // Only show form fields if user has checked in
                    if hasStoredData {
                        // Mobile App Name Field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Mobile App Name")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            TextField("Enter app name (e.g., Instagram, TikTok)", text: $mobileAppName)
                                .textFieldStyle(.roundedBorder)
                                .font(.body)
                                #if os(iOS)
                                .autocapitalization(.words)
                                .disableAutocorrection(false)
                                .submitLabel(.next)
                                #endif
                        }
                        
                        // Review Text Field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Your Review")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                TextEditor(text: $reviewText)
                                    .font(.body)
                                    .frame(minHeight: 120)
                                    .padding(8)
                                    .background(Color(UIColor.systemGray6))
                                    .cornerRadius(8)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(Color(UIColor.systemGray4), lineWidth: 1)
                                    )
                                
                                if reviewText.isEmpty {
                                    Text("Share your thoughts about this app. What do you like? What could be improved?")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                        .padding(.leading, 4)
                                }
                                
                                Text("\(reviewText.count)/1000 characters")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .padding(.leading, 4)
                            }
                        }
                    }
                }
                .padding(.horizontal, 20)
                
                // Submit Button (only show if user has checked in)
                if hasStoredData {
                    Button(action: {
                        Task {
                            await performSubmission()
                        }
                    }) {
                        HStack(spacing: 12) {
                            if isSubmitting {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.9)
                            } else {
                                Image(systemName: "paperplane.fill")
                                    .font(.title2)
                            }
                            
                            Text(isSubmitting ? "Submitting..." : "Submit Review")
                                .font(.headline)
                                .fontWeight(.semibold)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 55)
                        .background(
                            LinearGradient(
                                colors: isFormValid ? [.blue, .purple] : [.gray, .gray],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .cornerRadius(16)
                        .shadow(color: isFormValid ? .blue.opacity(0.3) : .clear, radius: 8, x: 0, y: 4)
                    }
                    .disabled(!isFormValid || isSubmitting)
                    .padding(.horizontal, 20)
                    .animation(.easeInOut(duration: 0.2), value: isFormValid)
                }
                
                // Success Message
                if showingSuccess, let response = lastSubmissionResponse {
                    VStack(spacing: 12) {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                                .font(.title2)
                            
                            Text("Review Submitted!")
                                .font(.headline)
                                .foregroundColor(.green)
                        }
                        
                        VStack(spacing: 4) {
                            Text("🎉 Thank you for sharing your thoughts!")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.primary)
                            
                            Text("App: \(response.data.mobile_app_name)")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        
                        Text(response.message)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(12)
                    .padding(.horizontal, 20)
                    .transition(.scale.combined(with: .opacity))
                }
                
                Spacer(minLength: 50)
            }
        }
        .navigationTitle("App Review")
        .navigationBarTitleDisplayMode(.inline)
        .alert(alertTitle, isPresented: $showingAlert) {
            Button("OK") { }
        } message: {
            Text(alertMessage)
        }
        .onTapGesture {
            hideKeyboard()
        }
    }
    
    private var isFormValid: Bool {
        hasStoredData &&
        !mobileAppName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !reviewText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    private func performSubmission() async {
        guard isFormValid else { return }
        
        hideKeyboard()
        
        isSubmitting = true
        showingSuccess = false
        
        do {
            let response = try await APIService.shared.submitReview(
                studentId: storedStudentId,
                mobileAppName: mobileAppName.trimmingCharacters(in: .whitespacesAndNewlines),
                reviewText: reviewText.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            
            await MainActor.run {
                withAnimation(.spring()) {
                    self.lastSubmissionResponse = response
                    self.showingSuccess = true
                }
                
                if response.success {
                    // Clear form on success (keep student info)
                    self.mobileAppName = ""
                    self.reviewText = ""
                    
                    // Hide success message after 5 seconds
                    DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
                        withAnimation(.easeOut) {
                            self.showingSuccess = false
                        }
                    }
                } else {
                    self.alertTitle = "Submission Failed"
                    self.alertMessage = response.message
                    self.showingAlert = true
                }
                
                self.isSubmitting = false
            }
            
        } catch {
            await MainActor.run {
                self.alertTitle = "Error"
                self.alertMessage = error.localizedDescription
                self.showingAlert = true
                self.isSubmitting = false
            }
        }
    }
    
    private func hideKeyboard() {
        #if os(iOS)
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
        #endif
    }
}

#Preview {
    NavigationStack {
        ReviewSubmissionView()
    }
}