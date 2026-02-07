//
//  CalendarView.swift
//  LiveOwnerUnit
//
//  Vue calendrier mensuel avec réservations
//

import SwiftUI

struct CalendarView: View {
    @StateObject private var reservationsVM = ReservationsViewModel()
    @StateObject private var gitesVM = GitesViewModel()
    
    @State private var selectedMonth = Date()
    @State private var showingAddReservation = false
    @State private var selectedReservation: Reservation?
    
    private let calendar = Calendar.current
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Filtre par gîte
                giteFilterSection
                
                // Calendrier
                monthNavigationSection
                
                ScrollView {
                    calendarGridSection
                }
            }
            .navigationTitle("Calendrier")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: { showingAddReservation = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddReservation) {
                AddReservationView(gites: gitesVM.gites)
            }
            .sheet(item: $selectedReservation) { reservation in
                ReservationDetailView(reservation: reservation)
            }
            .task {
                await loadData()
            }
        }
    }
    
    // MARK: - Gite Filter
    private var giteFilterSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                FilterChip(
                    title: "Tous",
                    isSelected: gitesVM.selectedGite == nil,
                    action: { gitesVM.selectedGite = nil }
                )
                
                ForEach(gitesVM.activeGites) { gite in
                    FilterChip(
                        title: gite.name,
                        isSelected: gitesVM.selectedGite?.id == gite.id,
                        color: gite.swiftUIColor,
                        action: { gitesVM.selectedGite = gite }
                    )
                }
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 10)
        .background(Color(.systemGroupedBackground))
    }
    
    // MARK: - Month Navigation
    private var monthNavigationSection: some View {
        HStack {
            Button(action: previousMonth) {
                Image(systemName: "chevron.left")
            }
            
            Spacer()
            
            Text(monthYearString)
                .font(.headline)
            
            Spacer()
            
            Button(action: nextMonth) {
                Image(systemName: "chevron.right")
            }
            
            Button(action: goToToday) {
                Text("Aujourd'hui")
                    .font(.caption)
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    // MARK: - Calendar Grid
    private var calendarGridSection: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 1) {
            // Weekday headers
            ForEach(weekdaySymbols, id: \.self) { day in
                Text(day)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .frame(height: 30)
            }
            
            // Days
            ForEach(daysInMonth, id: \.self) { date in
                DayCell(
                    date: date,
                    reservations: reservationsForDate(date),
                    isCurrentMonth: calendar.isDate(date, equalTo: selectedMonth, toGranularity: .month),
                    isToday: calendar.isDateInToday(date),
                    onTap: { reservation in
                        selectedReservation = reservation
                    }
                )
            }
        }
        .padding()
    }
    
    // MARK: - Helpers
    private var monthYearString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        formatter.locale = Locale(identifier: "fr_FR")
        return formatter.string(from: selectedMonth).capitalized
    }
    
    private var weekdaySymbols: [String] {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "fr_FR")
        return formatter.veryShortWeekdaySymbols
    }
    
    private var daysInMonth: [Date] {
        guard let monthInterval = calendar.dateInterval(of: .month, for: selectedMonth),
              let monthFirstWeek = calendar.dateInterval(of: .weekOfMonth, for: monthInterval.start),
              let monthLastWeek = calendar.dateInterval(of: .weekOfMonth, for: monthInterval.end - 1) else {
            return []
        }
        
        var dates: [Date] = []
        var date = monthFirstWeek.start
        
        while date < monthLastWeek.end {
            dates.append(date)
            date = calendar.date(byAdding: .day, value: 1, to: date)!
        }
        
        return dates
    }
    
    private func reservationsForDate(_ date: Date) -> [Reservation] {
        let filtered = reservationsVM.reservations.filter { reservation in
            // Filtrer par gîte si sélectionné
            if let selectedGite = gitesVM.selectedGite, reservation.giteId != selectedGite.id {
                return false
            }
            
            // Date dans la période de réservation ?
            return reservation.checkIn <= date && reservation.checkOut > date
        }
        
        return filtered
    }
    
    private func previousMonth() {
        selectedMonth = calendar.date(byAdding: .month, value: -1, to: selectedMonth) ?? selectedMonth
    }
    
    private func nextMonth() {
        selectedMonth = calendar.date(byAdding: .month, value: 1, to: selectedMonth) ?? selectedMonth
    }
    
    private func goToToday() {
        selectedMonth = Date()
    }
    
    private func loadData() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { try? await reservationsVM.fetchReservations() }
            group.addTask { try? await gitesVM.fetchGites() }
        }
    }
}

// MARK: - Subviews
struct FilterChip: View {
    let title: String
    let isSelected: Bool
    var color: Color = .blue
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? color : Color(.systemGray5))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(16)
        }
    }
}

struct DayCell: View {
    let date: Date
    let reservations: [Reservation]
    let isCurrentMonth: Bool
    let isToday: Bool
    let onTap: (Reservation) -> Void
    
    private let calendar = Calendar.current
    
    var body: some View {
        VStack(spacing: 2) {
            // Day number
            Text("\(calendar.component(.day, from: date))")
                .font(.caption)
                .foregroundColor(isCurrentMonth ? (isToday ? .blue : .primary) : .secondary)
                .fontWeight(isToday ? .bold : .regular)
            
            // Reservation indicators
            if !reservations.isEmpty {
                ForEach(reservations.prefix(3)) { reservation in
                    Button(action: { onTap(reservation) }) {
                        Rectangle()
                            .fill(reservation.platformColor.opacity(0.6))
                            .frame(height: 4)
                            .cornerRadius(2)
                    }
                }
                
                if reservations.count > 3 {
                    Text("+\(reservations.count - 3)")
                        .font(.system(size: 8))
                        .foregroundColor(.secondary)
                }
            }
        }
        .frame(height: 60)
        .frame(maxWidth: .infinity)
        .background(isToday ? Color.blue.opacity(0.1) : Color.clear)
        .cornerRadius(4)
    }
}

// MARK: - Add Reservation View (Placeholder)
struct AddReservationView: View {
    @Environment(\.dismiss) private var dismiss
    let gites: [Gite]
    
    var body: some View {
        NavigationStack {
            Form {
                Text("TODO: Formulaire ajout réservation")
            }
            .navigationTitle("Nouvelle réservation")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Annuler") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Reservation Detail View (Placeholder)
struct ReservationDetailView: View {
    let reservation: Reservation
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text(reservation.clientName)
                        .font(.largeTitle)
                    
                    Text("TODO: Détails réservation")
                }
                .padding()
            }
            .navigationTitle("Détails")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    CalendarView()
}
