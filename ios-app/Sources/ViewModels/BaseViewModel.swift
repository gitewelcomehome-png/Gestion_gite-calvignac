//
//  BaseViewModel.swift
//  LiveOwnerUnit
//
//  ViewModel de base avec gestion états communs
//

import Foundation
import Combine

@MainActor
class BaseViewModel: ObservableObject {
    // MARK: - Published Properties
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var showError: Bool = false
    
    // MARK: - Protected
    var cancellables = Set<AnyCancellable>()
    let supabase = SupabaseManager.shared
    
    // MARK: - Init
    init() {}
    
    // MARK: - Error Handling
    func handleError(_ error: Error) {
        isLoading = false
        errorMessage = error.localizedDescription
        showError = true
        print(" [BaseViewModel] Error: \(error.localizedDescription)")
    }
    
    func clearError() {
        errorMessage = nil
        showError = false
    }
    
    // MARK: - Loading State
    func startLoading() {
        isLoading = true
        clearError()
    }
    
    func stopLoading() {
        isLoading = false
    }
    
    // MARK: - Success Message (optionnel)
    @Published var successMessage: String?
    @Published var showSuccess: Bool = false
    
    func showSuccessMessage(_ message: String) {
        successMessage = message
        showSuccess = true
        
        // Auto-hide après 3 secondes
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in
            self?.showSuccess = false
        }
    }
}

// MARK: - Task Extension pour async/await
extension BaseViewModel {
    /// Execute une tâche async avec gestion d'erreur
    func executeTask(_ task: @escaping () async throws -> Void) {
        Task {
            startLoading()
            do {
                try await task()
                stopLoading()
            } catch {
                handleError(error)
            }
        }
    }
    
    /// Execute avec callback de succès
    func executeTask<T>(_ task: @escaping () async throws -> T, onSuccess: @escaping (T) -> Void) {
        Task {
            startLoading()
            do {
                let result = try await task()
                stopLoading()
                onSuccess(result)
            } catch {
                handleError(error)
            }
        }
    }
}
