# 🧪 GUIDE RAPIDE - Création Projet Test Supabase

**Date** : 7 janvier 2026  
**Durée** : ~30 minutes  
**Objectif** : Tester migration en toute sécurité

---

## ÉTAPE 1 : Créer Projet Supabase Test (5 min)

### 1.1 Créer le projet
1. Va sur : https://supabase.com/dashboard
2. Clique **"New Project"**
3. Remplis :
   - **Name** : `gites-calvignac-test`
   - **Database Password** : *(génère + sauvegarde)*
   - **Region** : `West EU (Paris)`
   - **Pricing Plan** : `Free`
4. Clique **"Create new project"**
5. Attends 2-3 min

### 1.2 Noter les credentials
Une fois créé, va dans **Settings → API** :
- **URL** : `https://XXXXXXXX.supabase.co`
- **anon public key** : `eyJhbGciOi...`

**Note-les quelque part !**

---

## ÉTAPE 2 : Copier Structure Production → Test (5 min)

### 2.1 Dans projet TEST, va dans SQL Editor

### 2.2 Crée les tables legacy (structure actuelle)
Copie-colle ce SQL :

```sql
-- Créer structure ACTUELLE (legacy) dans projet test
CREATE TABLE reservations (
    id BIGSERIAL PRIMARY KEY,
    gite TEXT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    plateforme TEXT,
    montant NUMERIC,
    nom_client TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    telephone TEXT,
    provenance TEXT,
    nb_personnes INTEGER,
    acompte NUMERIC,
    restant NUMERIC,
    paiement TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_from TEXT,
    menage_valide TEXT,
    gite_id UUID,
    organization_id UUID
);

CREATE TABLE cleaning_schedule (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT,
    gite TEXT,
    scheduled_date DATE NOT NULL,
    time_of_day TEXT DEFAULT 'afternoon',
    week_number TEXT,
    status TEXT DEFAULT 'pending',
    validated_by_company BOOLEAN DEFAULT false,
    proposed_date DATE,
    reservation_end DATE,
    reservation_start_after DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    refusal_reason TEXT
);
```

**Clique "Run"** ✅

---

## ÉTAPE 3 : Copier Données Production → Test (10 min)

### 3.1 Export CSV depuis Production

**Dans projet PRODUCTION** :
1. Va dans **Table Editor**
2. Clique sur table `reservations`
3. Clique **"..."** (3 points) → **"Download as CSV"**
4. Répète pour `cleaning_schedule`

### 3.2 Import CSV dans Test

**Dans projet TEST** :
1. Va dans **Table Editor**
2. Clique sur table `reservations`
3. Clique **"Insert"** → **"Import data from CSV"**
4. Upload le CSV de reservations
5. Répète pour `cleaning_schedule`

### 3.3 Vérifier les données

Dans SQL Editor du projet TEST :
```sql
-- Compter les données importées
SELECT 'reservations' as table_name, COUNT(*) FROM reservations
UNION ALL
SELECT 'cleaning_schedule', COUNT(*) FROM cleaning_schedule;

-- Vérifier les gîtes (doit être Trevoux + Couzon uniquement)
SELECT gite, COUNT(*) FROM reservations GROUP BY gite;
```

**✅ Les counts doivent correspondre à la production !**

---

## ÉTAPE 4 : Exécuter Migration sur Test (5 min)

### 4.1 Copier le script de migration

Ouvre le fichier : [sql/migration_production_preserve_data.sql](../sql/migration_production_preserve_data.sql)

**COPIE TOUT LE CONTENU**

### 4.2 Exécuter dans projet TEST

1. SQL Editor du projet TEST
2. **COLLE** le script complet
3. Clique **"Run"** ⚡

### 4.3 Observer les logs

Tu devrais voir :
```
✅ Table organizations créée
✅ Organization ID: abc-123...
✅ Table gites créée
✅ Gîtes Trevoux et Couzon insérés
✅ Colonnes organization_id et gite_id ajoutées
✅ organization_id rempli pour X réservations
✅ Toutes les réservations mappées (gite_id rempli)
✅ cleaning_schedule migré: Y lignes
✅ MIGRATION TERMINÉE AVEC SUCCÈS
```

### 4.4 Vérifier résultats

```sql
-- Stats post-migration
SELECT 
    (SELECT COUNT(*) FROM organizations) as organizations_count,
    (SELECT COUNT(*) FROM gites) as gites_count,
    (SELECT COUNT(*) FROM reservations) as reservations_total,
    (SELECT COUNT(*) FROM reservations WHERE gite_id IS NOT NULL) as reservations_migrated,
    (SELECT COUNT(*) FROM reservations WHERE gite_id IS NULL) as reservations_unmapped;

-- Détails par gîte
SELECT 
    g.name,
    g.icon,
    g.color,
    COUNT(r.id) as reservations_count
FROM gites g
LEFT JOIN reservations r ON r.gite_id = g.id
GROUP BY g.id, g.name, g.icon, g.color
ORDER BY g.name;
```

**✅ ATTENDU** :
- `organizations_count` = 1
- `gites_count` = 2
- `reservations_unmapped` = 0 ❗

---

## ÉTAPE 5 : Tester App sur Env Test (5 min)

### 5.1 Créer config test locale

Crée fichier `config.test.js` dans ton workspace :

```javascript
// config.test.js - NE PAS COMMITER
window.LOCAL_CONFIG = {
    SUPABASE_URL: 'https://XXXXXXXX.supabase.co',  // URL projet TEST
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // Anon key TEST
};
console.log('🧪 Configuration TEST chargée');
```

### 5.2 Modifier index.html temporairement

```html
<!-- Remplacer temporairement -->
<script src="config.test.js"></script>
```

### 5.3 Désactiver RLS pour tests

Dans SQL Editor du projet TEST :
```sql
-- Désactiver RLS temporairement
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE gites DISABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
```

### 5.4 Lancer app

```bash
python3 -m http.server 8080
```

Ouvre : http://localhost:8080

### 5.5 Vérifier

- [ ] Dashboard affiche données
- [ ] Planning ménage : 2 colonnes (Trevoux 🏰 + Couzon ⛰️)
- [ ] Couleurs correctes (violet #667eea + rose #f093fb)
- [ ] Stats Chart.js OK
- [ ] Console : 0 erreurs

---

## RÉSULTAT ATTENDU

### ✅ Succès si :
1. Migration complète sans erreur
2. 0 réservations unmapped
3. App fonctionne identique à production
4. Console propre

### ❌ Échec si :
1. `reservations_unmapped` > 0
2. Erreurs console
3. Planning ménage cassé
4. Données manquantes

---

## PROCHAINES ÉTAPES

Si tests OK :
1. **Commit résultats tests**
2. **Préparer backup production triple**
3. **Exécuter migration PRODUCTION**
4. **Monitorer 24-48h**

Si tests KO :
1. **Noter les erreurs**
2. **Corriger le script**
3. **Recréer projet test**
4. **Retester**

---

## 🆘 TROUBLESHOOTING

### Erreur: "gite_id IS NULL après migration"
```sql
-- Voir quelles lignes non mappées
SELECT id, gite, nom_client FROM reservations WHERE gite_id IS NULL LIMIT 10;

-- Fix manuel si nécessaire
UPDATE reservations 
SET gite_id = (SELECT id FROM gites WHERE name = 'Trevoux')
WHERE gite = 'Trevoux' AND gite_id IS NULL;
```

### App affiche données vides
1. Vérifier `config.test.js` chargé (console)
2. Vérifier URL/Key correctes
3. RLS désactivé sur toutes les tables

---

## 📝 CHECKLIST COMPLÈTE

- [ ] Projet test Supabase créé
- [ ] Credentials test notés
- [ ] Tables legacy créées dans test
- [ ] Données CSV importées
- [ ] Counts vérifiés (prod = test)
- [ ] Script migration exécuté
- [ ] 0 réservations unmapped
- [ ] config.test.js créé
- [ ] RLS désactivé
- [ ] App lancée en local
- [ ] Dashboard OK
- [ ] Planning ménage 2 colonnes OK
- [ ] Stats dynamiques OK
- [ ] Console 0 erreurs
- [ ] Screenshots pris

**Si tous ✅ → GO PRODUCTION !** 🚀
