//
//  SettingsView.swift
//  LiveOwnerUnit
//
//  Paramètres utilisateur
//

import SwiftUI

struct SettingsView: View {
    @StateObject private var settingsVM = SettingsViewModel()
    @State private var showingLogoutConfirm = false
    
    var body: some View {
        NavigationStack {
            Form {
                // Profile Section
                profileSection
                
                // Sync Section
                syncSection
                
                // Notifications Section
                notificationsSection
                
                // Security Section
                securitySection
                
                // About Section
                aboutSection
                
                // Logout Section
                logoutSection
            }
            .navigationTitle("Paramètres")
            .task {
                await settingsVM.loadProfile()
            }
            .alert("Déconnexion", isPresented: $showingLogoutConfirm) {
                Button("Annuler", role: .cancel) {}
                Button("Déconnexer", role: .destructive) {
                    Task {
                        await settingsVM.logout()
                    }
                }
            } message: {
                Text("Êtes-vous sûr de vouloir vous déconnecter ?")
            }
        }
    }
    
    // MARK: - Profile Section
    private var profileSection: some View {
        Section("Profil") {
            HStack {
                Text("Email")
                Spacer()
                Text(settingsVM.user?.email ?? "Non connecté")
                    .foregroundColor(.secondary)
            }
            
            if let fullName = settingsVM.user?.fullName {
                HStack {
                    Text("Nom")
                    Spacer()
                    Text(fullName)
                        .foregroundColor(.secondary)
                }
            }
            
            if let subscription = settingsVM.user?.subscriptionTier {
                NavigationLink(destination: SubscriptionView()) {
                    HStack {
                        Text("Abonnement")
                        Spacer()
                        Text(subscription.displayName)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
    }
    
    // MARK: - Sync Section
    private var syncSection: some View {
        Section("Synchronisation") {
            Toggle("Sync iCal automatique", isOn: $settingsVM.autoSyncIcal)
                .onChange(of: settingsVM.autoSyncIcal) { _, newValue in
                    Task {
                        await settingsVM.updateSettings()
                    }
                }
            
            if settingsVM.autoSyncIcal {
                Stepper("Fréquence: \(settingsVM.syncFrequencyMinutes) min", 
                       value: $settingsVM.syncFrequencyMinutes, 
                       in: 15...240, 
                       step: 15)
                .onChange(of: settingsVM.syncFrequencyMinutes) { _, _ in
                    Task {
                        await settingsVM.updateSettings()
                    }
                }
            }
            
            Button("Synchroniser maintenant") {
                Task {
                    await settingsVM.syncNow()
                }
            }
            .disabled(settingsVM.isLoading)
            
            if let lastSync = settingsVM.lastSyncDate {
                HStack {
                    Text("Dernière sync")
                    Spacer()
                    Text(lastSync, style: .relative)
                        .foregroundColor(.secondary)
                        .font(.caption)
                }
            }
        }
    }
    
    // MARK: - Notifications Section
    private var notificationsSection: some View {
        Section("Notifications") {
            Toggle("Activer les notifications", isOn: $settingsVM.notificationsEnabled)
                .onChange(of: settingsVM.notificationsEnabled) { _, _ in
                    Task {
                        await settingsVM.updateSettings()
                    }
                }
            
            if settingsVM.notificationsEnabled {
                Toggle("Notifications push", isOn: $settingsVM.pushNotifications)
                    .onChange(of: settingsVM.pushNotifications) { _, _ in
                        Task {
                            await settingsVM.updateSettings()
                        }
                    }
                
                Toggle("Notifications email", isOn: $settingsVM.emailNotifications)
                    .onChange(of: settingsVM.emailNotifications) { _, _ in
                        Task {
                            await settingsVM.updateSettings()
                        }
                    }
            }
        }
    }
    
    // MARK: - Security Section
    private var securitySection: some View {
        Section("Sécurité") {
            if settingsVM.biometricAvailable {
                Toggle("Authentification biométrique", isOn: $settingsVM.biometricAuth)
                    .onChange(of: settingsVM.biometricAuth) { _, _ in
                        Task {
                            await settingsVM.updateSettings()
                        }
                    }
            }
            
            NavigationLink("Changer le mot de passe") {
                ChangePasswordView()
            }
        }
    }
    
    // MARK: - About Section
    private var aboutSection: some View {
        Section("À propos") {
            HStack {
                Text("Version")
                Spacer()
                Text("1.0.0")
                    .foregroundColor(.secondary)
            }
            
            NavigationLink("Conditions d'utilisation") {
                TermsView()
            }
            
            NavigationLink("Politique de confidentialité") {
                PrivacyView()
            }
            
            Link("Support", destination: URL(string: "mailto:support@liveownerunit.com")!)
        }
    }
    
    // MARK: - Logout Section
    private var logoutSection: some View {
        Section {
            Button(action: {
                showingLogoutConfirm = true
            }) {
                HStack {
                    Spacer()
                    Text("Se déconnecter")
                        .foregroundColor(.red)
                    Spacer()
                }
            }
        }
    }
}

// MARK: - SettingsViewModel
@MainActor
class SettingsViewModel: BaseViewModel {
    @Published var user: User?
    
    // Settings
    @Published var autoSyncIcal = false
    @Published var syncFrequencyMinutes = 60
    @Published var notificationsEnabled = true
    @Published var pushNotifications = true
    @Published var emailNotifications = true
    @Published var biometricAuth = false
    
    // Sync status
    @Published var lastSyncDate: Date?
    
    var biometricAvailable: Bool {
        let context = LAContext()
        return context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil)
    }
    
    func loadProfile() async {
        do {
            guard let userId = try await supabase.currentUserId() else { return }
            
            let fetchedUser: User = try await supabase.client
                .from("users")
                .select()
                .eq("id", value: userId.uuidString)
                .single()
                .execute()
                .value
            
            user = fetchedUser
            
            // Load settings
            if let settings = fetchedUser.settings {
                autoSyncIcal = settings.autoSyncIcal ?? false
                syncFrequencyMinutes = settings.syncFrequencyMinutes ?? 60
                notificationsEnabled = settings.notificationsEnabled ?? true
                pushNotifications = settings.pushNotifications ?? true
                emailNotifications = settings.emailNotifications ?? true
                biometricAuth = settings.biometricAuth ?? false
            }
        } catch {
            handleError(error)
        }
    }
    
    func updateSettings() async {
        do {
            guard let userId = try await supabase.currentUserId() else { return }
            
            let newSettings = UserSettings(
                notificationsEnabled: notificationsEnabled,
                emailNotifications: emailNotifications,
                pushNotifications: pushNotifications,
                darkMode: nil,
                biometricAuth: biometricAuth,
                autoSyncIcal: autoSyncIcal,
                syncFrequencyMinutes: syncFrequencyMinutes
            )
            
            let _: User = try await supabase.client
                .from("users")
                .update(["settings": newSettings])
                .eq("id", value: userId.uuidString)
                .select()
                .single()
                .execute()
                .value
            
        } catch {
            handleError(error)
        }
    }
    
    func syncNow() async {
        startLoading()
        // TODO: Trigger iCal sync
        try? await Task.sleep(nanoseconds: 2_000_000_000)
        lastSyncDate = Date()
        stopLoading()
        showSuccessMessage("Synchronisation terminée")
    }
    
    func logout() async {
        do {
            try await supabase.signOut()
        } catch {
            handleError(error)
        }
    }
}

// MARK: - Placeholder Views
struct SubscriptionView: View {
    var body: some View {
        Text("TODO: Gestion abonnement")
            .navigationTitle("Abonnement")
    }
}

struct ChangePasswordView: View {
    var body: some View {
        Text("TODO: Changer mot de passe")
            .navigationTitle("Changer le mot de passe")
    }
}

struct TermsView: View {
    var body: some View {
        ScrollView {
            Text("TODO: Conditions d'utilisation")
                .padding()
        }
        .navigationTitle("Conditions d'utilisation")
    }
}

struct PrivacyView: View {
    var body: some View {
        ScrollView {
            Text("TODO: Politique de confidentialité")
                .padding()
        }
        .navigationTitle("Confidentialité")
    }
}

import LocalAuthentication

#Preview {
    SettingsView()
}
