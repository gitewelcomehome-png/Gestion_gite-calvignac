# 📱 GUIDE INSTALLATION PAS À PAS - Application iOS LiveOwnerUnit

> **Temps estimé:** 30-45 minutes  
> **Difficulté:** Facile (même sans expérience Xcode)  
> **Date:** 7 février 2026

---

## 🎯 CE DONT VOUS AVEZ BESOIN

### Obligatoire
- ✅ Un Mac (MacBook, iMac, Mac Mini...)
- ✅ macOS 13.0 ou plus récent (Ventura/Sonoma)
- ✅ Connexion internet stable
- ✅ 15 Go d'espace disque libre

### Vous allez installer
- Xcode (l'outil Apple pour créer des apps iOS)
- 2 bibliothèques Swift (automatique)

---

## 📋 ÉTAPE 1 : INSTALLER XCODE (15 min)

### 1.1 Ouvrir l'App Store
```
1. Cliquer sur l'icône  (pomme) en haut à gauche
2. Cliquer sur "App Store"
3. Attendre que l'App Store s'ouvre
```

### 1.2 Télécharger Xcode
```
1. Dans la barre de recherche en haut, taper : Xcode
2. Cliquer sur l'app "Xcode" (logo marteau bleu)
3. Cliquer sur le bouton "Obtenir" ou "Télécharger" (gratuit)
4. Entrer votre mot de passe Apple si demandé
5. ATTENDRE le téléchargement (7-10 Go, prend 5-15 min selon votre connexion)
```

### 1.3 Ouvrir Xcode la première fois
```
1. Une fois téléchargé, cliquer "Ouvrir" dans l'App Store
   OU
   Aller dans Applications > Double-cliquer sur Xcode
   
2. Cliquer "Agree" (Accepter la licence)
3. Entrer votre mot de passe Mac si demandé
4. ATTENDRE l'installation des composants (2-3 min)
5. Fenêtre "Welcome to Xcode" apparaît ✅
```

---

## 📂 ÉTAPE 2 : CRÉER LE PROJET (5 min)

### 2.1 Créer un nouveau projet
```
1. Dans la fenêtre "Welcome to Xcode", cliquer sur :
   "Create New Project" (gros bouton bleu)
   
2. Une fenêtre s'ouvre avec des templates
```

### 2.2 Choisir le type d'app
```
1. En haut, cliquer sur l'onglet "iOS" (déjà sélectionné normalement)
2. Dans la première ligne, cliquer sur "App" (icône iPhone)
3. En bas à droite, cliquer sur "Next"
```

### 2.3 Configurer les infos du projet
```
Dans la fenêtre qui apparaît, remplir :

Product Name: LiveOwnerUnit
Team: None (laisser vide si vous n'avez pas de compte développeur)
Organization Identifier: com.liveownerunit
Interface: SwiftUI (déjà sélectionné normalement)
Language: Swift (déjà sélectionné)
Storage: None

Décocher :
☐ Use Core Data
☐ Include Tests

Cliquer "Next"
```

### 2.4 Choisir où sauvegarder
```
1. Choisir un dossier (Bureau ou Documents recommandé)
2. Décocher "Create Git repository" (si coché)
3. Cliquer "Create"
4. ✅ Xcode ouvre votre projet vide
```

---

## 📥 ÉTAPE 3 : IMPORTER LES FICHIERS (5 min)

### 3.1 Ouvrir le dossier des fichiers
```
1. Minimiser Xcode (ne pas fermer)
2. Ouvrir le Finder
3. Naviguer vers le dossier de ce projet :
   /workspaces/Gestion_gite-calvignac/ios-app/Sources/
```

### 3.2 Voir la structure dans Xcode
```
Dans Xcode, à gauche vous voyez :
📁 LiveOwnerUnit (projet)
  📁 LiveOwnerUnit (dossier)
    📄 LiveOwnerUnitApp.swift
    📄 ContentView.swift
    📁 Assets.xcassets
    📄 Preview Content
```

### 3.3 Supprimer les fichiers par défaut
```
1. Dans Xcode (sidebar gauche), clic droit sur "ContentView.swift"
2. Cliquer "Delete"
3. Choisir "Move to Trash"
```

### 3.4 Glisser-déposer NOS fichiers
```
1. Dans le Finder, sélectionner TOUS les dossiers dans Sources/ :
   - App/
   - Models/
   - ViewModels/
   - Views/
   - Services/
   - Utils/
   
2. Glisser ces 6 dossiers dans Xcode (sur le dossier LiveOwnerUnit)

3. Une fenêtre apparaît, COCHER :
   ✅ Copy items if needed
   ✅ Create groups
   ✅ LiveOwnerUnit (dans Targets)
   
4. Cliquer "Finish"

5. ✅ Vous voyez maintenant tous les dossiers dans Xcode
```

---

## 📦 ÉTAPE 4 : AJOUTER LES BIBLIOTHÈQUES (10 min)

### 4.1 Ouvrir les paramètres du projet
```
1. Dans Xcode, cliquer sur "LiveOwnerUnit" (tout en haut de la sidebar gauche, icône bleue)
2. En haut au centre, cliquer sur l'onglet "Package Dependencies"
```

### 4.2 Ajouter Supabase
```
1. En bas à gauche, cliquer sur le "+" 
2. Dans la barre de recherche en haut à droite, coller :
   https://github.com/supabase-community/supabase-swift
   
3. Appuyer sur Entrée
4. ATTENDRE 10-30 secondes (Xcode vérifie le package)
5. Cliquer "Add Package" en bas à droite
6. Dans la fenêtre suivante, COCHER toutes les cases :
   ✅ Auth
   ✅ Functions
   ✅ PostgREST
   ✅ Realtime
   ✅ Storage
   ✅ Supabase
   
7. Cliquer "Add Package"
8. ATTENDRE le téléchargement (1-2 min)
```

### 4.3 Ajouter KeychainAccess
```
1. Re-cliquer sur le "+" en bas à gauche
2. Dans la barre de recherche, coller :
   https://github.com/kishikawakatsumi/KeychainAccess
   
3. Appuyer sur Entrée
4. ATTENDRE 5-10 secondes
5. Cliquer "Add Package"
6. Cliquer "Add Package" dans la fenêtre suivante
7. ATTENDRE le téléchargement (30 sec)
8. ✅ Les 2 packages sont maintenant installés
```

---

## 🔐 ÉTAPE 5 : CONFIGURER LES PERMISSIONS (3 min)

### 5.1 Ouvrir Info.plist
```
1. Dans la sidebar gauche, cliquer sur le dossier "LiveOwnerUnit"
2. Chercher le fichier "Info.plist" (liste au milieu)
3. Cliquer dessus
```

### 5.2 Ajouter les permissions photos
```
1. Clic droit dans la zone blanche (liste des permissions)
2. Cliquer "Add Row"
3. Dans le menu déroulant, taper : Privacy - Photo
4. Choisir "Privacy - Photo Library Usage Description"
5. Dans la colonne "Value", taper :
   Pour ajouter des photos des ménages effectués
   
6. Appuyer sur Entrée
```

### 5.3 Ajouter les permissions caméra
```
1. Même chose : Clic droit > Add Row
2. Taper : Privacy - Camera
3. Choisir "Privacy - Camera Usage Description"
4. Dans Value, taper :
   Pour photographier l'état des gîtes après ménage
   
5. Appuyer sur Entrée
6. ✅ Les 2 permissions sont ajoutées
```

---

## ⚙️ ÉTAPE 6 : CONFIGURER SUPABASE (5 min)

### 6.1 Ouvrir le fichier de configuration
```
1. Dans la sidebar, ouvrir le dossier "Services"
2. Cliquer sur "SupabaseManager.swift"
3. Le code s'affiche à droite
```

### 6.2 Remplacer les URLs
```
1. Chercher les lignes (autour de la ligne 15) :
   private let supabaseURL = "VOTRE_URL_SUPABASE"
   private let supabaseKey = "VOTRE_CLE_SUPABASE"

2. Les remplacer par VOS vrais identifiants Supabase :
   
   Où trouver vos identifiants ?
   → Aller sur https://supabase.com/dashboard
   → Ouvrir votre projet
   → Settings > API
   → Copier "Project URL" et "anon public"

3. Une fois remplacé, cliquer Cmd+S pour sauvegarder
```

---

## 🚀 ÉTAPE 7 : LANCER L'APP (5 min)

### 7.1 Choisir un simulateur
```
1. En haut au centre de Xcode, vous voyez :
   "LiveOwnerUnit > [un appareil]"
   
2. Cliquer sur la partie "[un appareil]"
3. Un menu s'ouvre, choisir :
   iPhone 15 Pro (ou iPhone 14 Pro si pas dispo)
```

### 7.2 Compiler et lancer
```
1. Cliquer sur le bouton ▶️ (Play) en haut à gauche
   OU
   Appuyer sur Cmd+R

2. ATTENDRE la compilation (1-3 minutes la première fois)
   Vous voyez en haut au centre : "Building..."
   
3. Un simulateur iPhone s'ouvre (fenêtre noire qui ressemble à un iPhone)
4. L'app se lance automatiquement
5. ✅ SUCCÈS ! Vous voyez l'écran de connexion
```

---

## 🧪 ÉTAPE 8 : TESTER L'APP

### 8.1 Se connecter
```
Email : stephanecalvignac@hotmail.fr
Mot de passe : [Votre mot de passe Supabase]

Cliquer "Se connecter"
```

### 8.2 Explorer les écrans
```
En bas, 5 onglets :
- 🏠 Dashboard : Vue d'ensemble
- 📅 Calendrier : Réservations
- 🧹 Ménage : Planning nettoyage
- 📊 Stats : Statistiques
- ⚙️ Paramètres : Réglages
```

---

## ❓ PROBLÈMES COURANTS

### ⚠️ Erreur "No such module 'Supabase'"
```
Solution :
1. File > Packages > Resolve Package Versions
2. Attendre 1-2 min
3. Re-lancer avec ▶️
```

### ⚠️ Erreur "Signing for LiveOwnerUnit requires a development team"
```
Solution :
1. Cliquer sur le projet (icône bleue en haut à gauche)
2. Cliquer sur l'onglet "Signing & Capabilities"
3. Dans "Team", choisir votre compte Apple
   (ou créer un compte gratuit en cliquant "Add Account")
```

### ⚠️ Le simulateur est lent
```
Solution :
1. Fermer le simulateur
2. Choisir un iPhone plus ancien (iPhone SE ou iPhone 13)
3. Re-lancer
```

### ⚠️ Beaucoup d'erreurs rouges dans le code
```
Solution probable : Les fichiers ne sont pas tous importés
1. Vérifier que vous avez bien les 6 dossiers dans la sidebar
2. Si manquant, recommencer l'étape 3
```

---

## 📞 BESOIN D'AIDE ?

Si vous bloquez à une étape :
1. Faire une capture d'écran de l'erreur
2. Noter à quelle étape vous êtes bloqué
3. Me la montrer pour que je vous aide

---

## ✅ CHECKLIST FINALE

Avant de dire que c'est terminé, vérifier :

**Étape 1 :**
- [ ] Xcode est installé et s'ouvre

**Étape 2 :**
- [ ] Projet "LiveOwnerUnit" créé

**Étape 3 :**
- [ ] 6 dossiers visibles dans Xcode (App, Models, ViewModels, Views, Services, Utils)

**Étape 4 :**
- [ ] 2 packages installés (Supabase + KeychainAccess)

**Étape 5 :**
- [ ] 2 permissions ajoutées dans Info.plist

**Étape 6 :**
- [ ] URLs Supabase configurées

**Étape 7 :**
- [ ] L'app se lance dans le simulateur

**Étape 8 :**
- [ ] Connexion fonctionne

---

**Bon courage ! 🚀**
