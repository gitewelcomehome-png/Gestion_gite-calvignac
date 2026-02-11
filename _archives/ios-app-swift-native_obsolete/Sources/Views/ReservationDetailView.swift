//
//  ReservationDetailView.swift
//  LiveOwnerUnit
//
//  Détails d'une réservation avec envoi de fiche client
//

import SwiftUI
import MessageUI

struct ReservationDetailView: View {
    let reservation: Reservation
    
    @StateObject private var viewModel = ReservationDetailViewModel()
    @State private var showingSharingSheet = false
    @State private var showingMailComposer = false
    @State private var showingMessageComposer = false
    @State private var generatedURL: URL?
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Header avec numéro
                headerSection
                
                // Client Info
                clientSection
                
                // Dates & Séjour
                datesSection
                
                // Paiement
                paymentSection
                
                // Fiche Client
                clientSheetSection
                
                // Actions
                actionsSection
            }
            .padding()
        }
        .navigationTitle("Réservation")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Erreur", isPresented: $viewModel.showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(viewModel.errorMessage ?? "Erreur inconnue")
        }
        .sheet(isPresented: $showingMailComposer) {
            if let url = generatedURL, MFMailComposeViewController.canSendMail() {
                MailComposeView(
                    recipients: [reservation.clientEmail ?? ""],
                    subject: "Votre fiche client pour \(reservation.gite ?? "votre gîte")",
                    body: viewModel.generateEmailBody(for: reservation, url: url)
                )
            }
        }
        .sheet(isPresented: $showingMessageComposer) {
            if let url = generatedURL, MFMessageComposeViewController.canSendText() {
                MessageComposeView(
                    recipients: [reservation.clientPhone ?? ""],
                    body: viewModel.generateSMSBody(for: reservation, url: url)
                )
            }
        }
        .sheet(isPresented: $showingSharingSheet) {
            if let url = generatedURL {
                ActivityView(activityItems: [url, viewModel.generateSMSBody(for: reservation, url: url)])
            }
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 12) {
            // Numéro de réservation
            HStack {
                Image(systemName: "number.circle.fill")
                    .foregroundColor(.blue)
                    .font(.title2)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("N° de réservation")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("#\(reservation.id.uuidString.prefix(8).uppercased())")
                        .font(.headline)
                        .fontWeight(.bold)
                }
                
                Spacer()
                
                Button {
                    UIPasteboard.general.string = reservation.id.uuidString
                    // TODO: Afficher toast "Copié"
                } label: {
                    Image(systemName: "doc.on.doc")
                        .foregroundColor(.blue)
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            
            // Statut
            HStack {
                Spacer()
                Text(reservation.status.displayName)
                    .font(.headline)
                    .foregroundColor(reservation.status.color)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(reservation.status.color.opacity(0.15))
                    .cornerRadius(20)
                Spacer()
            }
        }
    }
    
    // MARK: - Client Section
    private var clientSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Informations Client")
                .font(.title3)
                .fontWeight(.bold)
            
            InfoRow(icon: "person.fill", label: "Nom", value: reservation.clientName)
            
            if let email = reservation.clientEmail {
                InfoRow(icon: "envelope.fill", label: "Email", value: email, isLink: true, action: {
                    if let url = URL(string: "mailto:\(email)") {
                        UIApplication.shared.open(url)
                    }
                })
            }
            
            if let phone = reservation.clientPhone {
                InfoRow(icon: "phone.fill", label: "Téléphone", value: phone, isLink: true, action: {
                    if let url = URL(string: "tel:\(phone)") {
                        UIApplication.shared.open(url)
                    }
                })
            }
            
            if let guestCount = reservation.guestCount {
                InfoRow(icon: "person.2.fill", label: "Voyageurs", value: "\(guestCount)")
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
    
    // MARK: - Dates Section
    private var datesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Dates & Séjour")
                .font(.title3)
                .fontWeight(.bold)
            
            if let gite = reservation.gite {
                InfoRow(icon: "house.fill", label: "Gîte", value: gite)
            }
            
            InfoRow(
                icon: "calendar",
                label: "Arrivée",
                value: reservation.checkIn.formatted(date: .long, time: .omitted)
            )
            
            InfoRow(
                icon: "calendar",
                label: "Départ",
                value: reservation.checkOut.formatted(date: .long, time: .omitted)
            )
            
            InfoRow(
                icon: "moon.fill",
                label: "Durée",
                value: "\(reservation.nights) nuit\(reservation.nights > 1 ? "s" : "")"
            )
            
            if let platform = reservation.platform {
                HStack {
                    Image(systemName: reservation.platformIcon)
                        .foregroundColor(reservation.platformColor)
                    Text(platform)
                        .foregroundColor(reservation.platformColor)
                        .fontWeight(.semibold)
                    Spacer()
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
    
    // MARK: - Payment Section
    private var paymentSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Paiement")
                .font(.title3)
                .fontWeight(.bold)
            
            if let totalPrice = reservation.totalPrice {
                InfoRow(
                    icon: "eurosign.circle.fill",
                    label: "Prix total",
                    value: totalPrice.formatted(.currency(code: reservation.currency))
                )
            }
            
            InfoRow(
                icon: "checkmark.circle.fill",
                label: "Payé",
                value: reservation.paidAmount.formatted(.currency(code: reservation.currency)),
                valueColor: .green
            )
            
            if reservation.calculatedRestant > 0 {
                InfoRow(
                    icon: "exclamationmark.circle.fill",
                    label: "Restant",
                    value: reservation.calculatedRestant.formatted(.currency(code: reservation.currency)),
                    valueColor: .orange
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
    
    // MARK: - Client Sheet Section
    private var clientSheetSection: some View {
        VStack(spacing: 16) {
            HStack {
                Image(systemName: "doc.text.fill")
                    .font(.title2)
                    .foregroundColor(.blue)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Fiche Client")
                        .font(.headline)
                    Text(reservation.messageEnvoye ? "Envoyée ✓" : "Non envoyée")
                        .font(.caption)
                        .foregroundColor(reservation.messageEnvoye ? .green : .orange)
                }
                
                Spacer()
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            
            // Actions d'envoi
            VStack(spacing: 12) {
                if let email = reservation.clientEmail, !email.isEmpty {
                    ShareButton(
                        icon: "envelope.fill",
                        label: "Envoyer par Email",
                        color: .blue
                    ) {
                        await sendClientSheet(via: .email)
                    }
                }
                
                if let phone = reservation.clientPhone, !phone.isEmpty {
                    ShareButton(
                        icon: "message.fill",
                        label: "Envoyer par SMS",
                        color: .green
                    ) {
                        await sendClientSheet(via: .sms)
                    }
                    
                    ShareButton(
                        icon: "app.badge.fill",
                        label: "Envoyer par WhatsApp",
                        color: Color(red: 0.15, green: 0.68, blue: 0.38)
                    ) {
                        await sendClientSheet(via: .whatsapp)
                    }
                }
                
                ShareButton(
                    icon: "doc.on.doc.fill",
                    label: "Copier le lien",
                    color: .gray
                ) {
                    await copyClientSheetLink()
                }
                
                ShareButton(
                    icon: "square.and.arrow.up",
                    label: "Partager...",
                    color: .purple
                ) {
                    await showShareSheet()
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
    
    // MARK: - Actions Section
    private var actionsSection: some View {
        VStack(spacing: 12) {
            Button {
                // TODO: Éditer réservation
            } label: {
                Label("Modifier la réservation", systemImage: "pencil")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
            
            Button(role: .destructive) {
                // TODO: Supprimer réservation
            } label: {
                Label("Supprimer", systemImage: "trash")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red.opacity(0.1))
                    .foregroundColor(.red)
                    .cornerRadius(12)
            }
        }
    }
    
    // MARK: - Actions
    private func sendClientSheet(via method: SharingMethod) async {
        do {
            viewModel.startLoading()
            let url = try await ClientSheetService.shared.generateClientSheetURL(for: reservation)
            generatedURL = url
            viewModel.stopLoading()
            
            switch method {
            case .email:
                if MFMailComposeViewController.canSendMail() {
                    showingMailComposer = true
                } else {
                    viewModel.errorMessage = "Email non configuré sur cet appareil"
                    viewModel.showError = true
                }
            case .sms:
                if MFMessageComposeViewController.canSendText() {
                    showingMessageComposer = true
                } else {
                    viewModel.errorMessage = "SMS non disponible sur cet appareil"
                    viewModel.showError = true
                }
            case .whatsapp:
                await openWhatsApp(url: url)
            case .copy:
                break
            }
        } catch {
            viewModel.handleError(error)
        }
    }
    
    private func copyClientSheetLink() async {
        do {
            viewModel.startLoading()
            let url = try await ClientSheetService.shared.generateClientSheetURL(for: reservation)
            UIPasteboard.general.url = url
            viewModel.stopLoading()
            // TODO: Afficher toast "Lien copié"
        } catch {
            viewModel.handleError(error)
        }
    }
    
    private func showShareSheet() async {
        do {
            viewModel.startLoading()
            let url = try await ClientSheetService.shared.generateClientSheetURL(for: reservation)
            generatedURL = url
            viewModel.stopLoading()
            showingSharingSheet = true
        } catch {
            viewModel.handleError(error)
        }
    }
    
    private func openWhatsApp(url: URL) async {
        let message = viewModel.generateSMSBody(for: reservation, url: url)
        let encodedMessage = message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let phone = reservation.clientPhone?.replacingOccurrences(of: " ", with: "") ?? ""
        
        if let whatsappURL = URL(string: "https://wa.me/\(phone)?text=\(encodedMessage)") {
            if await UIApplication.shared.canOpenURL(whatsappURL) {
                await UIApplication.shared.open(whatsappURL)
            } else {
                viewModel.errorMessage = "WhatsApp n'est pas installé"
                viewModel.showError = true
            }
        }
    }
}

// MARK: - Supporting Views

struct InfoRow: View {
    let icon: String
    let label: String
    let value: String
    var isLink: Bool = false
    var valueColor: Color = .primary
    var action: (() -> Void)?
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 24)
            
            Text(label)
                .foregroundColor(.secondary)
            
            Spacer()
            
            if isLink, let action = action {
                Button(action: action) {
                    Text(value)
                        .foregroundColor(.blue)
                        .underline()
                }
            } else {
                Text(value)
                    .fontWeight(.semibold)
                    .foregroundColor(valueColor)
            }
        }
    }
}

struct ShareButton: View {
    let icon: String
    let label: String
    let color: Color
    let action: () async -> Void
    
    @State private var isLoading = false
    
    var body: some View {
        Button {
            Task {
                isLoading = true
                await action()
                isLoading = false
            }
        } label: {
            HStack {
                Image(systemName: icon)
                Text(label)
                Spacer()
                if isLoading {
                    ProgressView()
                        .tint(.white)
                }
            }
            .padding()
            .background(color)
            .foregroundColor(.white)
            .cornerRadius(10)
        }
        .disabled(isLoading)
    }
}

// MARK: - ViewModel
@MainActor
class ReservationDetailViewModel: BaseViewModel {
    func generateEmailBody(for reservation: Reservation, url: URL) -> String {
        let giteName = reservation.gite ?? "votre gîte"
        let checkIn = reservation.checkIn.formatted(date: .long, time: .omitted)
        let checkOut = reservation.checkOut.formatted(date: .long, time: .omitted)
        
        return """
        Bonjour \(reservation.clientName),
        
        Votre réservation pour \(giteName) du \(checkIn) au \(checkOut) est confirmée ! 🏡
        
        Pour faciliter votre arrivée, merci de compléter votre fiche client en cliquant sur ce lien :
        \(url.absoluteString)
        
        À très bientôt !
        """
    }
    
    func generateSMSBody(for reservation: Reservation, url: URL) -> String {
        let giteName = reservation.gite ?? "votre gîte"
        return "Bonjour \(reservation.clientName), merci de compléter votre fiche client pour \(giteName): \(url.absoluteString)"
    }
}

// MARK: - Mail Composer
struct MailComposeView: UIViewControllerRepresentable {
    let recipients: [String]
    let subject: String
    let body: String
    @Environment(\.presentationMode) var presentation
    
    func makeUIViewController(context: Context) -> MFMailComposeViewController {
        let vc = MFMailComposeViewController()
        vc.setToRecipients(recipients)
        vc.setSubject(subject)
        vc.setMessageBody(body, isHTML: false)
        vc.mailComposeDelegate = context.coordinator
        return vc
    }
    
    func updateUIViewController(_ uiViewController: MFMailComposeViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, MFMailComposeViewControllerDelegate {
        let parent: MailComposeView
        
        init(_ parent: MailComposeView) {
            self.parent = parent
        }
        
        func mailComposeController(_ controller: MFMailComposeViewController, didFinishWith result: MFMailComposeResult, error: Error?) {
            parent.presentation.wrappedValue.dismiss()
        }
    }
}

// MARK: - Message Composer
struct MessageComposeView: UIViewControllerRepresentable {
    let recipients: [String]
    let body: String
    @Environment(\.presentationMode) var presentation
    
    func makeUIViewController(context: Context) -> MFMessageComposeViewController {
        let vc = MFMessageComposeViewController()
        vc.recipients = recipients
        vc.body = body
        vc.messageComposeDelegate = context.coordinator
        return vc
    }
    
    func updateUIViewController(_ uiViewController: MFMessageComposeViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, MFMessageComposeViewControllerDelegate {
        let parent: MessageComposeView
        
        init(_ parent: MessageComposeView) {
            self.parent = parent
        }
        
        func messageComposeViewController(_ controller: MFMessageComposeViewController, didFinishWith result: MessageComposeResult) {
            parent.presentation.wrappedValue.dismiss()
        }
    }
}

// MARK: - Activity View
struct ActivityView: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

// MARK: - Preview
#Preview {
    NavigationStack {
        ReservationDetailView(
            reservation: Reservation(
                id: UUID(),
                ownerUserId: UUID(),
                giteId: UUID(),
                checkIn: Date(),
                checkOut: Date().addingTimeInterval(86400 * 7),
                clientName: "Jean Dupont",
                clientEmail: "jean@example.com",
                clientPhone: "+33612345678",
                clientAddress: nil,
                guestCount: 4,
                platform: "Airbnb",
                platformBookingId: nil,
                status: .confirmed,
                totalPrice: 850,
                currency: "EUR",
                paidAmount: 850,
                restant: 0,
                paiement: nil,
                notes: nil,
                source: .manual,
                syncedFrom: nil,
                icalUid: nil,
                manualOverride: false,
                lastSeenInIcal: nil,
                messageEnvoye: false,
                checkInTime: nil,
                checkOutTime: nil,
                gite: "Le Patio",
                createdAt: Date(),
                updatedAt: Date()
            )
        )
    }
}
