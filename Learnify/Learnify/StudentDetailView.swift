//
//  StudentDetailView.swift
//  Learnify
//
//  Created by Claude on 2025/7/1.
//

import SwiftUI

struct StudentDetailView: View {
    let student: Student
    @State private var checkIns: [StudentCheckIn] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showingAlert = false
    @State private var showingMarks = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
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
                    
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                            .font(.caption)
                            .foregroundColor(.blue)
                        
                        Text("Joined \(formatDate(student.created_at))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            
            // View Marks Button
            Button(action: {
                showingMarks = true
            }) {
                HStack(spacing: 12) {
                    Image(systemName: "chart.bar.fill")
                        .font(.title2)
                    
                    Text("View Current Marks")
                        .font(.headline)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(
                    LinearGradient(
                        colors: [.blue, .purple],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(12)
                .shadow(color: .blue.opacity(0.3), radius: 6, x: 0, y: 3)
            }
            .padding(.horizontal)
            .padding(.bottom, 8)
            
            // Check-ins List
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("Check-in History")
                        .font(.headline)
                        .fontWeight(.semibold)
                    
                    Spacer()
                    
                    if !checkIns.isEmpty {
                        Text("\(checkIns.count) check-ins")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.horizontal)
                .padding(.top)
                
                if isLoading {
                    VStack(spacing: 16) {
                        ProgressView()
                            .scaleEffect(1.2)
                        Text("Loading check-ins...")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if checkIns.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "checkmark.circle")
                            .font(.system(size: 50))
                            .foregroundColor(.gray)
                        
                        Text("No Check-ins Yet")
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text("This student hasn't checked in yet.")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        
                        Button("Refresh") {
                            Task {
                                await loadCheckIns()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        ForEach(sortedCheckIns, id: \.id) { checkIn in
                            CheckInRowView(checkIn: checkIn)
                        }
                    }
                    .listStyle(PlainListStyle())
                    .refreshable {
                        await loadCheckIns()
                    }
                }
            }
        }
        .navigationTitle("Student Details")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Refresh") {
                    Task {
                        await loadCheckIns()
                    }
                }
                .disabled(isLoading)
            }
        }
        .task {
            await loadCheckIns()
        }
        .alert("Error", isPresented: $showingAlert) {
            Button("OK") { }
            Button("Retry") {
                Task {
                    await loadCheckIns()
                }
            }
        } message: {
            Text(errorMessage ?? "Unknown error occurred")
        }
        .sheet(isPresented: $showingMarks) {
            StudentMarksView(student: student, checkIns: checkIns)
        }
    }
    
    private var sortedCheckIns: [StudentCheckIn] {
        checkIns.sorted { checkIn1, checkIn2 in
            let date1 = parsePostgreSQLDate(checkIn1.created_at) ?? Date.distantPast
            let date2 = parsePostgreSQLDate(checkIn2.created_at) ?? Date.distantPast
            return date1 > date2 // Most recent first
        }
    }
    
    @MainActor
    private func loadCheckIns() async {
        isLoading = true
        errorMessage = nil
        
        do {
            checkIns = try await APIService.shared.getStudentCheckIns(studentId: student.student_id)
        } catch {
            errorMessage = error.localizedDescription
            showingAlert = true
        }
        
        isLoading = false
    }
    
    private func getInitials(from name: String) -> String {
        let words = name.split(separator: " ")
        let initials = words.prefix(2).compactMap { $0.first }.map { String($0) }
        return initials.joined().uppercased()
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        
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

struct CheckInRowView: View {
    let checkIn: StudentCheckIn
    
    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color.green.opacity(0.2))
                    .frame(width: 40, height: 40)
                
                Image(systemName: "checkmark")
                    .font(.headline)
                    .foregroundColor(.green)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Daily Check-in")
                    .font(.headline)
                    .foregroundColor(.primary)
                
                if let date = parsePostgreSQLDate(checkIn.created_at) {
                    Text(formatDateTime(date))
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                } else {
                    Text("Unknown date")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
    
    private func formatDateTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
    
    private func parsePostgreSQLDate(_ dateString: String) -> Date? {
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        if let date = isoFormatter.date(from: dateString) {
            return date
        }
        
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
    NavigationStack {
        StudentDetailView(student: Student(
            id: "1",
            student_id: "STUDENT2025",
            full_name: "John Doe",
            created_at: "2025-07-01T00:14:59.61+00:00"
        ))
    }
}