//
//  ClientSheetService.swift
//  LiveOwnerUnit
//
//  Service pour générer et gérer les fiches clients
//

import Foundation
import Supabase
import MessageUI

class ClientSheetService {
    static let shared = ClientSheetService()
    private let supabase = SupabaseManager.shared.client
    
    private init() {}
    
    // MARK: - Generate or Fetch Token
    
    /// Génère ou récupère un token existant pour une réservation
    func getOrCreateToken(for reservation: Reservation) async throws -> ClientAccessToken {
        let userId = try await SupabaseManager.shared.currentUserId()
        
        // 1. Chercher token existant valide
        let existingTokens: [ClientAccessToken] = try await supabase
            .from("client_access_tokens")
            .select()
            .eq("reservation_id", value: reservation.id.uuidString)
            .eq("is_active", value: true)
            .gt("expires_at", value: Date().ISO8601Format())
            .order("created_at", ascending: false)
            .limit(1)
            .execute()
            .value
        
        if let existingToken = existingTokens.first {
            return existingToken
        }
        
        // 2. Générer nouveau token
        let token = generateSecureToken()
        
        // Calculer expiration (date de départ + 7 jours)
        var expiresAt = Calendar.current.date(byAdding: .day, value: 7, to: reservation.checkOut) ?? reservation.checkOut
        
        let newToken = ClientAccessToken(
            id: UUID(),
            ownerUserId: userId,
            reservationId: reservation.id,
            token: token,
            expiresAt: expiresAt,
            isActive: true,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        // 3. Sauvegarder en base
        let inserted: ClientAccessToken = try await supabase
            .from("client_access_tokens")
            .insert(newToken)
            .select()
            .single()
            .execute()
            .value
        
        return inserted
    }
    
    // MARK: - Generate Client Sheet URL
    
    /// Génère l'URL de la fiche client
    func generateClientSheetURL(for reservation: Reservation) async throws -> URL {
        let token = try await getOrCreateToken(for: reservation)
        
        guard let url = token.ficheUrl() else {
            throw ClientSheetError.invalidURL
        }
        
        return url
    }
    
    // MARK: - Share Client Sheet
    
    /// Partage la fiche client via SMS/Email/WhatsApp
    func shareClientSheet(for reservation: Reservation, via method: SharingMethod) async throws -> SharingResult {
        let url = try await generateClientSheetURL(for: reservation)
        let message = generateMessage(for: reservation, url: url)
        
        return SharingResult(
            url: url,
            message: message,
            method: method,
            clientName: reservation.clientName,
            clientEmail: reservation.clientEmail,
            clientPhone: reservation.clientPhone
        )
    }
    
    // MARK: - Message Generation
    
    private func generateMessage(for reservation: Reservation, url: URL) -> String {
        let giteName = reservation.gite ?? "votre gîte"
        let checkInFormatted = reservation.checkIn.formatted(date: .long, time: .omitted)
        let checkOutFormatted = reservation.checkOut.formatted(date: .long, time: .omitted)
        
        return """
        Bonjour \(reservation.clientName),
        
        Votre réservation pour \(giteName) du \(checkInFormatted) au \(checkOutFormatted) est confirmée ! 🏡
        
        Pour faciliter votre arrivée, merci de compléter votre fiche client :
        \(url.absoluteString)
        
        À très bientôt !
        """
    }
    
    // MARK: - Token Generation
    
    private func generateSecureToken() -> String {
        let characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<32).compactMap { _ in characters.randomElement() })
    }
    
    // MARK: - Fetch Tokens for Reservation
    
    func fetchTokens(for reservationId: UUID) async throws -> [ClientAccessToken] {
        let tokens: [ClientAccessToken] = try await supabase
            .from("client_access_tokens")
            .select()
            .eq("reservation_id", value: reservationId.uuidString)
            .order("created_at", ascending: false)
            .execute()
            .value
        
        return tokens
    }
}

// MARK: - Supporting Types

enum SharingMethod: String, CaseIterable {
    case sms = "SMS"
    case email = "Email"
    case whatsapp = "WhatsApp"
    case copy = "Copier le lien"
    
    var icon: String {
        switch self {
        case .sms: return "message.fill"
        case .email: return "envelope.fill"
        case .whatsapp: return "app.badge.fill"
        case .copy: return "doc.on.doc.fill"
        }
    }
}

struct SharingResult {
    let url: URL
    let message: String
    let method: SharingMethod
    let clientName: String
    let clientEmail: String?
    let clientPhone: String?
}

enum ClientSheetError: LocalizedError {
    case invalidURL
    case noClientContact
    case messagingNotAvailable
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Impossible de générer l'URL de la fiche client"
        case .noClientContact:
            return "Aucun moyen de contact disponible pour ce client"
        case .messagingNotAvailable:
            return "Service de messagerie non disponible"
        }
    }
}
