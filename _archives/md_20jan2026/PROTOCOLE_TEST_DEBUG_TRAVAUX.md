# 🧪 PROTOCOLE DE TEST DEBUG - TRAVAUX FISCAUX

## 📋 Étapes à suivre

### 1️⃣ **Ouvrir la console** (F12)
   - Onglet Console
   - Vider la console (Clear console)

### 2️⃣ **Aller sur la page Fiscalité**
   - Vous devriez voir :
     ```
     ✅ Données fiscales 2026 chargées: { ca: ..., nb_travaux: X, ... }
     🔄 Restauration de X travaux: [...]
     ```

### 3️⃣ **Ajouter un nouveau travail**
   - Cliquez sur "➕ Ajouter un travail"
   - **ATTENDEZ** - Vérifiez la console :
     ```
     ➕ [AJOUT] Création nouveau travail ID=X
     ```

### 4️⃣ **Remplir les champs**
   - Description : "Test debug"
   - Gîte : (choisir un gîte)
   - Montant : 100

### 5️⃣ **Valider (clic sur ✓ vert)**
   - **REGARDEZ LA CONSOLE** - Vous devriez voir :
     ```
     ✅ [VALIDATION] travaux-X: { desc: "Test debug", gite: "...", montant: 100 }
     💾 [SAVE-TRIGGER] Déclenchement sauvegarde depuis travaux-X
     📋 [GET] Collecte des travaux (travauxCounter=X)
       📦 [GET] travaux-1: {...}
       📦 [GET] travaux-2: {...}
     ✅ [GET] Total collecté: X travaux
     💾 [SAVE-START] Sauvegarde année 2026
     📊 [SAVE-DATA] Travaux à sauvegarder: [...]
     📊 [SAVE-DATA] Nombre de travaux: X
     ✅ [SAVE-SUCCESS] Données sauvegardées en BDD: [...]
     ```
   - **ET** un toast : "✓ Données fiscales sauvegardées"

### 6️⃣ **Vérifier en base de données**
   - Exécutez dans Supabase SQL Editor :
     ```sql
     SELECT 
         jsonb_pretty(donnees_detaillees->'travaux_liste') 
     FROM fiscal_history 
     WHERE year = 2026 AND gite = 'multi';
     ```
   - Vous devriez voir votre travail "Test debug"

### 7️⃣ **Changer de page**
   - Allez sur "Dashboard"
   - Revenez sur "Fiscalité"

### 8️⃣ **Vérifier le rechargement**
   - **CONSOLE** doit afficher :
     ```
     ✅ Données fiscales 2026 chargées: { ca: ..., nb_travaux: X, ... }
     🔄 Restauration de X travaux: [...]
       ✅ Travail 1 restauré: { id: 1, description: "...", gite: "...", montant: ... }
       ✅ Travail 2 restauré: { id: 2, description: "Test debug", gite: "...", montant: 100 }
     ```
   - Vos travaux doivent être **visibles à l'écran**

---

## 🐛 En cas de problème

### Problème A : Aucun log lors de l'ajout
**➡️ Le JavaScript n'est pas chargé**
- Rechargez la page (CTRL+F5)
- Vérifiez qu'il n'y a pas d'erreur JS avant

### Problème B : Logs VALIDATION ok, mais pas de SAVE-START
**➡️ La fonction sauvegarderDonneesFiscales n'est pas appelée**
- Vérifiez qu'il n'y a pas d'erreur JS après le clic sur ✓

### Problème C : SAVE-DATA montre 0 travaux
**➡️ getTravauxListe() ne collecte rien**
- Regardez les logs `[GET]` détaillés
- Vérifiez que les IDs correspondent (travaux-1, travaux-2, etc.)

### Problème D : SAVE-SUCCESS ok, mais rien en BDD
**➡️ Problème RLS ou contrainte unique**
- Vérifiez le log complet du résultat Supabase

### Problème E : BDD ok, mais pas de restauration
**➡️ Problème dans chargerDerniereSimulation()**
- Regardez le log `🔄 Restauration de X travaux`
- Si X = 0, le JSONB est vide ou mal structuré

---

## 📧 Rapport de bug

Si problème persistant, copie-collez :
1. **Console complète** (depuis l'ajout jusqu'au rechargement)
2. **Résultat SQL** (requête ci-dessus)
3. **Screenshot** de la page avec F12 ouvert
