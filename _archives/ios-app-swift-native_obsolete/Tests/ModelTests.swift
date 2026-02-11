//
//  ModelTests.swift
//  LiveOwnerUnitTests
//
//  Tests unitaires des modèles
//

import XCTest
@testable import LiveOwnerUnit

final class ModelTests: XCTestCase {
    // MARK: - Gite Tests
    func testGiteInitials() {
        let gite = Gite(
            id: UUID(),
            ownerUserId: UUID(),
            name: "Gîte La Maison Bleue",
            slug: "maison-bleue",
            description: nil,
            address: nil,
            icon: "house",
            color: "#3B82F6",
            capacity: 4,
            bedrooms: 2,
            bathrooms: 1,
            latitude: nil,
            longitude: nil,
            distanceKm: nil,
            icalSources: nil,
            settings: nil,
            tarifsCalendrier: nil,
            displayOrder: 0,
            isActive: true,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        XCTAssertEqual(gite.initials, "GL")
    }
    
    // MARK: - Reservation Tests
    func testReservationNights() {
        let checkIn = Date()
        let checkOut = Calendar.current.date(byAdding: .day, value: 3, to: checkIn)!
        
        let reservation = Reservation(
            id: UUID(),
            ownerUserId: UUID(),
            giteId: UUID(),
            checkIn: checkIn,
            checkOut: checkOut,
            clientName: "Test Client",
            clientEmail: nil,
            clientPhone: nil,
            clientAddress: nil,
            guestCount: 2,
            platform: nil,
            platformBookingId: nil,
            status: .confirmed,
            totalPrice: 300,
            currency: "EUR",
            paidAmount: 100,
            restant: 200,
            paiement: nil,
            notes: nil,
            source: .manual,
            syncedFrom: nil,
            icalUid: nil,
            manualOverride: false,
            lastSeenInIcal: nil,
            messageEnvoye: false,
            checkInTime: nil,
            checkOutTime: nil,
            gite: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        XCTAssertEqual(reservation.nights, 3)
        XCTAssertEqual(reservation.calculatedRestant, 200)
    }
    
    func testReservationConflict() {
        let giteId = UUID()
        
        let res1 = createReservation(
            giteId: giteId,
            checkIn: Date(),
            checkOut: Calendar.current.date(byAdding: .day, value: 3, to: Date())!
        )
        
        let res2 = createReservation(
            giteId: giteId,
            checkIn: Calendar.current.date(byAdding: .day, value: 2, to: Date())!,
            checkOut: Calendar.current.date(byAdding: .day, value: 5, to: Date())!
        )
        
        let res3 = createReservation(
            giteId: UUID(), // Gîte différent
            checkIn: Date(),
            checkOut: Calendar.current.date(byAdding: .day, value: 3, to: Date())!
        )
        
        XCTAssertTrue(res1.hasConflict(with: res2))
        XCTAssertFalse(res1.hasConflict(with: res3))
    }
    
    func testReservationShorterThan() {
        let res1 = createReservation(
            giteId: UUID(),
            checkIn: Date(),
            checkOut: Calendar.current.date(byAdding: .day, value: 2, to: Date())!
        )
        
        let res2 = createReservation(
            giteId: UUID(),
            checkIn: Date(),
            checkOut: Calendar.current.date(byAdding: .day, value: 5, to: Date())!
        )
        
        XCTAssertTrue(res1.isShorterThan(res2))
        XCTAssertFalse(res2.isShorterThan(res1))
    }
    
    // MARK: - CleaningSchedule Tests
    func testCleaningDurationFormatted() {
        let cleaning1 = createCleaning(durationMinutes: 90)
        XCTAssertEqual(cleaning1.durationFormatted, "1h30min")
        
        let cleaning2 = createCleaning(durationMinutes: 120)
        XCTAssertEqual(cleaning2.durationFormatted, "2h")
        
        let cleaning3 = createCleaning(durationMinutes: 45)
        XCTAssertEqual(cleaning3.durationFormatted, "45min")
    }
    
    func testCleaningChecklistCompletion() {
        var checklist = CleaningChecklist(
            kitchenCleaned: true,
            bathroomCleaned: true,
            bedroomsCleaned: false,
            livingRoomCleaned: true,
            floorsVacuumed: false,
            floorsMopped: nil,
            windowsCleaned: nil,
            linensChanged: nil,
            trashEmpty: nil,
            suppliesRestocked: nil
        )
        
        // 3 sur 4 tâches complétées (nil ignoré)
        XCTAssertEqual(checklist.completion, 75)
    }
    
    // MARK: - User Tests
    func testUserInitials() {
        let user = User(
            id: UUID(),
            email: "john.doe@example.com",
            fullName: "John Doe",
            phone: nil,
            company: nil,
            language: "fr",
            timezone: "Europe/Paris",
            settings: nil,
            subscriptionTier: .free,
            subscriptionExpiresAt: nil,
            lastLoginAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        XCTAssertEqual(user.initials, "JD")
        XCTAssertFalse(user.isPremium)
        XCTAssertTrue(user.hasActiveSubscription)
    }
    
    func testUserPremiumStatus() {
        let premiumUser = User(
            id: UUID(),
            email: "premium@example.com",
            fullName: "Premium User",
            phone: nil,
            company: nil,
            language: "fr",
            timezone: "Europe/Paris",
            settings: nil,
            subscriptionTier: .premium,
            subscriptionExpiresAt: Calendar.current.date(byAdding: .month, value: 1, to: Date()),
            lastLoginAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        XCTAssertTrue(premiumUser.isPremium)
        XCTAssertTrue(premiumUser.hasActiveSubscription)
        XCTAssertNotNil(premiumUser.daysRemaining)
    }
    
    // MARK: - Helpers
    private func createReservation(giteId: UUID, checkIn: Date, checkOut: Date) -> Reservation {
        Reservation(
            id: UUID(),
            ownerUserId: UUID(),
            giteId: giteId,
            checkIn: checkIn,
            checkOut: checkOut,
            clientName: "Test",
            clientEmail: nil,
            clientPhone: nil,
            clientAddress: nil,
            guestCount: 2,
            platform: nil,
            platformBookingId: nil,
            status: .confirmed,
            totalPrice: 100,
            currency: "EUR",
            paidAmount: 0,
            restant: 100,
            paiement: nil,
            notes: nil,
            source: .manual,
            syncedFrom: nil,
            icalUid: nil,
            manualOverride: false,
            lastSeenInIcal: nil,
            messageEnvoye: false,
            checkInTime: nil,
            checkOutTime: nil,
            gite: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
    }
    
    private func createCleaning(durationMinutes: Int) -> CleaningSchedule {
        CleaningSchedule(
            id: UUID(),
            ownerUserId: UUID(),
            giteId: UUID(),
            gite: "Test Gîte",
            reservationId: nil,
            scheduledDate: Date(),
            scheduledTime: "10:00",
            estimatedDurationMinutes: durationMinutes,
            status: .planned,
            assignedTo: nil,
            cleanerName: nil,
            checklistCompleted: false,
            checklist: nil,
            photos: nil,
            notes: nil,
            issue: false,
            issueDescription: nil,
            completedAt: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}
