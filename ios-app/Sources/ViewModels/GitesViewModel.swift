//
//  GitesViewModel.swift
//  LiveOwnerUnit
//
//  Gestion des gîtes
//

import Foundation
import Combine

@MainActor
class GitesViewModel: BaseViewModel {
    // MARK: - Published Properties
    @Published var gites: [Gite] = []
    @Published var selectedGite: Gite?
    
    // MARK: - Computed
    var activeGites: [Gite] {
        gites.filter { $0.isActive }.sorted { $0.displayOrder < $1.displayOrder }
    }
    
    // MARK: - Fetch Gites
    func fetchGites() async throws {
        guard let userId = try await supabase.currentUserId() else {
            throw SupabaseError.notAuthenticated
        }
        
        let response: [Gite] = try await supabase.client
            .from("gites")
            .select()
            .eq("owner_user_id", value: userId.uuidString)
            .order("display_order", ascending: true)
            .execute()
            .value
        
        gites = response
        
        // Sélectionner premier gîte si aucun sélectionné
        if selectedGite == nil, let first = activeGites.first {
            selectedGite = first
        }
    }
    
    // MARK: - Create Gite
    func createGite(_ gite: Gite) async throws {
        guard let userId = try await supabase.currentUserId() else {
            throw SupabaseError.notAuthenticated
        }
        
        var newGite = gite
        newGite.ownerUserId = userId
        
        let _: Gite = try await supabase.client
            .from("gites")
            .insert(newGite)
            .select()
            .single()
            .execute()
            .value
        
        try await fetchGites()
    }
    
    // MARK: - Update Gite
    func updateGite(_ gite: Gite) async throws {
        let _: Gite = try await supabase.client
            .from("gites")
            .update(gite)
            .eq("id", value: gite.id.uuidString)
            .select()
            .single()
            .execute()
            .value
        
        try await fetchGites()
    }
    
    // MARK: - Delete Gite
    func deleteGite(_ giteId: UUID) async throws {
        try await supabase.client
            .from("gites")
            .delete()
            .eq("id", value: giteId.uuidString)
            .execute()
        
        try await fetchGites()
    }
    
    // MARK: - Reorder Gites
    func reorderGites(from source: IndexSet, to destination: Int) {
        gites.move(fromOffsets: source, toOffset: destination)
        
        // Update display_order in background
        Task {
            for (index, gite) in gites.enumerated() {
                var updatedGite = gite
                updatedGite.displayOrder = index
                try? await supabase.client
                    .from("gites")
                    .update(["display_order": index])
                    .eq("id", value: gite.id.uuidString)
                    .execute()
            }
        }
    }
}
