# 🔒 AUDIT DE SÉCURITÉ - Gestion Gîte Calvignac
**Date**: 5 janvier 2026  
**Objectif**: Préparer l'application pour une commercialisation

---

## ⚠️ VULNÉRABILITÉS CRITIQUES

### 1. 🔴 **CRITIQUE** - Clés API Supabase exposées en clair
**Risque**: 10/10 - Accès total aux données

**Problème**:
- Clé API Supabase (`SUPABASE_KEY`) visible dans le code source
- Présente dans 5+ fichiers JavaScript publics
- N'importe qui peut copier la clé et accéder à votre base de données

**Fichiers concernés**:
- `js/shared-config.js` (ligne 10)
- `js/fiche-client-app.js` (ligne 12)
- `validation.html` (ligne 435)
- `femme-menage.html`
- Tous les fichiers de test

**Solution IMMÉDIATE**:
```javascript
// ❌ ACTUEL - DANGEREUX
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// ✅ RECOMMANDÉ
// 1. Utiliser les variables d'environnement Vercel
// 2. Créer un fichier .env (jamais commité)
// 3. Utiliser des tokens avec durée limitée
```

**Actions**:
1. ⚡ Révoquer la clé actuelle dans Supabase
2. ⚡ Créer une nouvelle clé "anon" avec permissions limitées
3. ⚡ Activer Row Level Security (RLS) sur TOUTES les tables
4. ✅ Utiliser variables d'environnement Vercel

---

### 2. 🔴 **CRITIQUE** - Row Level Security (RLS) désactivé
**Risque**: 9/10 - N'importe qui peut lire/modifier/supprimer vos données

**Problème**:
- RLS désactivé sur plusieurs tables
- Avec la clé API publique, accès total aux données

**Tables sans protection**:
- `stocks_draps` (sql/create_stocks_draps.sql:38)
- `retours_menage` (sql/create_retours_menage.sql:38)
- Probablement d'autres tables

**Solution**:
```sql
-- ✅ Activer RLS
ALTER TABLE stocks_draps ENABLE ROW LEVEL SECURITY;
ALTER TABLE retours_menage ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
-- ... pour TOUTES les tables

-- Créer des politiques d'accès
CREATE POLICY "Accès authentifié" ON stocks_draps
    FOR ALL
    TO authenticated
    USING (true);
```

---

### 3. 🟠 **ÉLEVÉ** - Injection XSS possible
**Risque**: 7/10 - Vol de session, manipulation de données

**Problème**:
- Utilisation de `innerHTML` avec données utilisateur non échappées
- 20+ occurrences trouvées dans le code

**Exemples vulnérables**:
```javascript
// ❌ DANGEREUX si userName vient d'un utilisateur
container.innerHTML = `<h2>Bonjour ${userName}</h2>`;

// ✅ SÉCURISÉ
container.textContent = userName;
// OU
const sanitized = DOMPurify.sanitize(userName);
container.innerHTML = sanitized;
```

**Fichiers à corriger**:
- `js/draps.js` (5+ occurrences)
- `js/decouvrir.js` (10+ occurrences)
- `js/infos-gites.js`
- `femme-menage.js`

---

### 4. 🟠 **ÉLEVÉ** - Pas d'authentification
**Risque**: 8/10 - N'importe qui peut accéder à l'app

**Problème**:
- Aucun système de login
- Application entièrement publique
- URLs iCal privées en clair dans le code

**Solution**:
```javascript
// Implémenter authentification Supabase
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Protéger les routes
if (!supabase.auth.getUser()) {
  window.location.href = '/login.html';
}
```

---

## 🟡 VULNÉRABILITÉS MOYENNES

### 5. 🟡 **MOYEN** - URLs iCal privées exposées
**Risque**: 5/10 - Accès aux calendriers de réservation

**Fichier**: `js/shared-config.js` lignes 22-35

**Solution**:
- Stocker les URLs dans Supabase avec RLS
- Ne jamais les exposer côté client
- Créer un proxy backend pour sync iCal

---

### 6. 🟡 **MOYEN** - Coordonnées GPS publiques
**Risque**: 3/10 - Localisation précise des gîtes

**Fichier**: `js/shared-config.js` lignes 38-41

**Impact**: Les concurrents peuvent voir vos emplacements exacts

---

### 7. 🟡 **MOYEN** - Pas de rate limiting
**Risque**: 6/10 - Surcharge serveur, coûts excessifs

**Problème**:
- Aucune limite sur les requêtes API
- Possibilité de DDoS facile
- Coûts Supabase non contrôlés

**Solution**: Implémenter rate limiting côté Supabase

---

## 🟢 BONNES PRATIQUES MANQUANTES

### 8. 🟢 Validation des entrées insuffisante
- Pas de validation côté client avant envoi à Supabase
- Pas de sanitization des données

### 9. 🟢 Gestion des erreurs exposée
- Messages d'erreur trop détaillés dans la console
- Informations sensibles dans les logs

### 10. 🟢 Pas de HTTPS forcé
- Vérifier configuration Vercel pour HTTPS only

### 11. 🟢 Pas de Content Security Policy (CSP)
- Headers de sécurité manquants

### 12. 🟢 Fichiers de test en production
- Nombreux fichiers `test-*.html` accessibles publiquement

---

## 📋 PLAN D'ACTION PRIORITAIRE

### Phase 1 - URGENT (Avant toute commercialisation)
- [ ] **Jour 1**: Activer RLS sur toutes les tables Supabase
- [ ] **Jour 1**: Créer politiques d'accès restrictives
- [ ] **Jour 2**: Implémenter authentification utilisateur
- [ ] **Jour 2**: Déplacer clés API vers variables d'environnement
- [ ] **Jour 3**: Révoquer et régénérer toutes les clés API

### Phase 2 - IMPORTANT (Semaine 1)
- [ ] Ajouter validation/sanitization sur tous les inputs
- [ ] Implémenter DOMPurify pour XSS
- [ ] Créer système de rôles (propriétaire, femme de ménage, admin)
- [ ] Supprimer tous les fichiers de test de production
- [ ] Déplacer URLs iCal vers backend sécurisé

### Phase 3 - AMÉLIORATION (Semaine 2-3)
- [ ] Ajouter rate limiting
- [ ] Implémenter logging sécurisé
- [ ] Configurer CSP headers
- [ ] Audit de toutes les requêtes SQL
- [ ] Tests de pénétration

### Phase 4 - COMMERCIALISATION (Mois 1)
- [ ] Documentation sécurité
- [ ] Formation utilisateurs
- [ ] Plan de réponse aux incidents
- [ ] Conformité RGPD
- [ ] Audit externe (recommandé)

---

## 💰 COÛT ESTIMÉ DE MISE EN CONFORMITÉ

**Développement interne**:
- Phase 1: 20-30h (CRITIQUE)
- Phase 2: 30-40h (IMPORTANT)
- Phase 3: 20-30h (AMÉLIORATION)
- **Total**: 70-100 heures

**Audit externe professionnel**: 2000-5000€

---

## 📚 RESSOURCES

- **Supabase Security**: https://supabase.com/docs/guides/auth
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Content Security Policy**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- **DOMPurify**: https://github.com/cure53/DOMPurify

---

## ⚖️ CONFORMITÉ LÉGALE

Pour commercialisation en France:
- [ ] RGPD: Politique de confidentialité
- [ ] RGPD: Consentement cookies
- [ ] RGPD: Droit à l'effacement
- [ ] CGU/CGV: Conditions d'utilisation
- [ ] Mentions légales obligatoires

---

## 🎯 SCORE DE SÉCURITÉ ACTUEL

**Note globale**: 3/10 ⚠️

**Détail**:
- Authentification: 0/10 ❌
- Autorisation: 2/10 ❌
- Chiffrement: 5/10 (HTTPS OK si forcé)
- Validation: 3/10 ⚠️
- Gestion secrets: 1/10 ❌
- Audit/Logs: 2/10 ❌

**Après mise en conformité**: 8-9/10 ✅

---

## 📝 NOTES

Cette application est actuellement **NON COMMERCIALISABLE** en l'état.

Les vulnérabilités critiques (clés API publiques + RLS désactivé) exposent toutes vos données sans protection.

**Priorité absolue**: Sécuriser l'accès à Supabase (RLS + Auth) avant toute chose.
