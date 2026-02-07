//
//  LiveOwnerUnitApp.swift
//  LiveOwnerUnit
//
//  Created: 07/02/2026
//  Copyright © 2026 LiveOwnerUnit. All rights reserved.
//

import SwiftUI

@main
struct LiveOwnerUnitApp: App {
    @StateObject private var authService = AuthService.shared
    
    init() {
        // Configuration initiale
        configureApp()
    }
    
    var body: some Scene {
        WindowGroup {
            if authService.isAuthenticated {
                MainTabView()
                    .environmentObject(authService)
            } else {
                LoginView()
                    .environmentObject(authService)
            }
        }
    }
    
    // MARK: - Configuration
    private func configureApp() {
        // Vérifier session existante au lancement
        Task {
            await authService.checkSession()
        }
    }
}

/// Vue principale avec TabBar
struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "house.fill")
                }
                .tag(0)
            
            CalendarView()
                .tabItem {
                    Label("Calendrier", systemImage: "calendar")
                }
                .tag(1)
            
            CleaningView()
                .tabItem {
                    Label("Ménage", systemImage: "sparkles")
                }
                .tag(2)
            
            StatsView()
                .tabItem {
                    Label("Stats", systemImage: "chart.bar.fill")
                }
                .tag(3)
            
            SettingsView()
                .tabItem {
                    Label("Plus", systemImage: "ellipsis.circle.fill")
                }
                .tag(4)
        }
        .accentColor(.blue)
    }
}
