//
//  ICalSyncServiceTests.swift
//  LiveOwnerUnitTests
//
//  Tests du service de synchronisation iCal
//

import XCTest
@testable import LiveOwnerUnit

final class ICalSyncServiceTests: XCTestCase {
    func testICalParsing() async throws {
        let sampleICal = """
        BEGIN:VCALENDAR
        VERSION:2.0
        PRODID:-//Test//Test//EN
        BEGIN:VEVENT
        UID:test-event-123
        DTSTART:20260715
        DTEND:20260718
        SUMMARY:John Doe
        DESCRIPTION:Airbnb reservation
        STATUS:CONFIRMED
        END:VEVENT
        END:VCALENDAR
        """
        
        // Test parsing (simplifié - nécessite accès aux méthodes privées ou refactoring)
        // TODO: Extraire la logique de parsing dans une méthode testable
    }
    
    func testConflictResolution() {
        let giteId = UUID()
        
        // Réservation existante: 3 nuits
        let existing = Reservation(
            id: UUID(),
            ownerUserId: UUID(),
            giteId: giteId,
            checkIn: Date(),
            checkOut: Calendar.current.date(byAdding: .day, value: 3, to: Date())!,
            clientName: "Existing",
            clientEmail: nil,
            clientPhone: nil,
            clientAddress: nil,
            guestCount: 2,
            platform: nil,
            platformBookingId: nil,
            status: .confirmed,
            totalPrice: 300,
            currency: "EUR",
            paidAmount: 0,
            restant: 300,
            paiement: nil,
            notes: nil,
            source: .manual,
            syncedFrom: nil,
            icalUid: "existing-123",
            manualOverride: false,
            lastSeenInIcal: nil,
            messageEnvoye: false,
            checkInTime: nil,
            checkOutTime: nil,
            gite: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        // Nouvelle réservation iCal: 2 nuits (plus courte)
        let newICal = Reservation(
            id: UUID(),
            ownerUserId: UUID(),
            giteId: giteId,
            checkIn: Calendar.current.date(byAdding: .day, value: 1, to: Date())!,
            checkOut: Calendar.current.date(byAdding: .day, value: 3, to: Date())!,
            clientName: "New iCal",
            clientEmail: nil,
            clientPhone: nil,
            clientAddress: nil,
            guestCount: 2,
            platform: "airbnb",
            platformBookingId: nil,
            status: .confirmed,
            totalPrice: 200,
            currency: "EUR",
            paidAmount: 0,
            restant: 200,
            paiement: nil,
            notes: nil,
            source: .ical,
            syncedFrom: "airbnb",
            icalUid: "new-ical-456",
            manualOverride: false,
            lastSeenInIcal: Date(),
            messageEnvoye: false,
            checkInTime: nil,
            checkOutTime: nil,
            gite: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        // Vérifications de la règle métier: garder la plus courte
        XCTAssertTrue(existing.hasConflict(with: newICal))
        XCTAssertTrue(newICal.isShorterThan(existing))
        
        // Dans un vrai scénario, newICal remplacerait existing
    }
}
