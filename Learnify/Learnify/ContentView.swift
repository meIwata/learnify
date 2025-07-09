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
            
            ReflectionSubmissionView()
                .tabItem {
                    Image(systemName: "bubble.left.and.bubble.right")
                    Text("Reflect")
                }
            
            ReflectionsListView()
                .tabItem {
                    Image(systemName: "list.bullet.rectangle")
                    Text("All Reflections")
                }
        }
        .accentColor(.blue)
    }
}

#Preview {
    ContentView()
}
