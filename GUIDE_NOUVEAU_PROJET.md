# Guide : Création Nouveau Projet Supabase (Propre)

## ÉTAPE 1 : Créer le nouveau projet

1. **Va sur** https://supabase.com/dashboard
2. **Clique** "New Project"
3. **Remplis** :
   - Name: `gestion-gite-prod`
   - Database Password: **NOTE-LE** (tu en auras besoin)
   - Region: `Europe (Frankfurt)` ou proche de toi
   - Pricing Plan: Free
4. **Attends** 2-3 minutes le provisioning

## ÉTAPE 2 : Récupérer les credentials

1. **Project Settings** (icône ⚙️ en bas à gauche)
2. **API** dans le menu
3. **Copie** :
   - `Project URL` (ressemble à `https://xxxxx.supabase.co`)
   - `anon public` key (commence par `eyJ...`)

## ÉTAPE 3 : Mettre à jour config.local.js

Ouvre `/workspaces/Gestion_gite-calvignac/config.local.js` et remplace :

```javascript
window.SUPABASE_CONFIG = {
    SUPABASE_URL: 'https://TON-NOUVEAU-PROJECT-ID.supabase.co',
    SUPABASE_ANON_KEY: 'eyJ... TA NOUVELLE CLÉ ...'
};
```

## ÉTAPE 4 : Créer le schéma dans le nouveau projet

1. **SQL Editor** dans Supabase (icône SQL dans le menu)
2. **Ouvre** le fichier `sql/multi-tenant/00_reset_and_create_clean.sql`
3. **Copie TOUT le contenu** (681 lignes)
4. **Colle** dans l'éditeur SQL Supabase
5. **Clique** sur "Run" (ou Ctrl+Enter)
6. **Attends** 10-15 secondes
7. **Vérifie** le message : ✅ BASE DE DONNÉES RÉINITIALISÉE ET RECRÉÉE

## ÉTAPE 5 : Vérifier que le schéma est créé

Exécute dans SQL Editor :

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

**Tu dois voir 9 tables** :
- cleaning_reports
- cleaning_schedule
- expenses
- gites
- linen_stocks
- organization_members
- organizations
- practical_info
- reservations

## ÉTAPE 6 : Tester l'onboarding

1. **Ouvre** http://localhost:8000/onboarding.html (ou ton URL de dev)
2. **Vide le cache** du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)
3. **Console** (F12) → vérifie "✅ Client Supabase initialisé"

### Step 1 - Créer compte
- Email : `test@example.com`
- Password : `Test123456!` (8+ caractères)
- Confirme password
- **"Continuer"**
- Vérifie console : ✅ Compte créé

### Step 2 - Organization
- Nom : `Mon Entreprise Test`
- Email : `contact@test.fr`
- Téléphone : `+33 6 12 34 56 78`
- **"Continuer"**

### Step 3 - Ajouter gîtes
- **Gîte 1** :
  - Nom : `Gîte du Lac`
  - Icône : Choisir "chalet" 
  - Couleur : Bleu
  - Capacité : 6
  - Adresse : `123 Route du Lac`
- **Clique "Ajouter un gîte"**
- **Gîte 2** :
  - Nom : `Chalet Montagne`
  - Icône : "cabin"
  - Couleur : Vert
  - Capacité : 8
  - Adresse : `456 Chemin des Sommets`
- **"Terminer la configuration"**

### Step 4 - Succès
- Message : "Configuration terminée !"
- Redirection automatique vers dashboard après 2 secondes

## ÉTAPE 7 : Vérifier dans la base de données

Retourne dans SQL Editor et exécute :

```sql
-- Vérifier organization créée
SELECT id, name, slug, email FROM organizations;

-- Vérifier gîtes créés
SELECT id, name, icon, color, capacity, address FROM gites;

-- Vérifier member owner
SELECT om.role, o.name as organization, u.email as user_email
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
JOIN auth.users u ON u.id = om.user_id;
```

**Tu dois voir :**
- 1 organization
- 2 gîtes avec leurs icônes, couleurs, capacités
- 1 member avec role='owner'

## ÉTAPE 8 : Tester la connexion

1. **Déconnecte-toi** (si besoin) : Console → `await window.supabaseClient.auth.signOut()`
2. **Va sur** http://localhost:8000/login.html
3. **Connecte-toi** avec `test@example.com` / `Test123456!`
4. **Vérifie** que tu arrives sur le dashboard
5. **Vérifie** que tes 2 gîtes s'affichent avec leurs icônes SVG

## ✅ Résultat attendu

Si tout fonctionne :
- ✅ Onboarding complet sans erreur
- ✅ Organization + gîtes créés en base
- ✅ Connexion fonctionne
- ✅ Dashboard affiche les gîtes avec icônes

## ❌ Si problème

Execute le diagnostic :
```sql
-- Dans SQL Editor
\i sql/DIAGNOSTIC.sql
```

Et envoie-moi les résultats.

## Note importante

**NE PAS** réexécuter `00_reset_and_create_clean.sql` sur ce nouveau projet ! Il est propre maintenant.
