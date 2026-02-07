# 🍎 LiveOwnerUnit - Application iOS

> **Application native iOS pour gestion de gîtes et locations saisonnières**  
> **Générée le** : 7 février 2026  
> **Version** : 1.0.0

---

## 🚀 INSTALLATION RAPIDE (30 MIN MAX)

### Prérequis
- Mac avec macOS 13+ (Ventura ou plus récent)
- Xcode 15+ (gratuit sur App Store)
- Connexion internet

### Étapes d'Installation

#### 1. Créer le Projet Xcode (5 min)
```bash
# Ouvrir Xcode
1. File → New → Project
2. Choisir "iOS" → "App"
3. Nom: LiveOwnerUnit
4. Organization Identifier: com.liveownerunit
5. Interface: SwiftUI
6. Language: Swift
7. Cocher: Use Swift Package Manager
8. Enregistrer dans un dossier
```

#### 2. Importer les Fichiers (5 min)
```bash
# Dans le Finder
1. Ouvrir le dossier ios-app/Sources/
2. Glisser-déposer TOUS les dossiers dans Xcode (sidebar gauche)
3. Cocher "Copy items if needed"
4. Cocher "Create groups"
5. Target: LiveOwnerUnit (coché)
6. Cliquer "Finish"
```

#### 3. Configurer les Dépendances (10 min)
```bash
# Dans Xcode
1. Cliquer sur le projet (en haut de la sidebar)
2. Onglet "Package Dependencies"
3. Cliquer "+" en bas
4. Ajouter ces packages:
   • https://github.com/supabase-community/supabase-swift
   • https://github.com/kishikawakatsumi/KeychainAccess
```

#### 4. Configurer Info.plist (5 min)
```bash
# Dans Xcode
1. Sélectionner Info.plist
2. Ajouter ces permissions (clic droit → Add Row):
   • Privacy - Camera Usage Description: "Pour photographier l'état du gîte"
   • Privacy - Photo Library Usage Description: "Pour ajouter des photos des ménages"
```

#### 5. Lancer l'App (5 min)
```bash
# Dans Xcode
1. Choisir un simulateur (iPhone 15 Pro recommandé)
2. Appuyer sur ▶️ (ou Cmd+R)
3. Attendre compilation (1-2 min première fois)
4. ✅ L'app s'ouvre dans le simulateur !
```

---

## 🧪 TESTER L'APPLICATION

### Compte de Test
```
Email: stephanecalvignac@hotmail.fr
Password: [Votre mot de passe Supabase]
```

### Scénarios de Test
1. **Login** : Tester connexion/déconnexion
2. **Dashboard** : Vérifier affichage réservations
3. **Calendrier** : Ajouter une réservation manuelle
4. **Ménage** : Consulter planning de la semaine
5. **Stats** : Vérifier graphiques CA

---

## 📁 STRUCTURE DU PROJET

```
ios-app/
├── Sources/
│   ├── App/
│   │   └── LiveOwnerUnitApp.swift          # Point d'entrée
│   ├── Models/                             # Modèles de données
│   │   ├── Gite.swift
│   │   ├── Reservation.swift
│   │   ├── CleaningSchedule.swift
│   │   └── User.swift
│   ├── ViewModels/                         # Logique métier
│   │   ├── BaseViewModel.swift
│   │   ├── ReservationsViewModel.swift
│   │   ├── DashboardViewModel.swift
│   │   └── ...
│   ├── Views/                              # Interface utilisateur
│   │   ├── Auth/
│   │   │   └── LoginView.swift
│   │   ├── Dashboard/
│   │   │   └── DashboardView.swift
│   │   ├── Calendar/
│   │   ├── Cleaning/
│   │   └── Stats/
│   ├── Services/                           # Services backend
│   │   ├── SupabaseManager.swift
│   │   ├── AuthService.swift
│   │   ├── ICalSyncService.swift
│   │   └── CacheManager.swift
│   └── Utils/                              # Utilitaires
│       ├── Extensions/
│       ├── Constants.swift
│       └── SecurityUtils.swift
└── Tests/                                  # Tests unitaires
    ├── ModelsTests/
    ├── ViewModelsTests/
    └── ServicesTests/
```

---

## 🔧 CONFIGURATION SUPABASE

Les identifiants Supabase sont déjà configurés dans `SupabaseManager.swift` :

```swift
// URL: https://fgqimtpjjhdqeyyaptoj.supabase.co
// Anon Key: [Déjà incluse dans le code]
```

**⚠️ Production** : Déplacer les clés dans `Config.xcconfig` (non inclus dans Git)

---

## 🐛 RÉSOLUTION DES PROBLÈMES

### Erreur "Module not found"
```bash
Solution: File → Packages → Resolve Package Versions
```

### Erreur de compilation
```bash
Solution: Product → Clean Build Folder (Shift+Cmd+K)
Puis relancer Build (Cmd+B)
```

### Simulateur ne démarre pas
```bash
Solution: Xcode → Preferences → Locations
Vérifier que Command Line Tools est configuré
```

### Erreur Supabase "Network error"
```bash
Vérifier que vous êtes connecté à Internet
Tester l'URL dans un navigateur:
https://fgqimtpjjhdqeyyaptoj.supabase.co
```

---

## 📞 SUPPORT

Si vous rencontrez un problème :

1. **Copier le message d'erreur exact** (⌘+C dans Xcode)
2. **Prendre un screenshot** de l'erreur
3. **Noter les étapes** qui ont mené à l'erreur
4. **Me contacter** avec ces informations

---

## 🎯 PROCHAINES ÉTAPES

Une fois l'app testée et fonctionnelle :

### Phase 2 : Test sur iPhone Physique
```bash
1. Connecter votre iPhone au Mac (USB)
2. Faire confiance au Mac sur l'iPhone
3. Dans Xcode, choisir votre iPhone comme destination
4. Appuyer sur ▶️
5. L'app s'installe sur votre iPhone (valide 7 jours)
```

### Phase 3 : Publication App Store (99€/an requis)
```bash
1. Inscription Apple Developer Program
2. Créer App ID dans Developer Console
3. Configurer App Store Connect
4. Soumettre pour review
5. Publication (1-3 jours de review)
```

---

## 📚 DOCUMENTATION TECHNIQUE

- **Architecture complète** : `REFERENCE_TECHNIQUE_APPLICATION_MOBILE.md`
- **Spécifications** : `SPECIFICATIONS_APPLICATION_APPLE.md`
- **Base de données** : `ARCHITECTURE.md` (racine du projet)

---

## ✅ VALIDATION

Checklist avant test sur Mac :

- [ ] Tous les fichiers copiés dans Xcode
- [ ] Packages Supabase + KeychainAccess installés
- [ ] Info.plist configuré avec permissions
- [ ] Build réussit sans erreur (Cmd+B)
- [ ] Simulateur iPhone 15 Pro sélectionné
- [ ] Connexion internet active

**Si tous les ✅ → Prêt à tester ! Appuyez sur ▶️**

---

**Bonne chance ! 🚀**
