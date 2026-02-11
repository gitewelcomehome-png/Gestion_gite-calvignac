//
//  Reservation.swift
//  LiveOwnerUnit
//
//  Modèle représentant une réservation
//

import Foundation

struct Reservation: Identifiable, Codable, Hashable {
    let id: UUID
    let ownerUserId: UUID
    let giteId: UUID
    var checkIn: Date
    var checkOut: Date
    var clientName: String
    var clientEmail: String?
    var clientPhone: String?
    var clientAddress: String?
    var guestCount: Int?
    var platform: String?
    var platformBookingId: String?
    var status: ReservationStatus
    var totalPrice: Decimal?
    var currency: String
    var paidAmount: Decimal
    var restant: Decimal // Calculé: totalPrice - paidAmount
    var paiement: String?
    var notes: String?
    var source: ReservationSource
    var syncedFrom: String? // Nom de la plateforme iCal
    var icalUid: String?
    var manualOverride: Bool
    var lastSeenInIcal: Date?
    var messageEnvoye: Bool
    var checkInTime: Date?
    var checkOutTime: Date?
    var gite: String? // Nom du gîte (calculé par trigger)
    let createdAt: Date?
    var updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id, status, currency, notes, source, paiement, gite
        case ownerUserId = "owner_user_id"
        case giteId = "gite_id"
        case checkIn = "check_in"
        case checkOut = "check_out"
        case clientName = "client_name"
        case clientEmail = "client_email"
        case clientPhone = "client_phone"
        case clientAddress = "client_address"
        case guestCount = "guest_count"
        case platform, platformBookingId = "platform_booking_id"
        case totalPrice = "total_price"
        case paidAmount = "paid_amount"
        case restant
        case syncedFrom = "synced_from"
        case icalUid = "ical_uid"
        case manualOverride = "manual_override"
        case lastSeenInIcal = "last_seen_in_ical"
        case messageEnvoye = "message_envoye"
        case checkInTime = "check_in_time"
        case checkOutTime = "check_out_time"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Enums
enum ReservationStatus: String, Codable, CaseIterable {
    case confirmed
    case pending
    case cancelled
    case completed
    
    var displayName: String {
        switch self {
        case .confirmed: return "Confirmée"
        case .pending: return "En attente"
        case .cancelled: return "Annulée"
        case .completed: return "Terminée"
        }
    }
    
    var color: Color {
        switch self {
        case .confirmed: return .green
        case .pending: return .orange
        case .cancelled: return .red
        case .completed: return .gray
        }
    }
}

enum ReservationSource: String, Codable {
    case manual
    case ical
    
    var displayName: String {
        switch self {
        case .manual: return "Manuelle"
        case .ical: return "iCal"
        }
    }
}

// MARK: - Computed Properties
extension Reservation {
    /// Durée du séjour en nuits
    var nights: Int {
        Calendar.current.dateComponents([.day], from: checkIn, to: checkOut).day ?? 0
    }
    
    /// Restant à payer (calculé)
    var calculatedRestant: Decimal {
        (totalPrice ?? 0) - paidAmount
    }
    
    /// Icône de la plateforme
    var platformIcon: String {
        guard let platform = platform?.lowercased() else { return "house" }
        switch platform {
        case "airbnb": return "a.circle.fill"
        case "booking": return "b.circle.fill"
        case "abritel": return "rectangle.portrait.fill"
        default: return "house"
        }
    }
    
    /// Couleur de la plateforme
    var platformColor: Color {
        guard let platform = platform?.lowercased() else { return .blue }
        switch platform {
        case "airbnb": return Color(.sRGB, red: 1.0, green: 0.35, blue: 0.37)
        case "booking": return Color(.sRGB, red: 0.0, green: 0.21, blue: 0.50)
        case "abritel": return .blue
        default: return .blue
        }
    }
    
    /// Est-ce une réservation à venir ?
    var isUpcoming: Bool {
        checkIn > Date()
    }
    
    /// Est-ce une réservation en cours ?
    var isOngoing: Bool {
        let now = Date()
        return checkIn <= now && checkOut >= now
    }
    
    /// Est-ce une réservation passée ?
    var isPast: Bool {
        checkOut < Date()
    }
}

// MARK: - Validation
extension Reservation {
    /// Valider qu'il n'y a pas de conflit de dates
    func hasConflict(with other: Reservation) -> Bool {
        // Même gîte ?
        guard giteId == other.giteId else { return false }
        
        // Chevauchement de dates ?
        return checkIn < other.checkOut && checkOut > other.checkIn
    }
    
    /// Quelle réservation est la plus courte ? (pour résolution conflits iCal)
    func isShorterThan(_ other: Reservation) -> Bool {
        nights < other.nights
    }
}

import SwiftUI
