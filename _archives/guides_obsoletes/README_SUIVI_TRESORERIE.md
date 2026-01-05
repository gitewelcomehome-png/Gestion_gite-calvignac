# Suivi Trésorerie Mensuelle + Simulations par Année

## Date
2 janvier 2026

## Nouvelles fonctionnalités

### 1. Simulations fiscales par année
- Chaque simulation est maintenant associée à une année fiscale
- Champ "Année de la simulation" en haut du formulaire
- Permet de gérer plusieurs simulations pour différentes années

### 2. Suivi trésorerie mensuelle avec graphique
- **Tableau de saisie** : 12 mois avec solde bancaire et notes
- **Graphique interactif** (Chart.js) : courbe d'évolution
- **2 modes d'affichage** :
  - Par année : les 12 mois d'une année spécifique
  - Vue générale : tous les mois de toutes les années
- **Sauvegarde SQL** : données persistantes dans Supabase

## Modifications SQL

### Script de migration
Fichier : `sql/add_suivi_soldes_bancaires.sql`

**Nouvelle table :**
```sql
CREATE TABLE suivi_soldes_bancaires (
    id SERIAL PRIMARY KEY,
    annee INTEGER NOT NULL,
    mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
    solde DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(annee, mois)
);
```

**Colonne ajoutée :**
- `simulations_fiscales.annee` : année de la simulation fiscale

## Modifications frontend

### HTML (`tabs/tab-fiscalite-v2.html`)
1. **Champ année simulation** : en haut du formulaire
2. **Section "Suivi Trésorerie Mensuelle"** :
   - Sélection d'année
   - Boutons Charger/Sauvegarder
   - Radio buttons (par année / vue générale)
   - Tableau 12 mois (solde + notes)
   - Canvas pour le graphique Chart.js

### JavaScript (`js/fiscalite-v2.js`)
Nouvelles fonctions :
- `genererTableauSoldes()` : génère le tableau de saisie des 12 mois
- `chargerSoldesBancaires()` : charge les soldes depuis Supabase
- `sauvegarderSoldesBancaires()` : sauvegarde avec upsert (insert ou update)
- `afficherGraphiqueSoldes()` : crée/met à jour le graphique Chart.js

### Dependencies (`index.html`)
- Ajout de **Chart.js v4.4.1** (CDN)

## Utilisation

### Étape 1 : Exécuter la migration SQL
```bash
# Dans Supabase SQL Editor, exécuter :
sql/add_suivi_soldes_bancaires.sql
```

### Étape 2 : Utiliser le suivi trésorerie
1. Aller dans l'onglet **Fiscalité**
2. Descendre jusqu'à **"Suivi Trésorerie Mensuelle"**
3. Saisir l'année dans le champ
4. Cliquer sur **"📥 Charger"** pour charger les données existantes
5. Remplir les soldes mensuels
6. Cliquer sur **"💾 Sauvegarder"**
7. Le graphique se met à jour automatiquement

### Basculer entre les vues
- **Par année** : affiche uniquement les 12 mois de l'année sélectionnée
- **Vue générale** : affiche tous les mois de toutes les années (historique complet)

## Exemples de données

### Soldes mensuels 2026
| Mois | Solde | Notes |
|------|-------|-------|
| Janvier 2026 | 15 000 € | Début d'année |
| Février 2026 | 14 500 € | Travaux cuisine |
| Mars 2026 | 16 200 € | Pic réservations |
| ... | ... | ... |

## Architecture technique

### Base de données
```
simulations_fiscales
├── annee (INTEGER)
├── chiffre_affaires
├── ... (tous les autres champs)

suivi_soldes_bancaires
├── id (SERIAL)
├── annee (INTEGER)
├── mois (INTEGER 1-12)
├── solde (DECIMAL)
├── notes (TEXT)
├── created_at
└── updated_at
```

### Graphique Chart.js
- Type : **line** (courbe)
- Couleur : bleu (#3498db)
- Animation : tension 0.4 (courbe lissée)
- Responsive : s'adapte à la largeur
- Tooltip : affiche le solde au survol

## Améliorations futures possibles
- Export CSV/Excel des soldes
- Prévisions automatiques basées sur l'historique
- Alertes si solde < seuil défini
- Comparaison entre années
- Import depuis fichiers bancaires

## Notes importantes
- Les soldes sont **upsertés** : si un mois existe déjà, il est mis à jour
- Le graphique se met à jour automatiquement après chaque sauvegarde
- Contrainte UNIQUE sur (annee, mois) évite les doublons
- Trigger PostgreSQL met à jour `updated_at` automatiquement
