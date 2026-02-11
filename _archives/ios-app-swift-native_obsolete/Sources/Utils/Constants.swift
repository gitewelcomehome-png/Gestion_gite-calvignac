//
//  Constants.swift
//  LiveOwnerUnit
//
//  Constantes globales de l'application
//

import Foundation

enum AppConstants {
    // MARK: - App Info
    static let appName = "LiveOwnerUnit"
    static let appVersion = "1.0.0"
    static let buildNumber = "1"
    
    // MARK: - URLs
    static let websiteURL = URL(string: "https://liveownerunit.com")!
    static let supportEmail = "support@liveownerunit.com"
    static let privacyPolicyURL = URL(string: "https://liveownerunit.com/privacy")!
    static let termsURL = URL(string: "https://liveownerunit.com/terms")!
    
    // MARK: - Cache
    static let cacheDefaultTTL: TimeInterval = 3600 // 1 heure
    static let cacheMaxSize = 50 * 1024 * 1024 // 50 MB
    
    // MARK: - Sync
    static let defaultSyncFrequencyMinutes = 60
    static let minSyncFrequencyMinutes = 15
    static let maxSyncFrequencyMinutes = 240
    
    // MARK: - iCal
    static let icalDeleteThresholdDays = 7 // Supprimer après 7 jours sans voir la résa
    static let icalTimeout: TimeInterval = 30.0
    
    // MARK: - Cleaning
    static let defaultCleaningDurationMinutes = 90
    static let minCleaningDurationMinutes = 30
    static let maxCleaningDurationMinutes = 300
    
    // MARK: - Business Rules
    static let urssafMinimumAnnual: Decimal = 1200 // Minimum URSSAF annuel
    static let tvaThreshold: Decimal = 176200 // Seuil TVA (simplifié)
    
    // MARK: - Validation
    static let passwordMinLength = 6
    static let phoneMinLength = 10
    static let phoneMaxLength = 15
    
    // MARK: - Pagination
    static let defaultPageSize = 50
    static let maxPageSize = 200
    
    // MARK: - Session
    static let sessionTimeout: TimeInterval = 30 * 24 * 60 * 60 // 30 jours
    static let refreshTokenBefore: TimeInterval = 5 * 60 // 5 minutes avant expiration
}

// MARK: - User Defaults Keys
enum UserDefaultsKeys {
    static let hasCompletedOnboarding = "hasCompletedOnboarding"
    static let lastSyncDate = "lastSyncDate"
    static let preferredLanguage = "preferredLanguage"
    static let biometricEnabled = "biometricEnabled"
    static let selectedGiteId = "selectedGiteId"
}

// MARK: - Notification Names
extension Notification.Name {
    static let userDidLogin = Notification.Name("userDidLogin")
    static let userDidLogout = Notification.Name("userDidLogout")
    static let syncDidComplete = Notification.Name("syncDidComplete")
    static let reservationDidUpdate = Notification.Name("reservationDidUpdate")
    static let cleaningDidComplete = Notification.Name("cleaningDidComplete")
}

// MARK: - Error Messages
enum ErrorMessages {
    static let networkUnavailable = "Aucune connexion Internet. Vérifiez votre connexion et réessayez."
    static let authenticationFailed = "Échec de l'authentification. Veuillez vous reconnecter."
    static let invalidCredentials = "Email ou mot de passe incorrect."
    static let passwordTooShort = "Le mot de passe doit contenir au moins \(AppConstants.passwordMinLength) caractères."
    static let emailInvalid = "Adresse email invalide."
    static let conflictDetected = "Un conflit de réservation a été détecté."
    static let syncFailed = "Échec de la synchronisation. Réessayez plus tard."
    static let unknownError = "Une erreur inconnue s'est produite. Veuillez réessayer."
}

// MARK: - API Endpoints
enum APIEndpoints {
    static let translationAPI = "https://api.mymemory.translated.net/get"
    static let geocodingAPI = "https://nominatim.openstreetmap.org/search"
}
