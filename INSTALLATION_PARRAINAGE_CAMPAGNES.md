# 🚀 INSTALLATION SYSTÈME PARRAINAGE CAMPAGNES

## ⚠️ IMPORTANT : Scripts SQL à exécuter dans Supabase

### 📋 Ordre d'exécution :

1. **Ouvrir Supabase SQL Editor**
   - Aller sur https://app.supabase.com
   - Sélectionner votre projet
   - Cliquer sur "SQL Editor"

2. **Exécuter les scripts dans l'ordre :**

### ✅ ÉTAPE 1 : Créer les tables de campagnes
```sql
-- Copier/coller le contenu complet du fichier :
sql/parrainage_campaigns.sql
```
📍 Ce fichier crée :
- Table `referral_campaigns`
- Table `user_campaign_participations`
- Fonctions SQL pour la gestion des campagnes
- RLS policies

### ✅ ÉTAPE 2 (Optionnel) : Charger les données de test
```sql
-- Copier/coller le contenu complet du fichier :
sql/parrainage_campaigns_test_data.sql
```
📍 Ce fichier crée 5 campagnes exemples :
- Double Bonus Février (active)
- Boost de démarrage (active)
- Super Points Mars (programmée)
- Bonus 500 Points (expirée)
- VIP Premium (complète)

---

## 🔍 Vérifier l'installation

Dans le SQL Editor de Supabase, exécuter :

```sql
-- Vérifier que la table existe
SELECT COUNT(*) FROM referral_campaigns;

-- Lister les campagnes
SELECT name, campaign_code, is_active FROM referral_campaigns;
```

---

## ✅ Une fois les scripts exécutés

1. **Recharger la page** admin-parrainage.html avec **Ctrl+Shift+R**
2. Les erreurs 404 doivent disparaître
3. Vous devriez voir les campagnes de test (si vous avez exécuté le fichier test_data)

---

## ❌ En cas d'erreur lors de l'exécution

### Erreur : "function already exists"
→ Les fonctions existent déjà, c'est OK, passez à l'étape suivante

### Erreur : "relation already exists"
→ Les tables existent déjà, c'est OK

### Erreur : "permission denied"
→ Vérifiez que vous êtes connecté avec un compte admin

---

## 📞 Aide

Si problème persistant :
1. Vérifier dans Supabase > Table Editor si `referral_campaigns` existe
2. Vérifier les logs d'erreur dans SQL Editor
3. Vérifier que les RLS policies sont actives
