//
//  CleaningView.swift
//  LiveOwnerUnit
//
//  Gestion du planning de ménage
//

import SwiftUI

struct CleaningView: View {
    @StateObject private var cleaningVM = CleaningViewModel()
    @StateObject private var gitesVM = GitesViewModel()
    
    @State private var selectedWeek = Date()
    @State private var showingAddCleaning = false
    @State private var selectedCleaning: CleaningSchedule?
    
    private let calendar = Calendar.current
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Week Navigation
                weekNavigationSection
                
                // Weekly View
                ScrollView {
                    VStack(spacing: 15) {
                        ForEach(daysInWeek, id: \.self) { date in
                            DaySection(
                                date: date,
                                cleanings: cleaningsForDate(date),
                                onTap: { cleaning in
                                    selectedCleaning = cleaning
                                }
                            )
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Ménages")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: { showingAddCleaning = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddCleaning) {
                AddCleaningView()
            }
            .sheet(item: $selectedCleaning) { cleaning in
                CleaningDetailView(cleaning: cleaning, viewModel: cleaningVM)
            }
            .task {
                await loadData()
            }
        }
    }
    
    // MARK: - Week Navigation
    private var weekNavigationSection: some View {
        HStack {
            Button(action: previousWeek) {
                Image(systemName: "chevron.left")
            }
            
            Spacer()
            
            Text(weekString)
                .font(.headline)
            
            Spacer()
            
            Button(action: nextWeek) {
                Image(systemName: "chevron.right")
            }
            
            Button(action: goToThisWeek) {
                Text("Aujourd'hui")
                    .font(.caption)
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }
    
    // MARK: - Helpers
    private var weekString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d MMM"
        formatter.locale = Locale(identifier: "fr_FR")
        
        guard let weekStart = calendar.dateInterval(of: .weekOfYear, for: selectedWeek)?.start,
              let weekEnd = calendar.date(byAdding: .day, value: 6, to: weekStart) else {
            return ""
        }
        
        return "\(formatter.string(from: weekStart)) - \(formatter.string(from: weekEnd))"
    }
    
    private var daysInWeek: [Date] {
        guard let weekStart = calendar.dateInterval(of: .weekOfYear, for: selectedWeek)?.start else {
            return []
        }
        
        return (0..<7).compactMap { day in
            calendar.date(byAdding: .day, value: day, to: weekStart)
        }
    }
    
    private func cleaningsForDate(_ date: Date) -> [CleaningSchedule] {
        cleaningVM.cleaningSchedules.filter { cleaning in
            calendar.isDate(cleaning.scheduledDate, inSameDayAs: date)
        }
    }
    
    private func previousWeek() {
        selectedWeek = calendar.date(byAdding: .weekOfYear, value: -1, to: selectedWeek) ?? selectedWeek
        Task {
            try? await cleaningVM.fetchCleanings(forWeek: selectedWeek)
        }
    }
    
    private func nextWeek() {
        selectedWeek = calendar.date(byAdding: .weekOfYear, value: 1, to: selectedWeek) ?? selectedWeek
        Task {
            try? await cleaningVM.fetchCleanings(forWeek: selectedWeek)
        }
    }
    
    private func goToThisWeek() {
        selectedWeek = Date()
        Task {
            try? await cleaningVM.fetchCleanings(forWeek: selectedWeek)
        }
    }
    
    private func loadData() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { try? await cleaningVM.fetchCleanings(forWeek: selectedWeek) }
            group.addTask { try? await gitesVM.fetchGites() }
        }
    }
}

// MARK: - Day Section
struct DaySection: View {
    let date: Date
    let cleanings: [CleaningSchedule]
    let onTap: (CleaningSchedule) -> Void
    
    private let calendar = Calendar.current
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Date header
            HStack {
                Text(dayString)
                    .font(.headline)
                    .foregroundColor(calendar.isDateInToday(date) ? .blue : .primary)
                
                if calendar.isDateInToday(date) {
                    Text("Aujourd'hui")
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.blue.opacity(0.2))
                        .foregroundColor(.blue)
                        .cornerRadius(8)
                }
                
                Spacer()
                
                Text("\(cleanings.count) ménage(s)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            // Cleanings
            if cleanings.isEmpty {
                Text("Aucun ménage prévu")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color(.systemGray6))
                    .cornerRadius(10)
            } else {
                ForEach(cleanings) { cleaning in
                    CleaningRowView(cleaning: cleaning)
                        .onTapGesture {
                            onTap(cleaning)
                        }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
    
    private var dayString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE d MMM"
        formatter.locale = Locale(identifier: "fr_FR")
        return formatter.string(from: date).capitalized
    }
}

// MARK: - Cleaning Row
struct CleaningRowView: View {
    let cleaning: CleaningSchedule
    
    var body: some View {
        HStack(spacing: 12) {
            // Status indicator
            Circle()
                .fill(cleaning.status.color)
                .frame(width: 12, height: 12)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(cleaning.gite ?? "Gîte")
                    .font(.headline)
                
                HStack {
                    if let time = cleaning.scheduledTime {
                        Label(time, systemImage: "clock")
                    }
                    
                    Label(cleaning.durationFormatted, systemImage: "timer")
                    
                    if let assignedTo = cleaning.cleanerName {
                        Label(assignedTo, systemImage: "person")
                    }
                }
                .font(.caption2)
                .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text(cleaning.status.displayName)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(cleaning.status.color)
                
                if cleaning.issue {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.red)
                        .font(.caption)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

// MARK: - Cleaning Detail View
struct CleaningDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var viewModel: CleaningViewModel
    
    let cleaning: CleaningSchedule
    @State private var showingPhotoPicker = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Info Section
                    infoSection
                    
                    // Status
                    statusSection
                    
                    // Checklist
                    checklistSection
                    
                    // Photos
                    photosSection
                    
                    // Notes
                    notesSection
                    
                    // Actions
                    actionsSection
                }
                .padding()
            }
            .navigationTitle("Détails du ménage")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fermer") { dismiss() }
                }
            }
        }
    }
    
    private var infoSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(cleaning.gite ?? "Gîte")
                .font(.title)
                .fontWeight(.bold)
            
            HStack {
                Label(cleaning.dateFormatted, systemImage: "calendar")
                Label(cleaning.scheduledTime ?? "Non défini", systemImage: "clock")
            }
            .font(.subheadline)
            
            Text("Durée estimée : \(cleaning.durationFormatted)")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
    
    private var statusSection: some View {
        HStack {
            Text("Statut:")
                .fontWeight(.medium)
            
            Text(cleaning.status.displayName)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(cleaning.status.color.opacity(0.2))
                .foregroundColor(cleaning.status.color)
                .cornerRadius(8)
            
            Spacer()
        }
    }
    
    private var checklistSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Checklist")
                .font(.headline)
            
            if let checklist = cleaning.checklist {
                ChecklistProgressView(checklist: checklist)
            } else {
                Text("Aucune checklist")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
    
    private var photosSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Photos")
                    .font(.headline)
                
                Spacer()
                
                Button(action: { showingPhotoPicker = true }) {
                    Label("Ajouter", systemImage: "camera")
                        .font(.caption)
                }
            }
            
            if let photos = cleaning.photos, !photos.isEmpty {
                ScrollView(.horizontal) {
                    HStack {
                        ForEach(photos, id: \.self) { url in
                            AsyncImage(url: URL(string: url)) { image in
                                image.resizable()
                                    .aspectRatio(contentMode: .fill)
                            } placeholder: {
                                ProgressView()
                            }
                            .frame(width: 100, height: 100)
                            .cornerRadius(8)
                        }
                    }
                }
            } else {
                Text("Aucune photo")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
    
    private var notesSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Notes")
                .font(.headline)
            
            Text(cleaning.notes ?? "Aucune note")
                .font(.body)
                .foregroundColor(cleaning.notes == nil ? .secondary : .primary)
        }
    }
    
    private var actionsSection: some View {
        VStack(spacing: 10) {
            if cleaning.status == .planned {
                Button(action: {
                    Task {
                        try? await viewModel.markAsCompleted(cleaning.id)
                        dismiss()
                    }
                }) {
                    Text("Marquer comme terminé")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
            }
            
            Button(action: {
                Task {
                    try? await viewModel.deleteCleaning(cleaning.id)
                    dismiss()
                }
            }) {
                Text("Supprimer")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red.opacity(0.2))
                    .foregroundColor(.red)
                    .cornerRadius(10)
            }
        }
    }
}

// MARK: - Checklist Progress
struct ChecklistProgressView: View {
    let checklist: CleaningChecklist
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Progress bar
            ProgressView(value: Double(checklist.completion), total: 100)
                .tint(.green)
            
            Text("\(checklist.completion)% complété")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Add Cleaning View (Placeholder)
struct AddCleaningView: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            Form {
                Text("TODO: Formulaire ajout ménage")
            }
            .navigationTitle("Nouveau ménage")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Annuler") { dismiss() }
                }
            }
        }
    }
}

#Preview {
    CleaningView()
}
