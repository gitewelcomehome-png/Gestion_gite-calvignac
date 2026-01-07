# 🔄 GUIDE DE MIGRATION PROGRESSIVE - ZÉRO DOWNTIME

**Date**: 7 janvier 2026  
**Objectif**: Migrer vers multi-tenant SANS impacter le site actuel

---

## 🎯 PRINCIPE : BACKWARD COMPATIBLE

### L'idée
```
1. Ajouter les tables multi-tenant (SANS toucher l'existant)
2. Ajouter les colonnes organization_id/gite_id (NULL autorisé)
3. Le site continue de fonctionner normalement
4. Migrer les données en arrière-plan
5. Activer RLS en dernier (quand tout est prêt)
6. AUCUNE interruption de service
```

---

## 📋 PHASE PAR PHASE - CE QU'IL FAUT FAIRE

### ✅ PHASE 0 : PRÉPARATION (30 min)

#### 1. **Vérifier l'état actuel**

```bash
# Se connecter à Supabase Dashboard
# → SQL Editor
```

**Commandes de diagnostic** :
```sql
-- Lister toutes vos tables actuelles
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Compter vos données
SELECT 
    (SELECT COUNT(*) FROM reservations) as nb_reservations,
    (SELECT COUNT(*) FROM charges) as nb_charges,
    (SELECT COUNT(*) FROM retours_menage) as nb_retours_menage,
    (SELECT COUNT(*) FROM stocks_draps) as nb_stocks;

-- Voir vos users actuels
SELECT COUNT(*) FROM auth.users;
```

✅ **Noter ces chiffres** - on vérifiera après que tout est intact.

#### 2. **Backup obligatoire** 🔥

**Option A : Via Dashboard Supabase**
```
1. Ouvrir https://app.supabase.com
2. Votre projet → Settings → Database
3. Backups → Create Backup
4. Attendre confirmation (5-10 min)
```

**Option B : Via pg_dump**
```bash
# Récupérer connection string
# Dashboard → Settings → Database → Connection string

pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" \
  > backup_$(date +%Y%m%d_%H%M%S).sql
```

✅ **OBLIGATOIRE** : Ne pas continuer sans backup !

---

### ✅ PHASE 1 : CRÉER LES NOUVELLES TABLES (10 min)

**IMPORTANT** : Ces tables sont INDÉPENDANTES, elles ne touchent PAS l'existant.

#### Exécuter les 3 premiers scripts

**Dans SQL Editor Supabase** :

**Script 1** : Copier-coller `01_create_organizations_table.sql`
```sql
-- Créer la table organizations
-- ✅ AUCUN impact sur l'existant
```
Exécuter (Run ou Ctrl+Enter)

**Script 2** : Copier-coller `02_create_gites_table.sql`
```sql
-- Créer la table gites
-- ✅ AUCUN impact sur l'existant
```
Exécuter

**Script 3** : Copier-coller `03_create_organization_members_table.sql`
```sql
-- Créer la table organization_members
-- ✅ AUCUN impact sur l'existant
```
Exécuter

#### Vérification
```sql
-- Les 3 tables doivent exister
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('organizations', 'gites', 'organization_members');
-- Doit retourner 3 lignes
```

✅ **Votre site fonctionne toujours normalement** - rien n'a changé pour lui !

---

### ✅ PHASE 2 : AJOUTER LES COLONNES (10 min)

**IMPORTANT** : On ajoute les colonnes mais **NULL est autorisé**.  
→ Votre site continue de fonctionner sans les remplir.

#### Exécuter le script 4

**Dans SQL Editor** :
```sql
-- Copier-coller 04_add_tenant_columns.sql
```

Ce script ajoute :
- `organization_id` (NULL autorisé)
- `gite_id` (NULL autorisé)

À toutes vos tables existantes.

#### Vérification
```sql
-- Vérifier que les colonnes sont ajoutées
SELECT * FROM verify_multi_tenant_columns();
```

#### Test critique
```sql
-- Vérifier que vos données sont INTACTES
SELECT 
    (SELECT COUNT(*) FROM reservations) as nb_reservations,
    (SELECT COUNT(*) FROM charges) as nb_charges,
    (SELECT COUNT(*) FROM retours_menage) as nb_retours_menage,
    (SELECT COUNT(*) FROM stocks_draps) as nb_stocks;

-- Les chiffres doivent être IDENTIQUES à Phase 0
```

✅ **Votre site fonctionne toujours** - les colonnes sont là mais NULL.

---

### ✅ PHASE 3 : PERSONNALISER LA MIGRATION (15 min)

**AVANT** d'exécuter le script 6, il faut le personnaliser.

#### Éditer `06_migrate_existing_data.sql`

**Lignes 70-92** - Remplacer par VOS infos :

```sql
VALUES (
    'Gîtes Calvignac',              -- ← VOTRE NOM
    'gites-calvignac',              -- ← VOTRE SLUG (minuscules, tirets)
    'contact@gitescalvignac.fr',    -- ← VOTRE EMAIL
    '+33 X XX XX XX XX',            -- ← VOTRE TÉLÉPHONE
    'Adresse du gîte',              -- ← VOTRE ADRESSE
    'Calvignac',                    -- ← VOTRE VILLE
    '46160',                        -- ← VOTRE CODE POSTAL
    -- ...
)
```

**Lignes 130-158** - Infos du gîte principal :

```sql
VALUES (
    v_org_id,
    'gite-principal',               -- ← SLUG du gîte
    'Gîte Principal',               -- ← NOM du gîte
    'Votre gîte principal',         -- ← DESCRIPTION
    'gite',                         -- ← TYPE (gite/villa/appartement)
    8,                              -- ← CAPACITÉ MAX
    3,                              -- ← NOMBRE CHAMBRES
    2,                              -- ← NOMBRE SALLES DE BAIN
    'Adresse du gîte',              -- ← ADRESSE
    'Calvignac',                    -- ← VILLE
    '46160',                        -- ← CODE POSTAL
    'FR',
    150.00,                         -- ← PRIX PAR NUIT (par défaut)
    50.00,                          -- ← FRAIS MÉNAGE
    500.00,                         -- ← CAUTION
    -- ...
)
```

✅ **Sauvegarder le fichier modifié**

---

### ✅ PHASE 4 : MIGRER LES DONNÉES (5 min)

**ATTENTION** : Cette étape va COPIER vos données (pas déplacer).  
→ L'original reste intact !

#### Exécuter le script 6 personnalisé

**Dans SQL Editor** :
```sql
-- Copier-coller votre 06_migrate_existing_data.sql PERSONNALISÉ
```

#### Ce qui se passe :
1. Création de "Gîtes Calvignac" (votre organization)
2. Création de votre gîte principal
3. **Remplissage** des colonnes `organization_id` et `gite_id`
4. Migration des users vers `organization_members`

#### Vérification CRITIQUE
```sql
-- 1. Organization créée
SELECT * FROM organizations WHERE slug = 'gites-calvignac';

-- 2. Gîte créé
SELECT * FROM gites;

-- 3. Toutes les données migrées
SELECT * FROM verify_migration();
-- Toutes les lignes doivent être "✅ OK"

-- 4. AUCUNE donnée perdue
SELECT 
    (SELECT COUNT(*) FROM reservations) as total_reservations,
    (SELECT COUNT(*) FROM reservations WHERE organization_id IS NOT NULL) as reservations_migrees,
    (SELECT COUNT(*) FROM reservations WHERE organization_id IS NULL) as reservations_non_migrees;
-- reservations_non_migrees DOIT être 0
```

✅ **Votre site fonctionne toujours** - les données sont juste enrichies.

---

### ✅ PHASE 5 : TESTER SANS RLS (10 min)

**NE PAS ENCORE ACTIVER RLS** - on teste d'abord !

#### Tests manuels dans votre application

1. **Ouvrir votre site** (index.html ou autre)
2. **Tester TOUTES les fonctionnalités** :
   - ✅ Voir les réservations → doit fonctionner
   - ✅ Créer une réservation → doit fonctionner
   - ✅ Voir les charges → doit fonctionner
   - ✅ Planning ménage → doit fonctionner
   - ✅ Tout doit être NORMAL

#### Si quelque chose ne marche pas

```sql
-- Regarder les logs
-- Dashboard → Logs → Postgres logs

-- Vérifier les données
SELECT * FROM reservations LIMIT 5;

-- Les colonnes organization_id et gite_id doivent être REMPLIES
```

#### Si tout va bien

✅ **Votre site est prêt pour RLS**

---

### ✅ PHASE 6 : ACTIVER RLS (EN DERNIER) (5 min)

**ATTENTION** : C'est l'étape qui "active" l'isolation.  
Mais comme tout est déjà migré, pas de problème !

#### Exécuter le script 5

**Dans SQL Editor** :
```sql
-- Copier-coller 05_create_rls_policies.sql
```

#### Vérification
```sql
-- RLS activé partout
SELECT * FROM verify_rls_enabled();
-- Toutes les tables doivent avoir RLS = true
```

#### Test final CRITIQUE

1. **Se déconnecter / Reconnecter** à votre app
2. **Tester TOUT** :
   - Voir réservations
   - Créer réservation
   - Voir charges
   - Etc.

3. **Si ça marche** → ✅ Migration réussie !
4. **Si ça ne marche pas** → Voir "ROLLBACK" ci-dessous

---

## 🚨 ROLLBACK (SI PROBLÈME)

### Option 1 : Désactiver RLS temporairement

```sql
-- Désactiver RLS sur une table
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE charges DISABLE ROW LEVEL SECURITY;
-- etc.

-- Tester si ça remarche
-- Puis débugger le problème de RLS
```

### Option 2 : Restaurer le backup

```bash
# Via Dashboard
# Settings → Database → Backups → Restore

# Ou via psql
psql "postgresql://..." < backup_XXXXXX.sql
```

### Option 3 : Supprimer juste les nouvelles tables

```sql
-- ATTENTION : Garde vos données originales
-- Supprime juste le multi-tenant

DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS gites CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Supprimer les colonnes ajoutées
ALTER TABLE reservations 
  DROP COLUMN IF EXISTS organization_id,
  DROP COLUMN IF EXISTS gite_id;

ALTER TABLE charges 
  DROP COLUMN IF EXISTS organization_id,
  DROP COLUMN IF EXISTS gite_id;

-- etc.
```

---

## ✅ CHECKLIST COMPLÈTE

```
☐ Phase 0 : Backup fait ✅
☐ Phase 0 : Chiffres notés (nb réservations, etc.)
☐ Phase 1 : 3 tables créées (organizations, gites, members)
☐ Phase 1 : Vérification OK
☐ Phase 2 : Colonnes ajoutées (organization_id, gite_id)
☐ Phase 2 : Site fonctionne toujours
☐ Phase 3 : Script 06 personnalisé avec VOS infos
☐ Phase 4 : Données migrées
☐ Phase 4 : verify_migration() retourne "✅ OK" partout
☐ Phase 4 : Aucune donnée perdue (vérifier les COUNT)
☐ Phase 5 : Site testé manuellement, tout fonctionne
☐ Phase 6 : RLS activé
☐ Phase 6 : Site testé après RLS, tout fonctionne
☐ SUCCESS : Migration terminée ! 🎉
```

---

## 🎯 POINTS CLÉS POUR "INVISIBILITÉ"

### Ce qui rend la migration invisible :

1. ✅ **Colonnes NULL autorisées** au début
   - Le site n'est pas obligé de les remplir
   - Pas d'erreur si elles sont vides

2. ✅ **Migration progressive**
   - Chaque phase est testée
   - Rollback possible à tout moment

3. ✅ **RLS en dernier**
   - Activé seulement quand tout est prêt
   - Toutes les données déjà migrées

4. ✅ **Aucun changement de schéma existant**
   - On ajoute, on ne modifie pas
   - Les tables existantes gardent leurs colonnes

5. ✅ **Backward compatible**
   - L'ancien code continue de fonctionner
   - Pas besoin de tout réécrire immédiatement

### Ce qui pourrait poser problème :

❌ **Activer RLS AVANT de migrer les données**
   → Solution : Suivre l'ordre exact des phases

❌ **Oublier de personnaliser le script 06**
   → Solution : Vérifier lignes 70-158

❌ **Ne pas tester entre chaque phase**
   → Solution : Toujours vérifier que le site fonctionne

---

## 📞 AIDE RAPIDE

### Commande de vérification rapide

```sql
-- Copier-coller ça après chaque phase
DO $$
DECLARE
    v_reservations INTEGER;
    v_migrated INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_reservations FROM reservations;
    SELECT COUNT(*) INTO v_migrated FROM reservations WHERE organization_id IS NOT NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '  ÉTAT DE LA MIGRATION';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE 'Total réservations : %', v_reservations;
    RAISE NOTICE 'Réservations migrées : %', v_migrated;
    RAISE NOTICE 'Progression : %%%', ROUND((v_migrated::DECIMAL / v_reservations) * 100);
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '';
END $$;
```

---

## 🎊 RÉSULTAT FINAL

Après la migration complète :

```
AVANT                           APRÈS
─────                           ─────

reservations                    reservations
├─ check_in                     ├─ check_in
├─ check_out                    ├─ check_out
├─ guest_name                   ├─ guest_name
└─ ...                          ├─ organization_id  ← NOUVEAU
                                ├─ gite_id          ← NOUVEAU
                                └─ ...

+ 3 nouvelles tables :
  ├─ organizations
  ├─ gites
  └─ organization_members

+ RLS actif (isolation automatique)

= Site fonctionne EXACTEMENT pareil
  MAIS prêt pour multi-tenant ! ✅
```

---

**DURÉE TOTALE** : 1h30 (avec tests)  
**RISQUE** : Très faible (backward compatible)  
**ROLLBACK** : Possible à tout moment  
**IMPACT SITE** : ZÉRO si suivi correctement

🚀 **C'est parti !**
