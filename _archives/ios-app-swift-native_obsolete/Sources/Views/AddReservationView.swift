//
//  AddReservationView.swift
//  LiveOwnerUnit
//
//  Formulaire d'ajout de réservation manuelle
//

import SwiftUI

struct AddReservationView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AddReservationViewModel()
    
    @State private var clientName = ""
    @State private var clientEmail = ""
    @State private var clientPhone = ""
    @State private var selectedGiteId: UUID?
    @State private var checkIn = Date()
    @State private var checkOut = Calendar.current.date(byAdding: .day, value: 7, to: Date()) ?? Date()
    @State private var guestCount = 2
    @State private var platform = "Manuelle"
    @State private var totalPrice: String = ""
    @State private var notes = ""
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Client") {
                    TextField("Nom complet*", text: $clientName)
                    TextField("Email", text: $clientEmail)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                    TextField("Téléphone", text: $clientPhone)
                        .keyboardType(.phonePad)
                        .textContentType(.telephoneNumber)
                }
                
                Section("Séjour") {
                    Picker("Gîte*", selection: $selectedGiteId) {
                        Text("Sélectionner un gîte").tag(nil as UUID?)
                        ForEach(viewModel.gites) { gite in
                            Text(gite.name).tag(gite.id as UUID?)
                        }
                    }
                    
                    DatePicker("Arrivée", selection: $checkIn, displayedComponents: .date)
                    DatePicker("Départ", selection: $checkOut, displayedComponents: .date)
                    
                    Stepper("Voyageurs: \(guestCount)", value: $guestCount, in: 1...20)
                }
                
                Section("Réservation") {
                    Picker("Plateforme", selection: $platform) {
                        ForEach(["Manuelle", "Airbnb", "Booking.com", "Abritel", "Gîtes de France"], id: \.self) { platform in
                            Text(platform)
                        }
                    }
                    
                    TextField("Prix total", text: $totalPrice)
                        .keyboardType(.decimalPad)
                }
                
                Section("Notes") {
                    TextField("Notes internes (optionnel)", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle("Nouvelle réservation")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Annuler") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("Ajouter") {
                        Task {
                            await saveReservation()
                        }
                    }
                    .disabled(!isValid || viewModel.isLoading)
                }
            }
            .task {
                await viewModel.loadGites()
            }
            .alert("Erreur", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "Erreur inconnue")
            }
        }
    }
    
    private var isValid: Bool {
        !clientName.isEmpty && selectedGiteId != nil && checkOut > checkIn
    }
    
    private func saveReservation() async {
        guard let giteId = selectedGiteId else { return }
        
        let price = Decimal(string: totalPrice.replacingOccurrences(of: ",", with: "."))
        
        let reservation = Reservation(
            id: UUID(),
            ownerUserId: UUID(), // Sera remplacé par le VM
            giteId: giteId,
            checkIn: checkIn,
            checkOut: checkOut,
            clientName: clientName,
            clientEmail: clientEmail.isEmpty ? nil : clientEmail,
            clientPhone: clientPhone.isEmpty ? nil : clientPhone,
            clientAddress: nil,
            guestCount: guestCount,
            platform: platform,
            platformBookingId: nil,
            status: .confirmed,
            totalPrice: price,
            currency: "EUR",
            paidAmount: 0,
            restant: price ?? 0,
            paiement: nil,
            notes: notes.isEmpty ? nil : notes,
            source: .manual,
            syncedFrom: nil,
            icalUid: nil,
            manualOverride: true,
            lastSeenInIcal: nil,
            messageEnvoye: false,
            checkInTime: nil,
            checkOutTime: nil,
            gite: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        let success = await viewModel.saveReservation(reservation)
        if success {
            dismiss()
        }
    }
}

// MARK: - ViewModel
@MainActor
class AddReservationViewModel: BaseViewModel {
    @Published var gites: [Gite] = []
    private let reservationsVM = ReservationsViewModel()
    
    func loadGites() async {
        startLoading()
        do {
            let userId = try await supabase.currentUserId()
            
            let loadedGites: [Gite] = try await supabase.client
                .from("gites")
                .select()
                .eq("owner_user_id", value: userId.uuidString)
                .order("ordre_affichage", ascending: true)
                .execute()
                .value
            
            gites = loadedGites
            stopLoading()
        } catch {
            handleError(error)
        }
    }
    
    func saveReservation(_ reservation: Reservation) async -> Bool {
        startLoading()
        do {
            try await reservationsVM.createReservation(reservation)
            stopLoading()
            return true
        } catch {
            handleError(error)
            return false
        }
    }
}

#Preview {
    AddReservationView()
}
