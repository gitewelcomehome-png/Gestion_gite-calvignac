# 🚀 PLAN DE DÉMARRAGE MULTI-TENANT
**Date**: 7 janvier 2026  
**Objectif**: Lancer le projet multi-tenant - Phase 1

---

## 🎯 OBJECTIF IMMÉDIAT (Semaine 1-2)

Créer l'infrastructure de base multi-tenant pour permettre:
- ✅ Plusieurs clients sur la même plateforme
- ✅ Isolation complète des données
- ✅ Gestion multi-propriétés par client
- ✅ Base pour commercialisation SaaS

---

## 📋 PLAN D'ACTION - ÉTAPE PAR ÉTAPE

### 🔥 ÉTAPE 1: TABLES DE BASE (Jour 1 - 6h)

**Objectif**: Créer les 3 tables fondamentales

#### 1.1 - Table `organizations` (tenants)
```sql
-- Un "organization" = UN CLIENT PAYANT
-- Ex: "Gîtes Calvignac SARL", "Villa Méditerranée SAS"
```

**Colonnes principales**:
- `id`, `slug`, `name`
- `plan` (free/starter/pro)
- `subscription_status`
- Limites: `max_gites`, `max_users`
- Métriques: `current_gites_count`

#### 1.2 - Table `gites`
```sql
-- Remplace l'ancienne logique "multi-gîte implicite"
-- Un gîte appartient à UNE organization
```

**Colonnes**:
- `id`, `organization_id` (FK)
- `name`, `slug`, `address`
- `max_capacity`, `bedrooms`, `bathrooms`
- `ical_url`, `calendar_color`

#### 1.3 - Table `organization_members`
```sql
-- Relie users aux organizations avec rôles
```

**Rôles**:
- `owner`: Propriétaire (accès total)
- `admin`: Administrateur (tout sauf billing)
- `manager`: Gestionnaire (réservations, ménage)
- `housekeeping`: Femme de ménage (planning uniquement)
- `viewer`: Lecture seule

---

### 🔥 ÉTAPE 2: MIGRATION TABLES EXISTANTES (Jour 2-3 - 8h)

**Objectif**: Ajouter `organization_id` et `gite_id` partout

#### Tables à modifier:
1. ✅ `reservations` → `organization_id`, `gite_id`
2. ✅ `charges` → `organization_id`, `gite_id`
3. ✅ `retours_menage` → `organization_id`, `gite_id`
4. ✅ `stocks_draps` → `organization_id`, `gite_id`
5. ✅ `cleaning_schedules` → `organization_id`, `gite_id` (si existe)
6. ✅ `infos_pratiques` → `organization_id`, `gite_id`

#### Actions:
```sql
-- Pour chaque table:
ALTER TABLE reservations 
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN gite_id UUID REFERENCES gites(id) ON DELETE CASCADE;

-- Créer index pour performance
CREATE INDEX idx_reservations_org ON reservations(organization_id);
CREATE INDEX idx_reservations_gite ON reservations(gite_id);
```

---

### 🔥 ÉTAPE 3: ROW LEVEL SECURITY (Jour 3-4 - 8h)

**Objectif**: Isolation automatique des données

#### Pour chaque table:

```sql
-- 1. Activer RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 2. Policy de lecture (SELECT)
CREATE POLICY "Users see only their organization data"
ON reservations FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

-- 3. Policy d'écriture (INSERT/UPDATE)
CREATE POLICY "Users can modify their organization data"
ON reservations FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'manager')
  )
);
```

**Tables à sécuriser**:
- ✅ organizations
- ✅ gites
- ✅ organization_members
- ✅ reservations
- ✅ charges
- ✅ retours_menage
- ✅ stocks_draps
- ✅ infos_pratiques

---

### 🔥 ÉTAPE 4: MIGRATION DONNÉES ACTUELLES (Jour 4 - 4h)

**Objectif**: Migrer les données existantes vers une organization par défaut

```sql
-- 1. Créer organization "Gîtes Calvignac" (vous)
INSERT INTO organizations (id, name, slug, email, plan, subscription_status)
VALUES (
  gen_random_uuid(),
  'Gîtes Calvignac',
  'gites-calvignac',
  'contact@gitescalvignac.fr',
  'pro',
  'active'
) RETURNING id; -- Noter l'ID

-- 2. Créer gîte par défaut
INSERT INTO gites (organization_id, name, slug)
VALUES (
  'xxx-org-id-xxx',
  'Gîte Principal',
  'principal'
) RETURNING id;

-- 3. Migrer toutes les réservations
UPDATE reservations SET 
  organization_id = 'xxx-org-id-xxx',
  gite_id = 'xxx-gite-id-xxx'
WHERE organization_id IS NULL;

-- Répéter pour charges, stocks_draps, etc.
```

---

### 🔥 ÉTAPE 5: HELPER FUNCTIONS (Jour 5 - 4h)

**Objectif**: Fonctions utilitaires pour simplifier le code

```sql
-- Obtenir l'organization_id du user connecté
CREATE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id 
  FROM organization_members 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Vérifier si user a un rôle
CREATE FUNCTION user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_members 
    WHERE user_id = auth.uid()
    AND role = required_role
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Obtenir tous les gîtes de l'organization
CREATE FUNCTION get_organization_gites()
RETURNS TABLE (id UUID, name TEXT, slug TEXT) AS $$
  SELECT g.id, g.name, g.slug
  FROM gites g
  JOIN organization_members om ON g.organization_id = om.organization_id
  WHERE om.user_id = auth.uid()
  AND om.role IN ('owner', 'admin', 'manager', 'housekeeping');
$$ LANGUAGE SQL SECURITY DEFINER;
```

---

### 🔥 ÉTAPE 6: TESTS & VALIDATION (Jour 5 - 4h)

**Checklist de validation**:

```sql
-- Test 1: Créer un nouvel organization
INSERT INTO organizations (name, slug, email) 
VALUES ('Test Gîtes', 'test-gites', 'test@example.com');

-- Test 2: Ajouter un member
INSERT INTO organization_members (organization_id, user_id, role)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'test-gites'),
  auth.uid(),
  'owner'
);

-- Test 3: Créer un gîte
INSERT INTO gites (organization_id, name, slug)
VALUES (
  (SELECT id FROM organizations WHERE slug = 'test-gites'),
  'Mon Gîte Test',
  'test-gite'
);

-- Test 4: Vérifier isolation RLS
-- Se connecter avec user1 → ne doit voir que ses données
-- Se connecter avec user2 → ne doit voir que ses données

-- Test 5: Tester permissions
-- User avec role 'viewer' → peut lire mais pas modifier
-- User avec role 'admin' → peut tout faire
```

**Résultats attendus**:
- ✅ Chaque user ne voit que ses organizations
- ✅ Impossible d'accéder aux données d'un autre tenant
- ✅ Les rôles fonctionnent correctement
- ✅ Aucune régression sur fonctionnalités existantes

---

## 📁 STRUCTURE FICHIERS À CRÉER

```
sql/
  multi-tenant/
    01_create_organizations_table.sql
    02_create_gites_table.sql
    03_create_organization_members_table.sql
    04_add_tenant_columns.sql
    05_create_rls_policies.sql
    06_migrate_existing_data.sql
    07_create_helper_functions.sql
    08_create_triggers.sql
```

---

## 🎯 CRITÈRES DE SUCCÈS (Fin Semaine 2)

- ✅ Tables multi-tenant créées
- ✅ RLS fonctionnel sur toutes les tables
- ✅ Données actuelles migrées sans perte
- ✅ Tests d'isolation validés
- ✅ Documentation SQL complète
- ✅ Zero breaking changes sur frontend actuel

---

## 📊 NEXT STEPS (Semaine 3+)

Une fois la base multi-tenant OK:

1. **Interface d'onboarding** (Semaine 3)
   - Page inscription
   - Création organization automatique
   - Setup wizard initial

2. **Dashboard Organization** (Semaine 3-4)
   - Vue d'ensemble organisation
   - Gestion des gîtes
   - Gestion des membres

3. **Billing Stripe** (Semaine 4-5)
   - Intégration Stripe
   - Plans tarifaires
   - Gestion abonnements

4. **Channel Manager** (Semaine 6-8)
   - API Airbnb/Booking
   - Synchronisation bidirectionnelle

---

## 🚨 POINTS D'ATTENTION

1. **Backup avant migration**: Sauvegarder TOUTES les données
2. **Tests progressifs**: Valider chaque étape
3. **Rollback plan**: Prévoir retour arrière si problème
4. **Performance**: Indexer toutes les FK
5. **Documentation**: Documenter chaque changement

---

## 💪 AVANTAGES POST-IMPLÉMENTATION

- ✅ Base solide pour SaaS
- ✅ Onboarding automatique nouveaux clients
- ✅ Isolation sécurisée données
- ✅ Scalabilité illimitée
- ✅ Multi-propriétés natif
- ✅ Gestion équipes complète

---

**STATUT**: 🚀 PRÊT À DÉMARRER

**PROCHAINE ACTION**: Créer `01_create_organizations_table.sql`
