//
//  StatsViewModel.swift
//  LiveOwnerUnit
//
//  ViewModel pour les statistiques
//

import Foundation
import Combine
import SwiftUI
import Supabase
import PostgREST

@MainActor
class StatsViewModel: BaseViewModel {
    // MARK: - Published Properties
    @Published var totalRevenue: Decimal = 0
    @Published var totalReservations: Int = 0
    @Published var occupancyRate: Int = 0
    @Published var avgPricePerNight: Decimal = 0
    
    // Trends (variation vs période précédente)
    @Published var revenueTrend: Double?
    @Published var reservationsTrend: Double?
    @Published var occupancyTrend: Double?
    @Published var avgPriceTrend: Double?
    
    // Charts data
    @Published var revenueData: [RevenueDataPoint] = []
    @Published var occupancyData: [OccupancyDataPoint] = []
    @Published var topGites: [TopGite] = []
    
    // MARK: - Fetch Stats
    func fetchStats(for period: StatsPeriod) async throws {
        let userId = try await supabase.currentUserId()
        
        let (startDate, endDate) = period.dateRange
        
        // Fetch reservations dans la période
        let reservations: [Reservation] = try await supabase.client
            .from("reservations")
            .select()
            .eq("owner_user_id", value: userId.uuidString)
            .gte("check_in", value: startDate.ISO8601Format())
            .lte("check_out", value: endDate.ISO8601Format())
            .eq("status", value: "confirmed")
            .execute()
            .value
        
        // Calcul KPIs
        calculateKPIs(from: reservations, period: period)
        
        // Calcul charts
        await calculateChartsData(reservations: reservations, period: period)
    }
    
    // MARK: - Calculate KPIs
    private func calculateKPIs(from reservations: [Reservation], period: StatsPeriod) {
        // Total revenue
        totalRevenue = reservations.compactMap { $0.totalPrice }.reduce(0, +)
        
        // Total reservations
        totalReservations = reservations.count
        
        // Average price per night
        let totalNights = reservations.reduce(0) { $0 + $1.nights }
        avgPricePerNight = totalNights > 0 ? totalRevenue / Decimal(totalNights) : 0
        
        // Occupancy rate (simplifié)
        // TODO: Calculer réellement selon nombre de gîtes et jours disponibles
        let daysInPeriod = period.daysCount
        let occupiedNights = totalNights
        occupancyRate = daysInPeriod > 0 ? min(100, Int((Double(occupiedNights) / Double(daysInPeriod)) * 100)) : 0
        
        // Trends (mock data - TODO: comparer avec période précédente)
        revenueTrend = 0.12 // +12%
        reservationsTrend = 0.08 // +8%
        occupancyTrend = -0.03 // -3%
        avgPriceTrend = 0.05 // +5%
    }
    
    // MARK: - Calculate Charts Data
    private func calculateChartsData(reservations: [Reservation], period: StatsPeriod) async {
        // Revenue by period (mock data)
        revenueData = generateRevenueData(period: period)
        
        // Occupancy by period (mock data)
        occupancyData = generateOccupancyData(period: period)
        
        // Top gites by revenue
        await calculateTopGites(reservations: reservations)
    }
    
    private func generateRevenueData(period: StatsPeriod) -> [RevenueDataPoint] {
        // Mock data - TODO: calculer réellement par période
        switch period {
        case .week:
            return [
                RevenueDataPoint(period: "Lun", amount: 350),
                RevenueDataPoint(period: "Mar", amount: 420),
                RevenueDataPoint(period: "Mer", amount: 380),
                RevenueDataPoint(period: "Jeu", amount: 450),
                RevenueDataPoint(period: "Ven", amount: 520),
                RevenueDataPoint(period: "Sam", amount: 680),
                RevenueDataPoint(period: "Dim", amount: 640)
            ]
        case .month:
            return [
                RevenueDataPoint(period: "S1", amount: 2400),
                RevenueDataPoint(period: "S2", amount: 2800),
                RevenueDataPoint(period: "S3", amount: 3200),
                RevenueDataPoint(period: "S4", amount: 2900)
            ]
        case .quarter:
            return [
                RevenueDataPoint(period: "Jan", amount: 8500),
                RevenueDataPoint(period: "Fév", amount: 9200),
                RevenueDataPoint(period: "Mar", amount: 10300)
            ]
        case .year:
            return [
                RevenueDataPoint(period: "Jan", amount: 8500),
                RevenueDataPoint(period: "Fév", amount: 9200),
                RevenueDataPoint(period: "Mar", amount: 10300),
                RevenueDataPoint(period: "Avr", amount: 11200),
                RevenueDataPoint(period: "Mai", amount: 12800),
                RevenueDataPoint(period: "Juin", amount: 14500),
                RevenueDataPoint(period: "Juil", amount: 16200),
                RevenueDataPoint(period: "Août", amount: 17800),
                RevenueDataPoint(period: "Sep", amount: 13400),
                RevenueDataPoint(period: "Oct", amount: 10200),
                RevenueDataPoint(period: "Nov", amount: 8900),
                RevenueDataPoint(period: "Déc", amount: 11500)
            ]
        }
    }
    
    private func generateOccupancyData(period: StatsPeriod) -> [OccupancyDataPoint] {
        // Mock data - TODO: calculer réellement
        switch period {
        case .week:
            return [
                OccupancyDataPoint(period: "Lun", rate: 60),
                OccupancyDataPoint(period: "Mar", rate: 65),
                OccupancyDataPoint(period: "Mer", rate: 70),
                OccupancyDataPoint(period: "Jeu", rate: 75),
                OccupancyDataPoint(period: "Ven", rate: 85),
                OccupancyDataPoint(period: "Sam", rate: 95),
                OccupancyDataPoint(period: "Dim", rate: 90)
            ]
        case .month:
            return [
                OccupancyDataPoint(period: "S1", rate: 55),
                OccupancyDataPoint(period: "S2", rate: 68),
                OccupancyDataPoint(period: "S3", rate: 72),
                OccupancyDataPoint(period: "S4", rate: 65)
            ]
        case .quarter:
            return [
                OccupancyDataPoint(period: "Jan", rate: 58),
                OccupancyDataPoint(period: "Fév", rate: 62),
                OccupancyDataPoint(period: "Mar", rate: 70)
            ]
        case .year:
            return [
                OccupancyDataPoint(period: "Jan", rate: 58),
                OccupancyDataPoint(period: "Fév", rate: 62),
                OccupancyDataPoint(period: "Mar", rate: 70),
                OccupancyDataPoint(period: "Avr", rate: 75),
                OccupancyDataPoint(period: "Mai", rate: 82),
                OccupancyDataPoint(period: "Juin", rate: 88),
                OccupancyDataPoint(period: "Juil", rate: 95),
                OccupancyDataPoint(period: "Août", rate: 98),
                OccupancyDataPoint(period: "Sep", rate: 85),
                OccupancyDataPoint(period: "Oct", rate: 68),
                OccupancyDataPoint(period: "Nov", rate: 55),
                OccupancyDataPoint(period: "Déc", rate: 72)
            ]
        }
    }
    
    private func calculateTopGites(reservations: [Reservation]) async {
        // Grouper par gîte et calculer revenue
        var gitesRevenue: [UUID: Decimal] = [:]
        
        for reservation in reservations {
            gitesRevenue[reservation.giteId, default: 0] += reservation.totalPrice ?? 0
        }
        
        // Fetch noms des gîtes
        guard let userId = try? await supabase.currentUserId() else { return }
        
        let gites: [Gite] = (try? await supabase.client
            .from("gites")
            .select()
            .eq("owner_user_id", value: userId.uuidString)
            .execute()
            .value) ?? []
        
        // Créer TopGite objects
        topGites = gitesRevenue
            .sorted { $0.value > $1.value }
            .prefix(5)
            .compactMap { giteId, revenue in
                guard let gite = gites.first(where: { $0.id == giteId }) else { return nil }
                return TopGite(
                    id: giteId,
                    name: gite.name,
                    revenue: revenue,
                    color: gite.swiftUIColor
                )
            }
    }
}

// MARK: - Data Models
struct RevenueDataPoint: Identifiable {
    let id = UUID()
    let period: String
    let amount: Decimal
}

struct OccupancyDataPoint: Identifiable {
    let id = UUID()
    let period: String
    let rate: Int
}

struct TopGite: Identifiable {
    let id: UUID
    let name: String
    let revenue: Decimal
    let color: Color
}

// MARK: - Period Extension
extension StatsPeriod {
    var dateRange: (Date, Date) {
        let now = Date()
        let calendar = Calendar.current
        
        switch self {
        case .week:
            let start = calendar.date(byAdding: .day, value: -7, to: now)!
            return (start, now)
        case .month:
            let start = calendar.date(byAdding: .month, value: -1, to: now)!
            return (start, now)
        case .quarter:
            let start = calendar.date(byAdding: .month, value: -3, to: now)!
            return (start, now)
        case .year:
            let start = calendar.date(byAdding: .year, value: -1, to: now)!
            return (start, now)
        }
    }
    
    var daysCount: Int {
        let (start, end) = dateRange
        return Calendar.current.dateComponents([.day], from: start, to: end).day ?? 0
    }
}
