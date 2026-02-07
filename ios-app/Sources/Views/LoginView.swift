//
//  LoginView.swift
//  LiveOwnerUnit
//
//  Écran de connexion avec Face ID/Touch ID
//

import SwiftUI
import LocalAuthentication

struct LoginView: View {
    @StateObject private var viewModel = LoginViewModel()
    @State private var email = ""
    @State private var password = ""
    @State private var showingRegister = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background gradient
                LinearGradient(
                    gradient: Gradient(colors: [Color.blue.opacity(0.6), Color.purple.opacity(0.6)]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                VStack(spacing: 30) {
                    Spacer()
                    
                    // Logo
                    VStack(spacing: 10) {
                        Image(systemName: "house.fill")
                            .font(.system(size: 80))
                            .foregroundColor(.white)
                        
                        Text("LiveOwnerUnit")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text("Gestion de vos gîtes")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    
                    Spacer()
                    
                    // Login Form
                    VStack(spacing: 20) {
                        TextField("Email", text: $email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                            .padding()
                            .background(Color.white.opacity(0.9))
                            .cornerRadius(10)
                        
                        SecureField("Mot de passe", text: $password)
                            .textContentType(.password)
                            .padding()
                            .background(Color.white.opacity(0.9))
                            .cornerRadius(10)
                        
                        // Login Button
                        Button(action: {
                            Task {
                                await viewModel.login(email: email, password: password)
                            }
                        }) {
                            HStack {
                                if viewModel.isLoading {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Text("Se connecter")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                        }
                        .disabled(viewModel.isLoading || email.isEmpty || password.isEmpty)
                        
                        // Biometric Login (si configuré)
                        if viewModel.biometricAvailable {
                            Button(action: {
                                Task {
                                    await viewModel.loginWithBiometric()
                                }
                            }) {
                                HStack {
                                    Image(systemName: viewModel.biometricIcon)
                                    Text("Se connecter avec \(viewModel.biometricName)")
                                }
                                .font(.subheadline)
                                .foregroundColor(.white)
                            }
                        }
                        
                        // Register Link
                        Button(action: {
                            showingRegister = true
                        }) {
                            Text("Pas encore de compte ? S'inscrire")
                                .font(.footnote)
                                .foregroundColor(.white)
                        }
                    }
                    .padding(.horizontal, 30)
                    
                    Spacer()
                }
            }
            .alert("Erreur", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "Erreur inconnue")
            }
            .sheet(isPresented: $showingRegister) {
                RegisterView()
            }
        }
    }
}

// MARK: - LoginViewModel
@MainActor
class LoginViewModel: BaseViewModel {
    let context = LAContext()
    
    var biometricAvailable: Bool {
        context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil)
    }
    
    var biometricName: String {
        switch context.biometryType {
        case .faceID: return "Face ID"
        case .touchID: return "Touch ID"
        default: return "Biométrie"
        }
    }
    
    var biometricIcon: String {
        switch context.biometryType {
        case .faceID: return "faceid"
        case .touchID: return "touchid"
        default: return "lock.shield"
        }
    }
    
    func login(email: String, password: String) async {
        startLoading()
        do {
            try await supabase.signIn(email: email, password: password)
            stopLoading()
        } catch {
            handleError(error)
        }
    }
    
    func loginWithBiometric() async {
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: "Connexion à LiveOwnerUnit"
            )
            
            if success {
                // Récupérer credentials du Keychain
                if let token = try? await supabase.getToken() {
                    // Session restaurée
                    print("Session restaurée via biométrie")
                }
            }
        } catch {
            handleError(error)
        }
    }
}

// MARK: - RegisterView
struct RegisterView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = RegisterViewModel()
    
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var fullName = ""
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Informations") {
                    TextField("Nom complet", text: $fullName)
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                }
                
                Section("Mot de passe") {
                    SecureField("Mot de passe", text: $password)
                        .textContentType(.newPassword)
                    SecureField("Confirmer", text: $confirmPassword)
                        .textContentType(.newPassword)
                }
                
                Section {
                    Button(action: {
                        Task {
                            let success = await viewModel.register(
                                email: email,
                                password: password,
                                confirmPassword: confirmPassword,
                                fullName: fullName
                            )
                            if success {
                                dismiss()
                            }
                        }
                    }) {
                        HStack {
                            if viewModel.isLoading {
                                ProgressView()
                            } else {
                                Text("Créer mon compte")
                            }
                        }
                    }
                    .disabled(viewModel.isLoading || email.isEmpty || password.isEmpty)
                }
            }
            .navigationTitle("Inscription")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Annuler") {
                        dismiss()
                    }
                }
            }
            .alert("Erreur", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "Erreur inconnue")
            }
        }
    }
}

// MARK: - RegisterViewModel
@MainActor
class RegisterViewModel: BaseViewModel {
    func register(email: String, password: String, confirmPassword: String, fullName: String) async -> Bool {
        // Validation
        guard password == confirmPassword else {
            errorMessage = "Les mots de passe ne correspondent pas"
            showError = true
            return false
        }
        
        guard password.count >= 6 else {
            errorMessage = "Le mot de passe doit contenir au moins 6 caractères"
            showError = true
            return false
        }
        
        startLoading()
        do {
            try await supabase.signUp(email: email, password: password)
            
            // TODO: Créer profil user avec fullName
            
            stopLoading()
            return true
        } catch {
            handleError(error)
            return false
        }
    }
}

#Preview {
    LoginView()
}
