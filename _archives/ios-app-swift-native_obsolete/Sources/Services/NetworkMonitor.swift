//
//  NetworkMonitor.swift
//  LiveOwnerUnit
//
//  Monitoring de la connectivité réseau
//

import Foundation
import Network

@MainActor
class NetworkMonitor: ObservableObject {
    static let shared = NetworkMonitor()
    
    @Published var isConnected = true
    @Published var connectionType: ConnectionType = .unknown
    
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")
    
    private init() {
        startMonitoring()
    }
    
    func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                self?.isConnected = path.status == .satisfied
                self?.connectionType = self?.determineConnectionType(path: path) ?? .unknown
                
                print("🌐 [Network] Status: \(self?.isConnected == true ? "Connected" : "Disconnected") (\(self?.connectionType.displayName ?? "unknown"))")
            }
        }
        
        monitor.start(queue: queue)
    }
    
    func stopMonitoring() {
        monitor.cancel()
    }
    
    private func determineConnectionType(path: NWPath) -> ConnectionType {
        if path.usesInterfaceType(.wifi) {
            return .wifi
        } else if path.usesInterfaceType(.cellular) {
            return .cellular
        } else if path.usesInterfaceType(.wiredEthernet) {
            return .ethernet
        } else {
            return .unknown
        }
    }
}

// MARK: - Connection Type
enum ConnectionType {
    case wifi
    case cellular
    case ethernet
    case unknown
    
    var displayName: String {
        switch self {
        case .wifi: return "Wi-Fi"
        case .cellular: return "Réseau mobile"
        case .ethernet: return "Ethernet"
        case .unknown: return "Inconnu"
        }
    }
    
    var icon: String {
        switch self {
        case .wifi: return "wifi"
        case .cellular: return "antenna.radiowaves.left.and.right"
        case .ethernet: return "cable.connector"
        case .unknown: return "network.slash"
        }
    }
}
