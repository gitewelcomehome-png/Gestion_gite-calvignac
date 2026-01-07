# 🔒 Configuration Sécurité Supabase - Guide Complet

## ✅ Déjà Configuré

1. **RLS (Row Level Security)** ✅
   - Activé sur 13 tables
   - 20+ policies définies
   - Scripts: `rls_enable.sql` + `rls_policies.sql`

2. **Authentification** ✅
   - Auth Supabase activée
   - JWT tokens sécurisés
   - AuthManager côté client

## 🛡️ Configuration Supplémentaire Recommandée

### 1. Domain Restrictions (Urgent) 🔥

**Dans Supabase Dashboard** :
1. Aller dans **Settings** > **API**
2. Section **Site URL** : `https://votre-domaine-vercel.app`
3. Section **Allowed Origins** :
   ```
   https://votre-domaine-vercel.app
   https://www.votre-domaine-vercel.app
   http://localhost:5500
   http://127.0.0.1:5500
   ```

**Impact** : Empêche les requêtes depuis d'autres domaines

---

### 2. Rate Limiting API (Recommandé)

**Dans Supabase Dashboard** :
1. Aller dans **Settings** > **API**
2. Activer **Rate Limiting**
3. Configurer :
   - Anonymous requests: 100/heure
   - Authenticated requests: 1000/heure

**Impact** : Protection DDoS au niveau Supabase

---

### 3. Email Confirmation (Important)

**Dans Supabase Dashboard** :
1. Aller dans **Authentication** > **Email**
2. Activer **Enable email confirmations**
3. Configurer **Email templates**

**Impact** : Empêche inscriptions frauduleuses

---

### 4. JWT Expiration (Optionnel)

**Dans Supabase Dashboard** :
1. Aller dans **Settings** > **Auth**
2. **JWT expiry** : 3600 (1 heure)
3. **Refresh token expiry** : 2592000 (30 jours)

**Impact** : Sessions expirées plus rapidement

---

### 5. Hooks de Sécurité (Avancé)

**Créer une Supabase Edge Function** :

```typescript
// supabase/functions/security-audit/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { type, payload } = await req.json()
  
  // Logger les connexions suspectes
  if (type === 'INSERT' && payload.table === 'auth.users') {
    // Vérifier IP, géolocalisation, etc.
    // Alerter si suspect
  }
  
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  })
})
```

---

## 📊 Monitoring Sécurité

### Requêtes à surveiller (dans Supabase Dashboard > Logs)

```sql
-- Tentatives d'accès RLS bloquées (dernières 24h)
SELECT 
  timestamp,
  auth.uid() as user_id,
  request_path,
  status_code
FROM edge_logs
WHERE status_code = 403 
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

```sql
-- Connexions par IP (détecter activité suspecte)
SELECT 
  ip_address,
  COUNT(*) as login_count,
  COUNT(DISTINCT user_id) as unique_users
FROM auth.audit_log_entries
WHERE action = 'login'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 10
ORDER BY login_count DESC;
```

---

## 🚨 Checklist Sécurité Finale

Cocher après configuration :

- [x] RLS activé sur toutes les tables
- [x] Policies RLS définies et testées
- [x] Clé `anon` utilisée (pas `service_role`)
- [ ] **Domain restrictions configurées** ⚠️ FAIRE
- [ ] **Rate limiting API activé** ⚠️ FAIRE
- [ ] Email confirmation activée
- [ ] JWT expiration configurée
- [ ] Monitoring logs actif
- [ ] Alerts Supabase configurées
- [ ] Backup automatique DB activé

---

## 🔑 Gestion des Clés

### Clés Supabase Existantes

1. **Clé `anon` (publique)** ✅
   - Visible dans le code client
   - Permissions limitées par RLS
   - **Utilisée actuellement** ✅

2. **Clé `service_role` (SECRÈTE)** ⚠️
   - **JAMAIS** dans le code client
   - **JAMAIS** dans git
   - Uniquement backend/scripts serveur
   - Contourne RLS → accès total

### Rotation des Clés (si compromission)

**Si vous soupçonnez une fuite de clé `service_role`** :

1. Dans Supabase Dashboard > **Settings** > **API**
2. Cliquer sur **Reset service_role key**
3. Mettre à jour tous les scripts backend
4. Vérifier logs d'accès suspects

**Clé `anon`** : Pas besoin de rotation (publique par design)

---

## 📞 Ressources

- [Doc Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase RLS Policies](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Best Practices](https://supabase.com/docs/guides/platform/going-into-prod)

---

**Date de création** : 7 janvier 2026  
**Dernière mise à jour** : 7 janvier 2026  
**Statut** : Configuration de base OK, optimisations recommandées
