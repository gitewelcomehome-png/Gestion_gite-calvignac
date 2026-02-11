//
//  AuthService.swift
//  LiveOwnerUnit
//
//  Created: 07/02/2026
//

import Foundation
import SwiftUI
import Combine

/// Service gérant l'authentification utilisateur
class AuthService: ObservableObject {
    static let shared = AuthService()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    private init() {
        // Vérifier si un token existe au démarrage
        checkSession()
    }
    
    /// Vérifier la session utilisateur
    func checkSession() async {
        // Vérifier si token existe dans Keychain
        if let _ = SupabaseManager.shared.getStoredToken() {
            await MainActor.run {
                self.isAuthenticated = true
            }
        }
    }
    
    /// Connexion
    func signIn(email: String, password: String) async throws {
        // Utiliser Supabase pour la connexion
        try await SupabaseManager.shared.signIn(email: email, password: password)
        
        await MainActor.run {
            self.isAuthenticated = true
        }
    }
    
    /// Déconnexion
    func signOut() async {
        await SupabaseManager.shared.signOut()
        
        await MainActor.run {
            self.isAuthenticated = false
            self.currentUser = nil
        }
    }
}
