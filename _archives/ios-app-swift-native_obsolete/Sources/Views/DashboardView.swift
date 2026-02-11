//
//  DashboardView.swift
//  LiveOwnerUnit
//
//  Tableau de bord principal
//

import SwiftUI

struct DashboardView: View {
    @StateObject private var reservationsVM = ReservationsViewModel()
    @StateObject private var cleaningVM = CleaningViewModel()
    @StateObject private var gitesVM = GitesViewModel()
    
    @State private var selectedPeriod: Period = .today
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Header avec période
                    headerSection
                    
                    // KPIs
                    kpiSection
                    
                    // Réservations à venir
                    upcomingReservationsSection
                    
                    // Ménages du jour
                    todayCleaningsSection
                    
                    // Alertes
                    alertsSection
                }
                .padding()
            }
            .navigationTitle("Tableau de bord")
            .refreshable {
                await loadData()
            }
            .task {
                await loadData()
            }
        }
    }
    
    // MARK: - Header
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Bienvenue")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Picker("Période", selection: $selectedPeriod) {
                ForEach(Period.allCases) { period in
                    Text(period.displayName).tag(period)
                }
            }
            .pickerStyle(.segmented)
        }
    }
    
    // MARK: - KPIs
    private var kpiSection: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 15) {
            KPICard(
                title: "Réservations",
                value: "\(reservationsVM.upcomingReservations.count)",
                icon: "calendar",
                color: .blue
            )
            
            KPICard(
                title: "Ménages",
                value: "\(cleaningVM.todayCleanings.count)",
                icon: "sparkles",
                color: .purple
            )
            
            KPICard(
                title: "Gîtes actifs",
                value: "\(gitesVM.activeGites.count)",
                icon: "house.fill",
                color: .green
            )
            
            KPICard(
                title: "Occupancy",
                value: "\(calculateOccupancy())%",
                icon: "chart.bar.fill",
                color: .orange
            )
        }
    }
    
    // MARK: - Upcoming Reservations
    private var upcomingReservationsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Réservations à venir")
                    .font(.headline)
                Spacer()
                NavigationLink {
                    ReservationListView()
                } label: {
                    Text("Voir tout")
                        .font(.caption)
                        .foregroundColor(.blue)
                }
            }
            
            if reservationsVM.upcomingReservations.isEmpty {
                EmptyStateView(message: "Aucune réservation à venir")
            } else {
                ForEach(reservationsVM.upcomingReservations.prefix(3)) { reservation in
                    NavigationLink {
                        ReservationDetailView(reservation: reservation)
                    } label: {
                        ReservationCard(reservation: reservation)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
    
    // MARK: - Today Cleanings
    private var todayCleaningsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Ménages aujourd'hui")
                    .font(.headline)
                Spacer()
                NavigationLink("Voir tout") {
                    CleaningView()
                }
                .font(.caption)
            }
            
            if cleaningVM.todayCleanings.isEmpty {
                EmptyStateView(message: "Aucun ménage prévu")
            } else {
                ForEach(cleaningVM.todayCleanings) { cleaning in
                    CleaningCard(cleaning: cleaning)
                }
            }
        }
    }
    
    // MARK: - Alerts
    private var alertsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Alertes")
                .font(.headline)
            
            // Ménages en retard
            if !cleaningVM.overdueCleanings.isEmpty {
                AlertCard(
                    title: "Ménages en retard",
                    message: "\(cleaningVM.overdueCleanings.count) ménage(s) non effectué(s)",
                    icon: "exclamationmark.triangle.fill",
                    color: .red
                )
            }
            
            // Conflits de réservations (TODO)
            
            if cleaningVM.overdueCleanings.isEmpty {
                EmptyStateView(message: "Aucune alerte")
            }
        }
    }
    
    // MARK: - Helpers
    private func loadData() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { try? await reservationsVM.fetchReservations() }
            group.addTask { try? await cleaningVM.fetchCleanings() }
            group.addTask { try? await gitesVM.fetchGites() }
        }
    }
    
    private func calculateOccupancy() -> Int {
        // TODO: Calculer taux d'occupation réel
        return 65
    }
}

// MARK: - Period Enum
enum Period: String, CaseIterable, Identifiable {
    case today = "Aujourd'hui"
    case week = "Semaine"
    case month = "Mois"
    
    var id: String { rawValue }
    var displayName: String { rawValue }
}

// MARK: - Subviews
struct KPICard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
            }
            
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

struct ReservationCard: View {
    let reservation: Reservation
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(reservation.clientName)
                    .font(.headline)
                
                Text("\(reservation.checkIn.formatted(date: .abbreviated, time: .omitted)) → \(reservation.checkOut.formatted(date: .abbreviated, time: .omitted))")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                HStack {
                    Label(reservation.gite ?? "Gîte", systemImage: "house")
                        .font(.caption2)
                    
                    if let platform = reservation.platform {
                        Label(platform, systemImage: reservation.platformIcon)
                            .font(.caption2)
                            .foregroundColor(reservation.platformColor)
                    }
                }
            }
            
            Spacer()
            
            VStack(alignment: .trailing) {
                Text("\(reservation.nights) nuit(s)")
                    .font(.caption)
                
                if let price = reservation.totalPrice {
                    Text("\(price, format: .currency(code: reservation.currency))")
                        .font(.headline)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
        .shadow(radius: 1)
    }
}

struct CleaningCard: View {
    let cleaning: CleaningSchedule
    
    var body: some View {
        HStack {
            Image(systemName: cleaning.status.icon)
                .foregroundColor(cleaning.status.color)
                .font(.title2)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(cleaning.gite ?? "Gîte")
                    .font(.headline)
                
                if let time = cleaning.scheduledTime {
                    Text("À \(time) • \(cleaning.durationFormatted)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            Text(cleaning.status.displayName)
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(cleaning.status.color.opacity(0.2))
                .foregroundColor(cleaning.status.color)
                .cornerRadius(8)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
        .shadow(radius: 1)
    }
}

struct AlertCard: View {
    let title: String
    let message: String
    let icon: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title2)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                Text(message)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(10)
    }
}

struct EmptyStateView: View {
    let message: String
    
    var body: some View {
        Text(message)
            .font(.caption)
            .foregroundColor(.secondary)
            .frame(maxWidth: .infinity, alignment: .center)
            .padding()
    }
}

#Preview {
    DashboardView()
}
