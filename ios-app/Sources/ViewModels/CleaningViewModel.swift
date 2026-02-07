//
//  CleaningViewModel.swift
//  LiveOwnerUnit
//
//  Gestion du planning de ménage
//

import Foundation
import Combine

@MainActor
class CleaningViewModel: BaseViewModel {
    // MARK: - Published Properties
    @Published var cleaningSchedules: [CleaningSchedule] = []
    @Published var upcomingCleanings: [CleaningSchedule] = []
    @Published var todayCleanings: [CleaningSchedule] = []
    @Published var overdueCleanings: [CleaningSchedule] = []
    
    // MARK: - Filters
    @Published var selectedWeek: Date = Date()
    
    // MARK: - Fetch Cleanings
    func fetchCleanings() async throws {
        guard let userId = try await supabase.currentUserId() else {
            throw SupabaseError.notAuthenticated
        }
        
        let response: [CleaningSchedule] = try await supabase.client
            .from("cleaning_schedule")
            .select()
            .eq("owner_user_id", value: userId.uuidString)
            .order("scheduled_date", ascending: true)
            .execute()
            .value
        
        cleaningSchedules = response
        updateCategories()
    }
    
    /// Catégoriser les ménages
    private func updateCategories() {
        let now = Date()
        let calendar = Calendar.current
        
        todayCleanings = cleaningSchedules.filter {
            calendar.isDateInToday($0.scheduledDate)
        }
        
        upcomingCleanings = cleaningSchedules.filter {
            $0.scheduledDate > now && $0.status == .planned
        }
        
        overdueCleanings = cleaningSchedules.filter {
            $0.isOverdue
        }
    }
    
    // MARK: - Fetch for Week
    func fetchCleanings(forWeek date: Date) async throws {
        guard let userId = try await supabase.currentUserId() else {
            throw SupabaseError.notAuthenticated
        }
        
        let calendar = Calendar.current
        let weekStart = calendar.dateInterval(of: .weekOfYear, for: date)?.start ?? date
        let weekEnd = calendar.date(byAdding: .day, value: 7, to: weekStart) ?? date
        
        let response: [CleaningSchedule] = try await supabase.client
            .from("cleaning_schedule")
            .select()
            .eq("owner_user_id", value: userId.uuidString)
            .gte("scheduled_date", value: weekStart.ISO8601Format())
            .lte("scheduled_date", value: weekEnd.ISO8601Format())
            .order("scheduled_date", ascending: true)
            .execute()
            .value
        
        cleaningSchedules = response
    }
    
    // MARK: - Create Cleaning
    func createCleaning(_ cleaning: CleaningSchedule) async throws {
        guard let userId = try await supabase.currentUserId() else {
            throw SupabaseError.notAuthenticated
        }
        
        var newCleaning = cleaning
        newCleaning.ownerUserId = userId
        
        let _: CleaningSchedule = try await supabase.client
            .from("cleaning_schedule")
            .insert(newCleaning)
            .select()
            .single()
            .execute()
            .value
        
        try await fetchCleanings()
    }
    
    // MARK: - Update Cleaning
    func updateCleaning(_ cleaning: CleaningSchedule) async throws {
        let _: CleaningSchedule = try await supabase.client
            .from("cleaning_schedule")
            .update(cleaning)
            .eq("id", value: cleaning.id.uuidString)
            .select()
            .single()
            .execute()
            .value
        
        try await fetchCleanings()
    }
    
    // MARK: - Mark as Completed
    func markAsCompleted(_ cleaningId: UUID) async throws {
        let now = Date()
        try await supabase.client
            .from("cleaning_schedule")
            .update([
                "status": CleaningStatus.completed.rawValue,
                "completed_at": now.ISO8601Format()
            ])
            .eq("id", value: cleaningId.uuidString)
            .execute()
        
        try await fetchCleanings()
    }
    
    // MARK: - Delete Cleaning
    func deleteCleaning(_ cleaningId: UUID) async throws {
        try await supabase.client
            .from("cleaning_schedule")
            .delete()
            .eq("id", value: cleaningId.uuidString)
            .execute()
        
        try await fetchCleanings()
    }
    
    // MARK: - Generate Auto Schedule (9 règles métier)
    func generateAutoSchedule(from reservations: [Reservation], gites: [Gite]) async throws {
        guard let userId = try await supabase.currentUserId() else {
            throw SupabaseError.notAuthenticated
        }
        
        var schedulesToCreate: [CleaningSchedule] = []
        
        for reservation in reservations where reservation.status == .confirmed {
            guard let gite = gites.first(where: { $0.id == reservation.giteId }) else { continue }
            
            // Règle 1: Ménage le jour du checkout
            let checkoutDate = Calendar.current.startOfDay(for: reservation.checkOut)
            
            // Règle 2: Durée standard (90min) ou custom
            let duration = gite.settings?.cleaningDurationMinutes ?? 90
            
            // Règle 3: Assignation auto si configuré
            let assignedTo = gite.settings?.cleaningEnabled == true ? "auto" : nil
            
            let cleaning = CleaningSchedule(
                id: UUID(),
                ownerUserId: userId,
                giteId: gite.id,
                gite: gite.name,
                reservationId: reservation.id,
                scheduledDate: checkoutDate,
                scheduledTime: gite.settings?.defaultCheckOut ?? "11:00",
                estimatedDurationMinutes: duration,
                status: .planned,
                assignedTo: assignedTo,
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
            
            schedulesToCreate.append(cleaning)
        }
        
        // Batch insert
        if !schedulesToCreate.isEmpty {
            let _: [CleaningSchedule] = try await supabase.client
                .from("cleaning_schedule")
                .insert(schedulesToCreate)
                .select()
                .execute()
                .value
        }
        
        try await fetchCleanings()
    }
}
