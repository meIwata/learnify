//
//  SettingsView.swift
//  Learnify
//
//  Created by Claude on 2025/7/9.
//

import SwiftUI

struct SettingsView: View {
    @AppStorage("student_id") private var studentId: String = ""
    @AppStorage("student_name") private var studentName: String = ""
    @State private var isEditing = false
    @State private var tempStudentId: String = ""
    @State private var tempStudentName: String = ""
    
    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Student Information")) {
                    if isEditing {
                        TextField("Student ID", text: $tempStudentId)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                        TextField("Full Name", text: $tempStudentName)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    } else {
                        HStack {
                            Text("Student ID:")
                            Spacer()
                            Text(studentId.isEmpty ? "Not set" : studentId)
                                .foregroundColor(studentId.isEmpty ? .gray : .primary)
                        }
                        HStack {
                            Text("Full Name:")
                            Spacer()
                            Text(studentName.isEmpty ? "Not set" : studentName)
                                .foregroundColor(studentName.isEmpty ? .gray : .primary)
                        }
                    }
                }
                
                Section {
                    if isEditing {
                        HStack {
                            Button("Cancel") {
                                tempStudentId = studentId
                                tempStudentName = studentName
                                isEditing = false
                            }
                            .foregroundColor(.red)
                            
                            Spacer()
                            
                            Button("Save") {
                                saveChanges()
                            }
                            .disabled(tempStudentId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
                                     tempStudentName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                        }
                    } else {
                        Button("Edit Student Information") {
                            startEditing()
                        }
                        .disabled(studentId.isEmpty && studentName.isEmpty)
                    }
                }
                
                Section(footer: Text("Student information is automatically saved after your first check-in. You can update it here if needed.")) {
                    if !studentId.isEmpty {
                        Button("Clear All Data") {
                            clearData()
                        }
                        .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
        }
    }
    
    private func startEditing() {
        tempStudentId = studentId
        tempStudentName = studentName
        isEditing = true
    }
    
    private func saveChanges() {
        studentId = tempStudentId.trimmingCharacters(in: .whitespacesAndNewlines)
        studentName = tempStudentName.trimmingCharacters(in: .whitespacesAndNewlines)
        isEditing = false
    }
    
    private func clearData() {
        studentId = ""
        studentName = ""
        isEditing = false
    }
}

#Preview {
    SettingsView()
}