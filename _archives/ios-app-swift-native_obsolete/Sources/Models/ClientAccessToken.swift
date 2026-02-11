//
//  ClientAccessToken.swift
//  LiveOwnerUnit
//
//  Modèle pour les tokens d'accès aux fiches clients
//

import Foundation

struct ClientAccessToken: Identifiable, Codable, Hashable {
    let id: UUID
    let ownerUserId: UUID
    let reservationId: UUID
    let token: String
    let expiresAt: Date
    var isActive: Bool
    let createdAt: Date?
    var updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id
        case ownerUserId = "owner_user_id"
        case reservationId = "reservation_id"
        case token
        case expiresAt = "expires_at"
        case isActive = "is_active"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Computed Properties
extension ClientAccessToken {
    /// URL de la fiche client
    func ficheUrl(baseUrl: String = "https://gestion-gite-calvignac.vercel.app") -> URL? {
        URL(string: "\(baseUrl)/pages/fiche-client.html?token=\(token)")
    }
    
    /// Est-ce que le token est expiré ?
    var isExpired: Bool {
        expiresAt < Date()
    }
    
    /// Est-ce que le token est valide ?
    var isValid: Bool {
        isActive && !isExpired
    }
}
