//
//  CheckInView.swift
//  Learnify
//
//  Created by Claude on 2025/7/1.
//

import SwiftUI

struct CheckInView: View {
    @Environment(AuthenticationService.self) var authService
    @State private var isLoading: Bool = false
    @State private var showingAlert: Bool = false
    @State private var alertTitle: String = ""
    @State private var alertMessage: String = ""
    @State private var lastCheckInResponse: CheckInResponse?
    
    private var isFormValid: Bool {
        return authService.isAuthenticated && 
               authService.currentStudentId != nil && 
               authService.currentStudentName != nil
    }
    
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
                
                // User Information Display
                VStack(spacing: 15) {
                    HStack {
                        Text("Student ID:")
                            .font(.headline)
                            .foregroundColor(.primary)
                        Spacer()
                        Text(authService.currentStudentId ?? "Unknown")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                    }
                    
                    HStack {
                        Text("Full Name:")
                            .font(.headline)
                            .foregroundColor(.primary)
                        Spacer()
                        Text(authService.currentStudentName ?? "Unknown")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
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
                
                // Logout Button
                VStack(spacing: 16) {
                    Divider()
                        .padding(.horizontal, 20)
                    
                    Button(action: {
                        Task {
                            await authService.logout()
                        }
                    }) {
                        HStack {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                                .font(.caption)
                            
                            Text("Sign Out")
                                .font(.caption)
                                .fontWeight(.medium)
                        }
                        .foregroundStyle(.red)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(8)
                    }
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
    
    private func performCheckIn() async {
        guard isFormValid,
              let studentId = authService.currentStudentId,
              let fullName = authService.currentStudentName else { 
            return 
        }
        
        // Dismiss keyboard
        hideKeyboard()
        
        isLoading = true
        
        do {
            print("Performing check-in for authenticated user...")
            let response = try await APIService.shared.checkIn(
                studentId: studentId,
                fullName: fullName
            )
            
            await MainActor.run {
                withAnimation(.spring()) {
                    self.lastCheckInResponse = response
                }
                
                if !response.success {
                    // Show error if API returned success: false
                    self.alertTitle = "Check-in Failed"
                    self.alertMessage = response.message
                    self.showingAlert = true
                }
                
                self.isLoading = false
            }
            
        } catch APIError.studentNotRegistered(let message) {
            await MainActor.run {
                self.alertTitle = "Student Not Registered"
                self.alertMessage = message
                self.showingAlert = true
                self.isLoading = false
                
                // Log out the user since their student ID is no longer valid
                Task {
                    await self.authService.logout()
                }
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
        .environment(AuthenticationService())
}
