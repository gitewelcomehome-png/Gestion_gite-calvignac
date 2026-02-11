# 🧪 GUIDE DE TEST - BONUS TEMPORAIRE 10% CAMPAGNE

## ✅ Ce qui a été corrigé

**AVANT** ❌ :
- Réduction hardcodée à 5% par filleul (ligne 211 de parrainage.js)
- Aucune prise en compte des campagnes actives
- Bonus ne s'appliquait JAMAIS même inscrit à une campagne

**MAINTENANT** ✅ :
- Calcul dynamique selon les campagnes actives
- Vérification automatique des dates (start_date / end_date)
- Affichage visuel du bonus temporaire
- Retour automatique à 5% après la fin de la campagne

---

## 📋 Étapes de test

### 1. Exécuter le script SQL (OBLIGATOIRE)
Dans Supabase SQL Editor, exécutez :
- `sql/parrainage_realtime_discount_calculation.sql`

Ce script crée 2 fonctions :
- `get_user_current_discount(user_id)` : Calcule la réduction en temps réel
- `get_user_subscription_price(user_id)` : Calcule le prix après réduction

### 2. Recharger l'onglet Parrainage CLIENT
1. Ouvrez **index.html** (interface client)
2. **CTRL + SHIFT + R** pour forcer le rechargement
3. Cliquez sur l'onglet **Parrainage**

### 3. Vérifier l'affichage du bonus

#### Scénario A : SANS filleul actif
Vous devriez voir :
```
Votre réduction BOOSTÉE
0%  (au lieu de réduction actuelle)

[ Encadré violet avec gradient ]
🎁 Campagne "Double Bonus Février 2026" active : 10% par filleul !

➡️ Plus que X filleuls pour l'abonnement GRATUIT !
```

#### Scénario B : AVEC 1 filleul actif
Simulation : Si vous aviez 1 filleul payant

**SANS campagne** : 5% (1 × 5%)
**AVEC campagne "Double Bonus"** : 10% (1 × 10%)

Affichage attendu :
```
Votre réduction BOOSTÉE
10%

Prix actuel : 27.00€ (au lieu de 28.50€)

[ Encadré violet ]
🎁 Campagne "Double Bonus Février 2026" active : 10% par filleul !
```

### 4. Tester la fin de campagne

Pour tester que ça revient bien à 5% après la campagne :

**Dans Supabase**, modifiez temporairement la date de fin :
```sql
-- Faire expirer la campagne immédiatement (test)
UPDATE referral_campaigns 
SET end_date = NOW() - INTERVAL '1 day'
WHERE name = 'Double Bonus Février 2026';
```

Rechargez l'onglet Parrainage → Vous devriez voir :
- "Votre réduction actuelle" (pas "BOOSTÉE")
- Pas d'encadré violet
- Calcul à 5% par filleul

**Puis remettre la bonne date :**
```sql
-- Restaurer la date normale
UPDATE referral_campaigns 
SET end_date = '2026-03-02'::timestamptz
WHERE name = 'Double Bonus Février 2026';
```

---

## 🎯 Résultats attendus

### Test 1 : Affichage frontend ✅
- ✅ Encadré violet visible quand campagne active
- ✅ "Votre réduction BOOSTÉE" affiché
- ✅ Calcul correct : 10% × nb_filleuls (pendant campagne)
- ✅ Calcul correct : 5% × nb_filleuls (hors campagne)

### Test 2 : Vérification SQL ✅
Exécutez dans Supabase (remplacez VOTRE_USER_ID) :

```sql
-- Voir votre réduction actuelle
SELECT * FROM get_user_current_discount('VOTRE_USER_ID');
```

Résultat attendu pendant la campagne :
| discount_pct | points_earned | active_referrals | campaign_name                | campaign_bonus            |
|--------------|---------------|------------------|------------------------------|---------------------------|
| 10.00        | 0             | 1                | Double Bonus Février 2026     | 10% par filleul (au lieu de 5%) |


### Test 3 : Calcul du prix ✅
```sql
-- Voir votre prix d'abonnement après réduction
SELECT * FROM get_user_subscription_price('VOTRE_USER_ID');
```

Résultat attendu (exemple avec 1 filleul) :
| base_price | discount_pct | final_price | total_saved | campaign_info                                               |
|------------|--------------|-------------|-------------|-------------------------------------------------------------|
| 29.00      | 10.00        | 26.10       | 2.90        | 🎁 Double Bonus Février 2026 : 10% par filleul (au lieu de 5%) |

---

## 🔍 Trouver votre User ID

Dans Supabase SQL Editor :
```sql
SELECT id, email 
FROM auth.users 
WHERE email = 'votre@email.com';
```

---

## 🚨 Points critiques vérifiés

1. ✅ **Bonus temporaire uniquement** : Vérifie `NOW() BETWEEN start_date AND end_date`
2. ✅ **Retour automatique à 5%** : Si aucune campagne active, taux de base appliqué
3. ✅ **Pas de hardcoding** : Le taux est calculé dynamiquement
4. ✅ **Affichage visuel** : Encadré coloré pour signaler le bonus actif
5. ✅ **Calcul SQL disponible** : Fonctions réutilisables pour facturation future

---

## 🎁 Bonus : Utilisation dans votre système de facturation

Quand vous générez les factures mensuelles, utilisez :

```sql
-- Récupérer les réductions de tous les utilisateurs pour facturation
SELECT 
    u.id,
    u.email,
    d.discount_pct,
    p.final_price,
    p.total_saved,
    p.campaign_info
FROM auth.users u
CROSS JOIN LATERAL get_user_subscription_price(u.id) p
CROSS JOIN LATERAL get_user_current_discount(u.id) d
WHERE d.discount_pct > 0
ORDER BY d.discount_pct DESC;
```

Cela vous donnera le prix exact à facturer avec le bon bonus temporaire appliqué.

---

## 📞 Support

Si après ces tests :
- ❌ L'encadré violet n'apparaît pas → Vérifier que vous êtes bien inscrit à la campagne
- ❌ Le calcul reste à 5% → Vérifier les dates de la campagne dans `referral_campaigns`
- ❌ Erreur SQL → Vérifier que le script `parrainage_realtime_discount_calculation.sql` a été exécuté

**Testez maintenant et confirmez-moi si vous voyez l'encadré violet avec "10% par filleul" !** 🎯
