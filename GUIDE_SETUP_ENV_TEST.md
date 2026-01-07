# 🧪 Guide Setup Environnement Test Supabase

**Date**: 7 janvier 2026  
**Objectif**: Créer projet Supabase test pour valider migration avant production

---

## 📋 PRÉREQUIS

- ✅ Compte Supabase actif
- ✅ Accès au projet production (`ivqiisnudabxemcxxyru`)
- ✅ Script migration prêt ([sql/migration_production_preserve_data.sql](sql/migration_production_preserve_data.sql))

---

## ÉTAPE 1 : Créer Projet Test Supabase (5 min)

### 1.1 Créer le projet

1. Aller sur https://supabase.com/dashboard
2. Cliquer **"New Project"**
3. Remplir :
   - **Name** : `gites-calvignac-test`
   - **Database Password** : *(générer un mot de passe fort, le sauvegarder)*
   - **Region** : `West EU (Paris)` *(même région que prod)*
   - **Pricing Plan** : `Free` *(suffisant pour tests)*
4. Cliquer **"Create new project"**
5. Attendre 2-3 minutes (création BDD)

### 1.2 Noter les credentials

Une fois créé, aller dans **Settings → API** :

```javascript
// Credentials TEST à noter :
TEST_SUPABASE_URL: 'https://XXXXXXXX.supabase.co'
TEST_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

---

## ÉTAPE 2 : Backup Production (10 min) ⚠️ CRITIQUE

### 2.1 Backup via Supabase Dashboard

1. Projet production : https://supabase.com/dashboard/project/ivqiisnudabxemcxxyru
2. Aller dans **Database → Backups**
3. Cliquer **"Create backup"** (manuel)
4. Attendre fin du backup

### 2.2 Export SQL via SQL Editor

1. Aller dans **SQL Editor**
2. Exécuter ces requêtes pour compter les données :

```sql
-- Statistiques avant migration
SELECT 'reservations' as table_name, COUNT(*) as count FROM reservations
UNION ALL
SELECT 'cleaning_schedule', COUNT(*) FROM cleaning_schedule
UNION ALL
SELECT 'stocks_draps', COUNT(*) FROM stocks_draps WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stocks_draps')
UNION ALL
SELECT 'charges', COUNT(*) FROM charges WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'charges');

-- Vérifier les gîtes utilisés
SELECT gite, COUNT(*) as reservations_count 
FROM reservations 
GROUP BY gite 
ORDER BY gite;
```

3. **NOTER LES RÉSULTATS** (pour vérification post-migration)

### 2.3 Export données CSV (sécurité supplémentaire)

Pour chaque table importante :

```sql
-- Export reservations (copier résultats dans Excel)
SELECT * FROM reservations ORDER BY check_in DESC;

-- Export cleaning_schedule
SELECT * FROM cleaning_schedule ORDER BY scheduled_date DESC;
```

**Sauvegarder les CSV** dans `_archives/backups/backup_pre_migration_$(date).csv`

---

## ÉTAPE 3 : Copier Données Production → Test (15 min)

### 3.1 Export structure + données production

**Option A : Via pg_dump (si accès direct)**

```bash
# Se connecter au projet production
pg_dump -h db.ivqiisnudabxemcxxyru.supabase.co \
        -U postgres \
        -d postgres \
        --clean \
        --if-exists \
        > backup_production_$(date +%Y%m%d).sql

# Import dans projet test
psql -h db.XXXXXXXX.supabase.co \
     -U postgres \
     -d postgres \
     < backup_production_$(date +%Y%m%d).sql
```

**Option B : Via Supabase Table Editor (plus simple)**

1. **Projet Production** → Table Editor → Cliquer table `reservations`
2. Cliquer **"..."** → **"Download as CSV"**
3. Répéter pour : `cleaning_schedule`, `stocks_draps`, `charges`

4. **Projet Test** → SQL Editor → Créer tables legacy d'abord :

```sql
-- Créer structure legacy dans projet test
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gite TEXT NOT NULL,  -- Colonne legacy TEXT
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cleaning_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gite TEXT,  -- Colonne legacy TEXT
    reservation_id UUID,
    scheduled_date DATE NOT NULL,
    week_number TEXT,
    status TEXT DEFAULT 'pending',
    validated_by_company BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stocks_draps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gite TEXT,
    type_drap TEXT NOT NULL,
    quantite INT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gite TEXT,
    categorie TEXT NOT NULL,
    montant DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

5. **Importer les CSV** via Table Editor → Import CSV

### 3.2 Vérifier les données copiées

```sql
-- Dans projet TEST
SELECT 'reservations' as table_name, COUNT(*) as count FROM reservations
UNION ALL
SELECT 'cleaning_schedule', COUNT(*) FROM cleaning_schedule;

-- Vérifier gîtes
SELECT gite, COUNT(*) FROM reservations GROUP BY gite;
```

**Les counts doivent correspondre à production !**

---

## ÉTAPE 4 : Exécuter Script Migration (10 min)

### 4.1 Ouvrir SQL Editor projet test

1. Projet Test → **SQL Editor**
2. Ouvrir le fichier [sql/migration_production_preserve_data.sql](sql/migration_production_preserve_data.sql)
3. **COPIER TOUT LE CONTENU**
4. **COLLER** dans SQL Editor
5. Cliquer **"Run"** (⚡ ou Ctrl+Enter)

### 4.2 Observer les logs

Le script affiche des logs à chaque phase :

```
✅ Table organizations créée
✅ Organization ID: abc-123-def...
✅ Table gites créée
✅ Gîtes Trevoux et Couzon insérés
✅ Colonnes organization_id et gite_id ajoutées
✅ organization_id rempli pour 150 réservations
✅ Toutes les réservations mappées (gite_id rempli)
✅ cleaning_schedule migré: 50 lignes
✅ MIGRATION TERMINÉE AVEC SUCCÈS
```

### 4.3 Vérifier résultats migration

```sql
-- Stats post-migration
SELECT 
    '✅ MIGRATION RÉUSSIE!' as status,
    (SELECT COUNT(*) FROM organizations) as organizations_count,
    (SELECT COUNT(*) FROM gites) as gites_count,
    (SELECT COUNT(*) FROM reservations) as reservations_total,
    (SELECT COUNT(*) FROM reservations WHERE gite_id IS NOT NULL) as reservations_migrated,
    (SELECT COUNT(*) FROM reservations WHERE gite_id IS NULL) as reservations_unmapped;

-- Détails par gîte
SELECT 
    g.name,
    g.slug,
    g.icon,
    g.color,
    COUNT(r.id) as reservations_count
FROM gites g
LEFT JOIN reservations r ON r.gite_id = g.id
GROUP BY g.id, g.name, g.slug, g.icon, g.color
ORDER BY g.name;
```

**✅ ATTENDU** :
- `organizations_count` = 1
- `gites_count` = 2
- `reservations_migrated` = 100% des réservations
- `reservations_unmapped` = 0 ❗

**❌ Si `reservations_unmapped` > 0** : PROBLÈME, vérifier logs !

---

## ÉTAPE 5 : Configurer App sur Env Test (5 min)

### 5.1 Créer config test

Créer fichier `config.test.js` (NE PAS commiter) :

```javascript
// config.test.js - À NE PAS COMMITER
window.LOCAL_CONFIG = {
    SUPABASE_URL: 'https://XXXXXXXX.supabase.co',  // URL projet TEST
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // Anon key TEST
};
console.log('🧪 Configuration TEST chargée');
```

### 5.2 Modifier index.html temporairement

```html
<!-- AVANT (production) -->
<script src="config.local.js" onerror="..."></script>

<!-- PENDANT TESTS (test) -->
<script src="config.test.js"></script>
```

### 5.3 Désactiver authentification (optionnel)

Si tu veux tester sans login, dans `js/auth.js` :

```javascript
// TEMPORAIRE - pour tests uniquement
const SKIP_AUTH_FOR_TESTS = true;

if (SKIP_AUTH_FOR_TESTS) {
    console.warn('🧪 Auth désactivée pour tests');
    return; // Skip auth check
}
```

---

## ÉTAPE 6 : Tests Complets Application (30 min)

### 6.1 Lancer app en local

```bash
cd /workspaces/Gestion_gite-calvignac
python3 -m http.server 8080
```

Ouvrir : http://localhost:8080

### 6.2 Checklist Tests Critiques

#### ✅ Dashboard
- [ ] Widgets affichent les bonnes données
- [ ] Couleurs Trevoux (#667eea violet) + Couzon (#f093fb rose)
- [ ] Stats correctes (nombre réservations)
- [ ] Pas d'erreurs console

#### ✅ Planning Ménage
- [ ] 2 colonnes affichées (Trevoux 🏰 + Couzon ⛰️)
- [ ] Réservations affichées dans bonnes colonnes
- [ ] Dates cohérentes
- [ ] Statuts ménage corrects

#### ✅ Statistiques
- [ ] Graphiques Chart.js s'affichent
- [ ] Données par gîte correctes
- [ ] Taux occupation calculé
- [ ] Couleurs dynamiques (violet/rose)

#### ✅ Sync iCal
- [ ] Bouton sync fonctionne
- [ ] Nouvelles réservations créées avec `gite_id` UUID
- [ ] Pas d'erreurs dans console

#### ✅ Réservations
- [ ] Liste complète affichée
- [ ] Filtres par gîte fonctionnent
- [ ] Création nouvelle réservation → `gite_id` rempli
- [ ] Modification réservation fonctionne

#### ✅ Console Browser (F12)
- [ ] Aucune erreur rouge
- [ ] Warnings acceptables uniquement
- [ ] Pas de `Cannot read property 'gite'` ou similaire

### 6.3 Tests Données BDD

Dans Supabase SQL Editor (projet test) :

```sql
-- Vérifier que nouvelles réservations ont gite_id
SELECT id, gite, gite_id, client_name, check_in 
FROM reservations 
ORDER BY created_at DESC 
LIMIT 10;

-- Vérifier dual filtering fonctionne
SELECT 
    COUNT(*) as total,
    COUNT(gite_id) as with_gite_id,
    COUNT(gite) as with_gite_text
FROM reservations;

-- Toutes les réservations doivent avoir gite_id OU gite rempli
SELECT * FROM reservations WHERE gite_id IS NULL AND gite IS NULL;
-- Doit retourner 0 lignes
```

---

## ÉTAPE 7 : Validation Finale (10 min)

### 7.1 Comparaison Production vs Test

**Créer tableau comparatif** :

| Métrique | Production | Test | ✅/❌ |
|----------|-----------|------|-------|
| Nb réservations | 150 | 150 | ✅ |
| Nb ménages | 50 | 50 | ✅ |
| Gîtes Trevoux | 80 | 80 | ✅ |
| Gîtes Couzon | 70 | 70 | ✅ |
| Console errors | 0 | 0 | ✅ |

### 7.2 Tests Edge Cases

```sql
-- Réservations chevauchantes
SELECT * FROM reservations r1
JOIN reservations r2 ON r1.gite_id = r2.gite_id
WHERE r1.id != r2.id
  AND r1.check_out > r2.check_in
  AND r1.check_in < r2.check_out;

-- Ménages sans réservation (orphelins)
SELECT * FROM cleaning_schedule cs
WHERE cs.reservation_id NOT IN (SELECT id FROM reservations);
```

### 7.3 Performance Tests

```sql
-- Temps requête avec gite_id (doit être rapide)
EXPLAIN ANALYZE
SELECT * FROM reservations WHERE gite_id = (SELECT id FROM gites WHERE slug = 'trevoux');

-- Vérifier indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('reservations', 'gites', 'cleaning_schedule');
```

---

## 📊 RÉSULTAT ATTENDU

### ✅ Succès si :
1. **Toutes les données migrées** (0 perte)
2. **gite_id rempli** pour 100% des réservations
3. **App fonctionne** identique à production
4. **Console propre** (0 erreurs)
5. **Performances OK** (requêtes rapides)

### ❌ Échec si :
1. Réservations non mappées (`gite_id IS NULL`)
2. Erreurs console liées à `gite` undefined
3. Données manquantes (counts différents)
4. Planning ménage cassé (colonnes vides)

---

## 🚀 PROCHAINES ÉTAPES (si tests OK)

1. **Documenter résultats tests** (screenshots, logs)
2. **Valider avec utilisateurs** (demo sur env test)
3. **Planifier migration production** (créneau maintenance)
4. **Préparer rollback plan** (backup + restore procedure)
5. **GO pour production !** 🎯

---

## 🆘 TROUBLESHOOTING

### Problème : "gite_id IS NULL après migration"

```sql
-- Debug : voir quelles valeurs gite ne sont pas mappées
SELECT DISTINCT gite FROM reservations WHERE gite_id IS NULL;

-- Fix : mapper manuellement
UPDATE reservations 
SET gite_id = (SELECT id FROM gites WHERE name = 'Trevoux')
WHERE gite = 'Trevoux' AND gite_id IS NULL;
```

### Problème : "App affiche données vides"

1. Vérifier `config.test.js` chargé (console log)
2. Vérifier Supabase URL correcte
3. Vérifier RLS désactivé sur tables test (pour tests)

```sql
-- Désactiver RLS temporairement pour tests
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE gites DISABLE ROW LEVEL SECURITY;
```

### Problème : "Erreur CORS Supabase"

1. Projet Test → Settings → API
2. Vérifier **CORS** autorise `http://localhost:8080`
3. Ajouter si besoin dans **Allowed Origins**

---

## 📝 CHECKLIST COMPLÈTE

- [ ] Projet test Supabase créé
- [ ] Credentials test notés
- [ ] Backup production réalisé (3x)
- [ ] Données copiées production → test
- [ ] Script migration exécuté
- [ ] 0 réservations non mappées
- [ ] config.test.js créé
- [ ] App lancée sur env test
- [ ] Dashboard fonctionne
- [ ] Planning ménage OK
- [ ] Stats dynamiques OK
- [ ] Console propre (0 erreurs)
- [ ] Comparaison prod/test identique
- [ ] Tests edge cases validés
- [ ] Documentation résultats

**Une fois tous les ✅ cochés** → Prêt pour migration production ! 🚀
