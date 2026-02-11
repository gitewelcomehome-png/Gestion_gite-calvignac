//
//  Extensions.swift
//  LiveOwnerUnit
//
//  Extensions utilitaires
//

import Foundation
import SwiftUI

// MARK: - Date Extensions
extension Date {
    /// Format ISO 8601 pour Supabase
    func ISO8601Format() -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: self)
    }
    
    /// Format court (ex: "15 juil. 2026")
    func shortDateString() -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        formatter.locale = Locale(identifier: "fr_FR")
        return formatter.string(from: self)
    }
    
    /// Format complet avec heure (ex: "15 juil. 2026 à 14:30")
    func fullDateTimeString() -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        formatter.locale = Locale(identifier: "fr_FR")
        return formatter.string(from: self)
    }
}

// MARK: - Decimal Extensions
extension Decimal {
    /// Arrondir à 2 décimales
    func rounded(to places: Int = 2) -> Decimal {
        var result = self
        var rounded = Decimal()
        NSDecimalRound(&rounded, &result, places, .plain)
        return rounded
    }
}

// MARK: - String Extensions
extension String {
    /// Valider format email
    var isValidEmail: Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let predicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return predicate.evaluate(with: self)
    }
    
    /// Valider format téléphone (simplifié)
    var isValidPhone: Bool {
        let phoneRegex = "^[+]?[0-9]{10,15}$"
        let predicate = NSPredicate(format: "SELF MATCHES %@", phoneRegex)
        return predicate.evaluate(with: self)
    }
    
    /// Capitaliser première lettre
    func capitalizingFirstLetter() -> String {
        prefix(1).capitalized + dropFirst()
    }
}

// MARK: - View Extensions
extension View {
    /// Appliquer un modificateur conditionnel
    @ViewBuilder
    func `if`<Transform: View>(
        _ condition: Bool,
        transform: (Self) -> Transform
    ) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
    
    /// Corner radius spécifique pour chaque coin
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

// MARK: - Rounded Corner Shape
struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners
    
    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

// MARK: - Array Extensions
extension Array where Element: Identifiable {
    /// Supprimer un élément par son ID
    mutating func remove(id: Element.ID) {
        removeAll { $0.id == id }
    }
    
    /// Trouver l'index d'un élément par son ID
    func index(of element: Element) -> Int? where Element.ID: Equatable {
        firstIndex { $0.id == element.id }
    }
}

// MARK: - Optional Extensions
extension Optional where Wrapped == String {
    /// Vérifier si la string optionnelle est vide ou nil
    var isNilOrEmpty: Bool {
        self?.isEmpty ?? true
    }
}

// MARK: - Task Extensions
extension Task where Success == Never, Failure == Never {
    /// Sleep pour un nombre de secondes
    static func sleep(seconds: Double) async throws {
        try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
    }
}

// MARK: - URLRequest Extensions
extension URLRequest {
    /// Ajouter des headers d'authentification
    mutating func addAuthHeader(token: String) {
        setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }
    
    /// Ajouter Content-Type JSON
    mutating func addJSONContentType() {
        setValue("application/json", forHTTPHeaderField: "Content-Type")
    }
}
