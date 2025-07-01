//
//  CheckInView.swift
//  Learnify
//
//  Created by Claude on 2025/7/1.
//

import SwiftUI

struct CheckInView: View {
    @State private var studentId: String = ""
    @State private var fullName: String = ""
    @State private var isLoading: Bool = false
    @State private var showingAlert: Bool = false
    @State private var alertTitle: String = ""
    @State private var alertMessage: String = ""
    @State private var lastCheckInResponse: CheckInResponse?
    
    var body: some View {
        ScrollView {
            VStack(spacing: 30) {
                // Header
                VStack(spacing: 15) {
                    Image(systemName: "graduationcap.fill")
                        .font(.system(size: 60))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.blue, .purple],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    
                    Text("Learnify Check-In")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    Text("Submit your daily check-in to earn points!")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                .padding(.top, 20)
                
                // Form
                VStack(spacing: 25) {
                    // Student ID Field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Student ID")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        TextField("Enter your student ID (e.g., STUDENT2025)", text: $studentId)
                            .textFieldStyle(.roundedBorder)
                            .font(.body)
                            #if os(iOS)
                            .autocapitalization(.allCharacters)
                            .disableAutocorrection(true)
                            .submitLabel(.next)
                            #endif
                    }
                    
                    // Full Name Field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Full Name")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        TextField("Enter your full name", text: $fullName)
                            .textFieldStyle(.roundedBorder)
                            .font(.body)
                            #if os(iOS)
                            .autocapitalization(.words)
                            .disableAutocorrection(false)
                            .submitLabel(.done)
                            #endif
                            .onSubmit {
                                if isFormValid {
                                    Task {
                                        await performCheckIn()
                                    }
                                }
                            }
                    }
                }
                .padding(.horizontal, 20)
                
                // Check-In Button
                Button(action: {
                    Task {
                        await performCheckIn()
                    }
                }) {
                    HStack(spacing: 12) {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.9)
                        } else {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.title2)
                        }
                        
                        Text(isLoading ? "Checking In..." : "Check In Now")
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
                .disabled(!isFormValid || isLoading)
                .padding(.horizontal, 20)
                .animation(.easeInOut(duration: 0.2), value: isFormValid)
                
                // Success Message
                if let response = lastCheckInResponse, response.success {
                    VStack(spacing: 12) {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.green)
                                .font(.title2)
                            
                            Text("Check-in Successful!")
                                .font(.headline)
                                .foregroundColor(.green)
                        }
                        
                        if let data = response.data {
                            VStack(spacing: 4) {
                                Text("🎉 Check-in successful!")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundColor(.primary)
                                
                                Text("Welcome, \(data.student_name)")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                
                                if data.is_new_student {
                                    Text("New student registered!")
                                        .font(.caption)
                                        .foregroundColor(.blue)
                                        .fontWeight(.medium)
                                }
                            }
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
        .alert(alertTitle, isPresented: $showingAlert) {
            Button("OK") { }
        } message: {
            Text(alertMessage)
        }
        .onTapGesture {
            // Dismiss keyboard when tapping outside
            hideKeyboard()
        }
    }
    
    private var isFormValid: Bool {
        !studentId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !fullName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    private func performCheckIn() async {
        guard isFormValid else { return }
        
        // Dismiss keyboard
        hideKeyboard()
        
        isLoading = true
        
        do {
            print("Performing check-in...")
            let response = try await APIService.shared.checkIn(
                studentId: studentId.trimmingCharacters(in: .whitespacesAndNewlines),
                fullName: fullName.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            
            await MainActor.run {
                withAnimation(.spring()) {
                    self.lastCheckInResponse = response
                }
                
                if response.success {
                    // Clear form on success
                    self.studentId = ""
                    self.fullName = ""
                } else {
                    // Show error if API returned success: false
                    self.alertTitle = "Check-in Failed"
                    self.alertMessage = response.message
                    self.showingAlert = true
                }
                
                self.isLoading = false
            }
            
        } catch {
            await MainActor.run {
                self.alertTitle = "Error"
                self.alertMessage = error.localizedDescription
                self.showingAlert = true
                self.isLoading = false
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
    CheckInView()
}