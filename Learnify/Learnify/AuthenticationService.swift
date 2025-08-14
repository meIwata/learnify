//
//  AuthenticationService.swift
//  Learnify
//
//  Created by Claude on 2025/8/14.
//

import SwiftUI
import Observation
import Combine

@MainActor
@Observable
class AuthenticationService {
    var isAuthenticated: Bool = false
    var studentId: String? = nil
    var studentName: String? = nil
    var isLoading: Bool = false
    var loginError: String? = nil
    
    @ObservationIgnored
    @AppStorage("student_id") private var storedStudentId: String = ""
    @ObservationIgnored
    @AppStorage("student_name") private var storedStudentName: String = ""
    
    init() {
        if !storedStudentId.isEmpty && !storedStudentName.isEmpty {
            self.studentId = storedStudentId
            self.studentName = storedStudentName
            self.isAuthenticated = true
            Task { await validateStoredCredentials() }
        }
    }
    
    private func validateStoredCredentials() async {
        guard !storedStudentId.isEmpty else { return }
        do {
            let exists = try await APIService.shared.checkStudentExists(studentId: storedStudentId)
            if exists {
                self.studentId = storedStudentId
                self.studentName = storedStudentName
                self.isAuthenticated = true
                print("✅ Stored credentials validated successfully")
            } else {
                await logout()
                print("⚠️ Stored student no longer exists, logging out")
            }
        } catch {
            print("⚠️ Could not validate stored credentials (offline or error): \(error). Keeping local session.")
        }
    }
    
    func login(studentId: String) async {
        self.isLoading = true
        self.loginError = nil
        
        let trimmedStudentId = studentId.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        
        do {
            // First, validate that the student exists and get their information
            let exists = try await APIService.shared.checkStudentExists(studentId: trimmedStudentId)
            
            if !exists {
                self.loginError = "Student ID not found. Please check your Student ID or contact your instructor."
                self.isLoading = false
                return
            }
            
            // Fetch student information from the backend
            let studentInfo = try await APIService.shared.getStudentInfo(studentId: trimmedStudentId)
            
            // If validation passes, set authentication
            self.studentId = trimmedStudentId
            self.studentName = studentInfo.full_name
            self.isAuthenticated = true
            self.loginError = nil
            
            // Store credentials for future use
            self.storedStudentId = trimmedStudentId
            self.storedStudentName = studentInfo.full_name
            
            print("✅ Login successful for student: \(trimmedStudentId) (\(studentInfo.full_name))")
            
        } catch APIError.studentNotRegistered(let message) {
            self.loginError = message
            print("❌ Student not registered: \(message)")
        } catch {
            self.loginError = "Login failed: \(error.localizedDescription)"
            print("❌ Login error: \(error)")
        }
        
        self.isLoading = false
    }
    
    func logout() async {
        self.studentId = nil
        self.studentName = nil
        self.isAuthenticated = false
        self.loginError = nil
        await clearStoredCredentials()
        print("✅ User logged out")
    }
    
    private func clearStoredCredentials() async {
        self.storedStudentId = ""
        self.storedStudentName = ""
    }
    
    // Computed property for backward compatibility
    var hasStoredCredentials: Bool {
        return !storedStudentId.isEmpty && !storedStudentName.isEmpty && isAuthenticated
    }
    
    // Get current student info for API calls
    var currentStudentId: String? {
        return isAuthenticated ? studentId : nil
    }
    
    var currentStudentName: String? {
        return isAuthenticated ? studentName : nil
    }
}
