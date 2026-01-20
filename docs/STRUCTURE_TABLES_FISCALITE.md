# 📊 Structure des Tables Fiscalité - Production

## ⚠️ ÉTAT ACTUEL EN PRODUCTION

Il existe **DEUX tables** en production :

### 1️⃣ Table `fiscal_history` ✅ UTILISÉE
**Objectif** : Historique détaillé multi-gîtes avec toutes les données

```sql
CREATE TABLE fiscal_history (
    id UUID PRIMARY KEY,
    owner_user_id UUID REFERENCES auth.users(id),  -- 🔒 Multi-utilisateur
    year INTEGER NOT NULL,                         -- Année
    gite TEXT NOT NULL,                            -- 🏠 Multi-gîtes ('multi' pour global)
    revenus NUMERIC(10, 2) DEFAULT 0,
    charges NUMERIC(10, 2) DEFAULT 0,
    resultat NUMERIC(10, 2) DEFAULT 0,
    taux_occupation NUMERIC(5, 2) DEFAULT 0,
    nb_reservations INTEGER DEFAULT 0,
    donnees_detaillees JSONB DEFAULT '{}',        -- ⭐ TOUTES LES DONNÉES ICI
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_user_id, year, gite)
);
```

**Structure JSONB `donnees_detaillees`** :
```json
{
  "nom_simulation": "Simulation 2026",
  "regime": "reel",
  "chiffre_affaires": 50000,
  "charges_gites": {
    "couzon": {
      "internet": 50,
      "internet_type": "mensuel",
      "eau": 30,
      "electricite": 100,
      ...
    },
    "trevoux": { ... }
  },
  "travaux_liste": [...],
  "frais_divers_liste": [...],
  "surface_bureau": 10,
  "comptable": 1200,
  "salaire_madame": 25000,
  "salaire_monsieur": 30000,
  "nombre_enfants": 2,
  "benefice_imposable": 35000,
  "cotisations_urssaf": 8000,
  "impot_revenu": 7000
}
```

### 2️⃣ Table `simulations_fiscales` ❌ NON UTILISÉE
**Objectif** : Table simplifiée sans détails (peut être supprimée)

```sql
CREATE TABLE simulations_fiscales (
    id UUID PRIMARY KEY,
    owner_user_id UUID REFERENCES auth.users(id),
    annee INTEGER NOT NULL,
    revenus_totaux NUMERIC(10, 2),
    charges_totales NUMERIC(10, 2),
    resultat NUMERIC(10, 2),
    impots_estimes NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

⚠️ **Problèmes** :
- ❌ PAS de colonne JSONB → ne peut stocker les détails
- ❌ PAS de colonne `gite` → ne supporte pas le multi-gîtes
- ❌ Uniquement des totaux → pas assez pour reconstituer une simulation

## ✅ DÉCISION : Utiliser `fiscal_history`

**Raisons** :
1. ✅ Compatible multi-gîtes (colonne `gite`)
2. ✅ Compatible multi-utilisateurs (colonne `owner_user_id`)
3. ✅ JSONB pour stocker TOUTES les données détaillées
4. ✅ Peut stocker des historiques par gîte ou global

**Code JS** :
- ✅ Toutes les fonctions utilisent `fiscal_history`
- ✅ INSERT/SELECT sur colonnes : `year`, `gite`, `revenus`, `charges`, `resultat`, `donnees_detaillees`
- ✅ Filtre automatique RLS sur `owner_user_id`

## 🔄 Migration Recommandée (optionnel)

Si vous souhaitez nettoyer :
```sql
-- Option 1 : Supprimer simulations_fiscales (si non utilisée)
DROP TABLE IF EXISTS simulations_fiscales CASCADE;

-- Option 2 : Garder pour usage futur (résumés rapides)
-- Créer une vue ou trigger pour synchroniser
```

## 📝 Mapping Code → Base

### Sauvegarde
```js
const data = {
    year: 2026,                    // → fiscal_history.year
    gite: 'multi',                 // → fiscal_history.gite
    revenus: 50000,                // → fiscal_history.revenus
    charges: 15000,                // → fiscal_history.charges
    resultat: 35000,               // → fiscal_history.resultat
    donnees_detaillees: {          // → fiscal_history.donnees_detaillees (JSONB)
        nom_simulation: "...",
        charges_gites: {...},
        // ... tout le reste
    }
};

await supabaseClient.from('fiscal_history').insert(data);
```

### Chargement
```js
const { data } = await supabaseClient
    .from('fiscal_history')
    .select('*')
    .eq('year', 2026)
    .order('created_at', { ascending: false })
    .limit(1);

const details = data.donnees_detaillees || {};
// Accès : details.charges_gites.couzon.internet
```

## 🏢 Multi-Tenant & Multi-Gîtes

### Multi-Utilisateur ✅
- Filtre automatique RLS : `owner_user_id = auth.uid()`
- Chaque utilisateur voit UNIQUEMENT ses données

### Multi-Gîtes ✅
- **Option 1** : Une ligne par gîte (`gite = 'couzon'`, `gite = 'trevoux'`)
- **Option 2** : Une ligne globale avec détails dans JSONB (`gite = 'multi'`)
- **Actuellement** : Option 2 utilisée → tout dans `donnees_detaillees.charges_gites`

### Avantages de la structure actuelle
1. ✅ Une seule ligne par année = plus simple
2. ✅ Toutes les données centralisées dans JSONB
3. ✅ Scalable : ajout de gîtes sans modifier la structure
4. ✅ Performance : 1 INSERT au lieu de N

## 🔍 Vérification Production

Pour vérifier quelle table est réellement utilisée :
```sql
-- Compter les enregistrements
SELECT COUNT(*) FROM fiscal_history;
SELECT COUNT(*) FROM simulations_fiscales;

-- Voir les colonnes
\d fiscal_history
\d simulations_fiscales
```

## 📅 Date de Migration
- **15 janvier 2026** : Passage complet à `fiscal_history`
- **Version JS** : v1737013000
- **Fichier** : `js/fiscalite-v2.js`
