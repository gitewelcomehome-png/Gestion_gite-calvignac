# 🎯 PLAN D'ACTION - COMMERCIALISATION GESTION GÎTE

**Date de création**: 5 janvier 2026  
**Score actuel**: 3/10 - NON commercialisable  
**Objectif**: Score 9/10 - Prêt pour commercialisation  
**Durée estimée**: 6-8 semaines (70-100h développement + 15-20h tests)

---

## 📋 SYNOPSIS - LES 4 PHASES

| Phase | Objectif | Durée | Bloquant commercial ? |
|-------|----------|-------|----------------------|
| **Phase 1** | Sécurité fondamentale (RLS + Auth) | 2-3 semaines | ✅ OUI - CRITIQUE |
| **Phase 2** | Protection des secrets | 3-5 jours | ✅ OUI - CRITIQUE |
| **Phase 3** | Protection applicative (XSS + Injection) | 1-2 semaines | ⚠️ HAUTEMENT RECOMMANDÉ |
| **Phase 4** | Conformité légale (RGPD + CGU) | 1 semaine | ⚠️ LÉGALEMENT OBLIGATOIRE |

**Audit externe recommandé**: 2000-5000€ avant mise en production commerciale

---

## 🚨 PHASE 1 - SÉCURITÉ FONDAMENTALE [CRITIQUE]

### Durée: 2-3 semaines | Score cible: 5/10

### 1.1 - Activer RLS sur TOUTES les tables (Jour 1-3)

**🎯 Objectif**: Empêcher l'accès non autorisé aux données

#### Étape 1: Lister toutes les tables sans RLS
```bash
# Créer un script de diagnostic
cat > scripts/check_rls.sql << 'EOF'
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
EOF
```

#### Étape 2: Activer RLS sur chaque table
```sql
-- À exécuter via l'interface Supabase SQL Editor

-- Tables principales
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE infos_gites ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiches_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications_clients ENABLE ROW LEVEL SECURITY;

-- Tables critiques identifiées
ALTER TABLE stocks_draps ENABLE ROW LEVEL SECURITY;
ALTER TABLE retours_menage ENABLE ROW LEVEL SECURITY;

-- Tables support
ALTER TABLE fiscalite ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE activites ENABLE ROW LEVEL SECURITY;
ALTER TABLE soldes_bancaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE commits_log ENABLE ROW LEVEL SECURITY;
```

#### Étape 3: Créer les politiques RLS de base
```sql
-- Politique temporaire: Accès complet pour utilisateurs authentifiés
-- (Sera affiné en Phase 1.3)

CREATE POLICY "Propriétaire accès complet" ON reservations
    FOR ALL 
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Propriétaire accès complet" ON charges
    FOR ALL 
    USING (auth.uid() IS NOT NULL);

-- Répéter pour chaque table avec le même pattern
-- Créer un script pour automatiser:

DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('
            CREATE POLICY "Utilisateurs authentifiés" ON %I
            FOR ALL USING (auth.uid() IS NOT NULL)',
            table_name
        );
    END LOOP;
END $$;
```

**✅ Validation Étape 1**: 
- [ ] Toutes les tables ont `rowsecurity = true`
- [ ] Au moins 1 politique par table
- [ ] Impossible d'accéder aux données sans authentification

---

### 1.2 - Implémenter l'authentification (Jour 4-8)

**🎯 Objectif**: Système de login/logout fonctionnel

#### Étape 1: Créer la structure d'authentification

**Fichier**: `js/auth.js` (NOUVEAU)
```javascript
// Gestionnaire d'authentification centralisé
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.checkAuthState();
    }

    async checkAuthState() {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            this.onAuthSuccess();
        } else {
            this.redirectToLogin();
        }
    }

    async login(email, password) {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        this.currentUser = data.user;
        this.onAuthSuccess();
        return data;
    }

    async logout() {
        await window.supabaseClient.auth.signOut();
        this.currentUser = null;
        window.location.href = '/login.html';
    }

    redirectToLogin() {
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = '/login.html';
        }
    }

    onAuthSuccess() {
        // Charger les préférences utilisateur
        console.log('Utilisateur authentifié:', this.currentUser.email);
    }

    // Vérifier si l'utilisateur a un rôle
    async hasRole(role) {
        const { data } = await window.supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', this.currentUser.id)
            .eq('role', role)
            .single();
        
        return !!data;
    }
}

// Instance globale
window.authManager = new AuthManager();
```

#### Étape 2: Créer la page de connexion

**Fichier**: `login.html` (NOUVEAU)
```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connexion - Gestion Gîtes</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
        }
        
        .login-card {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            width: 100%;
            max-width: 400px;
        }
        
        h1 {
            margin: 0 0 30px;
            color: #333;
            font-size: 28px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }
        
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 16px;
            box-sizing: border-box;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        button {
            width: 100%;
            padding: 14px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        button:hover {
            background: #5568d3;
        }
        
        .error-message {
            background: #fee;
            color: #c33;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
        }
        
        .info-text {
            text-align: center;
            margin-top: 20px;
            color: #777;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="login-card">
        <h1>🏡 Gestion Gîtes</h1>
        
        <div id="errorMessage" class="error-message"></div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" required autocomplete="email">
            </div>
            
            <div class="form-group">
                <label for="password">Mot de passe</label>
                <input type="password" id="password" required autocomplete="current-password">
            </div>
            
            <button type="submit">Se connecter</button>
        </form>
        
        <div class="info-text">
            Version sécurisée avec authentification
        </div>
    </div>

    <script src="js/shared-config.js"></script>
    <script>
        const loginForm = document.getElementById('loginForm');
        const errorMessage = document.getElementById('errorMessage');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMessage.style.display = 'none';
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (error) throw error;
                
                // Redirection vers le dashboard
                window.location.href = '/index.html';
                
            } catch (error) {
                errorMessage.textContent = `Erreur: ${error.message}`;
                errorMessage.style.display = 'block';
            }
        });
    </script>
</body>
</html>
```

#### Étape 3: Protéger index.html et toutes les pages

**Ajouter en haut de `index.html`** (ligne 10-15):
```html
<script src="js/shared-config.js"></script>
<script src="js/auth.js"></script>
<script>
    // Vérification auth immédiate
    (async () => {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session && !window.location.pathname.includes('login.html')) {
            window.location.href = '/login.html';
        }
    })();
</script>
```

#### Étape 4: Créer le premier utilisateur

**Via Supabase Dashboard** → Authentication → Users → Add User:
- Email: votre-email@example.com
- Password: [mot de passe fort]
- Confirm email: ✅

**Ou via SQL**:
```sql
-- Créer un utilisateur administrateur
-- (À exécuter via l'interface Supabase Auth, pas SQL directement)
```

**✅ Validation Étape 1.2**:
- [ ] login.html accessible et fonctionnel
- [ ] index.html redirige vers login si non authentifié
- [ ] Connexion avec email/password réussie
- [ ] Bouton "Déconnexion" dans l'interface
- [ ] Session persistante après rafraîchissement

---

### 1.3 - Affiner les politiques RLS (Jour 9-12)

**🎯 Objectif**: Contrôle d'accès granulaire par rôle

#### Étape 1: Créer la table des rôles

```sql
-- Table de gestion des rôles
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'cleaner', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Politique: Seuls les admins voient les rôles
CREATE POLICY "Admins gèrent les rôles" ON user_roles
    FOR ALL 
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role = 'admin'
        )
    );
```

#### Étape 2: Affiner les politiques par table

```sql
-- RÉSERVATIONS: Owner et Admin accès complet
DROP POLICY IF EXISTS "Utilisateurs authentifiés" ON reservations;

CREATE POLICY "Owner et Admin complet" ON reservations
    FOR ALL 
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles 
            WHERE role IN ('owner', 'admin')
        )
    );

-- RETOURS MÉNAGE: Cleaner peut créer, Owner peut tout voir
DROP POLICY IF EXISTS "Utilisateurs authentifiés" ON retours_menage;

CREATE POLICY "Cleaner crée" ON retours_menage
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role = 'cleaner'
        )
    );

CREATE POLICY "Owner lit et valide" ON retours_menage
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles 
            WHERE role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owner met à jour" ON retours_menage
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles 
            WHERE role IN ('owner', 'admin')
        )
    );

-- CHARGES: Owner uniquement
DROP POLICY IF EXISTS "Utilisateurs authentifiés" ON charges;

CREATE POLICY "Owner uniquement" ON charges
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role = 'owner'
        )
    );

-- Répéter ce pattern pour toutes les tables sensibles
```

#### Étape 3: Assigner les rôles initiaux

```sql
-- Assigner le rôle "owner" à votre utilisateur
INSERT INTO user_roles (user_id, role)
VALUES (
    'UUID_DE_VOTRE_UTILISATEUR', -- Récupérer depuis Supabase Dashboard
    'owner'
);

-- Si vous avez une femme de ménage
INSERT INTO user_roles (user_id, role)
VALUES (
    'UUID_FEMME_MENAGE',
    'cleaner'
);
```

**✅ Validation Étape 1.3**:
- [ ] Table user_roles créée et protégée
- [ ] Politiques RLS personnalisées par rôle
- [ ] Owner voit tout, Cleaner limité aux retours ménage
- [ ] Tests d'accès concluants pour chaque rôle

---

## 🔐 PHASE 2 - PROTECTION DES SECRETS [CRITIQUE]

### Durée: 3-5 jours | Score cible: 6.5/10

### 2.1 - Créer les variables d'environnement (Jour 1)

#### Étape 1: Créer .env.local (développement)

```bash
# Créer le fichier
cat > .env.local << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anonyme

# iCal URLs (Privé)
VITE_ICAL_COTTAGE_URL=votre_url_ical_cottage
VITE_ICAL_BARN_URL=votre_url_ical_barn
VITE_ICAL_SHED_URL=votre_url_ical_shed

# GPS Coordinates
VITE_GPS_LAT=44.4829
VITE_GPS_LON=1.9154
EOF

# Ajouter au .gitignore
echo ".env.local" >> .gitignore
echo ".env*.local" >> .gitignore
```

#### Étape 2: Configurer Vercel (production)

**Via Vercel Dashboard**:
1. Project Settings → Environment Variables
2. Ajouter chaque variable:
   - `VITE_SUPABASE_URL` = [valeur]
   - `VITE_SUPABASE_ANON_KEY` = [valeur]
   - `VITE_ICAL_COTTAGE_URL` = [valeur]
   - etc.
3. Scope: Production, Preview, Development

**Ou via CLI**:
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_ICAL_COTTAGE_URL
vercel env add VITE_ICAL_BARN_URL
vercel env add VITE_ICAL_SHED_URL
```

---

### 2.2 - Modifier shared-config.js (Jour 2)

**Remplacer le contenu actuel**:

```javascript
// Configuration centralisée avec protection des secrets
const CONFIG = {
    // Supabase - Depuis variables d'environnement
    supabase: {
        url: import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    },
    
    // iCal - Depuis variables d'environnement (URLs privées)
    icalUrls: {
        cottage: import.meta.env.VITE_ICAL_COTTAGE_URL || process.env.VITE_ICAL_COTTAGE_URL,
        barn: import.meta.env.VITE_ICAL_BARN_URL || process.env.VITE_ICAL_BARN_URL,
        shed: import.meta.env.VITE_ICAL_SHED_URL || process.env.VITE_ICAL_SHED_URL
    },
    
    // Données publiques (OK)
    gps: {
        lat: 44.4829,
        lon: 1.9154
    },
    
    gites: {
        cottage: 'Cottage',
        barn: 'Barn',
        shed: 'Shed'
    }
};

// Validation au chargement
if (!CONFIG.supabase.url || !CONFIG.supabase.anonKey) {
    console.error('❌ ERREUR: Variables d\'environnement Supabase manquantes');
    alert('Configuration manquante. Contactez l\'administrateur.');
}

// Initialisation Supabase
window.supabaseClient = supabase.createClient(
    CONFIG.supabase.url,
    CONFIG.supabase.anonKey
);

console.log('✅ Configuration chargée avec sécurité');
```

---

### 2.3 - Régénérer les clés Supabase (Jour 3)

**🚨 IMPORTANT**: Une fois les secrets hors du code, RÉGÉNÉRER les clés

#### Via Supabase Dashboard:

1. **Settings** → **API**
2. **Project API keys** → Cliquer sur "Reset"
3. Copier les nouvelles clés
4. Mettre à jour `.env.local` ET Vercel
5. Redéployer l'application

```bash
# Après régénération
vercel env rm VITE_SUPABASE_ANON_KEY
vercel env add VITE_SUPABASE_ANON_KEY
# [coller la nouvelle clé]

# Forcer redéploiement
git commit --allow-empty -m "Chore: Régénération clés Supabase"
git push
```

**✅ Validation Phase 2**:
- [ ] Aucune clé visible dans le code source
- [ ] .env.local dans .gitignore
- [ ] Variables configurées sur Vercel
- [ ] Anciennes clés révoquées
- [ ] Application fonctionne avec nouvelles clés
- [ ] GitHub history ne contient plus les anciennes clés

---

## 🛡️ PHASE 3 - PROTECTION APPLICATIVE [RECOMMANDÉ]

### Durée: 1-2 semaines | Score cible: 8/10

### 3.1 - Corriger les vulnérabilités XSS (Jour 1-5)

#### Étape 1: Installer DOMPurify

```bash
# Via npm
npm install dompurify

# Ou via CDN dans index.html
```

**Ajouter dans `index.html`**:
```html
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.8/dist/purify.min.js"></script>
```

#### Étape 2: Créer un utilitaire de sanitisation

**Fichier**: `js/security-utils.js` (NOUVEAU)
```javascript
// Utilitaires de sécurité
const SecurityUtils = {
    // Sanitiser HTML avant insertion
    sanitizeHTML(dirty) {
        return DOMPurify.sanitize(dirty, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
            ALLOWED_ATTR: []
        });
    },
    
    // Échapper pour textContent (pas de HTML)
    escapeText(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // Valider email
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Valider numéro de téléphone français
    isValidPhone(phone) {
        const re = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
        return re.test(phone);
    }
};

window.SecurityUtils = SecurityUtils;
```

#### Étape 3: Remplacer tous les innerHTML dangereux

**Fichiers à corriger**: 
- `js/draps.js`
- `js/femme-menage.js`
- `js/infos-gites.js`
- `js/decouvrir.js`
- `js/fiche-client.js`

**Pattern à appliquer**:
```javascript
// ❌ AVANT (Dangereux)
element.innerHTML = userInput;

// ✅ APRÈS (Sécurisé)
// Option 1: Texte pur uniquement
element.textContent = userInput;

// Option 2: HTML sanitisé si absolument nécessaire
element.innerHTML = SecurityUtils.sanitizeHTML(userInput);
```

**Exemples concrets**:

```javascript
// Dans femme-menage.js - Ligne ~250
// ❌ AVANT
alertsContainer.innerHTML = html;

// ✅ APRÈS
alertsContainer.innerHTML = ''; // Clear
html.split('</div>').forEach(part => {
    if (part.trim()) {
        const div = document.createElement('div');
        div.innerHTML = SecurityUtils.sanitizeHTML(part + '</div>');
        alertsContainer.appendChild(div.firstChild);
    }
});
```

---

### 3.2 - Protection contre l'injection SQL (Jour 6-7)

**Bonne nouvelle**: Supabase utilise des requêtes paramétrées par défaut.

**Vérifier les patterns dangereux**:

```javascript
// ❌ DANGEREUX (Construction de requête)
const query = `SELECT * FROM users WHERE name = '${userName}'`;

// ✅ SÉCURISÉ (Supabase paramétré)
const { data } = await supabaseClient
    .from('users')
    .select('*')
    .eq('name', userName); // Automatiquement échappé
```

**Action**: Grep pour trouver les constructions dangereuses:
```bash
grep -r "SELECT.*\${" js/
grep -r "INSERT.*\${" js/
grep -r "UPDATE.*\${" js/
```

Si trouvé → Remplacer par l'API Supabase.

---

### 3.3 - Validation côté serveur (Jour 8-10)

#### Créer des Edge Functions Supabase

**Fichier**: `supabase/functions/validate-reservation/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { gite, date_arrivee, date_depart } = await req.json();
    
    // Validation côté serveur
    if (!gite || !date_arrivee || !date_depart) {
        return new Response(
            JSON.stringify({ error: 'Données manquantes' }),
            { status: 400 }
        );
    }
    
    // Vérifier chevauchements
    const { data: conflicts } = await supabase
        .from('reservations')
        .select('*')
        .eq('gite', gite)
        .or(`and(date_arrivee.lte.${date_depart},date_depart.gte.${date_arrivee})`);
    
    if (conflicts && conflicts.length > 0) {
        return new Response(
            JSON.stringify({ error: 'Dates déjà réservées' }),
            { status: 409 }
        );
    }
    
    // Insérer
    const { data, error } = await supabase
        .from('reservations')
        .insert({ gite, date_arrivee, date_depart });
    
    if (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500 }
        );
    }
    
    return new Response(
        JSON.stringify({ data }),
        { headers: { 'Content-Type': 'application/json' } }
    );
});
```

**Déployer**:
```bash
supabase functions deploy validate-reservation
```

**Utiliser dans le frontend**:
```javascript
// Au lieu de insert direct
const response = await supabaseClient.functions.invoke('validate-reservation', {
    body: { gite, date_arrivee, date_depart }
});
```

**✅ Validation Phase 3**:
- [ ] DOMPurify installé et fonctionnel
- [ ] 0 innerHTML non sanitisé restant
- [ ] Aucune construction SQL dangereuse
- [ ] Edge Functions pour opérations critiques
- [ ] Tests de sécurité passés (essayer d'injecter `<script>`)

---

## 📜 PHASE 4 - CONFORMITÉ LÉGALE [OBLIGATOIRE]

### Durée: 1 semaine | Score cible: 9/10

### 4.1 - RGPD - Gestion des données personnelles (Jour 1-3)

#### Étape 1: Créer la page de politique de confidentialité

**Fichier**: `privacy.html` (NOUVEAU)
```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Politique de Confidentialité - Gestion Gîtes</title>
</head>
<body>
    <h1>Politique de Confidentialité</h1>
    
    <h2>1. Données collectées</h2>
    <ul>
        <li>Réservations: Nom, email, téléphone, dates de séjour</li>
        <li>Retours ménage: Photos, observations</li>
        <li>Comptabilité: Factures, charges</li>
    </ul>
    
    <h2>2. Finalité du traitement</h2>
    <p>Gestion administrative des locations de gîtes.</p>
    
    <h2>3. Durée de conservation</h2>
    <p>10 ans pour les données comptables (obligation légale)</p>
    <p>3 ans pour les données clients après dernier contact</p>
    
    <h2>4. Vos droits</h2>
    <p>Accès, rectification, suppression, portabilité</p>
    <p>Contact: votre-email@example.com</p>
    
    <h2>5. Sécurité</h2>
    <p>Données hébergées chez Supabase (Certifié ISO 27001)</p>
    <p>Chiffrement en transit (TLS) et au repos</p>
</body>
</html>
```

#### Étape 2: Implémenter le consentement cookies

**Fichier**: `js/cookies-consent.js` (NOUVEAU)
```javascript
// Bannière de consentement RGPD
class CookieConsent {
    constructor() {
        this.showBannerIfNeeded();
    }
    
    showBannerIfNeeded() {
        if (localStorage.getItem('cookies-accepted')) return;
        
        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.innerHTML = `
            <div style="position: fixed; bottom: 0; left: 0; right: 0; background: #333; color: white; padding: 20px; z-index: 10000;">
                <p>
                    Nous utilisons des cookies pour améliorer votre expérience. 
                    <a href="/privacy.html" style="color: #6ea8fe;">En savoir plus</a>
                </p>
                <button id="accept-cookies" style="background: #198754; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    Accepter
                </button>
                <button id="decline-cookies" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                    Refuser
                </button>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        document.getElementById('accept-cookies').addEventListener('click', () => {
            localStorage.setItem('cookies-accepted', 'true');
            banner.remove();
        });
        
        document.getElementById('decline-cookies').addEventListener('click', () => {
            localStorage.setItem('cookies-accepted', 'false');
            banner.remove();
            // Désactiver les cookies non essentiels
        });
    }
}

new CookieConsent();
```

#### Étape 3: Droit à l'effacement

**Ajouter dans l'interface owner**:
```javascript
async function deleteClientData(clientId) {
    if (!confirm('Supprimer TOUTES les données de ce client ? (Irréversible)')) {
        return;
    }
    
    // Supprimer de toutes les tables
    await supabaseClient.from('fiches_clients').delete().eq('id', clientId);
    await supabaseClient.from('transactions_clients').delete().eq('fiche_client_id', clientId);
    await supabaseClient.from('communications_clients').delete().eq('fiche_client_id', clientId);
    await supabaseClient.from('reservations').delete().eq('client_id', clientId);
    
    alert('Données client supprimées (RGPD)');
}
```

---

### 4.2 - CGU et Mentions légales (Jour 4)

**Fichier**: `legal.html` (NOUVEAU)
```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Mentions Légales - Gestion Gîtes</title>
</head>
<body>
    <h1>Mentions Légales</h1>
    
    <h2>Éditeur du site</h2>
    <p>
        [Votre Nom ou Société]<br>
        SIRET: [Numéro]<br>
        Adresse: [Votre adresse]<br>
        Email: [Email]<br>
        Téléphone: [Téléphone]
    </p>
    
    <h2>Hébergeur</h2>
    <p>
        Vercel Inc.<br>
        340 S Lemon Ave #4133<br>
        Walnut, CA 91789<br>
        États-Unis
    </p>
    
    <p>
        Base de données: Supabase Inc.<br>
        [Adresse Supabase]
    </p>
    
    <h2>Propriété intellectuelle</h2>
    <p>Tous droits réservés © 2026</p>
    
    <h2>Données personnelles</h2>
    <p>Voir <a href="/privacy.html">Politique de Confidentialité</a></p>
</body>
</html>
```

---

### 4.3 - Logging et audit (Jour 5-7)

#### Créer un système de logs d'accès

```sql
-- Table de logs d'accès
CREATE TABLE IF NOT EXISTS access_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'login', 'view', 'create', 'update', 'delete'
    resource TEXT, -- 'reservations', 'charges', etc.
    resource_id INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_access_logs_user ON access_logs(user_id);
CREATE INDEX idx_access_logs_created ON access_logs(created_at);

ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins voient tous les logs" ON access_logs
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM user_roles WHERE role = 'admin'
        )
    );
```

#### Implémenter le logging

**Fichier**: `js/audit-logger.js` (NOUVEAU)
```javascript
class AuditLogger {
    static async log(action, resource, resourceId = null) {
        try {
            await window.supabaseClient
                .from('access_logs')
                .insert({
                    user_id: window.authManager.currentUser?.id,
                    action,
                    resource,
                    resource_id: resourceId,
                    user_agent: navigator.userAgent
                });
        } catch (error) {
            console.error('Erreur logging:', error);
        }
    }
}

window.AuditLogger = AuditLogger;
```

**Utiliser dans le code**:
```javascript
// Exemple dans dashboard.js
async function deleteReservation(id) {
    await supabaseClient.from('reservations').delete().eq('id', id);
    await AuditLogger.log('delete', 'reservations', id);
}
```

**✅ Validation Phase 4**:
- [ ] privacy.html créée et accessible
- [ ] legal.html créée avec mentions légales
- [ ] Bannière cookies fonctionnelle
- [ ] Droit à l'effacement implémenté
- [ ] Système de logs opérationnel
- [ ] Lien "Confidentialité" dans le footer

---

## 🎯 CHECKLIST FINALE DE COMMERCIALISATION

### Sécurité Technique ✅

- [ ] RLS activé sur toutes les tables
- [ ] Politiques RLS par rôle fonctionnelles
- [ ] Système d'authentification robuste
- [ ] Secrets dans variables d'environnement
- [ ] Anciennes clés révoquées
- [ ] XSS corrigés (DOMPurify)
- [ ] Pas d'injection SQL
- [ ] HTTPS activé (Vercel par défaut)
- [ ] Rate limiting configuré
- [ ] CSP headers configurés

### Conformité Légale ✅

- [ ] Politique de confidentialité publiée
- [ ] Mentions légales complètes
- [ ] Bannière cookies RGPD
- [ ] Droit à l'effacement fonctionnel
- [ ] Logs d'audit activés
- [ ] CGU acceptées par les users

### Tests de Sécurité ✅

- [ ] Tentative XSS échouée
- [ ] Accès non authentifié bloqué
- [ ] Changement de rôle impossible
- [ ] Secrets invisibles dans le code source
- [ ] Test de pénétration basique passé

### Audit Externe ✅

- [ ] Budget alloué (2000-5000€)
- [ ] Société d'audit contactée
- [ ] Rapport d'audit reçu
- [ ] Correctifs appliqués
- [ ] Certificat de conformité obtenu

---

## 📊 SUIVI DE PROGRESSION

### Semaine 1-2: Phase 1 (Sécurité Fondamentale)
- Jour 1-3: RLS sur toutes les tables
- Jour 4-8: Authentification complète
- Jour 9-12: Politiques RLS granulaires

**Validation**: ✅ Score 5/10 atteint

### Semaine 3: Phase 2 (Protection Secrets)
- Jour 1: Variables d'environnement
- Jour 2: Modification shared-config.js
- Jour 3: Régénération clés

**Validation**: ✅ Score 6.5/10 atteint

### Semaine 4-5: Phase 3 (Protection Applicative)
- Jour 1-5: Correction XSS
- Jour 6-7: Injection SQL
- Jour 8-10: Edge Functions

**Validation**: ✅ Score 8/10 atteint

### Semaine 6: Phase 4 (Conformité)
- Jour 1-3: RGPD
- Jour 4: CGU/Mentions légales
- Jour 5-7: Audit logging

**Validation**: ✅ Score 9/10 atteint

### Semaine 7-8: Audit Externe
- Contact sociétés audit
- Tests de pénétration
- Correctifs finaux

**Validation finale**: ✅ Score 9.5/10 - COMMERCIALISABLE

---

## 💰 BUDGET ESTIMATIF

| Poste | Coût interne (70-100h) | Coût externe |
|-------|------------------------|--------------|
| Phase 1 (RLS + Auth) | 25-35h | 2500-4000€ |
| Phase 2 (Secrets) | 5-8h | 500-800€ |
| Phase 3 (XSS + Injection) | 20-30h | 2000-3000€ |
| Phase 4 (RGPD) | 15-20h | 1500-2000€ |
| Tests | 10-15h | 1000-1500€ |
| **Audit externe** | - | **2000-5000€** |
| **TOTAL** | **75-108h** | **9500-16300€** |

**Recommandation**: Mix interne (Phase 1-4) + audit externe final.

---

## 🚀 COMMANDES RAPIDES

### Démarrage Phase 1
```bash
# Créer la branche de sécurité
git checkout -b security/commercialization

# Créer les scripts SQL
mkdir -p sql/security
touch sql/security/01_enable_rls.sql
touch sql/security/02_auth_policies.sql
touch sql/security/03_user_roles.sql
```

### Test de sécurité local
```bash
# Vérifier les secrets exposés
grep -r "SUPABASE" --include="*.js" --include="*.html" .

# Compter les innerHTML
grep -r "innerHTML" --include="*.js" js/ | wc -l
```

### Déploiement sécurisé
```bash
# S'assurer que .env.local est ignoré
git check-ignore .env.local

# Déployer avec nouvelles variables
vercel --prod
```

---

## 📞 CONTACT AUDIT EXTERNE

### Sociétés recommandées (Cybersécurité)

1. **Vaadata** (France)
   - Spécialité: PME/Start-ups
   - Tarif: ~3000€
   - [www.vaadata.com](https://www.vaadata.com)

2. **Synacktiv** (France)
   - Spécialité: Pentest applicatif
   - Tarif: 4000-5000€
   - [www.synacktiv.com](https://www.synacktiv.com)

3. **Yogosha** (Plateforme Bug Bounty)
   - Spécialité: Tests continus
   - Tarif: Variable (à partir de 2000€)
   - [www.yogosha.com](https://www.yogosha.com)

---

## 📝 NOTES IMPORTANTES

### ⚠️ Points de vigilance

1. **Ne jamais pusher les .env**
   ```bash
   # Vérifier avant chaque commit
   git status | grep "env"
   ```

2. **Tester en local d'abord**
   - Phase 1: Tester l'auth sur localhost
   - Phase 2: Vérifier que les env vars sont chargées
   - Phase 3: Tests XSS manuels

3. **Sauvegardes avant changements RLS**
   ```bash
   # Exporter la base avant Phase 1
   # Via Supabase Dashboard → Database → Backup
   ```

4. **Communiquer avec l'équipe**
   - Prévenir la femme de ménage du nouveau login
   - Former sur le nouveau processus
   - Documenter les changements

### 🎓 Ressources formation

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Supabase RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- RGPD (CNIL): https://www.cnil.fr/fr/rgpd-de-quoi-parle-t-on

---

## ✅ VALIDATION FINALE

Avant de déclarer l'application commercialisable:

```bash
# 1. Checklist automatique
node scripts/security-check.js

# 2. Tests manuels
# - Essayer d'accéder sans login ❌
# - Essayer d'injecter <script>alert('XSS')</script> ❌
# - Vérifier que les API keys sont invisibles ❌
# - Tester tous les rôles (owner, cleaner) ✅

# 3. Audit externe
# - Rapport reçu et validé ✅
# - Score > 8/10 ✅

# 4. Légal
# - Privacy policy visible ✅
# - Mentions légales complètes ✅
# - Bannière cookies active ✅
```

---

**Document créé le**: 5 janvier 2026  
**Auteur**: GitHub Copilot + Propriétaire gîte  
**Version**: 1.0  
**Prochaine révision**: Après Phase 1 (dans 2-3 semaines)

---

🎯 **OBJECTIF FINAL**: Application sécurisée, conforme RGPD, prête pour commercialisation avec score 9/10 minimum.

🚀 **PRÊT À COMMENCER**: Phase 1 - RLS + Authentification (Semaine 1-2)
