//
//  CleaningSchedule.swift
//  LiveOwnerUnit
//
//  Modèle représentant un planning de ménage
//

import Foundation

struct CleaningSchedule: Identifiable, Codable, Hashable {
    let id: UUID
    let ownerUserId: UUID
    let giteId: UUID
    var gite: String? // Nom du gîte (calculé)
    var reservationId: UUID?
    var scheduledDate: Date
    var scheduledTime: String? // "10:00"
    var estimatedDurationMinutes: Int
    var status: CleaningStatus
    var assignedTo: String?
    var cleanerName: String?
    var checklistCompleted: Bool
    var checklist: CleaningChecklist?
    var photos: [String]? // URLs Supabase Storage
    var notes: String?
    var issue: Bool
    var issueDescription: String?
    var completedAt: Date?
    let createdAt: Date?
    var updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id, gite, status, notes, issue
        case ownerUserId = "owner_user_id"
        case giteId = "gite_id"
        case reservationId = "reservation_id"
        case scheduledDate = "scheduled_date"
        case scheduledTime = "scheduled_time"
        case estimatedDurationMinutes = "estimated_duration_minutes"
        case assignedTo = "assigned_to"
        case cleanerName = "cleaner_name"
        case checklistCompleted = "checklist_completed"
        case checklist, photos
        case issueDescription = "issue_description"
        case completedAt = "completed_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Enums
enum CleaningStatus: String, Codable, CaseIterable {
    case planned
    case inProgress = "in_progress"
    case completed
    case cancelled
    
    var displayName: String {
        switch self {
        case .planned: return "Prévu"
        case .inProgress: return "En cours"
        case .completed: return "Terminé"
        case .cancelled: return "Annulé"
        }
    }
    
    var color: Color {
        switch self {
        case .planned: return .blue
        case .inProgress: return .orange
        case .completed: return .green
        case .cancelled: return .red
        }
    }
    
    var icon: String {
        switch self {
        case .planned: return "calendar"
        case .inProgress: return "clock.fill"
        case .completed: return "checkmark.circle.fill"
        case .cancelled: return "xmark.circle.fill"
        }
    }
}

// MARK: - Checklist
struct CleaningChecklist: Codable, Hashable {
    var kitchenCleaned: Bool?
    var bathroomCleaned: Bool?
    var bedroomsCleaned: Bool?
    var livingRoomCleaned: Bool?
    var floorsVacuumed: Bool?
    var floorsMopped: Bool?
    var windowsCleaned: Bool?
    var linensChanged: Bool?
    var trashEmpty: Bool?
    var suppliesRestocked: Bool?
    
    enum CodingKeys: String, CodingKey {
        case kitchenCleaned = "kitchen_cleaned"
        case bathroomCleaned = "bathroom_cleaned"
        case bedroomsCleaned = "bedrooms_cleaned"
        case livingRoomCleaned = "living_room_cleaned"
        case floorsVacuumed = "floors_vacuumed"
        case floorsMopped = "floors_mopped"
        case windowsCleaned = "windows_cleaned"
        case linensChanged = "linens_changed"
        case trashEmpty = "trash_empty"
        case suppliesRestocked = "supplies_restocked"
    }
    
    /// Taux de complétion (0-100%)
    var completion: Int {
        let allTasks = [
            kitchenCleaned, bathroomCleaned, bedroomsCleaned, livingRoomCleaned,
            floorsVacuumed, floorsMopped, windowsCleaned, linensChanged,
            trashEmpty, suppliesRestocked
        ]
        let completed = allTasks.compactMap { $0 }.filter { $0 }.count
        let total = allTasks.compactMap { $0 }.count
        guard total > 0 else { return 0 }
        return Int((Double(completed) / Double(total)) * 100)
    }
}

// MARK: - Computed Properties
extension CleaningSchedule {
    /// Formateur de date pour affichage
    var dateFormatted: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        formatter.locale = Locale(identifier: "fr_FR")
        return formatter.string(from: scheduledDate)
    }
    
    /// Heure complète formatée (date + time)
    var fullDateTime: Date? {
        guard let time = scheduledTime else { return scheduledDate }
        let calendar = Calendar.current
        let components = time.split(separator: ":").compactMap { Int($0) }
        guard components.count == 2 else { return scheduledDate }
        
        var dateComponents = calendar.dateComponents([.year, .month, .day], from: scheduledDate)
        dateComponents.hour = components[0]
        dateComponents.minute = components[1]
        
        return calendar.date(from: dateComponents)
    }
    
    /// Durée en format humain
    var durationFormatted: String {
        let hours = estimatedDurationMinutes / 60
        let minutes = estimatedDurationMinutes % 60
        
        if hours > 0 && minutes > 0 {
            return "\(hours)h\(minutes)min"
        } else if hours > 0 {
            return "\(hours)h"
        } else {
            return "\(minutes)min"
        }
    }
    
    /// Est-ce aujourd'hui ?
    var isToday: Bool {
        Calendar.current.isDateInToday(scheduledDate)
    }
    
    /// Est-ce en retard ?
    var isOverdue: Bool {
        status == .planned && scheduledDate < Date()
    }
}

import SwiftUI
