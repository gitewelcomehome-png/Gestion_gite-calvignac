# 📊 Documentation complète - Module Fiscalité LMNP

## Vue d'ensemble

Le module de fiscalité permet aux propriétaires de gérer leur déclaration LMNP (Loueur Meublé Non Professionnel) avec calcul automatique des charges, amortissements et optimisation fiscale.

---

## 🎯 Fonctionnalités principales

### 1. Gestion multi-années
- **Sélecteur d'année** : Permet de basculer entre les différentes années fiscales
- **Création d'année** : Bouton "Nouvelle Année" crée automatiquement l'année suivante
- **Données isolées** : Chaque année stocke ses propres données indépendamment

### 2. Calcul automatique du CA
- **Source** : Récupération automatique depuis les réservations de l'année
- **Affichage** : Carte visuelle en haut avec montant formaté (ex: "12 701,00 €")
- **Champ caché** : `<input type="hidden" id="ca">` pour les calculs

---

## 📝 Structure des champs et traitement

### BLOC 1 : Chiffre d'affaires

#### Champ : `ca` (Chiffre d'affaires annuel)
- **Type** : Hidden (lecture seule)
- **Traitement** : 
  - Calculé automatiquement via `calculerCADepuisReservations()`
  - Mis à jour par `mettreAJourAffichageCA(valeur)`
  - Affiché dans `#ca-display`
- **Sauvegarde** : Non (calculé à la volée)
- **Utilisation** : Base de tous les calculs fiscaux

---

### BLOC 2 : Charges par gîte

Chaque gîte possède sa propre section de charges. Les champs sont générés dynamiquement.

#### Champs par gîte (14 types de charges)

##### Charges avec périodicité (Mensuel/Annuel) :

1. **`internet_[giteId]`** - Internet
   - **Type** : Number
   - **Toggle** : Mensuel ↔ Annuel
   - **Traitement** : 
     - Si mensuel : valeur × 12
     - Si annuel : valeur
   - **Fonction** : `togglePeriodSection(giteId, 'mensuel'|'annuel')`
   - **Sauvegarde** : Valeur brute + type de période

2. **`eau_[giteId]`** - Eau
   - Même traitement que Internet

3. **`electricite_[giteId]`** - Électricité
   - Même traitement que Internet

4. **`assurance_hab_[giteId]`** - Assurance habitation
   - Même traitement que Internet

5. **`assurance_emprunt_[giteId]`** - Assurance emprunteur
   - Même traitement que Internet

6. **`interets_emprunt_[giteId]`** - Intérêts d'emprunt
   - Même traitement que Internet

7. **`menage_[giteId]`** - Ménage/Entretien
   - Même traitement que Internet

8. **`linge_[giteId]`** - Linge (draps, serviettes)
   - Même traitement que Internet

9. **`logiciel_[giteId]`** - Logiciel de gestion
   - Même traitement que Internet

10. **`copropriete_[giteId]`** - Charges de copropriété
    - Même traitement que Internet

##### Charges TOUJOURS annuelles (pas de toggle) :

11. **`taxe_fonciere_[giteId]`** - Taxe foncière
    - **Type** : Number
    - **Périodicité** : ANNUEL uniquement
    - **Traitement** : Valeur directe (pas de conversion)
    - **Sauvegarde** : Valeur brute

12. **`cfe_[giteId]`** - CFE (Cotisation Foncière des Entreprises)
    - **Type** : Number
    - **Périodicité** : ANNUEL uniquement
    - **Traitement** : Valeur directe
    - **Sauvegarde** : Valeur brute

13. **`commissions_[giteId]`** - Commissions plateformes
    - **Type** : Number
    - **Périodicité** : ANNUEL uniquement
    - **Traitement** : Valeur directe
    - **Sauvegarde** : Valeur brute

14. **`amortissement_[giteId]`** - Amortissement du bien
    - **Type** : Number
    - **Périodicité** : ANNUEL uniquement
    - **Traitement** : Valeur directe
    - **Sauvegarde** : Valeur brute
    - **Note** : Amortissement du bien immobilier sur 20-30 ans

---

### BLOC 2C : Frais d'exploitations

Section collapsible contenant 3 sous-sections dynamiques.

#### Sous-section 1 : Travaux/Réparations

**Liste dynamique** stockée dans tableau `travaux[]`

Chaque élément contient :
- **`description`** : String - Description du travail
- **`montant`** : Number - Montant TTC
- **`date_travaux`** : Date - Date d'exécution
- **`type_amortissement`** : String - Type détecté automatiquement ou choisi manuellement
- **`id`** : Number - Identifiant unique

**Règles d'amortissement automatique** :
```javascript
SEUIL_AMORTISSEMENT_TTC: 720€

Catégories détectées par mots-clés :
- Informatique (3 ans) : ordinateur, pc, laptop, tablette, smartphone, etc.
- Électroménager (5 ans) : lave-linge, frigo, four, etc.
- Mobilier (10 ans) : canapé, lit, matelas, table, etc.
- Équipements AV (5 ans) : TV, sono, enceinte, etc.
- Rénovation légère (10 ans) : peinture, parquet, plomberie, etc.
- Gros travaux (20 ans) : toiture, façade, isolation, etc.
```

**Traitement** :
- Si montant < 720€ : déductible immédiatement (charge courante)
- Si montant ≥ 720€ : amortissement sur X années
- Calcul montant annuel : `montant / duree`
- Affichage badge : "📊 X ans (Y€/an jusqu'en ZZZZ)"

**Fonctions** :
- `ajouterTravaux()` : Ajoute une ligne
- `detecterAmortissement(desc, montant, type)` : Calcule l'amortissement
- `supprimerTravaux(id)` : Supprime une ligne
- Recalcul automatique à chaque modification

#### Sous-section 2 : Frais divers

**Liste dynamique** stockée dans tableau `fraisDivers[]`

Chaque élément contient :
- **`description`** : String - Description du frais
- **`montant`** : Number - Montant
- **`date_frais`** : Date - Date du frais
- **`id`** : Number - Identifiant unique

**Traitement** :
- Somme simple de tous les montants
- Pas d'amortissement (frais déductibles directement)
- Exemples : fournitures, petit matériel, frais postaux, etc.

**Fonctions** :
- `ajouterFraisDivers()` : Ajoute une ligne
- `supprimerFraisDivers(id)` : Supprime une ligne

#### Sous-section 3 : Produits d'accueil

**Liste dynamique** stockée dans tableau `produits[]`

Chaque élément contient :
- **`description`** : String - Description du produit
- **`montant`** : Number - Montant
- **`date_achat`** : Date - Date d'achat
- **`id`** : Number - Identifiant unique

**Traitement** :
- Somme simple de tous les montants
- Pas d'amortissement
- Exemples : café, thé, gel douche, shampooing, etc.

**Fonctions** :
- `ajouterProduit()` : Ajoute une ligne
- `supprimerProduit(id)` : Supprime une ligne

---

### BLOC 3 : Frais kilométriques

**Configuration** stockée dans `configKm`

Champs :
- **`bareme_km`** : Number - Barème kilométrique (défaut: 0.568 €/km pour véhicule 7CV)
- **`domicile_adresse`** : String - Adresse du domicile principal

**Liste des trajets** stockée dans tableau `trajets[]`

Chaque trajet contient :
- **`date_trajet`** : Date - Date du déplacement
- **`motif`** : String - Motif (réparation, ménage, accueil voyageur, etc.)
- **`lieu_depart`** : String - Adresse de départ
- **`lieu_arrivee`** : String - Adresse d'arrivée
- **`distance_km`** : Number - Distance en km (calculée automatiquement via API Google Maps)
- **`montant_calcule`** : Number - Montant = distance × barème
- **`id`** : Number - Identifiant unique

**Fonctions** :
- `configurerKilometrage()` : Configure le barème et domicile
- `ajouterTrajetKm()` : Ajoute un trajet
- `calculerDistanceTrajet(id)` : Appelle l'API Google Maps pour calculer la distance
- `supprimerTrajetKm(id)` : Supprime un trajet
- Total automatique : Somme de tous les `montant_calcule`

**Lieux favoris** :
- Possibilité d'enregistrer des lieux fréquents
- Stockés dans `lieuxFavoris[]`
- Remplissage rapide des adresses

---

### BLOC 4 : Crédits personnels investis

**Liste dynamique** stockée dans tableau `creditsPersonnels[]`

Chaque crédit contient :
- **`description`** : String - Description de la dépense
- **`montant`** : Number - Montant investi
- **`date_depense`** : Date - Date de la dépense
- **`id`** : Number - Identifiant unique

**Traitement** :
- Ces montants sont des **apports personnels** non déductibles fiscalement
- Utilisés pour le suivi de trésorerie et calcul du retour sur investissement
- Ne sont PAS inclus dans les charges déductibles

**Fonctions** :
- `ajouterCredit()` : Ajoute un crédit
- `supprimerCredit(id)` : Supprime un crédit
- Affichage du total pour info uniquement

---

## 🔄 Flux de traitement des données

### 1. Chargement d'une année

```javascript
chargerAnnee(annee) {
  1. Vérifie si l'année existe en BDD
  2. Si non : créer structure vide
  3. Si oui : charger toutes les données
  4. Remplir tous les champs du formulaire
  5. Reconstruire les listes dynamiques (travaux, frais, etc.)
  6. Calculer et afficher le CA
  7. Lancer le calcul fiscal
}
```

### 2. Sauvegarde automatique

**Déclencheur** : Tout changement de champ (event `input`, `change`)

```javascript
Debounce de 1000ms → sauvegarderDonnees() {
  1. Récupérer toutes les valeurs des champs
  2. Parcourir les listes dynamiques
  3. Construire l'objet JSON complet
  4. Comparer avec lastSavedData (éviter doublons)
  5. Si différent : INSERT/UPDATE en base
  6. Mettre à jour lastSavedData
  7. Afficher notification "Sauvegarde auto ✓"
}
```

### 3. Calcul fiscal

**Déclencheur** : Après chaque sauvegarde ou changement

```javascript
calculerFiscalite() {
  1. Calculer le total des charges par gîte (avec conversion mensuel/annuel)
  2. Additionner travaux (avec amortissement de l'année en cours)
  3. Additionner frais divers
  4. Additionner produits d'accueil
  5. Additionner frais kilométriques
  6. Total charges = somme de tout
  7. Bénéfice brut = CA - Total charges
  8. Calculer l'IR selon le régime (Micro-BIC ou Réel)
  9. Afficher tous les résultats dans les cartes récapitulatives
}
```

### 4. Toggle Mensuel/Annuel

```javascript
togglePeriodSection(giteId, periode) {
  1. Mettre à jour le bouton actif (classe .active)
  2. NE PAS modifier les valeurs des inputs ⚠️
  3. Recalculer les charges avec la nouvelle période
  4. Les 4 champs annuels NE BOUGENT JAMAIS :
     - taxe_fonciere
     - cfe
     - commissions
     - amortissement_bien
}
```

**⚠️ RÈGLE CRITIQUE** : Le toggle change UNIQUEMENT la manière de calculer, JAMAIS les valeurs saisies par l'utilisateur.

---

## 💾 Structure de stockage

### Table : `fiscalite_data`

```sql
{
  annee: INTEGER,
  user_id: UUID,
  ca: DECIMAL,
  
  -- Charges par gîte (JSON)
  charges_gite_[id]: {
    internet: { valeur: X, type: 'mensuel'|'annuel' },
    eau: { valeur: X, type: 'mensuel'|'annuel' },
    ...
    taxe_fonciere: { valeur: X },  // pas de type
    cfe: { valeur: X },
    commissions: { valeur: X },
    amortissement: { valeur: X }
  },
  
  -- Listes dynamiques (JSON)
  travaux: [{id, description, montant, date_travaux, type_amortissement}, ...],
  frais_divers: [{id, description, montant, date_frais}, ...],
  produits: [{id, description, montant, date_achat}, ...],
  trajets_km: [{id, date_trajet, motif, lieu_depart, lieu_arrivee, distance_km, montant_calcule}, ...],
  credits_personnels: [{id, description, montant, date_depense}, ...],
  
  -- Configuration km
  config_km: {
    bareme_km: DECIMAL,
    domicile_adresse: STRING
  },
  
  -- Résultats calculés (pour historique)
  total_charges: DECIMAL,
  benefice_brut: DECIMAL,
  ir_micro_bic: DECIMAL,
  ir_reel: DECIMAL
}
```

---

## 🎨 Interface utilisateur

### Blocs collapsibles

- Cliquer sur le titre → Replier/Déplier
- Icône `▼` ou `▶` indique l'état
- Classe `.collapsed` ajoutée/retirée
- Animation smooth

### Cartes récapitulatives

En bas de page, affichage des résultats :
- **Carte CA** : Chiffre d'affaires total
- **Carte Charges** : Total des charges déductibles
- **Carte Bénéfice** : CA - Charges
- **Carte IR** : Comparaison Micro-BIC vs Réel

### Notifications

- Sauvegarde auto : Badge vert "✓ Sauvegardé"
- Erreurs : Badge rouge avec message
- Calculs : Badge bleu "Calcul en cours..."

---

## 🔧 Fonctions principales

### Gestion des données

- `chargerAnnee(annee)` - Charge une année depuis la BDD
- `creerNouvelleAnnee()` - Crée l'année suivante
- `sauvegarderDonnees()` - Sauvegarde automatique debounced
- `calculerFiscalite()` - Calcul fiscal complet

### Gestion des listes

- `ajouterTravaux()` / `supprimerTravaux(id)`
- `ajouterFraisDivers()` / `supprimerFraisDivers(id)`
- `ajouterProduit()` / `supprimerProduit(id)`
- `ajouterTrajetKm()` / `supprimerTrajetKm(id)`
- `ajouterCredit()` / `supprimerCredit(id)`

### Utilitaires

- `mettreAJourAffichageCA(valeur)` - Met à jour l'affichage du CA
- `calculerCADepuisReservations()` - Récupère le CA depuis les réservations
- `togglePeriodSection(giteId, periode)` - Bascule mensuel/annuel
- `detecterAmortissement(desc, montant, type)` - Détecte l'amortissement automatique
- `calculerDistanceTrajet(id)` - Calcule distance via Google Maps API

---

## 📌 Points importants

### ✅ Bonnes pratiques

1. **Sauvegarde auto** : Évite les pertes de données
2. **Calcul temps réel** : L'utilisateur voit immédiatement l'impact
3. **Amortissement intelligent** : Détection automatique par mots-clés
4. **Multi-gîtes** : Gestion individuelle par bien
5. **Historique** : Conservation des données de toutes les années

### ⚠️ Pièges à éviter

1. **Toggle mensuel/annuel** : NE JAMAIS modifier les valeurs saisies
2. **Champs annuels** : Les 4 champs (taxe foncière, CFE, commissions, amortissement) sont TOUJOURS annuels
3. **Amortissement travaux** : Seul le montant de l'année en cours compte dans les charges
4. **CA automatique** : Ne pas permettre la saisie manuelle (source de vérité = réservations)
5. **Debounce sauvegarde** : Éviter les requêtes en double avec `lastSavedData`

---

## 🚀 Évolutions possibles

- [ ] Export PDF du récapitulatif fiscal
- [ ] Simulation sur 5 ans avec projection
- [ ] Détection automatique de la tranche d'imposition
- [ ] Comparaison avec l'année N-1
- [ ] Alertes sur optimisations fiscales possibles
- [ ] Intégration API comptable (Indy, Tiime, etc.)

---

**Dernière mise à jour** : 4 février 2026
