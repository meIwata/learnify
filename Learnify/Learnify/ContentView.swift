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
            DashboardView()
                .tabItem {
                    Image(systemName: "house")
                    Text("Dashboard")
                }
            
            LessonView()
                .tabItem {
                    Image(systemName: "book")
                    Text("Lessons")
                }
            
            SubmissionsContainerView()
                .tabItem {
                    Image(systemName: "folder")
                    Text("Submissions")
                }
        }
        .accentColor(.blue)
    }
}

#Preview {
    ContentView()
        .environment(AuthenticationService())
}
