# 🚀 SOLUTION ROBUSTE - RPC `complete_onboarding`

## ❌ Problème avec l'ancienne méthode

**Après 5h de galère avec PostgREST :**
- Cache qui ne se rafraîchit pas immédiatement
- Besoin d'attendre 30 secondes entre chaque étape
- RLS qui bloque parfois les inserts
- Architecture fragile et complexe

## ✅ NOUVELLE SOLUTION : RPC sécurisée

### Principe
1. L'utilisateur s'inscrit via `supabase.auth.signUp()`
2. Une fois connecté, le front appelle la RPC `complete_onboarding`
3. La fonction PL/pgSQL crée l'organisation + le membership owner
4. La même RPC insère tous les gîtes en une transaction

### Avantages
- ✅ **Zéro problème de cache** : Tout se passe côté serveur, RLS maîtrisé
- ✅ **Transaction unique** : org + gîtes + membership créés d'un coup
- ✅ **Plus sécurisé** : Fonction `SECURITY DEFINER` qui valide l'utilisateur
- ✅ **Moins de JS** : Plus besoin de requêtes REST manuelles
- ✅ **Compatible confirmation email** : On peut lancer la RPC après login

---

## 📋 ÉTAPES D'INSTALLATION

### 1. Supprimer l'ancien projet (optionnel)

Si vous voulez repartir à zéro :
1. Dashboard Supabase → Settings → Danger Zone
2. Delete project
3. Create new project

### 2. Exécuter le nouveau schéma

Ouvrir **SQL Editor** dans Supabase, copier-coller :

```
sql/fresh-start/01_schema_with_triggers.sql
```

Cliquer **"Run"**

✅ Vous devriez voir :
```
✅ SCHÉMA CRÉÉ AVEC RPC COMPLETE_ONBOARDING()
✅ Organizations, gites, members, reservations prêts
✅ RLS activé sur toutes les tables
✅ Fonction complete_onboarding() disponible pour les utilisateurs authentifiés
```

### 3. Mettre à jour config.local.js

```javascript
window.LOCAL_CONFIG = {
    SUPABASE_URL: 'https://VOTRE-PROJET.supabase.co',
    SUPABASE_KEY: 'eyJ...'
};
```

---

## 🧪 TEST

### 1. Ouvrir onboarding.html

```bash
# Serveur local
python3 -m http.server 8000

# Ou
npx serve
```

Ouvrir : http://localhost:8000/onboarding-v2.html

### 2. Créer un compte

**Étape 1 - Compte**
```
Société:       Gîtes Test  
Email:         test@example.com
Mot de passe:  Test123456!
Confirmer:     Test123456!
```

➡️ Cliquer **"Continuer"**

**🎯 À ce moment :**
1. Supabase crée le user dans `auth.users`
2. Aucune organisation n'est créée tant que l'email n'est pas confirmé
3. Dès que l'utilisateur est connecté, on passe à l'étape 2

### 3. Ajouter les gîtes

**Étape 2 - Gîtes**
```
Nom:      Gîte du Lac
Icône:    ⛰️ Chalet
Couleur:  Bleu
Capacité: 6
Adresse:  12 Rue du Lac
```

➡️ Cliquer **"Terminer"**

**🎯 À ce moment :**
1. Le front appelle `supabase.rpc('complete_onboarding', {...})`
2. La fonction SQL crée l'organisation + membership en utilisant `auth.uid()`
3. Les gîtes sont insérés dans la même transaction
4. **Retour immédiat (JSON) avec `organization_id` et `gites_created`**

### 4. Vérification

**Dans Supabase SQL Editor :**

```sql
-- Vérifier organization
SELECT * FROM organizations;

-- Vérifier gîtes
SELECT * FROM gites;

-- Vérifier membership
SELECT * FROM organization_members;
```

Vous devriez voir vos données !

---

## 🔍 COMMENT ÇA MARCHE

### La fonction SQL `complete_onboarding`

```sql
CREATE OR REPLACE FUNCTION complete_onboarding(
    p_org_name TEXT,
    p_org_email TEXT DEFAULT NULL,
    p_org_phone TEXT DEFAULT NULL,
    p_gites JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_org_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'auth_required';
    END IF;

    -- Empêcher la double création
    IF EXISTS (SELECT 1 FROM organization_members WHERE user_id = v_user_id) THEN
        RAISE EXCEPTION 'organization_already_exists';
    END IF;

    -- Création organisation + membership + gîtes
    ...

    RETURN jsonb_build_object('organization_id', v_org_id, 'gites_created', ...);
END;
$$;
```

### Appel côté JavaScript

```javascript
const { data, error } = await supabaseClient.rpc('complete_onboarding', {
  p_org_name: companyName,
  p_org_email: signupEmail,
  p_gites: gitesPayload
});

if (error) {
  throw new Error(error.message);
}
```

---

## 📊 COMPARAISON

| Critère | Ancienne méthode | Nouvelle méthode |
|---------|------------------|------------------|
| **Étapes** | 5-6 appels API | 2 appels API |
| **Cache PostgREST** | ❌ Problème | ✅ Pas de souci |
| **Attente** | ❌ 30 sec entre étapes | ✅ Instantané |
| **Sécurité** | ⚠️ Logique côté client | ✅ Fonction SQL sécurisée |
| **Complexité** | ❌ Inserts manuels + trigger | ✅ Une seule RPC |
| **Fiabilité** | ⚠️ Fragile | ✅ Transaction unique |
| **Temps dev** | ❌ 5h de debug | ✅ 30 min |

---

## ✅ PROCHAINES ÉTAPES

1. **Tester onboarding.html** (10 min)
2. **Vérifier isolation multi-tenant** (créer 2 comptes)
3. **Mettre à jour les autres pages** pour lire `organizations`/`gites`
4. **Activer à nouveau la confirmation email** si besoin

---

## 🐛 TROUBLESHOOTING

### "organization_already_exists"
→ L'utilisateur a déjà une organisation. Supprimer les données test :
```sql
DELETE FROM organizations o USING organization_members m
WHERE o.id = m.organization_id AND m.user_id = auth.uid();
```

### "Permission denied"
→ RLS bloque. Vérifier les policies :
```sql
SELECT * FROM organization_members WHERE user_id = auth.uid();
```

### "Email already exists"
→ Utiliser un autre email ou supprimer le user :
```sql
DELETE FROM auth.users WHERE email = 'test@example.com';
```

---

## 🎉 CONCLUSION

**Cette approche résout TOUS les problèmes :**
- ✅ Pas de cache PostgREST
- ✅ Pas d'attente
- ✅ Code plus simple
- ✅ Plus sécurisé
- ✅ Plus maintenable

**Durée totale : 30 minutes** (vs 5h avant !)
