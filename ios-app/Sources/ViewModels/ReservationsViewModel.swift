//
//  ReservationsViewModel.swift
//  LiveOwnerUnit
//
//  Gestion des réservations avec RLS
//

import Foundation
import Combine

@MainActor
class ReservationsViewModel: BaseViewModel {
    // MARK: - Published Properties
    @Published var reservations: [Reservation] = []
    @Published var upcomingReservations: [Reservation] = []
    @Published var ongoingReservations: [Reservation] = []
    @Published var pastReservations: [Reservation] = []
    
    // MARK: - Filters
    @Published var selectedGiteId: UUID?
    @Published var dateRange: ClosedRange<Date>?
    
    // MARK: - Fetch Reservations
    func fetchReservations() async throws {
        guard let userId = try await supabase.currentUserId() else {
            throw SupabaseError.notAuthenticated
        }
        
        // Query avec RLS
        let response: [Reservation] = try await supabase.client
            .from("reservations")
            .select()
            .eq("owner_user_id", value: userId.uuidString)
            .order("check_in", ascending: true)
            .execute()
            .value
        
        reservations = response
        updateCategories()
    }
    
    /// Mettre à jour les catégories (upcoming, ongoing, past)
    private func updateCategories() {
        let now = Date()
        upcomingReservations = reservations.filter { $0.checkIn > now }
        ongoingReservations = reservations.filter { $0.checkIn <= now && $0.checkOut >= now }
        pastReservations = reservations.filter { $0.checkOut < now }
    }
    
    // MARK: - Fetch by Gite
    func fetchReservations(forGiteId giteId: UUID) async throws {
        guard let userId = try await supabase.currentUserId() else {
            throw SupabaseError.notAuthenticated
        }
        
        let response: [Reservation] = try await supabase.client
            .from("reservations")
            .select()
            .eq("owner_user_id", value: userId.uuidString)
            .eq("gite_id", value: giteId.uuidString)
            .order("check_in", ascending: true)
            .execute()
            .value
        
        reservations = response
        updateCategories()
    }
    
    // MARK: - Create Reservation
    func createReservation(_ reservation: Reservation) async throws {
        guard let userId = try await supabase.currentUserId() else {
            throw SupabaseError.notAuthenticated
        }
        
        // Validation: pas de chevauchement
        try await validateNoConflict(reservation)
        
        // Insert
        var newReservation = reservation
        newReservation.ownerUserId = userId
        
        let _: Reservation = try await supabase.client
            .from("reservations")
            .insert(newReservation)
            .select()
            .single()
            .execute()
            .value
        
        // Refresh
        try await fetchReservations()
    }
    
    // MARK: - Update Reservation
    func updateReservation(_ reservation: Reservation) async throws {
        // Validation
        try await validateNoConflict(reservation, excludingId: reservation.id)
        
        let _: Reservation = try await supabase.client
            .from("reservations")
            .update(reservation)
            .eq("id", value: reservation.id.uuidString)
            .select()
            .single()
            .execute()
            .value
        
        // Refresh
        try await fetchReservations()
    }
    
    // MARK: - Delete Reservation
    func deleteReservation(_ reservationId: UUID) async throws {
        try await supabase.client
            .from("reservations")
            .delete()
            .eq("id", value: reservationId.uuidString)
            .execute()
        
        // Refresh
        try await fetchReservations()
    }
    
    // MARK: - Conflict Validation
    private func validateNoConflict(_ reservation: Reservation, excludingId: UUID? = nil) async throws {
        guard let userId = try await supabase.currentUserId() else {
            throw SupabaseError.notAuthenticated
        }
        
        // Fetch toutes les réservations du même gîte
        var query = supabase.client
            .from("reservations")
            .select()
            .eq("owner_user_id", value: userId.uuidString)
            .eq("gite_id", value: reservation.giteId.uuidString)
        
        if let excludingId = excludingId {
            query = query.neq("id", value: excludingId.uuidString)
        }
        
        let existingReservations: [Reservation] = try await query
            .execute()
            .value
        
        // Vérifier chevauchement
        for existing in existingReservations {
            if reservation.hasConflict(with: existing) {
                throw SupabaseError.conflictDetected("Chevauchement avec une autre réservation")
            }
        }
    }
}

// MARK: - Helper Extensions
extension SupabaseError {
    static func conflictDetected(_ message: String) -> SupabaseError {
        .unknown(message)
    }
}
