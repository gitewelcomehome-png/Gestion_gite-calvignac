# 🛠️ COMMANDES UTILES - PROJET MULTI-TENANT

**Quick Reference** pour le développement

---

## 🗄️ COMMANDES SQL UTILES

### Vérifications post-migration

```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'gites', 'organization_members');

-- Vérifier colonnes ajoutées
SELECT * FROM verify_multi_tenant_columns();

-- Vérifier migration des données
SELECT * FROM verify_migration();

-- Vérifier RLS activé
SELECT * FROM verify_rls_enabled();

-- Voir toutes les organizations
SELECT id, name, slug, plan, subscription_status, 
       current_gites_count, current_users_count 
FROM organizations;

-- Voir tous les gîtes
SELECT g.name, g.slug, o.name as organization_name
FROM gites g
JOIN organizations o ON g.organization_id = o.id
ORDER BY o.name, g.name;

-- Voir tous les members
SELECT 
    u.email,
    o.name as organization,
    om.role,
    om.is_active
FROM organization_members om
JOIN auth.users u ON om.user_id = u.id
JOIN organizations o ON om.organization_id = o.id
ORDER BY o.name, om.role;
```

---

## 🔍 DEBUGGING

### Tester l'isolation RLS

```sql
-- Se connecter en tant que user X
-- Doit voir uniquement SES données

-- Test 1: Voir ses organizations
SELECT * FROM get_user_organizations();

-- Test 2: Voir ses gîtes
SELECT * FROM get_organization_gites();

-- Test 3: Voir ses réservations (filtré automatiquement)
SELECT * FROM reservations;

-- Test 4: Vérifier rôle
SELECT get_user_role_in_org('xxx-org-id-xxx', auth.uid());

-- Test 5: Vérifier permission
SELECT user_has_permission_in_org('xxx-org-id-xxx', 'edit_finances');
```

### Logs RLS (si activé)

```sql
-- Voir les accès récents
SELECT 
    user_id,
    table_name,
    operation,
    accessed_at
FROM rls_access_logs
ORDER BY accessed_at DESC
LIMIT 50;

-- Purger logs > 30 jours
SELECT purge_old_rls_logs();
```

---

## 🔧 GESTION ORGANIZATIONS

### Créer une nouvelle organization

```sql
INSERT INTO organizations (name, slug, email, plan)
VALUES (
    'Villa Méditerranée',
    'villa-mediterranee',
    'contact@villa-med.fr',
    'starter'
)
RETURNING id;
```

### Ajouter un membre

```sql
INSERT INTO organization_members (organization_id, user_id, role)
VALUES (
    'xxx-org-id-xxx',
    'xxx-user-id-xxx',
    'admin'
);
```

### Changer le plan d'une organization

```sql
UPDATE organizations
SET 
    plan = 'pro',
    max_gites = 10,
    max_users = 15,
    features = features || '{"channel_manager": true}'::jsonb
WHERE slug = 'gites-calvignac';
```

### Désactiver une organization

```sql
UPDATE organizations
SET 
    is_active = false,
    is_suspended = true,
    suspension_reason = 'Impayé'
WHERE slug = 'organization-xxx';
```

---

## 🏠 GESTION GÎTES

### Créer un nouveau gîte

```sql
INSERT INTO gites (
    organization_id,
    slug,
    name,
    address,
    city,
    postal_code,
    max_capacity
)
VALUES (
    (SELECT id FROM organizations WHERE slug = 'gites-calvignac'),
    'villa-mediterranee',
    'Villa Méditerranée',
    '123 Avenue de la Mer',
    'Nice',
    '06000',
    8
);
```

### Lister les gîtes d'une organization

```sql
SELECT * FROM gites
WHERE organization_id = (
    SELECT id FROM organizations WHERE slug = 'gites-calvignac'
)
ORDER BY name;
```

---

## 📊 STATISTIQUES

### Dashboard organization

```sql
-- Vue d'ensemble d'une organization
SELECT 
    o.name,
    o.plan,
    o.subscription_status,
    COUNT(DISTINCT g.id) as nb_gites,
    COUNT(DISTINCT om.user_id) as nb_users,
    COUNT(DISTINCT r.id) as nb_reservations_total,
    COUNT(DISTINCT CASE 
        WHEN r.check_in >= NOW() 
        THEN r.id 
    END) as nb_reservations_futures
FROM organizations o
LEFT JOIN gites g ON o.id = g.organization_id
LEFT JOIN organization_members om ON o.id = om.organization_id AND om.is_active = true
LEFT JOIN reservations r ON o.id = r.organization_id
WHERE o.slug = 'gites-calvignac'
GROUP BY o.id, o.name, o.plan, o.subscription_status;
```

### Statistiques par gîte

```sql
SELECT 
    g.name as gite,
    COUNT(r.id) as nb_reservations,
    SUM(EXTRACT(DAY FROM (r.check_out - r.check_in))) as nb_nuits_total,
    ROUND(AVG(EXTRACT(DAY FROM (r.check_out - r.check_in))), 1) as duree_moyenne
FROM gites g
LEFT JOIN reservations r ON g.id = r.gite_id
WHERE g.organization_id = (
    SELECT id FROM organizations WHERE slug = 'gites-calvignac'
)
GROUP BY g.id, g.name
ORDER BY nb_reservations DESC;
```

---

## 🔄 MIGRATIONS & BACKUPS

### Backup complet

```bash
# Via pg_dump
pg_dump "postgresql://..." > backup_$(date +%Y%m%d_%H%M%S).sql

# Via Supabase CLI (si installé)
supabase db dump > backup.sql
```

### Restaurer backup

```bash
psql "postgresql://..." < backup_XXXXXX.sql
```

### Export données spécifiques

```sql
-- Exporter une organization complète
COPY (
    SELECT * FROM organizations WHERE slug = 'gites-calvignac'
) TO '/tmp/organization.csv' WITH CSV HEADER;

COPY (
    SELECT * FROM gites WHERE organization_id = 'xxx'
) TO '/tmp/gites.csv' WITH CSV HEADER;
```

---

## 🧹 MAINTENANCE

### Reset compteurs mensuels

```sql
-- À exécuter tous les 1er du mois (ou via CRON)
SELECT reset_monthly_reservation_counters();
```

### Nettoyer données test

```sql
-- Supprimer organizations de test
DELETE FROM organizations 
WHERE slug LIKE 'test-%';

-- Supprimer gîtes inactifs
DELETE FROM gites 
WHERE is_active = false 
AND deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '30 days';
```

### Recalculer compteurs

```sql
-- Recalculer nb gîtes
UPDATE organizations o
SET current_gites_count = (
    SELECT COUNT(*) 
    FROM gites 
    WHERE organization_id = o.id 
    AND is_active = true
);

-- Recalculer nb users
UPDATE organizations o
SET current_users_count = (
    SELECT COUNT(*) 
    FROM organization_members 
    WHERE organization_id = o.id 
    AND is_active = true
);
```

---

## 🔐 SÉCURITÉ

### Voir les policies RLS actives

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Tester une policy

```sql
-- Désactiver temporairement RLS (ATTENTION: Danger en prod!)
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;

-- Réactiver
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
```

### Audit logs

```sql
-- Voir qui a accédé à quoi
SELECT 
    u.email,
    al.table_name,
    al.operation,
    al.accessed_at
FROM rls_access_logs al
JOIN auth.users u ON al.user_id = u.id
WHERE al.accessed_at > NOW() - INTERVAL '24 hours'
ORDER BY al.accessed_at DESC;
```

---

## 📱 FRONTEND

### Récupérer organization du user

```javascript
// Dans votre code JS
async function getCurrentOrganization() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
        .from('organization_members')
        .select(`
            organization_id,
            role,
            organizations (
                id,
                name,
                slug,
                plan,
                features
            )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
    
    return data;
}
```

### Récupérer gîtes accessibles

```javascript
async function getGites() {
    // RLS filtre automatiquement
    const { data, error } = await supabase
        .from('gites')
        .select('*')
        .eq('is_active', true)
        .order('name');
    
    return data;
}
```

### Créer une réservation

```javascript
async function createReservation(reservationData) {
    const org = await getCurrentOrganization();
    
    const { data, error } = await supabase
        .from('reservations')
        .insert({
            organization_id: org.organizations.id,
            gite_id: reservationData.gite_id,
            check_in: reservationData.check_in,
            check_out: reservationData.check_out,
            guest_name: reservationData.guest_name,
            // ...
        })
        .select()
        .single();
    
    return data;
}
```

---

## 🧪 TESTS

### Script de test complet

```sql
-- Test 1: Créer organization test
INSERT INTO organizations (name, slug, email)
VALUES ('Test Org', 'test-org-' || gen_random_uuid(), 'test@example.com')
RETURNING id;

-- Test 2: Créer gîte test
INSERT INTO gites (organization_id, slug, name, address, city, postal_code, max_capacity)
VALUES (
    'xxx-test-org-id-xxx',
    'test-gite',
    'Test Gîte',
    'Test Address',
    'Test City',
    '00000',
    4
);

-- Test 3: Ajouter member test
INSERT INTO organization_members (organization_id, user_id, role)
VALUES (
    'xxx-test-org-id-xxx',
    'xxx-test-user-id-xxx',
    'owner'
);

-- Test 4: Créer réservation test
INSERT INTO reservations (organization_id, gite_id, check_in, check_out, guest_name)
VALUES (
    'xxx-test-org-id-xxx',
    'xxx-test-gite-id-xxx',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '14 days',
    'Test Guest'
);

-- Cleanup
DELETE FROM organizations WHERE slug LIKE 'test-org-%';
```

---

## 📞 AIDE & SUPPORT

### Fichiers de documentation

```bash
# Lire les guides
cat PLAN_DEMARRAGE_MULTI_TENANT.md
cat sql/multi-tenant/README.md
cat ARCHITECTURE_MULTI_TENANT.md
cat STATUS_MULTI_TENANT.md

# Roadmap complète
ls documentation/ROADMAP_MULTI_TENANT_*.md
```

### Logs Supabase

```bash
# Via Dashboard
# → Logs → Database Logs
# → Filtrer par erreur, warning, etc.
```

### Reset complet (DEV ONLY)

```sql
-- ⚠️ DANGER: Supprime TOUT
-- À utiliser UNIQUEMENT en développement
DROP TABLE IF EXISTS rls_access_logs CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS charges CASCADE;
DROP TABLE IF EXISTS retours_menage CASCADE;
DROP TABLE IF EXISTS stocks_draps CASCADE;
DROP TABLE IF EXISTS gites CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Puis réexécuter les scripts 01-06
```

---

## 🎯 RACCOURCIS UTILES

### Connexion rapide psql

```bash
# Ajouter dans ~/.bashrc ou ~/.zshrc
export SUPABASE_DB="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
alias db="psql $SUPABASE_DB"

# Utilisation:
db  # Se connecte directement
```

### Alias SQL utiles

```sql
-- Créer des vues pour accès rapide
CREATE OR REPLACE VIEW v_org_overview AS
SELECT 
    o.name,
    o.plan,
    COUNT(DISTINCT g.id) as gites,
    COUNT(DISTINCT om.user_id) as users,
    COUNT(DISTINCT r.id) as reservations
FROM organizations o
LEFT JOIN gites g ON o.id = g.organization_id
LEFT JOIN organization_members om ON o.id = om.organization_id
LEFT JOIN reservations r ON o.id = r.organization_id
GROUP BY o.id, o.name, o.plan;

-- Utilisation:
SELECT * FROM v_org_overview;
```

---

**Dernière mise à jour** : 7 janvier 2026  
**Version** : 1.0 - Phase SQL multi-tenant
