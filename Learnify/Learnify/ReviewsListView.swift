//
//  ReflectionsListView.swift
//  Learnify
//
//  Created by Claude on 2025/7/1.
//

import SwiftUI

struct ReviewsListView: View {
    @State private var reviews: [StudentReview] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showingAlert = false
    @State private var appNameFilter = ""
    @State private var expandedReviews: Set<Int> = []
    
    var body: some View {
        NavigationStack {
            VStack {
                // Filter Section
                VStack(spacing: 12) {
                    HStack(spacing: 12) {
                        TextField("Filter by app name...", text: $appNameFilter)
                            .textFieldStyle(.roundedBorder)
                            .onSubmit {
                                Task {
                                    await loadReviews()
                                }
                            }
                        
                        Button(action: {
                            Task {
                                await loadReviews()
                            }
                        }) {
                            Image(systemName: "arrow.clockwise")
                                .font(.title3)
                                .foregroundColor(.blue)
                        }
                        .disabled(isLoading)
                    }
                    .padding(.horizontal)
                    .padding(.top, 8)
                    
                    if !appNameFilter.isEmpty {
                        HStack {
                            Text("Filtering by: \(appNameFilter)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Spacer()
                            
                            Button("Clear") {
                                appNameFilter = ""
                                Task {
                                    await loadReviews()
                                }
                            }
                            .font(.caption)
                            .foregroundColor(.blue)
                        }
                        .padding(.horizontal)
                    }
                }
                .background(Color(UIColor.systemGroupedBackground))
                
                if isLoading {
                    VStack(spacing: 20) {
                        ProgressView()
                            .scaleEffect(1.5)
                        Text("Loading reviews...")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if reviews.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "bubble.left.and.bubble.right")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("No Reviews Found")
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundColor(.primary)
                        
                        Text(appNameFilter.isEmpty ? "No reviews have been submitted yet." : "No reviews match your filter.")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        
                        Button("Refresh") {
                            Task {
                                await loadReviews()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        ForEach(reviews, id: \.id) { review in
                            ReviewRowView(
                                review: review,
                                isExpanded: expandedReviews.contains(review.id)
                            ) {
                                toggleExpanded(review.id)
                            }
                        }
                    }
                    .listStyle(PlainListStyle())
                    .refreshable {
                        await loadReviews()
                    }
                }
            }
            .navigationTitle("All Reviews")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Refresh") {
                        Task {
                            await loadReviews()
                        }
                    }
                    .disabled(isLoading)
                }
            }
            .task {
                await loadReviews()
            }
            .alert("Error", isPresented: $showingAlert) {
                Button("OK") { }
                Button("Retry") {
                    Task {
                        await loadReviews()
                    }
                }
            } message: {
                Text(errorMessage ?? "Unknown error occurred")
            }
        }
    }
    
    private func toggleExpanded(_ id: Int) {
        if expandedReviews.contains(id) {
            expandedReviews.remove(id)
        } else {
            expandedReviews.insert(id)
        }
    }
    
    @MainActor
    private func loadReviews() async {
        isLoading = true
        errorMessage = nil
        
        do {
            let params = appNameFilter.isEmpty ? [:] : ["app_name": appNameFilter]
            reviews = try await APIService.shared.getAllReviews(params: params)
        } catch {
            errorMessage = error.localizedDescription
            showingAlert = true
        }
        
        isLoading = false
    }
}

struct ReviewRowView: View {
    let review: StudentReview
    let isExpanded: Bool
    let onToggleExpanded: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack(spacing: 12) {
                // Avatar
                ZStack {
                    Circle()
                        .fill(LinearGradient(
                            gradient: Gradient(colors: [.blue, .purple]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                        .frame(width: 45, height: 45)
                    
                    Text(getInitials(from: review.students?.full_name ?? review.student_id))
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(review.students?.full_name ?? review.student_id)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text(review.student_id)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text(review.mobile_app_name)
                        .font(.caption)
                        .fontWeight(.medium)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.blue.opacity(0.1))
                        .foregroundColor(.blue)
                        .cornerRadius(8)
                    
                    Text(formatDate(review.created_at))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Review Text
            VStack(alignment: .leading, spacing: 8) {
                if isExpanded {
                    Text(review.review_text)
                        .font(.body)
                        .foregroundColor(.primary)
                        .lineLimit(nil)
                } else {
                    Text(truncateText(review.review_text, maxLength: 150))
                        .font(.body)
                        .foregroundColor(.primary)
                        .lineLimit(3)
                }
                
                if shouldShowExpand(review.review_text) {
                    Button(action: onToggleExpanded) {
                        Text(isExpanded ? "Show Less" : "Show More")
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.blue)
                    }
                }
            }
        }
        .padding(.vertical, 8)
    }
    
    private func getInitials(from name: String) -> String {
        let words = name.split(separator: " ")
        let initials = words.prefix(2).compactMap { $0.first }.map { String($0) }
        return initials.joined().uppercased()
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        
        if let date = parsePostgreSQLDate(dateString) {
            return formatter.string(from: date)
        }
        
        return "Unknown"
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
    
    private func truncateText(_ text: String, maxLength: Int) -> String {
        if text.count <= maxLength {
            return text
        }
        return String(text.prefix(maxLength)) + "..."
    }
    
    private func shouldShowExpand(_ text: String) -> Bool {
        return text.count > 150
    }
}

#Preview {
    ReviewsListView()
}