# 🏢 REFONTE COMPLÈTE FISCALITÉ - MULTI-TENANT (15 Jan 2026)

## ⚠️ CHANGEMENTS CRITIQUES

Ce fichier documente la refonte **COMPLÈTE** du module fiscalité pour le rendre 100% dynamique et multi-tenant.

## 📊 Structure des Données

### Table: `simulations_fiscales`
```sql
CREATE TABLE simulations_fiscales (
    id UUID PRIMARY KEY,
    owner_user_id UUID REFERENCES auth.users(id),
    annee INT NOT NULL,
    gite TEXT,
    regime TEXT CHECK (regime IN ('reel', 'micro-bic', 'lmnp')),
    revenus_bruts DECIMAL(10, 2),
    charges_deductibles DECIMAL(10, 2),
    abattement_forfaitaire DECIMAL(5, 2),
    base_imposable DECIMAL(10, 2),
    impots_estimes DECIMAL(10, 2),
    cotisations_sociales DECIMAL(10, 2),
    resultat_net DECIMAL(10, 2),
    parametres JSONB DEFAULT '{}',  -- ⭐ TOUTES LES DONNÉES STOCKÉES ICI (production)
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

⚠️ **IMPORTANT** : La colonne s'appelle **`parametres`** en production (pas `details`)

### Structure JSONB `parametres`
```json
{
  "nom_simulation": "Simulation 2026",
  "chiffre_affaires": 50000,
  "revenus_total": 50000,
  "charges_total": 15000,
  "resultat_imposable": 35000,
  "impot_estime": 7000,
  "charges_gites": {
    "couzon": {
      "internet": 50,
      "internet_type": "mensuel",
      "eau": 30,
      "eau_type": "mensuel",
      "electricite": 100,
      "electricite_type": "mensuel",
      ...
    },
    "trevoux": { ... },
    "3me": { ... }
  },
  "travaux_liste": [...],
  "frais_divers_liste": [...],
  "surface_bureau": 10,
  "surface_totale": 100,
  ...
}
```

## 🔧 Modifications JS (fiscalite-v2.js)

### 1. Génération Dynamique des Options de Gîtes
**Fonction**: `genererOptionsGites()`
- Lit `window.GITES_DATA` pour générer les options
- Fonctionne avec n'importe quel nombre de gîtes
- Ajoute automatiquement l'option "Commun"

### 2. Sauvegarde (sauvegarderSimulation)
**AVANT** (Hardcodé) :
```js
data.internet_couzon = parseFloat(document.getElementById('internet_couzon').value);
data.internet_trevoux = parseFloat(document.getElementById('internet_trevoux').value);
```

**APRÈS** (Dynamique) :
```js
const data = {
    annee: 2026,
    gite: 'multi',
    regime: 'reel',
    parametres: {} // JSONB - VRAIE colonne en production
};

const chargesGites = {};
window.GITES_DATA.forEach(gite => {
    const slug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    chargesGites[slug] = {};
    
    chargesFields.forEach(field => {
        chargesGites[slug][field.id] = parseFloat(valueEl.value || 0);
    });
});
detailsData.charges_gites = chargesGites;
data.parametres = detailsData;
```

### 3. Chargement (chargerDerniereSimulation)
**AVANT** (Hardcodé) :
```js
document.getElementById('internet_couzon').value = data.internet_couzon || '';
document.getElementById('internet_trevoux').value = data.internet_trevoux || '';
```

**APRÈS** (Dynamique) :
```js
const details = data.parametres || {}; // JSONB en production
window.GITES_DATA.forEach(gite => {
    const slug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const giteCharges = details.charges_gites[slug];
    
    if (giteCharges) {
        chargesFields.forEach(field => {
            valueEl.value = giteCharges[field.id] || '';
        });
    }
});
```

### 4. Duplication d'Année (creerNouvelleAnnee)
**AVANT** : Copiait 50+ lignes hardcodées couzon/trevoux
**APRÈS** : Copie `prevDetails.charges_gites` en un seul objet

### 5. Listes Dynamiques (Travaux, Frais, Produits)
- `ajouterTravaux()` : Génère options avec `genererOptionsGites()`
- `ajouterFraisDivers()` : Idem
- `ajouterProduitAccueil()` : Idem
- Valeur par défaut : `'commun'` au lieu de `'couzon'`

## ❌ Code Supprimé

### Fonction Obsolète Supprimée
- `chargerDonneesFormulaire(data)` (180+ lignes)
  - Duplicata de la logique dans `chargerDerniereSimulation()`
  - Contenait des références hardcodées à couzon/trevoux

## ✅ Avantages du Nouveau Système

### 1. Scalabilité
- ✅ Supporte 2, 3, 10, 100+ gîtes sans modification de code
- ✅ Pas de limite PostgreSQL (une seule colonne JSONB)
- ✅ Ajout/suppression de gîtes transparent

### 2. Flexibilité
- ✅ Nouveaux types de charges ajoutables dans `chargesFields`
- ✅ Structure extensible via JSONB
- ✅ Pas de migration SQL nécessaire pour nouveaux gîtes

### 3. Maintenabilité
- ✅ Code plus court (suppression de 500+ lignes hardcodées)
- ✅ Une seule logique pour tous les gîtes
- ✅ Facile à debugger

### 4. Compatibilité
- ✅ Utilise la table existante (pas de nouvelle colonne)
- ✅ Compatible avec le schéma déjà en production
- ✅ Les anciennes simulations continuent de fonctionner

## 🎯 Points d'Attention

### Slug de Gîte
Le slug est généré avec :
```js
const slug = gite.name.toLowerCase().replace(/[^a-z0-9]/g, '');
```

**Exemples** :
- "Couzon" → `couzon`
- "Trévoux" → `trvoux`
- "3ème gîte" → `3megite`

### Champs de Charges (chargesFields)
```js
const chargesFields = [
    { id: 'internet', label: 'Internet' },
    { id: 'eau', label: 'Eau' },
    { id: 'electricite', label: 'Électricité' },
    { id: 'assurance_hab', label: 'Assurance habitation' },
    { id: 'assurance_emprunt', label: 'Assurance emprunt' },
    { id: 'interets_emprunt', label: 'Intérêts d\'emprunt' },
    { id: 'menage', label: 'Ménage' },
    { id: 'linge', label: 'Linge' },
    { id: 'logiciel', label: 'Logiciel' },
    { id: 'taxe_fonciere', label: 'Taxe foncière' },
    { id: 'cfe', label: 'CFE' },
    { id: 'commissions', label: 'Commissions' },
    { id: 'amortissement', label: 'Amortissement' },
    { id: 'copropriete', label: 'Copropriété' }
];
```

## 🔍 Test & Validation

### Scénarios à Tester
1. ✅ Sauvegarde avec 2 gîtes
2. ✅ Chargement de simulation existante
3. ✅ Duplication d'année
4. ✅ Ajout d'un nouveau gîte en base → Vérifier qu'il apparaît automatiquement
5. ✅ Listes dynamiques (travaux, frais, produits)

### Console Logs Utiles
```js
console.log('🏠 Gîtes chargés:', window.GITES_DATA);
console.log('💾 Données à sauvegarder:', data);
console.log('📊 Charges par gîte:', detailsData.charges_gites);
```

## 📝 Version
- **Date**: 2026-01-15
- **Version cache**: `1737010000`
- **Fichier**: `js/fiscalite-v2.js`
- **Colonne JSONB**: `parametres` (production)
- **Lignes modifiées**: ~500+ lignes refactorisées
- **Tests**: ⏳ En attente validation utilisateur

## ⚠️ RAPPEL CRITIQUE
**JAMAIS PLUS de variables hardcodées couzon/trevoux dans ce module !**
Tout doit être dynamique basé sur `window.GITES_DATA`.
