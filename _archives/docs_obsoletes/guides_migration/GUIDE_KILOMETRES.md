# 🚗 SYSTÈME DE GESTION DES KILOMÈTRES PROFESSIONNELS

**Date création :** 19 janvier 2026  
**Version :** 1.0  
**Statut :** ✅ Implémenté - Prêt pour tests

---

## 📋 Vue d'Ensemble

Système complet de suivi des déplacements professionnels pour déduction fiscale au barème kilométrique. Permet :
- ✅ **Suivi détaillé des trajets** (manuel et automatique)
- ✅ **Configuration des distances** par gîte
- ✅ **Automatisation** sur réservations (cases à cocher par type)
- ✅ **Export Excel** pour expert-comptable
- ✅ **Calcul automatique** du montant déductible

---

## 🗄️ Base de Données

### 1. **Table `gites`** (modification)
**Ajout colonne :**
```sql
distance_km DECIMAL(6,2) DEFAULT 0
```
Distance depuis domicile/base jusqu'au gîte en km.

### 2. **Table `km_trajets`**
Historique complet des trajets professionnels.

**Colonnes principales :**
- `date_trajet` : Date du déplacement
- `annee_fiscale` : Année fiscale (pour filtrage)
- `motif` : Description du trajet
- `type_trajet` : `menage_entree`, `menage_sortie`, `courses`, `maintenance`, `autre`
- `lieu_arrivee` : Destination (nom du gîte ou magasin)
- `gite_id` : FK vers gîtes si applicable
- `distance_aller` : Distance en km (aller simple)
- `aller_retour` : Boolean (true = A/R)
- `distance_totale` : Calculée automatiquement
- `reservation_id` : FK vers réservation si trajet auto
- `auto_genere` : Boolean (true = créé automatiquement)

### 3. **Table `km_config_auto`**
Configuration de l'automatisation (une ligne par user).

**Colonnes :**
- `auto_menage_entree` : Boolean - Créer trajet ménage jour avant arrivée
- `auto_menage_sortie` : Boolean - Créer trajet ménage jour de départ
- `auto_courses` : Boolean - Créer trajet courses
- `auto_maintenance` : Boolean - Créer trajet maintenance

### 4. **Table `km_lieux_favoris`**
Lieux fréquents (magasins, fournisseurs) avec distances.

**Colonnes :**
- `nom` : Nom du lieu
- `type_lieu` : `magasin`, `autre`
- `distance_km` : Distance depuis domicile
- `adresse` : Adresse (optionnel)

---

## 📂 Fichiers Créés/Modifiés

### Nouveaux Fichiers

**SQL :**
- `sql/create_km_management.sql` - Création complète des tables + RLS

**JavaScript :**
- `js/km-manager.js` - Module de gestion des kilomètres (570 lignes)

**Documentation :**
- `docs/GUIDE_KILOMETRES.md` - Ce fichier

### Fichiers Modifiés

**JavaScript :**
- `js/fiscalite-v2.js` - Ajout 580 lignes pour interface kilomètres
  - Fonctions init, modals, calculs, exports

**HTML :**
- `tabs/tab-fiscalite-v2.html` - Section kilomètres + 3 modals
  - Interface complète dans bloc "🚗 Frais de véhicule"
  - Modals : Ajout trajet, Config auto, Lieux favoris

**CSS :**
- `css/fiscalite-neo.css` - Styles modals et boutons

**Autre :**
- `index.html` - Inclusion du script km-manager.js

---

## 🎨 Interface Utilisateur

### Section principale (tab-fiscalite-v2.html)

**Bloc "🚗 Frais de véhicule & Kilomètres professionnels" contient :**

1. **Configuration véhicule** (fond bleu)
   - Puissance fiscale (3-7 CV)
   - Total km (calculé automatiquement)
   - Montant déductible (barème 2024)

2. **Automatisation** (fond jaune)
   - Bouton "⚙️ Configurer"
   - Status des 4 types d'automatisation

3. **Distances gîtes** (fond violet)
   - Liste des gîtes avec input distance modifiable
   - Bouton "➕ Gérer mes lieux"

4. **Historique trajets** (fond blanc)
   - Résumé mensuel (cartes avec km/mois)
   - Liste complète des trajets
   - Boutons : "➕ Ajouter" | "📊 Export Excel"

### Modals

#### **Modal 1 : Ajouter un trajet**
Formulaire complet avec :
- Date
- Type (liste déroulante : ménage entrée/sortie, courses, maintenance, autre)
- Motif (auto-rempli selon type)
- Destination (liste gîtes + lieux favoris + "autre")
- Distance aller (auto-remplie si destination connue)
- Checkbox Aller-retour
- Distance totale (calculée en temps réel)
- Notes (optionnel)

#### **Modal 2 : Configuration automatisation**
4 cases à cocher avec descriptions :
- ✅ Ménage entrée (jour avant arrivée)
- ✅ Ménage sortie (jour de départ)
- ❌ Courses (avant arrivée)
- ❌ Maintenance (périodique)

#### **Modal 3 : Gestion lieux**
Deux sections :
- **Mes gîtes** : Liste avec input distance/gîte
- **Magasins** : Formulaire ajout (nom, distance, adresse) + liste avec suppression

---

## ⚙️ Fonctionnalités

### 1. Configuration des distances

**Par gîte :**
```javascript
// Affichage automatique dans "Distances depuis mon domicile"
await chargerDistancesGites();

// Sauvegarde immédiate au changement
sauvegarderDistanceGite(giteId, distance);
```

**Lieux favoris (magasins) :**
```javascript
await KmManager.ajouterLieuFavori({
    nom: "Intermarché Cahors",
    distance_km: 12.5,
    adresse: "Route de Paris"
});
```

### 2. Ajout manuel de trajets

```javascript
await KmManager.ajouterTrajet({
    date_trajet: "2026-01-19",
    motif: "Courses Intermarché",
    type_trajet: "courses",
    lieu_arrivee: "Intermarché Cahors",
    distance_aller: 12.5,
    aller_retour: true
});
// → Crée trajet avec distance_totale = 25 km
```

### 3. Automatisation sur réservations

**À l'ajout/modification d'une réservation :**
```javascript
// Appelé automatiquement depuis reservations.js
const result = await KmManager.creerTrajetsAutoReservation(reservation);
// → Crée 0-4 trajets selon configuration
```

**Exemple avec config par défaut (ménage entrée + sortie activés) :**
- Réservation : Gîte La Roseraie, arrivée 25/01, départ 28/01
- Distance gîte : 8 km
- **Trajets créés automatiquement :**
  1. Date : 24/01, Motif : "Ménage entrée - La Roseraie", 16 km A/R
  2. Date : 28/01, Motif : "Ménage sortie - La Roseraie", 16 km A/R

**Suppression :**
À la suppression d'une réservation, les trajets auto sont supprimés :
```javascript
await KmManager.supprimerTrajetsAutoReservation(reservationId);
```

### 4. Calculs automatiques

**Total km annuel :**
```javascript
const totalKm = KmManager.calculerTotalKm(trajetsAnnee);
// → Somme de tous les distance_totale
```

**Montant déductible (barème 2024) :**
```javascript
const montant = KmManager.calculerMontantDeductible(totalKm, puissanceFiscale);
// Utilise barème progressif :
// - 0-5000 km : 0.636€/km (5 CV)
// - 5001-20000 km : 0.357€/km
// - 20001+ km : 0.427€/km
```

**Mise à jour automatique :**
- À chaque ajout/suppression de trajet
- Au changement de puissance fiscale
- Au chargement d'une année

### 5. Export Excel (CSV)

```javascript
KmManager.exporterCSV(trajetsAnnee, annee);
```

**Fichier généré : `trajets_km_2026.csv`**

Colonnes :
- Date
- Motif
- Type
- Départ
- Arrivée
- Distance aller (km)
- Aller-retour (Oui/Non)
- Distance totale (km)
- Auto-généré (Oui/Non)
- Notes

Ligne finale : **TOTAL** avec somme des km

---

## 🔄 Workflow Complet

### Première utilisation

1. **Configurer les distances des gîtes**
   - Ouvrir section "🚗 Frais de véhicule"
   - Cliquer "📍 Distances depuis mon domicile"
   - Saisir la distance pour chaque gîte

2. **Configurer l'automatisation**
   - Cliquer "⚙️ Configurer"
   - Cocher les types de trajets à auto-générer
   - Sauvegarder

3. **Ajouter des lieux favoris (optionnel)**
   - Cliquer "➕ Gérer mes lieux"
   - Section "Magasins & autres lieux"
   - Ajouter nom + distance

### Utilisation quotidienne

**Automatique :**
- Lors d'une réservation → Trajets ménage créés automatiquement

**Manuel :**
- Cliquer "➕ Ajouter un trajet"
- Remplir formulaire
- Enregistrer

**Vérification :**
- Le total km et montant se mettent à jour automatiquement
- Consulter l'historique mensuel

**Export comptable :**
- Fin d'année → Cliquer "📊 Export Excel"
- Envoyer le CSV à l'expert-comptable

---

## 🔐 Sécurité (RLS)

**Toutes les tables ont Row Level Security activé :**

```sql
-- Exemple pour km_trajets
CREATE POLICY "Users can view own km_trajets"
    ON public.km_trajets FOR SELECT
    USING (auth.uid() = owner_user_id);
```

Chaque utilisateur ne voit/modifie que SES données.

---

## 📊 Barème Kilométrique 2024

Implémenté dans `KmManager.calculerMontantDeductible()` :

| CV | 0-5000 km | 5001-20000 km | 20001+ km |
|----|-----------|---------------|-----------|
| 3  | 0.529 €   | 0.316 €       | 0.370 €   |
| 4  | 0.606 €   | 0.340 €       | 0.407 €   |
| 5  | 0.636 €   | 0.357 €       | 0.427 €   |
| 6  | 0.665 €   | 0.374 €       | 0.447 €   |
| 7+ | 0.697 €   | 0.394 €       | 0.470 €   |

---

## 🚀 Installation / Activation

### 1. Exécuter le script SQL

Dans Supabase SQL Editor :
```sql
-- Copier/coller le contenu de sql/create_km_management.sql
-- Exécuter
```

**✅ Vérifie :**
- Colonne `distance_km` ajoutée dans `gites`
- 3 nouvelles tables créées
- RLS configuré

### 2. Rafraîchir l'application

- Vider le cache navigateur (Ctrl+Shift+R)
- Recharger la page

### 3. Tester

1. Onglet "Fiscalité"
2. Ouvrir section "🚗 Frais de véhicule"
3. Configurer distance d'un gîte
4. Ajouter un trajet manuel
5. Vérifier calcul automatique

---

## 🐛 Troubleshooting

### Problème : "KmManager is not defined"
**Cause :** Script km-manager.js non chargé  
**Solution :** Vérifier que le script est dans index.html AVANT fiscalite-v2.js

### Problème : Trajets auto non créés
**Cause :** Distance gîte = 0 ou config auto désactivée  
**Solution :**
1. Vérifier distance gîte > 0
2. Ouvrir modal config, cocher "Ménage entrée/sortie"

### Problème : Export CSV vide
**Cause :** Aucun trajet pour l'année  
**Solution :** Ajouter des trajets ou changer d'année

### Problème : SQL error "column already exists"
**Cause :** Script SQL déjà exécuté  
**Solution :** Normal, le script vérifie l'existence (IF NOT EXISTS)

---

## 📈 Évolutions Futures

**Possibles améliorations :**

- [ ] **Import iCal** : Détecter automatiquement les déplacements depuis agenda
- [ ] **Géolocalisation** : Calcul automatique des distances via Google Maps API
- [ ] **Statistiques** : Graphiques mensuels, par gîte, par type
- [ ] **Multi-véhicules** : Gérer plusieurs véhicules avec barèmes différents
- [ ] **Indemnités kilométriques collaborateurs** : Si embauche femme de ménage
- [ ] **Export PDF** : Justificatif détaillé pour contrôle fiscal
- [ ] **Trajet récurrent** : Dupliquer un trajet sur plusieurs dates

---

## ✅ Checklist Post-Installation

- [ ] Script SQL exécuté dans Supabase
- [ ] Tables créées (vérifier via Supabase Table Editor)
- [ ] Distance configurée pour au moins 1 gîte
- [ ] Configuration automatisation sauvegardée
- [ ] 1 trajet test ajouté manuellement
- [ ] Total km calculé correctement
- [ ] Export CSV fonctionne
- [ ] 1 réservation test créée → trajets auto générés

---

## 📝 Notes Importantes

⚠️ **PRODUCTION** : Ce système est en PRODUCTION  
✅ **RLS** : Toutes les données sont isolées par utilisateur  
💾 **Sauvegarde** : Les trajets sont dans `km_trajets`, pas dans `donnees_detaillees`  
🔄 **Sync** : Le total km se met à jour automatiquement dans la section fiscalité  
📊 **Comptabilité** : L'export CSV est conforme aux exigences comptables françaises

---

**Développé le :** 19 janvier 2026  
**Testé :** En attente  
**Validé :** En attente
