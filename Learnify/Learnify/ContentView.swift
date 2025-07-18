//
//  ContentView.swift
//  Learnify
//
//  Created by Harry Taiwan on 2025/7/1.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            CheckInView()
                .tabItem {
                    Image(systemName: "checkmark.circle")
                    Text("Check In")
                }
            
            StudentsListView()
                .tabItem {
                    Image(systemName: "person.3")
                    Text("Students")
                }
            
            ReviewSubmissionView()
                .tabItem {
                    Image(systemName: "bubble.left.and.bubble.right")
                    Text("Review")
                }
            
            ReviewsListView()
                .tabItem {
                    Image(systemName: "list.bullet.rectangle")
                    Text("All Reviews")
                }
            
            LeaderboardView()
                .tabItem {
                    Image(systemName: "trophy.fill")
                    Text("Leaderboard")
                }
            
            SettingsView()
                .tabItem {
                    Image(systemName: "gear")
                    Text("Settings")
                }
        }
        .accentColor(.blue)
    }
}

#Preview {
    ContentView()
}
