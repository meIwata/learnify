//
//  StudentsListView.swift
//  Learnify
//
//  Created by Claude on 2025/7/1.
//

import SwiftUI

struct StudentsListView: View {
    @State private var students: [Student] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showingAlert = false
    
    var body: some View {
        NavigationStack {
            VStack {
                if isLoading {
                    VStack(spacing: 20) {
                        ProgressView()
                            .scaleEffect(1.5)
                        Text("Loading students...")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if students.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "person.3.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("No Students Found")
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundColor(.primary)
                        
                        Text("No students have registered yet.")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        
                        Button("Refresh") {
                            Task {
                                await loadStudents()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        ForEach(students) { student in
                            NavigationLink(destination: StudentDetailView(student: student)) {
                                StudentRowView(student: student)
                            }
                        }
                    }
                    .refreshable {
                        await loadStudents()
                    }
                }
            }
            .navigationTitle("Students")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Refresh") {
                        Task {
                            await loadStudents()
                        }
                    }
                    .disabled(isLoading)
                }
            }
            .task {
                await loadStudents()
            }
            .alert("Error", isPresented: $showingAlert) {
                Button("OK") { }
                Button("Retry") {
                    Task {
                        await loadStudents()
                    }
                }
            } message: {
                Text(errorMessage ?? "Unknown error occurred")
            }
        }
    }
    
    @MainActor
    private func loadStudents() async {
        isLoading = true
        errorMessage = nil
        
        do {
            students = try await APIService.shared.getAllStudents()
        } catch {
            errorMessage = error.localizedDescription
            showingAlert = true
        }
        
        isLoading = false
    }
}

struct StudentRowView: View {
    let student: Student
    
    var body: some View {
        HStack(spacing: 12) {
            // Avatar with initials
            ZStack {
                Circle()
                    .fill(LinearGradient(
                        gradient: Gradient(colors: [.blue, .purple]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(width: 50, height: 50)
                
                Text(getInitials(from: student.full_name))
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(student.full_name)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Text(student.student_id)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                        .font(.caption)
                        .foregroundColor(.blue)
                    
                    Text("Joined \(formatDate(student.created_at))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
    
    private func getInitials(from name: String) -> String {
        let words = name.split(separator: " ")
        let initials = words.prefix(2).compactMap { $0.first }.map { String($0) }
        return initials.joined().uppercased()
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        
        // Handle PostgreSQL timestamp format
        if let date = parsePostgreSQLDate(dateString) {
            return formatter.string(from: date)
        }
        
        return "Unknown"
    }
    
    private func parsePostgreSQLDate(_ dateString: String) -> Date? {
        // Handle PostgreSQL timestamp format with variable decimal precision
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        // Try direct parsing first
        if let date = isoFormatter.date(from: dateString) {
            return date
        }
        
        // Manual parsing for PostgreSQL format with any number of decimal digits
        let pattern = #"^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.(\d+))?\+00:00$"#
        let regex = try? NSRegularExpression(pattern: pattern)
        let range = NSRange(dateString.startIndex..<dateString.endIndex, in: dateString)
        
        if let match = regex?.firstMatch(in: dateString, range: range) {
            let datePart = String(dateString[Range(match.range(at: 1), in: dateString)!])
            let timePart = String(dateString[Range(match.range(at: 2), in: dateString)!])
            
            var paddedMs = "000"
            if match.range(at: 3).location != NSNotFound {
                let ms = String(dateString[Range(match.range(at: 3), in: dateString)!])
                if ms.count < 3 {
                    paddedMs = ms.padding(toLength: 3, withPad: "0", startingAt: 0)
                } else if ms.count > 3 {
                    paddedMs = String(ms.prefix(3))
                } else {
                    paddedMs = ms
                }
            }
            
            let isoString = "\(datePart)T\(timePart).\(paddedMs)Z"
            return isoFormatter.date(from: isoString)
        }
        
        return nil
    }
}

#Preview {
    StudentsListView()
}