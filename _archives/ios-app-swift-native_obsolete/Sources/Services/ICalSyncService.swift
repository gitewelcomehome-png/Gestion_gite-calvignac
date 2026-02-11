//
//  ICalSyncService.swift
//  LiveOwnerUnit
//
//  Service de synchronisation iCal (RFC 5545)
//

import Foundation
import Supabase
import PostgREST

actor ICalSyncService {
    static let shared = ICalSyncService()
    
    private let supabase = SupabaseManager.shared
    private var syncTasks: [UUID: Task<Void, Never>] = [:]
    
    private init() {}
    
    // MARK: - Sync All Gites
    func syncAll() async throws {
        let userId = try await supabase.currentUserId()
        
        // Fetch gites avec sources iCal
        let gites: [Gite] = try await supabase.client
            .from("gites")
            .select()
            .eq("owner_user_id", value: userId.uuidString)
            .execute()
            .value
        
        let gitesWithICal = gites.filter { ($0.icalSources?.count ?? 0) > 0 }
        
        print("🔄 [iCal] Syncing \(gitesWithICal.count) gites...")
        
        // Sync en parallèle
        await withTaskGroup(of: Void.self) { group in
            for gite in gitesWithICal {
                group.addTask {
                    try? await self.syncGite(gite)
                }
            }
        }
        
        print("✅ [iCal] Sync completed")
    }
    
    // MARK: - Sync Single Gite
    func syncGite(_ gite: Gite) async throws {
        guard let icalSources = gite.icalSources, !icalSources.isEmpty else {
            return
        }
        
        print("🔄 [iCal] Syncing \(gite.name)...")
        
        var allReservations: [Reservation] = []
        
        // Fetch depuis chaque source iCal
        for (platform, url) in icalSources {
            do {
                let reservations = try await fetchICalReservations(
                    from: url,
                    giteId: gite.id,
                    platform: platform
                )
                allReservations.append(contentsOf: reservations)
            } catch {
                print("⚠️ [iCal] Error fetching \(platform): \(error.localizedDescription)")
            }
        }
        
        // Résoudre conflits et sauvegarder
        try await resolveConflictsAndSave(
            newReservations: allReservations,
            giteId: gite.id
        )
    }
    
    // MARK: - Fetch iCal
    private func fetchICalReservations(
        from urlString: String,
        giteId: UUID,
        platform: String
    ) async throws -> [Reservation] {
        guard let url = URL(string: urlString) else {
            throw ICalError.invalidURL
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw ICalError.httpError
        }
        
        guard let icalString = String(data: data, encoding: .utf8) else {
            throw ICalError.decodingError
        }
        
        return try parseICalString(icalString, giteId: giteId, platform: platform)
    }
    
    // MARK: - Parse iCal (RFC 5545)
    private func parseICalString(
        _ icalString: String,
        giteId: UUID,
        platform: String
    ) throws -> [Reservation] {
        var reservations: [Reservation] = []
        let lines = icalString.components(separatedBy: .newlines)
        
        var currentEvent: [String: String] = [:]
        var inEvent = false
        
        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            
            if trimmed.starts(with: "BEGIN:VEVENT") {
                inEvent = true
                currentEvent = [:]
            } else if trimmed.starts(with: "END:VEVENT") {
                inEvent = false
                
                // Créer réservation depuis l'événement
                if let reservation = createReservation(
                    from: currentEvent,
                    giteId: giteId,
                    platform: platform
                ) {
                    reservations.append(reservation)
                }
            } else if inEvent {
                // Parser les propriétés
                let parts = trimmed.split(separator: ":", maxSplits: 1)
                if parts.count == 2 {
                    let key = String(parts[0])
                    let value = String(parts[1])
                    
                    // Gérer les clés avec paramètres (ex: DTSTART;VALUE=DATE:20260715)
                    let cleanKey = key.components(separatedBy: ";").first ?? key
                    currentEvent[cleanKey] = value
                }
            }
        }
        
        return reservations
    }
    
    // MARK: - Create Reservation from iCal Event
    private func createReservation(
        from event: [String: String],
        giteId: UUID,
        platform: String
    ) -> Reservation? {
        guard let dtStart = event["DTSTART"],
              let dtEnd = event["DTEND"] else {
            return nil
        }
        
        // Parser dates (format: 20260715 ou 20260715T150000Z)
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyyMMdd"
        dateFormatter.timeZone = TimeZone(identifier: "UTC")
        
        guard let checkIn = dateFormatter.date(from: String(dtStart.prefix(8))),
              let checkOut = dateFormatter.date(from: String(dtEnd.prefix(8))) else {
            return nil
        }
        
        let summary = event["SUMMARY"] ?? "Client iCal"
        let uid = event["UID"] ?? UUID().uuidString
        let description = event["DESCRIPTION"]
        
        // Créer réservation
        return Reservation(
            id: UUID(),
            ownerUserId: UUID(), // Sera remplacé lors de l'insert
            giteId: giteId,
            checkIn: checkIn,
            checkOut: checkOut,
            clientName: summary,
            clientEmail: nil,
            clientPhone: nil,
            clientAddress: nil,
            guestCount: nil,
            platform: platform,
            platformBookingId: nil,
            status: .confirmed,
            totalPrice: nil,
            currency: "EUR",
            paidAmount: 0,
            restant: 0,
            paiement: nil,
            notes: description,
            source: .ical,
            syncedFrom: platform,
            icalUid: uid,
            manualOverride: false,
            lastSeenInIcal: Date(),
            messageEnvoye: false,
            checkInTime: nil,
            checkOutTime: nil,
            gite: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
    }
    
    // MARK: - Resolve Conflicts and Save
    private func resolveConflictsAndSave(
        newReservations: [Reservation],
        giteId: UUID
    ) async throws {
        let userId = try await supabase.currentUserId()
        
        // Fetch réservations existantes du gîte
        let existing: [Reservation] = try await supabase.client
            .from("reservations")
            .select()
            .eq("owner_user_id", value: userId.uuidString)
            .eq("gite_id", value: giteId.uuidString)
            .execute()
            .value
        
        var toInsert: [Reservation] = []
        var toUpdate: [Reservation] = []
        var toDelete: [UUID] = []
        
        // Identifier réservations à insérer/mettre à jour
        for newRes in newReservations {
            // Chercher par icalUid
            if let existingRes = existing.first(where: { $0.icalUid == newRes.icalUid }) {
                // Vérifier si modification
                if existingRes.checkIn != newRes.checkIn || existingRes.checkOut != newRes.checkOut {
                    var updated = newRes
                    updated.id = existingRes.id
                    updated.ownerUserId = userId
                    toUpdate.append(updated)
                }
            } else {
                // Vérifier conflits
                let conflicts = existing.filter { newRes.hasConflict(with: $0) }
                
                if conflicts.isEmpty {
                    // Pas de conflit: insérer
                    var insert = newRes
                    insert.ownerUserId = userId
                    toInsert.append(insert)
                } else {
                    // Conflit: garder la plus courte (règle métier)
                    for conflict in conflicts {
                        if newRes.isShorterThan(conflict) && !conflict.manualOverride {
                            toDelete.append(conflict.id)
                            var insert = newRes
                            insert.ownerUserId = userId
                            toInsert.append(insert)
                        }
                    }
                }
            }
        }
        
        // Identifier réservations à supprimer (plus vues dans iCal depuis 7 jours)
        let weekAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date())!
        let icalReservations = existing.filter { $0.source == .ical && !$0.manualOverride }
        
        for icalRes in icalReservations {
            let stillExists = newReservations.contains { $0.icalUid == icalRes.icalUid }
            if !stillExists, let lastSeen = icalRes.lastSeenInIcal, lastSeen < weekAgo {
                toDelete.append(icalRes.id)
            }
        }
        
        // Exécuter les changements
        if !toInsert.isEmpty {
            let _: [Reservation] = try await supabase.client
                .from("reservations")
                .insert(toInsert)
                .select()
                .execute()
                .value
            
            print("✅ [iCal] Inserted \(toInsert.count) reservations")
        }
        
        for reservation in toUpdate {
            let _: Reservation = try await supabase.client
                .from("reservations")
                .update(reservation)
                .eq("id", value: reservation.id.uuidString)
                .select()
                .single()
                .execute()
                .value
        }
        
        if !toUpdate.isEmpty {
            print("✅ [iCal] Updated \(toUpdate.count) reservations")
        }
        
        for id in toDelete {
            try await supabase.client
                .from("reservations")
                .delete()
                .eq("id", value: id.uuidString)
                .execute()
        }
        
        if !toDelete.isEmpty {
            print("✅ [iCal] Deleted \(toDelete.count) reservations")
        }
    }
}

// MARK: - Errors
enum ICalError: Error, LocalizedError {
    case invalidURL
    case httpError
    case decodingError
    case parsingError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL: return "URL iCal invalide"
        case .httpError: return "Erreur lors du téléchargement iCal"
        case .decodingError: return "Impossible de décoder le fichier iCal"
        case .parsingError(let message): return "Erreur de parsing: \(message)"
        }
    }
}
