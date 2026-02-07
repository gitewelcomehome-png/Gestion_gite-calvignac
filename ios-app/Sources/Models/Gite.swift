//
//  Gite.swift
//  LiveOwnerUnit
//
//  Modèle représentant un gîte/propriété
//

import Foundation

struct Gite: Identifiable, Codable, Hashable {
    let id: UUID
    let ownerUserId: UUID
    let name: String
    let slug: String
    var description: String?
    var address: String?
    var icon: String
    var color: String
    var capacity: Int?
    var bedrooms: Int?
    var bathrooms: Int?
    var latitude: Double?
    var longitude: Double?
    var distanceKm: Decimal?
    var icalSources: [String: String]? // {"airbnb": "url", "booking": "url"}
    var settings: GiteSettings?
    var tarifsCalendrier: [String: Decimal]? // {"2026-07-15": 120}
    var displayOrder: Int
    var isActive: Bool
    let createdAt: Date?
    var updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id, name, slug, description, address, icon, color, capacity, bedrooms, bathrooms
        case latitude, longitude, settings
        case ownerUserId = "owner_user_id"
        case distanceKm = "distance_km"
        case icalSources = "ical_sources"
        case is Active = "is_active"
        case tarifsCalendrier = "tarifs_calendrier"
        case displayOrder = "display_order"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Settings Nested Type
struct GiteSettings: Codable, Hashable {
    var autoReply: Bool?
    var defaultCheckIn: String? // "15:00"
    var defaultCheckOut: String? // "11:00"
    var cleaningEnabled: Bool?
    var cleaningDurationMinutes: Int?
    
    enum CodingKeys: String, CodingKey {
        case autoReply = "auto_reply"
        case defaultCheckIn = "default_check_in"
        case defaultCheckOut = "default_check_out"
        case cleaningEnabled = "cleaning_enabled"
        case cleaningDurationMinutes = "cleaning_duration_minutes"
    }
}

// MARK: - Computed Properties
extension Gite {
    /// Initiales du nom du gîte pour avatar
    var initials: String {
        let words = name.components(separatedBy: " ")
        let initials = words.compactMap { $0.first }.prefix(2)
        return String(initials).uppercased()
    }
    
    /// Couleur SwiftUI depuis hex
    var swiftUIColor: Color {
        Color(hex: color) ?? .blue
    }
    
    /// Coordonnées GPS si disponibles
    var coordinates: CLLocationCoordinate2D? {
        guard let lat = latitude, let lon = longitude else { return nil }
        return CLLocationCoordinate2D(latitude: lat, longitude: lon)
    }
}

// MARK: - Helpers
extension Color {
    init?(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            return nil
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

import SwiftUI
import CoreLocation
