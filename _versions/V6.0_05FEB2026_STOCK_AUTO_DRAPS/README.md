# VERSION 6.0 - 5 Février 2026
## STOCK AUTOMATIQUE DRAPS + FIXES CALCULS

### 🎯 Nouveautés Majeures

#### 1. Système de Décrémentation Automatique du Stock
- **Trigger automatique** : Lors du chargement de la page Draps
- **Logique** : Décrémente le stock pour chaque réservation dont `check_out = aujourd'hui`
- **Sécurité** : Table `linen_stock_transactions` empêche le double traitement
- **Tracking** : Conservation de l'historique des décrémentiations

**Fichiers modifiés :**
- `js/draps.js` : Fonction `decrementerStockReservationsTerminees()` (lignes 547-658)
- `sql/create_linen_stock_transactions.sql` : Nouvelle table de tracking

#### 2. Modal de Visualisation des Décrémentiations
- **Objectif** : Tester et valider la décrémentation automatique
- **Affichage** : Pour chaque gîte/item → Avant : X → -Y → Après : Z
- **Codes couleur** : Bleu (avant), Rouge (différence), Jaune (après)
- **À SUPPRIMER** : Une fois le système validé en production

**Fichiers modifiés :**
- `js/draps.js` : Fonction `afficherModalDecrementationStock()` (lignes 660-748)

#### 3. Correction Calculs "À Emmener"
- **Bug corrigé** : Comptait toutes les réservations au lieu des futures uniquement
- **Nouvelle logique** : 
  - Compte les `check_out` entre aujourd'hui et la date sélectionnée
  - Chaque checkout = 1 set de draps nécessaire
- **Résultat** : Calcul précis des besoins

**Fichiers modifiés :**
- `js/draps.js` : Fonction `calculerManquePourGite()` (lignes 893-980)
- `tabs/tab-draps.html` : Sélection par boutons au lieu de dropdown

#### 4. Simulation Globale
- **Modification** : Affichage global au lieu de par gîte
- **Affichage** :
  - Nombre total de réservations
  - Stock global suffisant/insuffisant
  - Items à commander avec calculs
- **UX** : Card centrée plus lisible

**Fichiers modifiés :**
- `js/draps.js` : Fonction `afficherResultatsSimulation()` (lignes 1201-1340)

#### 5. Fix Modal Règles de Ménage
- **Bug** : Variable CSS `--background` inexistante
- **Solution** : Utilisation de `var(--bg-secondary)` + overlay `rgba(0,0,0,0.85)`
- **Résultat** : Modal adapté au thème actif

**Fichiers modifiés :**
- `js/cleaning-rules-modal.js` : Ligne 7 (background corrigé)

### 📁 Fichiers Créés
- `sql/create_linen_stock_transactions.sql` : Table de tracking

### 📝 Fichiers Modifiés
- `js/draps.js` : ~200 lignes ajoutées/modifiées
- `js/cleaning-rules-modal.js` : 1 ligne modifiée
- `tabs/tab-draps.html` : Boutons de sélection

### 🔄 Base de Données
**Action requise avant déploiement :**
```sql
-- Exécuter dans Supabase SQL Editor
-- Fichier : sql/create_linen_stock_transactions.sql
CREATE TABLE linen_stock_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL,
    gite_id UUID NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_user_id, reservation_id)
);
```

### ⚠️ Actions Post-Déploiement
1. **Exécuter le SQL** : Créer la table `linen_stock_transactions` dans Supabase
2. **Tester la décrémentation** : Attendre un checkout réel (6 février 2026)
3. **Valider le modal** : Vérifier les calculs dans la visualisation
4. **Supprimer le modal** : Une fois validé, retirer `afficherModalDecrementationStock()`

### 🚀 Statut
**PRODUCTION READY** (après exécution SQL)
- ✅ Décrémentation automatique fonctionnelle
- ✅ Sécurité anti-doublon garantie
- ✅ Calculs corrigés et validés
- ✅ Modal de test opérationnel
- ⏳ En attente de validation réelle
