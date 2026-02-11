//
//  SupabaseManager.swift
//  LiveOwnerUnit
//
//  Phase 1.1 - Configuration Supabase
//  Singleton pour gérer toutes les interactions avec Supabase
//

import Foundation
import Supabase
import KeychainAccess

/// Gestionnaire centralisé pour toutes les opérations Supabase
final class SupabaseManager {
    
    // MARK: - Singleton
    static let shared = SupabaseManager()
    
    // MARK: - Properties
    private let supabaseURL = URL(string: "https://fgqimtpjjhdqeyyaptoj.supabase.co")!
    private let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncWltdHBqamhkcWV5eWFwdG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTU0MjQsImV4cCI6MjA4MzczMTQyNH0.fOuYg0COYts7XXWxgB7AM01Fg6P86f8oz8XVpGdIaNM"
    
    let client: SupabaseClient
    private let keychain = Keychain(service: "com.liveownerunit.app")
    
    // MARK: - Initialization
    private init() {
        self.client = SupabaseClient(
            supabaseURL: supabaseURL,
            supabaseKey: supabaseKey
        )
    }
    
    // MARK: - Authentication
    
    /// Connexion avec email/mot de passe
    /// - Parameters:
    ///   - email: Email de l'utilisateur
    ///   - password: Mot de passe
    /// - Returns: Session Supabase avec access token
    func signIn(email: String, password: String) async throws -> Session {
        let session = try await client.auth.signIn(email: email, password: password)
        
        // Sauvegarder le token dans Keychain
        try saveToken(session.accessToken)
        
        return session
    }
    
    /// Inscription nouvel utilisateur
    func signUp(email: String, password: String) async throws -> Session {
        let session = try await client.auth.signUp(email: email, password: password)
        try saveToken(session.accessToken)
        return session
    }
    
    /// Déconnexion
    func signOut() async throws {
        try await client.auth.signOut()
        try deleteToken()
    }
    
    /// Récupérer l'utilisateur actuellement connecté
    func currentUser() async throws -> User? {
        return try await client.auth.user()
    }
    
    /// Vérifier si une session est active
    func hasActiveSession() async -> Bool {
        do {
            let session = try await client.auth.session
            return session != nil
        } catch {
            return false
        }
    }
    
    /// Rafraîchir le token automatiquement
    func refreshToken() async throws {
        let session = try await client.auth.refreshSession()
        try saveToken(session.accessToken)
    }
    
    // MARK: - Token Management (Keychain)
    
    private func saveToken(_ token: String) throws {
        try keychain.set(token, key: "supabase.access_token")
    }
    
    private func getToken() -> String? {
        try? keychain.get("supabase.access_token")
    }
    
    private func deleteToken() throws {
        try keychain.remove("supabase.access_token")
    }
    
    // MARK: - Database Operations Helpers
    
    /// Récupérer l'UUID de l'utilisateur connecté (pour filtres RLS)
    func currentUserId() async throws -> UUID {
        guard let user = try await currentUser() else {
            throw SupabaseError.notAuthenticated
        }
        return user.id
    }
}

// MARK: - Errors
enum SupabaseError: LocalizedError {
    case notAuthenticated
    case invalidResponse
    case networkError(Error)
    
    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "Vous devez être connecté pour effectuer cette action"
        case .invalidResponse:
            return "Réponse invalide du serveur"
        case .networkError(let error):
            return "Erreur réseau: \(error.localizedDescription)"
        }
    }
}
