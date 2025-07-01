//
//  LearnifyApp.swift
//  Learnify
//
//  Created by Harry Taiwan on 2025/7/1.
//

import SwiftUI

@main
struct LearnifyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .frame(minWidth: 400, minHeight: 600)
                #if os(macOS)
                .frame(idealWidth: 500, idealHeight: 700)
                #endif
        }
        #if os(macOS)
        .windowResizability(.contentSize)
        #endif
    }
}
