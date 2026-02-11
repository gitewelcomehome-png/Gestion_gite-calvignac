# 🍎 SPÉCIFICATIONS APPLICATION APPLE - LIVEOWNERUNIT

> **Cahier des charges pour développement application iOS/macOS**  
> **Date de création :** 7 février 2026  
> **Version :** 1.0 (Enrichie)  
> **Référence technique :** `REFERENCE_TECHNIQUE_APPLICATION_MOBILE.md`

---

## 🎯 OBJECTIFS DU PROJET

### Vision
Créer une application native iOS/macOS permettant aux propriétaires de gîtes de gérer leurs locations en mobilité avec une expérience utilisateur fluide, rapide et intuitive.

### Critères de Succès
- ✅ **Performance** : Temps de chargement < 2s sur réseau 4G
- ✅ **Fiabilité** : Sync sans perte de données, mode offline fonctionnel
- ✅ **UX** : Navigation intuitive, actions en max 3 taps
- ✅ **Sécurité** : RLS strict, données chiffrées, biométrie
- ✅ **Scalabilité** : Support jusqu'à 50 gîtes et 1000 réservations/an

### Public Cible
- **Primaire** : Propriétaires de gîtes gérant 2-10 propriétés
- **Secondaire** : Sociétés de ménage partenaires (vue limitée)
- **Plateformes** : iOS 16+ (iPhone/iPad), macOS 13+ (optionnel phase 2)

---

## 📝 SPÉCIFICATIONS DÉTAILLÉES

STRUCTURE DE NAVIGATION PROPOSÉE
Architecture : Tab Bar (5 onglets) + Navigation Stack
┌─────────────────────────────────────┐
│  🏠 Dashboard  │  📅 Calendrier  │  🧹 Ménage  │  📊 Stats  │  ⚙️ Plus  │
└─────────────────────────────────────┘

🏠 Dashboard (HomeView)
├─ Header: Semaine en cours, météo lieu principal
├─ Section Urgent: Alertes (conflits, ménages non validés)
├─ Section Réservations: Arrivées/Départs (scroll horizontal)
├─ Section Ménage: Interventions du jour (tap → détails)
└─ Section Actions Rapides: [+ Résa manuelle] [📧 Envoi fiche]

📅 Calendrier (CalendarView)
├─ Header: Sélecteur propriété (dropdown) + Vue (Mois/Semaine)
├─ Grille: Réservations colorées par source (Airbnb/Booking/Manuel)
├─ Tap réservation → Sheet: Détails complets + Actions (Modifier/Annuler)
└─ FloatingButton: [+] Ajouter réservation manuelle

🧹 Ménage (CleaningView)
├─ Header: Vue Semaine (scroll horizontal jours)
├─ Liste: Interventions par jour avec statuts visuels
│   ├─ Pending: Orange avec picto horloge
│   ├─ Validated: Vert avec checkmark
│   └─ Pending_validation: Violet avec badge "À valider"
├─ Tap intervention → NavigationLink: Détails + Photos + Actions
└─ Filter: [Tous] [À valider] [Terminés]

📊 Stats (StatsView)
├─ Sélecteur période: [Mois] [Année] [Personnalisé]
├─ Cards KPI: CA, Taux occupation, Panier moyen
├─ Graphique: Évolution CA par mois (SwiftCharts)
└─ Répartition: Plateformes (donut chart)

⚙️ Plus (SettingsView)
├─ Section Profil: Photo, nom, email
├─ Section Propriétés: Liste gîtes (tap → Infos gîte)
├─ Section Sync: [⟳ Synchroniser maintenant] Dernière sync
├─ Section Fiscal: [Accès simulateur LMNP/LMP]
└─ Section Compte: [Parrainage] [Support] [Déconnexion]

🔧 STACK TECHNIQUE RECOMMANDÉE
Frontend

UI Framework : SwiftUI (100% déclaratif)
Navigation : NavigationStack + TabView
State Management :

@StateObject / @ObservedObject pour ViewModels
@EnvironmentObject pour données globales (User, Settings)


Concurrency : Swift Concurrency (async/await, Task, Actor)
Charts : Swift Charts (iOS 16+) pour statistiques

Backend & Sync

API Client : supabase-swift (SDK officiel)
Cache Local : SwiftData (iOS 17+) ou CoreData (fallback)
Sync Strategy :

Pull-to-refresh manuel
Background fetch (15 min interval) pour réservations
Supabase Realtime (WebSocket) pour mises à jour push


Offline Mode :

Lecture seule des données cachées
Queue d'actions (CRUD) à synchroniser



Sécurité

Tokens : Stockage Keychain (KeychainAccess lib)
Biométrie : LocalAuthentication framework (Face ID/Touch ID)
SSL Pinning : TrustKit pour vérifier certificat Supabase

Notifications

Push : APNs (Apple Push Notification service)
Local : UserNotifications pour rappels ménage


📝 PROMPTS SPÉCIFIQUES POUR GÉNÉRER LE CODE
Voici la séquence de prompts à me donner un par un pour coder l'app module par module :
Phase 1 : Foundation (3 prompts)
Prompt 1.1 - Configuration Supabase
"Génère le fichier `SupabaseManager.swift` (singleton) avec :
- Configuration URL et Anon Key
- Méthodes d'authentification (signIn, signUp, signOut, getUser)
- Gestion automatique refresh token
- Stockage sécurisé token dans Keychain
Utilise supabase-swift SDK et async/await."
Prompt 1.2 - Modèles de Données
"Crée les structs Swift conformes à Codable pour les tables :
- Gite (avec tous champs du schéma SQL)
- Reservation (avec calcul computed property `restant`)
- CleaningSchedule
- InfosGite (119 champs)
Ajoute des extensions pour formattage (dates, prix, distances)."
Prompt 1.3 - Architecture MVVM de Base
"Implémente le pattern MVVM avec :
- Protocol `ViewModelProtocol` (standard loading/error states)
- Classe `BaseViewModel` avec @Published var isLoading, errorMessage
- Exemple concret : `ReservationsViewModel` qui fetch les réservations
Utilise Combine pour la réactivité."

Phase 2 : Authentification (2 prompts)
Prompt 2.1 - LoginView
"Crée `LoginView` SwiftUI avec :
- Champs email/password avec validation
- Bouton connexion avec state isLoading (spinner)
- Gestion erreurs (alerte native)
- Navigation automatique vers TabView si succès
Utilise `LoginViewModel` (à créer)."
Prompt 2.2 - Gestion Session
"Implémente `AuthService` (singleton) qui :
- Vérifie session active au lancement app
- Auto-logout après 30 jours d'inactivité
- Expose @Published var currentUser
Intègre dans App lifecycle (didFinishLaunching)."

Phase 3 : Dashboard (3 prompts)
Prompt 3.1 - DashboardView Structure
"Crée `DashboardView` avec :
- Header (semaine, date, icône météo placeholder)
- Section Urgent (ScrollView horizontal de cards)
- Section Réservations (LazyVStack paginée)
- Section Ménages du jour (max 3 items)
Utilise `DashboardViewModel` qui fetch data."
Prompt 3.2 - DashboardViewModel Logique
"Implémente `DashboardViewModel` avec méthodes :
- fetchUpcomingReservations() (72h suivantes)
- fetchTodayCleanings()
- fetchUrgentAlerts() (conflits, ménages pending_validation)
Utilise Supabase filters (.gte, .lte) et tri par date."
Prompt 3.3 - Cards Réutilisables
"Crée composants :
- `ReservationCard` (check-in/out, client, gîte, statut badge)
- `CleaningCard` (date, heure, gîte, statut icon)
- `AlertCard` (titre, description, action button)
Avec animations de tap (spring)."

Phase 4 : Calendrier (4 prompts)
Prompt 4.1 - CalendarView avec Grille
"Crée `CalendarView` affichant une grille mensuelle :
- Header avec mois/année et boutons < >
- Grille 7x6 (jours semaine + dates)
- Overlay réservations (rectangles colorés)
Utilise `CalendarViewModel` + `Date` extensions."
Prompt 4.2 - Logique Affichage Multi-Réservations
"Dans `CalendarViewModel`, implémente :
- Méthode `reservationsForDay(date:)` → [Reservation]
- Gestion chevauchements visuels (max 3 par jour, puis badge '+X')
- Couleurs par source (Airbnb #FF5A5F, Booking #003580, Manuel #667EEA)
- Tap gesture → Sheet avec détails."
Prompt 4.3 - Sheet Détails Réservation
"Crée `ReservationDetailSheet` avec :
- Infos complètes (dates, client, prix, statut)
- Boutons actions : [Modifier] [Annuler] [Envoyer fiche]
- Formulaire d'édition inline (toggle edit mode)
Utilise `@Binding` pour mise à jour parent view."
Prompt 4.4 - Ajout Réservation Manuelle
"Crée `AddReservationView` (sheet fullscreen) avec :
- Form SwiftUI (dates, client, gîte picker, prix)
- Validation (check-out > check-in, gîte dispo)
- Sauvegarde Supabase + refresh calendrier
- Boutons [Annuler] [Enregistrer]."

Phase 5 : Synchronisation iCal (2 prompts)
Prompt 5.1 - Service Sync iCal
"Implémente `ICalSyncService` qui :
- Fetch fichiers .ics depuis URLs (gites.ical_sources)
- Parse événements avec bibliothèque iCal (ou regex manuel)
- Détecte conflits (chevauchements) selon règle 'plus courte'
- Insert/Update reservations avec flag synced_from
Utilise URLSession + async/await."
Prompt 5.2 - Background Sync
"Configure Background Fetch (iOS) :
- Enregistrement task dans AppDelegate
- Exécution sync toutes les 1h max
- Notification locale si nouvelle réservation détectée
- Gestion erreurs réseau (retry exponential backoff)."

Phase 6 : Gestion Ménage (3 prompts)
Prompt 6.1 - CleaningView Liste
"Crée `CleaningView` avec :
- Sélecteur vue semaine (scroll horizontal dates)
- Liste groupée par jour (Section)
- Icônes statut (SF Symbols: clock, checkmark, exclamationmark)
- Pull-to-refresh
Utilise `CleaningViewModel`."
Prompt 6.2 - CleaningDetailView
"Crée vue détails intervention avec :
- Infos (gîte, date, heure, statut)
- Photos uploadées (grille 2 colonnes)
- Si pending_validation : boutons [Accepter] [Refuser] + TextField notes
- Upload photos depuis galerie (PhotosPicker iOS 16+)
Intègre Supabase Storage pour images."
Prompt 6.3 - Calcul Automatique Ménages
"Dans `CleaningViewModel`, implémente méthode :
- `calculateCleaningSchedule(from:to:)` qui :
  * Récupère réservations période
  * Applique les 9 règles (cleaning_rules table)
  * Génère cleaning_schedule avec date/heure suggérées
  * Exclut dimanches/samedis si règles actives
Affiche résultats dans sheet de confirmation."

Phase 7 : Statistiques (2 prompts)
Prompt 7.1 - StatsView Dashboard
"Crée `StatsView` avec :
- Période picker (Mois/Année/Personnalisé)
- 3 cards KPI (CA total, Taux occupation %, Panier moyen)
- Line chart CA mensuel (Swift Charts)
- Donut chart répartition plateformes
Utilise `StatsViewModel`."
Prompt 7.2 - Calculs Statistiques
"Dans `StatsViewModel`, implémente :
- `calculateRevenue(period:)` → agrégation sum(montant)
- `calculateOccupancyRate(period:)` → jours occupés / jours totaux
- `platformDistribution()` → group by plateforme
Utilise requêtes Supabase avec .select() et functions."

Phase 8 : Fiches Clients (2 prompts)
Prompt 8.1 - Génération Fiche Bilingue
"Crée `ClientSheetGenerator` service qui :
- Fetch infos_gites + checklist_templates + faq + activites_gites
- Génère HTML bilingue (FR/EN toggle)
- Inclut QR Code WiFi (CoreImage framework)
- Export PDF (PDFKit)
Renvoie Data pour partage (ShareSheet)."
Prompt 8.2 - Envoi Fiche par Email
"Implémente `EmailService` utilisant :
- MessageUI framework (MFMailComposeViewController)
- Pièce jointe PDF fiche client
- Template email pré-rempli (objet, corps)
- Callback succès/échec
Alternative : Deep link mailto: si MessageUI indisponible."

Phase 9 : Mode Offline (2 prompts)
Prompt 9.1 - Cache avec SwiftData
"Configure SwiftData models pour :
- GiteCache (mirror table gites)
- ReservationCache (mirror table reservations)
- Sync date tracking (last_synced timestamp)
Implémente auto-save lors fetch Supabase."
Prompt 9.2 - Queue d'Actions Offline
"Crée `OfflineActionQueue` qui :
- Stocke actions CRUD en attente (insert/update/delete)
- Format : struct Action { type, tableName, data, timestamp }
- Sync automatique au retour réseau (NetworkMonitor)
- Gestion conflits (last-write-wins ou UI confirmation)."

Phase 10 : Finalisation (3 prompts)
Prompt 10.1 - Notifications Push
"Configure APNs :
- Demande permission UNUserNotificationCenter
- Enregistrement device token Supabase
- Réception notifications (willPresent, didReceive)
- Actions rapides (Accepter ménage, Voir réservation)
Gère Supabase Functions pour envoi serveur."
Prompt 10.2 - Settings & Profil
"Crée `SettingsView` avec :
- Section Profil (photo, nom, email)
- Section Sync (bouton manuel + last sync time)
- Section Sécurité (toggle biométrie, timeout session)
- Section À propos (version app, CGU, contact)
- Bouton Déconnexion (confirmation alert)."
Prompt 10.3 - Tests Unitaires Critiques
"Génère XCTest pour :
- SupabaseManager : testSignIn, testTokenRefresh
- ReservationsViewModel : testFetchReservations, testConflictDetection
- ICalSyncService : testParseICS, testDuplicateHandling
Utilise mocks pour Supabase (protocol-oriented design)."

🚀 CONTRAINTES SYNCHRONISATION TEMPS RÉEL
Stratégie Anti-Double-Booking

Lock Optimiste avec Timestamp

swift// Lors de l'ajout d'une réservation :
let existingReservations = try await supabase
    .from("reservations")
    .select()
    .eq("gite_id", giteId)
    .gte("check_in", newCheckIn)
    .lte("check_out", newCheckOut)
    .execute()

guard existingReservations.data.isEmpty else {
    throw BookingError.conflictDetected
}

// Insert avec vérification updated_at
try await supabase
    .from("reservations")
    .insert(newReservation)
    .execute()

Supabase Realtime Subscription

swiftlet channel = supabase.channel("reservations-changes")
    .on(.postgres_changes(
        event: .insert,
        schema: "public",
        table: "reservations",
        filter: "owner_user_id=eq.\(userId)"
    )) { payload in
        // Refresh local cache immédiatement
        await viewModel.fetchReservations()
    }
    .subscribe()

Conflict Resolution UI


Si conflit détecté lors sync iCal : Alert avec options

[Garder manuel] [Garder iCal] [Annuler les deux]


Log dans cm_error_logs pour audit


Indicateur Visuel de Sync


Badge "Sync en cours" sur TabBar
Animation pulse sur calendrier pendant fetch
Toast "Données à jour" après succès


📦 LIVRABLES ATTENDUS
À la fin de cette séquence de prompts, tu auras :
✅ Code Production-Ready

40+ fichiers Swift organisés (ViewModels, Views, Services, Models)
Tests unitaires (>60% coverage)
Documentation inline (DocC)

✅ Features Complètes

Authentification sécurisée
Dashboard temps réel
Calendrier multi-propriétés
Gestion ménage + validation
Stats avancées
Fiches clients bilingues
Mode offline fonctionnel

✅ Conformité Apple

Human Interface Guidelines respectées
Accessibility (VoiceOver ready)
Dark Mode supporté
iPad layout adaptatif

---

## 🗄️ ARCHITECTURE DONNÉES & BACKEND

### Référence Base de Données
Consulter **`REFERENCE_TECHNIQUE_APPLICATION_MOBILE.md`** pour :
- Schéma complet des 33 tables Supabase
- Relations et contraintes FK
- Colonnes calculées et triggers
- Indexes et optimisations

### Tables Critiques pour l'App Mobile

#### Core (Priorité 1)
```swift
// Fichiers Models à créer
- Gite.swift (12 propriétés principales)
- Reservation.swift (18 propriétés + computed)
- CleaningSchedule.swift (9 propriétés)
- User.swift (auth.users wrapper)
```

#### Fiches Clients (Priorité 2)
```swift
- InfosGite.swift (119 propriétés FR/EN)
- ChecklistTemplate.swift (bilingue)
- FAQ.swift (bilingue)
- ActiviteGite.swift (POIs)
```

#### Avancé (Priorité 3)
```swift
- SimulationFiscale.swift (LMNP/LMP)
- KmTrajet.swift (déductions km)
- Referral.swift (parrainage)
- SupportTicket.swift (support)
```

### Règles Métier Critiques à Implémenter

#### 1. Réservations
```swift
// ⚠️ RÈGLE CRITIQUE : Une seule réservation par gîte à la fois
func validateNoConflict(giteId: UUID, checkIn: Date, checkOut: Date) async throws {
    let conflicts = try await supabase
        .from("reservations")
        .select()
        .eq("gite_id", giteId)
        .or("check_in.lte.\(checkOut.iso8601),check_out.gte.\(checkIn.iso8601)")
        .execute()
    
    guard conflicts.data.isEmpty else {
        throw BookingError.conflictDetected(conflicts.data)
    }
}

// ⚠️ RÈGLE CRITIQUE : En cas de conflit iCal → garder la plus courte
func resolveConflict(_ a: Reservation, _ b: Reservation) -> Reservation {
    let durationA = a.checkOut.timeIntervalSince(a.checkIn)
    let durationB = b.checkOut.timeIntervalSince(b.checkIn)
    return durationA < durationB ? a : b
}
```

#### 2. Calculs Fiscaux
```swift
// ⚠️ RÈGLE CRITIQUE : Minimum URSSAF 1 200 €/an
func calculateURSSAF(benefice: Decimal) -> Decimal {
    let calculated = benefice * 0.22 // Taux simplifié
    return max(calculated, 1200.0) // MINIMUM LÉGAL
}
```

#### 3. Ménage
```swift
// ⚠️ RÈGLE CRITIQUE : Appliquer les 9 règles de planification
enum CleaningRule: String {
    case noSunday, noSaturday, noWednesday, noThursday
    case enchainement, joursFeries
    case heureDefaut, delaiMinimum, prioriteEnchainements
}

func calculateCleaningDate(after checkout: Date, before checkin: Date, rules: [CleaningRule]) -> Date? {
    // Logique complexe à implémenter selon cleaning_rules table
}
```

---

## 🔐 SÉCURITÉ AVANCÉE

### Row Level Security (RLS)
**IMPORTANT** : Supabase filtre automatiquement les données côté serveur via RLS.

```swift
// ❌ MAUVAIS - Ne JAMAIS faire ça
let reservations = try await supabase
    .from("reservations")
    .select()
    .execute() // Récupère TOUT (interdit par RLS)

// ✅ BON - RLS filtre automatiquement selon auth.uid()
let reservations = try await supabase
    .from("reservations")
    .select()
    .execute() // RLS retourne uniquement les données de l'user connecté
```

### Gestion des Tokens
```swift
// Configuration Keychain
import KeychainAccess

class SecureStorage {
    private let keychain = Keychain(service: "com.liveownerunit.app")
    
    func saveToken(_ token: String) throws {
        try keychain.set(token, key: "supabase.token")
    }
    
    func getToken() -> String? {
        try? keychain.get("supabase.token")
    }
    
    func deleteToken() {
        try? keychain.remove("supabase.token")
    }
}
```

### SSL Pinning
```swift
// TrustKit configuration (Info.plist)
<key>TSKConfiguration</key>
<dict>
    <key>TSKPinnedDomains</key>
    <dict>
        <key>fgqimtpjjhdqeyyaptoj.supabase.co</key>
        <dict>
            <key>TSKPublicKeyHashes</key>
            <array>
                <string>HASH_TO_ADD</string>
            </array>
        </dict>
    </dict>
</dict>
```

---

## 🚀 PERFORMANCE & OPTIMISATION

### Stratégie de Cache Multi-Niveaux

#### Niveau 1 : Memory Cache (NSCache)
```swift
class DataCache {
    private let cache = NSCache<NSString, CacheItem>()
    
    func get<T: Codable>(_ key: String) -> T? {
        cache.object(forKey: key as NSString)?.data as? T
    }
    
    func set<T: Codable>(_ key: String, value: T, ttl: TimeInterval = 300) {
        let item = CacheItem(data: value, expiresAt: Date().addingTimeInterval(ttl))
        cache.setObject(item, forKey: key as NSString)
    }
}
```

#### Niveau 2 : Disk Cache (SwiftData)
```swift
@Model
class CachedReservation {
    @Attribute(.unique) var id: UUID
    var data: Data
    var cachedAt: Date
    var expiresAt: Date
}
```

#### Niveau 3 : Supabase (source de vérité)
```swift
func fetchReservations(forceRefresh: Bool = false) async throws -> [Reservation] {
    // 1. Check memory cache
    if !forceRefresh, let cached: [Reservation] = cache.get("reservations") {
        return cached
    }
    
    // 2. Check disk cache (offline mode)
    if !isConnected {
        return try await loadFromDisk()
    }
    
    // 3. Fetch from Supabase
    let fresh = try await supabase.from("reservations").select().execute()
    cache.set("reservations", value: fresh.data)
    try await saveToDisk(fresh.data)
    return fresh.data
}
```

### Pagination intelligente
```swift
// Charger 50 réservations par batch
func fetchReservations(page: Int = 0, limit: Int = 50) async throws {
    let offset = page * limit
    let data = try await supabase
        .from("reservations")
        .select()
        .order("check_in", ascending: false)
        .range(from: offset, to: offset + limit - 1)
        .execute()
}
```

### Background Refresh
```swift
// AppDelegate
func application(_ application: UIApplication, performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    Task {
        do {
            let hasNewData = try await syncManager.backgroundSync()
            completionHandler(hasNewData ? .newData : .noData)
        } catch {
            completionHandler(.failed)
        }
    }
}
```

---

## 🧪 TESTS & QUALITÉ

### Tests Unitaires Critiques

#### SupabaseManager Tests
```swift
class SupabaseManagerTests: XCTestCase {
    func testSignInSuccess() async throws {
        let manager = SupabaseManager.shared
        let session = try await manager.signIn(email: "test@example.com", password: "password")
        XCTAssertNotNil(session.accessToken)
    }
    
    func testTokenRefresh() async throws {
        // Simuler expiration token
        // Vérifier refresh automatique
    }
    
    func testRLSFiltering() async throws {
        // Vérifier qu'un user ne voit que ses données
    }
}
```

#### ReservationsViewModel Tests
```swift
class ReservationsViewModelTests: XCTestCase {
    func testConflictDetection() async throws {
        let vm = ReservationsViewModel(supabase: mockSupabase)
        let conflict = try await vm.checkConflict(
            giteId: UUID(),
            checkIn: Date(),
            checkOut: Date().addingDays(2)
        )
        XCTAssertTrue(conflict)
    }
    
    func testShorterReservationWins() {
        let short = Reservation(checkIn: date1, checkOut: date1.addingDays(2))
        let long = Reservation(checkIn: date1, checkOut: date1.addingDays(7))
        let winner = vm.resolveConflict(short, long)
        XCTAssertEqual(winner.id, short.id)
    }
}
```

#### ICalSyncService Tests
```swift
class ICalSyncServiceTests: XCTestCase {
    func testParseValidICS() throws {
        let icsData = """
        BEGIN:VCALENDAR
        BEGIN:VEVENT
        DTSTART:20260315
        DTEND:20260320
        SUMMARY:Airbnb Booking
        END:VEVENT
        END:VCALENDAR
        """
        let events = try service.parse(icsData)
        XCTAssertEqual(events.count, 1)
    }
    
    func testDuplicateHandling() async throws {
        // Vérifier qu'une réservation existante n'est pas dupliquée
    }
}
```

### Tests UI (XCUITest)
```swift
class LoginFlowUITests: XCTestCase {
    func testSuccessfulLogin() {
        let app = XCUIApplication()
        app.launch()
        
        app.textFields["email"].tap()
        app.textFields["email"].typeText("test@example.com")
        app.secureTextFields["password"].tap()
        app.secureTextFields["password"].typeText("password")
        app.buttons["Connexion"].tap()
        
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 5))
    }
}
```

### Code Coverage Target
- **Minimum** : 60% (services critiques)
- **Objectif** : 80% (ViewModels + Services)
- **Exclusions** : UI Views (testées manuellement)

---

## 📦 DÉPENDANCES & CONFIGURATION

### Package.swift (Swift Package Manager)
```swift
dependencies: [
    .package(url: "https://github.com/supabase-community/supabase-swift", from: "1.0.0"),
    .package(url: "https://github.com/kishikawakatsumi/KeychainAccess", from: "4.2.2"),
    .package(url: "https://github.com/onevcat/Kingfisher", from: "7.10.0"), // Cache images
    .package(url: "https://github.com/kean/Nuke", from: "12.0.0"), // Alternative images
]
```

### Info.plist Permissions
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Pour ajouter des photos des ménages effectués</string>

<key>NSCameraUsageDescription</key>
<string>Pour photographier l'état du gîte</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Pour géolocaliser automatiquement les activités</string>

<key>NSFaceIDUsageDescription</key>
<string>Pour sécuriser l'accès à votre compte</string>
```

### Build Settings Xcode
```
- iOS Deployment Target: 16.0
- Swift Language Version: 5.9
- Enable Bitcode: NO
- Optimization Level (Release): -O -whole-module-optimization
```

---

## 🔔 NOTIFICATIONS & ALERTES

### Configuration APNs
```swift
// AppDelegate
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
        if granted {
            DispatchQueue.main.async {
                application.registerForRemoteNotifications()
            }
        }
    }
    return true
}

func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    Task {
        try? await supabase.from("device_tokens").insert(["user_id": userId, "token": token]).execute()
    }
}
```

### Notifications Locales (Rappels)
```swift
class NotificationManager {
    func scheduleCleaningReminder(for cleaning: CleaningSchedule) {
        let content = UNMutableNotificationContent()
        content.title = "Ménage à effectuer"
        content.body = "Gîte \(cleaning.giteName) - \(cleaning.scheduledTime)"
        content.sound = .default
        content.categoryIdentifier = "CLEANING_REMINDER"
        
        let trigger = UNCalendarNotificationTrigger(
            dateMatching: Calendar.current.dateComponents([.year, .month, .day, .hour], from: cleaning.scheduledDate),
            repeats: false
        )
        
        let request = UNNotificationRequest(identifier: cleaning.id.uuidString, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }
}
```

### Actions Rapides
```swift
// Notification actions
let acceptAction = UNNotificationAction(identifier: "ACCEPT_CLEANING", title: "Accepter", options: .foreground)
let refuseAction = UNNotificationAction(identifier: "REFUSE_CLEANING", title: "Refuser", options: .destructive)
let category = UNNotificationCategory(identifier: "CLEANING_REMINDER", actions: [acceptAction, refuseAction], intentIdentifiers: [])

UNUserNotificationCenter.current().setNotificationCategories([category])
```

---

## 📊 MONITORING & ANALYTICS

### Logging Structuré
```swift
import OSLog

extension Logger {
    static let supabase = Logger(subsystem: "com.liveownerunit", category: "supabase")
    static let sync = Logger(subsystem: "com.liveownerunit", category: "sync")
    static let ui = Logger(subsystem: "com.liveownerunit", category: "ui")
}

// Usage
Logger.supabase.info("Fetching reservations for gite \(giteId)")
Logger.sync.error("iCal sync failed: \(error.localizedDescription)")
```

### Crash Reporting
```swift
// Intégration Sentry (optionnel)
import Sentry

@main
struct LiveOwnerUnitApp: App {
    init() {
        SentrySDK.start { options in
            options.dsn = "YOUR_DSN"
            options.environment = "production"
            options.tracesSampleRate = 1.0
        }
    }
}
```

### Métriques Personnalisées
```swift
class MetricsManager {
    func trackEvent(_ name: String, properties: [String: Any] = [:]) {
        // Firebase Analytics, Mixpanel, ou custom
        Logger.ui.info("Event: \(name) - \(properties)")
    }
}

// Usage
metricsManager.trackEvent("reservation_created", properties: ["source": "manual", "gite_id": giteId])
```

---

## 🔄 MIGRATION & VERSIONING

### Stratégie de Migration
```swift
enum AppVersion: String, Comparable {
    case v1_0 = "1.0.0"
    case v1_1 = "1.1.0"
    case v2_0 = "2.0.0"
    
    static func < (lhs: AppVersion, rhs: AppVersion) -> Bool {
        lhs.rawValue.compare(rhs.rawValue, options: .numeric) == .orderedAscending
    }
}

class MigrationManager {
    func migrate(from oldVersion: AppVersion, to newVersion: AppVersion) async throws {
        if oldVersion < .v1_1 && newVersion >= .v1_1 {
            try await migrateToV1_1()
        }
        if oldVersion < .v2_0 && newVersion >= .v2_0 {
            try await migrateToV2_0()
        }
    }
    
    private func migrateToV1_1() async throws {
        // Exemple : Ajouter nouvelle colonne cache
        Logger.supabase.info("Migrating to v1.1")
    }
}
```

### Changelog Intégré
```swift
/// app/Resources/CHANGELOG.md
## Version 1.1.0 (8 Février 2026)
### Nouveautés
- ✨ Synchronisation iCal en background
- ✨ Mode sombre amélioré
- 🐛 Correction bug calcul taux occupation

## Version 1.0.0 (7 Février 2026)
### Version Initiale
- Gestion réservations
- Planning ménage
- Fiches clients bilingues
```

---

## 📋 CHECKLIST AVANT SOUMISSION APP STORE

### Technique
- [ ] Tests unitaires > 60% coverage
- [ ] Tests UI critiques (login, ajout réservation)
- [ ] Pas de warnings Xcode
- [ ] Crash rate < 0.1% (Testflight)
- [ ] Temps de lancement < 2s

### Conformité
- [ ] Privacy Policy URL configurée
- [ ] Terms of Use URL configurée
- [ ] Permissions justifiées (NSUsageDescription)
- [ ] Pas de private APIs utilisées
- [ ] Support IPv6 (requis)

### UX
- [ ] Dark Mode testé
- [ ] VoiceOver testé
- [ ] Dynamic Type supporté
- [ ] iPad layout optimisé
- [ ] Rotation écran gérée

### Marketing
- [ ] Screenshots (6.5", 5.5", iPad Pro)
- [ ] App Icon 1024x1024
- [ ] Description App Store FR/EN
- [ ] Mots-clés SEO
- [ ] Video preview (optionnel)

---

## 🎓 RESSOURCES & DOCUMENTATION

### Documentation Officielle
- [Supabase Swift SDK](https://github.com/supabase-community/supabase-swift)
- [SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
- [Swift Concurrency](https://docs.swift.org/swift-book/LanguageGuide/Concurrency.html)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

### Exemples de Code
- [GitHub - iOS Architecture Samples](https://github.com/kudoleh/iOS-Clean-Architecture-MVVM)
- [GitHub - SwiftUI Best Practices](https://github.com/nalexn/clean-architecture-swiftui)

### Support Technique
- **Documentation projet** : `/docs/architecture/ARCHITECTURE.md`
- **Référence technique** : `REFERENCE_TECHNIQUE_APPLICATION_MOBILE.md`
- **Contact** : stephanecalvignac@hotmail.fr

---

**Document enrichi avec connaissances techniques avancées**  
**Prêt pour développement séquentiel avec prompts détaillés**

✅ Conformité Apple

Human Interface Guidelines respectées
Accessibility (VoiceOver ready)
Dark Mode supporté
iPad layout adaptatif