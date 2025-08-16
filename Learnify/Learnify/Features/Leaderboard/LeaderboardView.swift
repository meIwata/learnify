//
//  LeaderboardView.swift
//  Learnify
//
//  Created by Claude on 2025/7/11.
//

import SwiftUI

struct LeaderboardView: View {
    @State private var leaderboard: [LeaderboardEntry] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showingAlert = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if isLoading {
                    VStack(spacing: 20) {
                        ProgressView()
                            .scaleEffect(1.5)
                        Text("Loading leaderboard...")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if leaderboard.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "trophy.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("No Students Yet")
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundColor(.primary)
                        
                        Text("No students have joined the leaderboard yet.")
                            .font(.body)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        
                        Button("Refresh") {
                            Task {
                                await loadLeaderboard()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        // Top 3 Podium Section
                        if leaderboard.count >= 3 {
                            Section {
                                PodiumView(leaderboard: Array(leaderboard.prefix(3)))
                            }
                            .listRowInsets(EdgeInsets())
                            .listRowBackground(Color.clear)
                        }
                        
                        // Full Rankings List
                        Section(header: Text("All Rankings").textCase(.uppercase)) {
                            ForEach(leaderboard, id: \.student_id) { entry in
                                LeaderboardRowView(entry: entry)
                            }
                        }
                    }
                    .listStyle(PlainListStyle())
                    .refreshable {
                        await loadLeaderboard()
                    }
                }
            }
            .navigationTitle("Leaderboard")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Refresh") {
                        Task {
                            await loadLeaderboard()
                        }
                    }
                    .disabled(isLoading)
                }
            }
            .task {
                await loadLeaderboard()
            }
            .alert("Error", isPresented: $showingAlert) {
                Button("OK") { }
                Button("Retry") {
                    Task {
                        await loadLeaderboard()
                    }
                }
            } message: {
                Text(errorMessage ?? "Unknown error occurred")
            }
        }
    }
    
    @MainActor
    private func loadLeaderboard() async {
        isLoading = true
        errorMessage = nil
        
        do {
            leaderboard = try await APIService.shared.getLeaderboard()
        } catch {
            errorMessage = error.localizedDescription
            showingAlert = true
        }
        
        isLoading = false
    }
}

struct PodiumView: View {
    let leaderboard: [LeaderboardEntry]
    
    var body: some View {
        VStack(spacing: 20) {
            Text("🏆 Top Performers")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.primary)
                .padding(.top)
            
            HStack(alignment: .bottom, spacing: 16) {
                // 2nd Place
                if leaderboard.count >= 2 {
                    PodiumPositionView(
                        entry: leaderboard[1],
                        position: 2,
                        height: 80,
                        color: .gray
                    )
                }
                
                // 1st Place
                if leaderboard.count >= 1 {
                    PodiumPositionView(
                        entry: leaderboard[0],
                        position: 1,
                        height: 100,
                        color: .yellow
                    )
                }
                
                // 3rd Place
                if leaderboard.count >= 3 {
                    PodiumPositionView(
                        entry: leaderboard[2],
                        position: 3,
                        height: 60,
                        color: .orange
                    )
                }
            }
            .padding(.horizontal)
            .padding(.bottom)
        }
        .frame(maxWidth: .infinity)
        .background(
            LinearGradient(
                colors: [.blue.opacity(0.1), .purple.opacity(0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(16)
        .padding()
    }
}

struct PodiumPositionView: View {
    let entry: LeaderboardEntry
    let position: Int
    let height: CGFloat
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            // Avatar
            ZStack {
                Circle()
                    .fill(LinearGradient(
                        gradient: Gradient(colors: [.blue, .purple]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(width: 50, height: 50)
                
                Text(getInitials(from: entry.full_name))
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
            }
            
            // Name
            Text(entry.full_name)
                .font(.caption)
                .fontWeight(.medium)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .frame(maxWidth: 80)
            
            // Score
            Text("\(entry.total_marks)")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.blue)
            
            // Podium
            Rectangle()
                .fill(color)
                .frame(width: 60, height: height)
                .overlay(
                    Text("\(position)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                )
                .cornerRadius(8)
        }
    }
    
    private func getInitials(from name: String) -> String {
        let words = name.split(separator: " ")
        let initials = words.prefix(2).compactMap { $0.first }.map { String($0) }
        return initials.joined().uppercased()
    }
}

struct LeaderboardRowView: View {
    let entry: LeaderboardEntry
    
    var body: some View {
        HStack(spacing: 12) {
            // Rank
            ZStack {
                Circle()
                    .fill(rankColor.opacity(0.2))
                    .frame(width: 36, height: 36)
                
                Text("\(entry.rank)")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(rankColor)
            }
            
            // Avatar with initials
            ZStack {
                Circle()
                    .fill(LinearGradient(
                        gradient: Gradient(colors: [.blue, .purple]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ))
                    .frame(width: 40, height: 40)
                
                Text(getInitials(from: entry.full_name))
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
            }
            
            // Student Info
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.full_name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                
                HStack(spacing: 4) {
                    Text(entry.student_id)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    if entry.total_check_ins > 0 {
                        Text("• \(entry.total_check_ins) check-ins")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            Spacer()
            
            // Score and Badge
            VStack(alignment: .trailing, spacing: 4) {
                Text("\(entry.total_marks)")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)
                
                if entry.rank <= 3 {
                    Text(rankEmoji)
                        .font(.title2)
                } else {
                    Text("pts")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
    
    private var rankColor: Color {
        switch entry.rank {
        case 1: return .yellow
        case 2: return .gray
        case 3: return .orange
        default: return .blue
        }
    }
    
    private var rankEmoji: String {
        switch entry.rank {
        case 1: return "🥇"
        case 2: return "🥈"
        case 3: return "🥉"
        default: return ""
        }
    }
    
    private func getInitials(from name: String) -> String {
        let words = name.split(separator: " ")
        let initials = words.prefix(2).compactMap { $0.first }.map { String($0) }
        return initials.joined().uppercased()
    }
}

#Preview {
    LeaderboardView()
}
