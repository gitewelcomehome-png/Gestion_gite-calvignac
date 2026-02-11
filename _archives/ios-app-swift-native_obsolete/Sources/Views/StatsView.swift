//
//  StatsView.swift
//  LiveOwnerUnit
//
//  Statistiques et KPIs
//

import SwiftUI
import Charts

struct StatsView: View {
    @StateObject private var statsVM = StatsViewModel()
    @State private var selectedPeriod: StatsPeriod = .month
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Period Picker
                    periodPicker
                    
                    // KPIs
                    kpiCardsSection
                    
                    // Revenue Chart
                    revenueChartSection
                    
                    // Occupancy Chart
                    occupancyChartSection
                    
                    // Top Gites
                    topGitesSection
                }
                .padding()
            }
            .navigationTitle("Statistiques")
            .refreshable {
                await loadStats()
            }
            .task {
                await loadStats()
            }
        }
    }
    
    // MARK: - Period Picker
    private var periodPicker: some View {
        Picker("Période", selection: $selectedPeriod) {
            ForEach(StatsPeriod.allCases) { period in
                Text(period.displayName).tag(period)
            }
        }
        .pickerStyle(.segmented)
        .onChange(of: selectedPeriod) { _, _ in
            Task {
                await loadStats()
            }
        }
    }
    
    // MARK: - KPIs
    private var kpiCardsSection: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 15) {
            StatsKPICard(
                title: "Revenu",
                value: statsVM.totalRevenue.formatted(.currency(code: "EUR")),
                icon: "eurosign.circle.fill",
                color: .green,
                trend: statsVM.revenueTrend
            )
            
            StatsKPICard(
                title: "Réservations",
                value: "\(statsVM.totalReservations)",
                icon: "calendar.circle.fill",
                color: .blue,
                trend: statsVM.reservationsTrend
            )
            
            StatsKPICard(
                title: "Taux d'occupation",
                value: "\(statsVM.occupancyRate)%",
                icon: "chart.pie.fill",
                color: .orange,
                trend: statsVM.occupancyTrend
            )
            
            StatsKPICard(
                title: "Prix moyen/nuit",
                value: statsVM.avgPricePerNight.formatted(.currency(code: "EUR")),
                icon: "bed.double.fill",
                color: .purple,
                trend: statsVM.avgPriceTrend
            )
        }
    }
    
    // MARK: - Revenue Chart
    private var revenueChartSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Évolution du revenu")
                .font(.headline)
            
            Chart(statsVM.revenueData) { dataPoint in
                BarMark(
                    x: .value("Période", dataPoint.period),
                    y: .value("Revenu", dataPoint.amount)
                )
                .foregroundStyle(.green.gradient)
            }
            .frame(height: 200)
            .chartXAxis {
                AxisMarks(values: .automatic) { _ in
                    AxisValueLabel()
                        .font(.caption2)
                }
            }
            .chartYAxis {
                AxisMarks { value in
                    AxisValueLabel {
                        if let amount = value.as(Decimal.self) {
                            Text("\(amount, format: .currency(code: "EUR").precision(.fractionLength(0)))")
                                .font(.caption2)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
    
    // MARK: - Occupancy Chart
    private var occupancyChartSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Taux d'occupation")
                .font(.headline)
            
            Chart(statsVM.occupancyData) { dataPoint in
                LineMark(
                    x: .value("Période", dataPoint.period),
                    y: .value("Taux", dataPoint.rate)
                )
                .foregroundStyle(.blue)
                .interpolationMethod(.catmullRom)
                
                AreaMark(
                    x: .value("Période", dataPoint.period),
                    y: .value("Taux", dataPoint.rate)
                )
                .foregroundStyle(.blue.opacity(0.2))
                .interpolationMethod(.catmullRom)
            }
            .frame(height: 150)
            .chartXAxis {
                AxisMarks(values: .automatic) { _ in
                    AxisValueLabel()
                        .font(.caption2)
                }
            }
            .chartYAxis {
                AxisMarks { value in
                    AxisValueLabel {
                        if let rate = value.as(Int.self) {
                            Text("\(rate)%")
                                .font(.caption2)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
    
    // MARK: - Top Gites
    private var topGitesSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Top gîtes")
                .font(.headline)
            
            ForEach(statsVM.topGites) { gite in
                HStack {
                    Circle()
                        .fill(gite.color)
                        .frame(width: 12, height: 12)
                    
                    Text(gite.name)
                        .font(.subheadline)
                    
                    Spacer()
                    
                    Text(gite.revenue.formatted(.currency(code: "EUR")))
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
    
    // MARK: - Helpers
    private func loadStats() async {
        try? await statsVM.fetchStats(for: selectedPeriod)
    }
}

// MARK: - Stats KPI Card
struct StatsKPICard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    let trend: Double?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.title2)
                Spacer()
                
                if let trend = trend {
                    TrendIndicator(trend: trend)
                }
            }
            
            Text(value)
                .font(.title2)
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

// MARK: - Trend Indicator
struct TrendIndicator: View {
    let trend: Double
    
    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: trend >= 0 ? "arrow.up.right" : "arrow.down.right")
                .font(.caption2)
            
            Text("\(abs(trend), format: .percent.precision(.fractionLength(1)))")
                .font(.caption2)
                .fontWeight(.medium)
        }
        .foregroundColor(trend >= 0 ? .green : .red)
    }
}

// MARK: - Period Enum
enum StatsPeriod: String, CaseIterable, Identifiable {
    case week = "Semaine"
    case month = "Mois"
    case quarter = "Trimestre"
    case year = "Année"
    
    var id: String { rawValue }
    var displayName: String { rawValue }
}

#Preview {
    StatsView()
}
