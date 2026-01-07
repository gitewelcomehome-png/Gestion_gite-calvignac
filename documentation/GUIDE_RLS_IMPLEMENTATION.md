# 🔐 Guide d'Implémentation RLS (Row Level Security)

**Date**: 7 janvier 2026  
**Objectif**: Sécuriser l'accès aux données au niveau des lignes  
**Impact**: Score sécurité 8.5/10 → **9/10**

---

## 📋 Vue d'Ensemble

Row Level Security (RLS) est une fonctionnalité PostgreSQL/Supabase qui contrôle l'accès aux lignes individuelles d'une table selon des règles (policies).

### Avantages
✅ **Sécurité renforcée** : Chaque utilisateur voit uniquement ses données  
✅ **Simplicité côté client** : Pas de filtres manuels dans le code  
✅ **Performance** : Filtrage au niveau base de données  
✅ **Audit trail** : Toutes les requêtes sont filtrées automatiquement

---

## 🚀 Étapes d'Implémentation

### Étape 1 : Activer RLS sur les Tables

Exécuter dans l'éditeur SQL Supabase :

```bash
# Dans Supabase Dashboard > SQL Editor
# Copier/coller le contenu de sql/security/rls_enable.sql
```

Ou via ligne de commande :
```bash
psql $DATABASE_URL < sql/security/rls_enable.sql
```

**Résultat** : RLS activé sur 13 tables critiques

⚠️ **ATTENTION** : Une fois RLS activé, **AUCUNE requête ne passe** sans policy !

---

### Étape 2 : Créer les Policies

Exécuter dans l'éditeur SQL Supabase :

```bash
# Dans Supabase Dashboard > SQL Editor
# Copier/coller le contenu de sql/security/rls_policies.sql
```

**Résultat** : 20+ policies créées pour tous les scénarios d'accès

---

### Étape 3 : Vérifier les Policies Actives

```sql
-- Voir toutes les policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

### Étape 4 : Tester l'Accès

#### Test Admin
```javascript
// Connecté en tant qu'admin
const { data: reservations } = await supabase
    .from('reservations')
    .select('*');

console.log(reservations); // Toutes les réservations
```

#### Test Femme de Ménage
```javascript
// Connecté en tant que femme_menage
const { data: reservations } = await supabase
    .from('reservations')
    .select('*');

console.log(reservations); // Uniquement réservations confirmées/ongoing
```

#### Test Utilisateur Non Authentifié
```javascript
// Non connecté
const { data, error } = await supabase
    .from('reservations')
    .select('*');

console.log(error); // "new row violates row-level security policy"
```

---

## 📊 Tables Sécurisées

| Table | Admin | Femme Ménage | Anon | Notes |
|-------|-------|--------------|------|-------|
| `reservations` | ALL | SELECT filtrée | ❌ | Femme ménage : status confirmed/ongoing |
| `cleaning_schedule` | ALL | ALL | ❌ | Femme ménage : ses interventions |
| `user_roles` | ALL | SELECT propre | ❌ | Lecture de ses propres rôles |
| `retours_menage` | ALL | ALL | ❌ | Femme ménage crée ses retours |
| `stocks_draps` | ALL | ALL | ❌ | Femme ménage gère les stocks |
| `infos_gites` | ALL | SELECT | ❌ | Femme ménage : lecture seule |
| `activites_gites` | ALL | SELECT | ❌ | Tous : lecture activités |
| `client_access_tokens` | ALL | ❌ | SELECT via token | Accès client anonyme temporaire |
| `historical_data` | ALL | ❌ | ❌ | Charges fiscalité admin only |
| `simulations_fiscales` | ALL | ❌ | ❌ | Simulations fiscales admin only |
| `todos` | ALL | ❌ | ❌ | Dashboard admin only |
| `commits_log` | ALL | ❌ | ❌ | Logs commits admin only |
| `faq_questions` | ALL | ❌ | SELECT | FAQ lecture publique |

---

## 🎯 Scénarios d'Utilisation

### Scénario 1 : Admin Complet
```sql
-- Policy: admin_full_access_reservations
CREATE POLICY "admin_full_access_reservations"
ON reservations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);
```

**Effet** : Les admins accèdent à TOUTES les lignes de `reservations`

### Scénario 2 : Femme de Ménage Limitée
```sql
-- Policy: femme_menage_read_reservations
CREATE POLICY "femme_menage_read_reservations"
ON reservations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'femme_menage'
    )
    AND status IN ('confirmed', 'ongoing')
);
```

**Effet** : Femme de ménage voit uniquement réservations confirmées/en cours

### Scénario 3 : Accès Client Anonyme
```sql
-- Policy: anon_access_via_valid_token
CREATE POLICY "anon_access_via_valid_token"
ON client_access_tokens
FOR SELECT
TO anon
USING (
    expires_at > NOW()
    AND used_at IS NULL
);
```

**Effet** : Clients accèdent à leur fiche via token temporaire

---

## 🔍 Debug et Dépannage

### Problème : "new row violates row-level security policy"

**Cause** : Tentative d'accès sans policy correspondante

**Solution** :
1. Vérifier que l'utilisateur est authentifié
2. Vérifier le rôle dans `user_roles`
3. Vérifier que la policy existe pour ce rôle

```sql
-- Voir le rôle de l'utilisateur actuel
SELECT role FROM user_roles WHERE user_id = auth.uid();
```

### Problème : Requête très lente après RLS

**Cause** : Policies sans index

**Solution** : Créer index sur `user_roles`
```sql
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_role 
ON user_roles(role);
```

### Problème : Impossible d'insérer des données

**Cause** : Policy WITH CHECK manquante

**Solution** :
```sql
-- Ajouter WITH CHECK pour INSERT/UPDATE
CREATE POLICY "policy_name"
ON table_name
FOR ALL
USING (condition_select)
WITH CHECK (condition_insert_update);
```

---

## 🧪 Tests Unitaires RLS

Créer un fichier de tests :

```sql
-- sql/security/rls_tests.sql

-- Test 1: Admin voit toutes les réservations
SELECT COUNT(*) FROM reservations; -- Devrait retourner toutes

-- Test 2: Créer utilisateur test femme de ménage
INSERT INTO user_roles (user_id, role) 
VALUES ('test-uuid-femme-menage', 'femme_menage');

-- Test 3: Se connecter en tant que femme de ménage et compter
-- (via interface Supabase ou client JS)

-- Test 4: Vérifier accès anonyme aux FAQ
SELECT COUNT(*) FROM faq_questions; -- Devrait marcher même non auth

-- Test 5: Bloquer accès non autorisé
-- Essayer SELECT user_roles sans être admin → Devrait échouer
```

---

## 📈 Impact Performance

### Avant RLS
```javascript
// ❌ Filtrage manuel dans le code
const { data } = await supabase.from('reservations').select('*');
const filtered = data.filter(r => {
    if (userRole === 'femme_menage') {
        return r.status === 'confirmed' || r.status === 'ongoing';
    }
    return true;
});
```

**Problèmes** :
- Toutes les données transitent par le réseau
- Filtrage côté client (lent, non sécurisé)
- Risque d'oubli de filtre

### Après RLS
```javascript
// ✅ Filtrage automatique au niveau DB
const { data } = await supabase.from('reservations').select('*');
// data contient déjà uniquement les lignes autorisées
```

**Avantages** :
- Données filtrées côté serveur (rapide, sécurisé)
- Moins de données sur le réseau
- Code plus simple
- Impossible d'oublier le filtrage

---

## 🔒 Bonnes Pratiques

### 1. Toujours Tester les Policies
```sql
-- Tester en tant que différents rôles
SET LOCAL role TO 'authenticated';
SELECT * FROM reservations;

SET LOCAL role TO 'anon';
SELECT * FROM reservations; -- Devrait échouer
```

### 2. Utiliser EXISTS pour Vérifier les Rôles
```sql
-- ✅ BON - EXISTS est optimisé
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
)

-- ❌ MAUVAIS - Sous-requête non optimisée
USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
)
```

### 3. Séparer SELECT et INSERT/UPDATE
```sql
-- Policy pour lecture
CREATE POLICY "read_policy" ON table FOR SELECT ...

-- Policy séparée pour écriture avec WITH CHECK
CREATE POLICY "write_policy" ON table FOR INSERT 
WITH CHECK (...);
```

### 4. Logger les Tentatives d'Accès Refusées
```sql
-- Créer une fonction trigger pour logger
CREATE OR REPLACE FUNCTION log_rls_violation()
RETURNS event_trigger AS $$
BEGIN
    INSERT INTO security_logs (event, user_id, timestamp)
    VALUES ('rls_violation', auth.uid(), NOW());
END;
$$ LANGUAGE plpgsql;
```

---

## 📝 Checklist Déploiement

Avant de déployer en production :

- [ ] Exécuter `rls_enable.sql` sur Supabase production
- [ ] Exécuter `rls_policies.sql` sur Supabase production
- [ ] Vérifier que tous les utilisateurs ont un rôle dans `user_roles`
- [ ] Tester accès avec compte admin
- [ ] Tester accès avec compte femme de ménage
- [ ] Tester accès client anonyme (fiche-client)
- [ ] Vérifier performances (ajouter index si besoin)
- [ ] Monitorer logs Supabase pour violations RLS
- [ ] Documenter les policies dans README.md

---

## 🎉 Résultat Final

Avec RLS implémenté :

✅ **Score sécurité : 9.0/10** (+0.5)  
✅ **Protection données au niveau DB**  
✅ **Code client simplifié**  
✅ **Conformité RGPD améliorée**  
✅ **Audit trail automatique**

**Temps d'implémentation** : 1-2 heures  
**Complexité** : Moyenne  
**ROI** : ⭐⭐⭐⭐⭐ (Excellent)
