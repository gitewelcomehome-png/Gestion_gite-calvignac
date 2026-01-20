# 🚀 MIGRATION MULTI-TENANT - GUIDE D'EXÉCUTION

**Date**: 7 janvier 2026  
**Objectif**: Transformer l'application en plateforme multi-tenant SaaS

---

## 📋 VUE D'ENSEMBLE

Cette migration ajoute les fondations multi-tenant à votre application :
- **Organizations** : Un tenant = un client payant
- **Gites** : Plusieurs propriétés par organization
- **Members** : Gestion des rôles et permissions
- **RLS** : Isolation automatique des données

---

## ⚠️ PRÉREQUIS CRITIQUES

### 1. **BACKUP COMPLET** 🔥
```bash
# Backup Supabase complet
pg_dump postgresql://[CONNECTION_STRING] > backup_$(date +%Y%m%d_%H%M%S).sql

# OU via Supabase Dashboard
# Settings → Database → Backups → Create Backup
```

### 2. **Environnement de test**
- Tester d'abord sur un environnement de développement
- Ne PAS exécuter directement en production

### 3. **Accès Supabase SQL Editor**
- Avoir accès au SQL Editor de Supabase
- Ou utiliser `psql` en ligne de commande

---

## 🎯 ORDRE D'EXÉCUTION

### **Phase 1 : Tables de base** (15 min)

Exécuter dans cet ordre EXACT :

```bash
# 1. Créer table organizations
sql/multi-tenant/01_create_organizations_table.sql

# 2. Créer table gites
sql/multi-tenant/02_create_gites_table.sql

# 3. Créer table organization_members
sql/multi-tenant/03_create_organization_members_table.sql
```

✅ **Vérification Phase 1** :
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('organizations', 'gites', 'organization_members');
-- Doit retourner 3 lignes
```

---

### **Phase 2 : Ajout colonnes** (10 min)

```bash
# 4. Ajouter organization_id et gite_id partout
sql/multi-tenant/04_add_tenant_columns.sql
```

✅ **Vérification Phase 2** :
```sql
SELECT * FROM verify_multi_tenant_columns();
-- Toutes les tables doivent avoir organization_id
```

---

### **Phase 3 : Migration données** (15 min)

⚠️ **AVANT d'exécuter** : Éditer `06_migrate_existing_data.sql` lignes 70-85 pour personnaliser :
- Nom de votre organization
- Email, téléphone, adresse
- Nom du gîte principal
- Caractéristiques (capacité, chambres, etc.)

```bash
# 5. Migrer toutes les données existantes
sql/multi-tenant/06_migrate_existing_data.sql
```

✅ **Vérification Phase 3** :
```sql
SELECT * FROM verify_migration();
-- Toutes les lignes doivent être '✅ OK'
```

---

### **Phase 4 : Sécurité RLS** (10 min)

⚠️ **IMPORTANT** : Exécuter APRÈS la migration des données !

```bash
# 6. Activer les policies RLS (DERNIER)
sql/multi-tenant/05_create_rls_policies.sql
```

✅ **Vérification Phase 4** :
```sql
SELECT * FROM verify_rls_enabled();
-- Toutes les tables doivent avoir RLS activé
```

---

## 🔧 EXÉCUTION PRATIQUE

### **Option A : Supabase SQL Editor** (recommandé)

1. Ouvrir [Supabase Dashboard](https://app.supabase.com)
2. Aller dans **SQL Editor**
3. Copier-coller le contenu de chaque fichier
4. Exécuter (bouton RUN ou Ctrl+Enter)
5. Vérifier les messages de succès

### **Option B : psql (ligne de commande)**

```bash
# Se connecter à la base
psql postgresql://[YOUR_SUPABASE_CONNECTION_STRING]

# Exécuter chaque script
\i sql/multi-tenant/01_create_organizations_table.sql
\i sql/multi-tenant/02_create_gites_table.sql
\i sql/multi-tenant/03_create_organization_members_table.sql
\i sql/multi-tenant/04_add_tenant_columns.sql
\i sql/multi-tenant/06_migrate_existing_data.sql
\i sql/multi-tenant/05_create_rls_policies.sql
```

### **Option C : Script automatisé**

```bash
# Utiliser le script fourni
chmod +x sql/multi-tenant/execute_migration.sh
./sql/multi-tenant/execute_migration.sh
```

---

## ✅ CHECKLIST DE VALIDATION

Après migration complète :

### 1. **Données migrées**
```sql
-- Vérifier organization créée
SELECT * FROM organizations WHERE slug = 'gites-calvignac';

-- Vérifier gîte créé
SELECT * FROM gites WHERE organization_id = (
    SELECT id FROM organizations WHERE slug = 'gites-calvignac'
);

-- Vérifier réservations migrées
SELECT COUNT(*) FROM reservations WHERE organization_id IS NOT NULL;
```

### 2. **RLS activé**
```sql
-- Toutes les tables doivent avoir RLS
SELECT * FROM verify_rls_enabled();
```

### 3. **Isolation fonctionne**
```sql
-- Se connecter avec un user
-- Doit voir uniquement les données de son organization
SELECT * FROM reservations;
```

---

## 🎓 CONCEPTS CLÉS

### **Organization**
- Représente UN CLIENT PAYANT
- Exemple : "Gîtes Calvignac SARL", "Villa Méditerranée"
- Peut avoir 1-N gîtes selon son plan

### **Gite**
- Une propriété louée
- Appartient à UNE organization
- Indépendant des autres gîtes

### **Organization Member**
- Lie un user à une organization
- Rôles : `owner`, `admin`, `manager`, `housekeeping`, `viewer`
- Permissions granulaires

### **RLS (Row Level Security)**
- Isolation automatique des données
- Un user ne voit QUE les données de son organization
- Transparent côté code

---

## 🚨 PROBLÈMES COURANTS

### **Erreur : "Table already exists"**
✅ Normal si vous réexécutez les scripts - ils sont idempotents

### **Erreur : "Foreign key constraint"**
❌ Vous avez exécuté dans le mauvais ordre
→ Solution : Recommencer dans l'ordre 01 → 02 → 03 → 04 → 06 → 05

### **Des données avec organization_id NULL**
❌ La migration n'a pas fonctionné complètement
→ Solution : Vérifier les logs du script 06, corriger et réexécuter

### **User ne voit plus ses données**
❌ RLS activé trop tôt ou user pas dans organization_members
→ Solution : 
```sql
INSERT INTO organization_members (organization_id, user_id, role)
VALUES (
    (SELECT id FROM organizations WHERE slug = 'gites-calvignac'),
    'votre-user-id',
    'owner'
);
```

---

## 🔄 ROLLBACK (en cas de problème)

Si quelque chose ne va pas :

```bash
# Restaurer le backup
psql postgresql://[CONNECTION_STRING] < backup_XXXXXX.sql

# OU via Supabase Dashboard
# Settings → Database → Backups → Restore
```

---

## 📊 APRÈS LA MIGRATION

### **Modifications code nécessaires**

Les requêtes devront inclure `organization_id` :

**AVANT** :
```javascript
const { data } = await supabase
    .from('reservations')
    .select('*');
```

**APRÈS** :
```javascript
// organization_id est automatiquement filtré par RLS
// Pas besoin de le spécifier !
const { data } = await supabase
    .from('reservations')
    .select('*');
```

**Pour créer** :
```javascript
const { data } = await supabase
    .from('reservations')
    .insert({
        organization_id: currentOrgId,  // À récupérer via helper
        gite_id: selectedGiteId,
        // ... autres champs
    });
```

### **Helper functions JS à créer**

```javascript
// Récupérer organization du user connecté
async function getCurrentOrganization() {
    const { data } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(*)')
        .eq('user_id', user.id)
        .single();
    return data;
}

// Récupérer tous les gîtes accessibles
async function getAccessibleGites() {
    const { data } = await supabase
        .from('gites')
        .select('*')
        .order('name');
    return data; // Automatiquement filtré par RLS
}
```

---

## 🎯 PROCHAINES ÉTAPES

Une fois la migration OK :

1. ✅ **Tester l'isolation** avec plusieurs users
2. ✅ **Adapter le frontend** pour multi-gîtes
3. 🚧 **Interface onboarding** (inscription nouveaux clients)
4. 🚧 **Dashboard organization** (gestion gîtes/membres)
5. 🚧 **Intégration Stripe** (billing)
6. 🚧 **Channel Manager** (Airbnb/Booking)

---

## 📞 SUPPORT

En cas de problème :
1. Vérifier les logs SQL (messages RAISE NOTICE)
2. Exécuter les fonctions de vérification
3. Consulter [PLAN_DEMARRAGE_MULTI_TENANT.md](../../PLAN_DEMARRAGE_MULTI_TENANT.md)

---

**DURÉE TOTALE** : ~1h (avec tests)  
**DIFFICULTÉ** : ⭐⭐⭐ Moyenne  
**RÉVERSIBLE** : ✅ Oui (avec backup)

Bonne migration ! 🚀
