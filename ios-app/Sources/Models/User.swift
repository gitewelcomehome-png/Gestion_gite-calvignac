//
//  User.swift
//  LiveOwnerUnit
//
//  Modèle utilisateur (propriétaire de gîtes)
//

import Foundation
import Supabase

struct User: Identifiable, Codable, Hashable {
    let id: UUID
    var email: String
    var fullName: String?
    var phone: String?
    var company: String?
    var language: String // "fr" ou "en"
    var timezone: String // "Europe/Paris"
    var settings: UserSettings?
    var subscriptionTier: SubscriptionTier
    var subscriptionExpiresAt: Date?
    var lastLoginAt: Date?
    let createdAt: Date?
    var updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id, email, phone, company, language, timezone, settings
        case fullName = "full_name"
        case subscriptionTier = "subscription_tier"
        case subscriptionExpiresAt = "subscription_expires_at"
        case lastLoginAt = "last_login_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Settings
struct UserSettings: Codable, Hashable {
    var notificationsEnabled: Bool?
    var emailNotifications: Bool?
    var pushNotifications: Bool?
    var darkMode: Bool?
    var biometricAuth: Bool?
    var autoSyncIcal: Bool?
    var syncFrequencyMinutes: Int?
    
    enum CodingKeys: String, CodingKey {
        case notificationsEnabled = "notifications_enabled"
        case emailNotifications = "email_notifications"
        case pushNotifications = "push_notifications"
        case darkMode = "dark_mode"
        case biometricAuth = "biometric_auth"
        case autoSyncIcal = "auto_sync_ical"
        case syncFrequencyMinutes = "sync_frequency_minutes"
    }
}

// MARK: - Subscription
enum SubscriptionTier: String, Codable, CaseIterable {
    case free
    case premium
    case enterprise
    
    var displayName: String {
        switch self {
        case .free: return "Gratuit"
        case .premium: return "Premium"
        case .enterprise: return "Entreprise"
        }
    }
    
    var maxGites: Int? {
        switch self {
        case .free: return 2
        case .premium: return 10
        case .enterprise: return nil // Illimité
        }
    }
    
    var features: [String] {
        switch self {
        case .free:
            return ["2 gîtes maximum", "Calendrier basique", "Ménage manuel"]
        case .premium:
            return ["10 gîtes", "Sync iCal", "Stats avancées", "Fiches clients"]
        case .enterprise:
            return ["Gîtes illimités", "Support prioritaire", "API access", "White label"]
        }
    }
}

// MARK: - Computed Properties
extension User {
    /// Initiales pour avatar
    var initials: String {
        guard let fullName = fullName else { return "?" }
        let words = fullName.components(separatedBy: " ")
        let initials = words.compactMap { $0.first }.prefix(2)
        return String(initials).uppercased()
    }
    
    /// Est abonné premium ?
    var isPremium: Bool {
        subscriptionTier == .premium || subscriptionTier == .enterprise
    }
    
    /// Abonnement actif ?
    var hasActiveSubscription: Bool {
        guard let expiresAt = subscriptionExpiresAt else {
            return subscriptionTier == .free // Gratuit = toujours actif
        }
        return expiresAt > Date()
    }
    
    /// Jours restants d'abonnement
    var daysRemaining: Int? {
        guard let expiresAt = subscriptionExpiresAt else { return nil }
        return Calendar.current.dateComponents([.day], from: Date(), to: expiresAt).day
    }
}

// MARK: - Supabase Auth User Extension
extension AuthUser {
    /// Convertir Supabase AuthUser en User (si profile existe)
    func toUser(profile: User?) -> User {
        return User(
            id: UUID(uuidString: id) ?? UUID(),
            email: email ?? "",
            fullName: profile?.fullName,
            phone: profile?.phone,
            company: profile?.company,
            language: profile?.language ?? "fr",
            timezone: profile?.timezone ?? "Europe/Paris",
            settings: profile?.settings,
            subscriptionTier: profile?.subscriptionTier ?? .free,
            subscriptionExpiresAt: profile?.subscriptionExpiresAt,
            lastLoginAt: Date(),
            createdAt: profile?.createdAt ?? Date(),
            updatedAt: Date()
        )
    }
}
