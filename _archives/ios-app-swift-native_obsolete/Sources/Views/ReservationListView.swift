//
//  ReservationListView.swift
//  LiveOwnerUnit
//
//  Liste complète des réservations avec recherche et filtres
//

import SwiftUI

struct ReservationListView: View {
    @StateObject private var viewModel = ReservationsViewModel()
    @State private var searchText = ""
    @State private var selectedFilter: ReservationFilter = .all
    @State private var selectedReservation: Reservation?
    @State private var showingAddReservation = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Filtres
                filterSection
                
                // Liste
                if filteredReservations.isEmpty {
                    emptyStateView
                } else {
                    List {
                        ForEach(filteredReservations) { reservation in
                            NavigationLink {
                                ReservationDetailView(reservation: reservation)
                            } label: {
                                ReservationRowView(reservation: reservation)
                            }
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Réservations (\(filteredReservations.count))")
            .searchable(text: $searchText, prompt: "Rechercher un client...")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddReservation = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                    }
                }
            }
            .refreshable {
                await loadData()
            }
            .task {
                await loadData()
            }
            .sheet(isPresented: $showingAddReservation) {
                AddReservationView()
            }
            .alert("Erreur", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "Erreur inconnue")
            }
        }
    }
    
    // MARK: - Filter Section
    private var filterSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(ReservationFilter.allCases) { filter in
                    FilterChip(
                        title: filter.displayName,
                        count: countForFilter(filter),
                        isSelected: selectedFilter == filter
                    ) {
                        withAnimation {
                            selectedFilter = filter
                        }
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(Color(.systemBackground))
    }
    
    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "calendar.badge.exclamationmark")
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            Text("Aucune réservation")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text(emptyStateMessage)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            
            Button {
                showingAddReservation = true
            } label: {
                Label("Ajouter une réservation", systemImage: "plus.circle.fill")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(12)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private var emptyStateMessage: String {
        if !searchText.isEmpty {
            return "Aucun résultat pour \"\(searchText)\""
        }
        switch selectedFilter {
        case .all: return "Ajoutez votre première réservation"
        case .upcoming: return "Aucune réservation à venir"
        case .ongoing: return "Aucune réservation en cours"
        case .past: return "Aucune réservation passée"
        }
    }
    
    // MARK: - Filtered Reservations
    private var filteredReservations: [Reservation] {
        var reservations: [Reservation]
        
        switch selectedFilter {
        case .all:
            reservations = viewModel.reservations
        case .upcoming:
            reservations = viewModel.upcomingReservations
        case .ongoing:
            reservations = viewModel.ongoingReservations
        case .past:
            reservations = viewModel.pastReservations
        }
        
        if searchText.isEmpty {
            return reservations
        }
        
        return reservations.filter { reservation in
            reservation.clientName.localizedCaseInsensitiveContains(searchText) ||
            reservation.gite?.localizedCaseInsensitiveContains(searchText) == true ||
            reservation.clientEmail?.localizedCaseInsensitiveContains(searchText) == true
        }
    }
    
    private func countForFilter(_ filter: ReservationFilter) -> Int {
        switch filter {
        case .all: return viewModel.reservations.count
        case .upcoming: return viewModel.upcomingReservations.count
        case .ongoing: return viewModel.ongoingReservations.count
        case .past: return viewModel.pastReservations.count
        }
    }
    
    // MARK: - Load Data
    private func loadData() async {
        do {
            try await viewModel.fetchReservations()
        } catch {
            print("Erreur chargement réservations: \(error)")
        }
    }
}

// MARK: - Reservation Row
struct ReservationRowView: View {
    let reservation: Reservation
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                // Numéro de réservation (6 premiers caractères de l'UUID)
                Text("#\(reservation.id.uuidString.prefix(6))")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.blue)
                    .cornerRadius(4)
                
                Spacer()
                
                // Statut
                Text(reservation.status.displayName)
                    .font(.caption)
                    .foregroundColor(reservation.status.color)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(reservation.status.color.opacity(0.1))
                    .cornerRadius(8)
            }
            
            // Nom client
            Text(reservation.clientName)
                .font(.headline)
            
            // Gîte
            if let gite = reservation.gite {
                Label(gite, systemImage: "house.fill")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            // Dates
            HStack {
                Image(systemName: "calendar")
                    .foregroundColor(.secondary)
                Text("\(reservation.checkIn.formatted(date: .abbreviated, time: .omitted)) → \(reservation.checkOut.formatted(date: .abbreviated, time: .omitted))")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Text("• \(reservation.nights) nuit\(reservation.nights > 1 ? "s" : "")")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Plateforme & Prix
            HStack {
                if let platform = reservation.platform {
                    Label(platform, systemImage: reservation.platformIcon)
                        .font(.caption)
                        .foregroundColor(reservation.platformColor)
                }
                
                Spacer()
                
                if let price = reservation.totalPrice {
                    Text(price, format: .currency(code: reservation.currency))
                        .font(.headline)
                        .foregroundColor(.green)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let title: String
    let count: Int
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(isSelected ? .semibold : .regular)
                
                Text("\(count)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(isSelected ? Color.white.opacity(0.3) : Color.gray.opacity(0.2))
                    .cornerRadius(8)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isSelected ? Color.blue : Color(.systemGray5))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(20)
        }
    }
}

// MARK: - Filter Enum
enum ReservationFilter: String, CaseIterable, Identifiable {
    case all = "Toutes"
    case upcoming = "À venir"
    case ongoing = "En cours"
    case past = "Passées"
    
    var id: String { rawValue }
    var displayName: String { rawValue }
}

// MARK: - Preview
#Preview {
    ReservationListView()
}
