# 🚀 GUIDE D'INTÉGRATION - SYSTÈME D'ABONNEMENTS

**Date:** 12 février 2026  
**Status:** ✅ Fichiers créés, prêt à intégrer

---

## 📁 Fichiers Créés

### 1. Base de données
- **`sql/CREATE_SUBSCRIPTION_SYSTEM.sql`** - Tables Supabase complètes

### 2. JavaScript
- **`js/subscription-manager.js`** - Manager et contrôles d'accès

### 3. CSS
- **`css/subscription-styles.css`** - Styles features et modals

---

## 🎯 ÉTAPE 1 : EXÉCUTER LE SQL

### Dans Supabase Dashboard

1. Aller sur **[votre projet Supabase](https://supabase.com/dashboard)**
2. Cliquer sur **SQL Editor** dans le menu gauche
3. Cliquer sur **New query**
4. Copier tout le contenu de `sql/CREATE_SUBSCRIPTION_SYSTEM.sql`
5. Coller dans l'éditeur
6. Cliquer sur **Run** (ou Ctrl+Enter)

### Vérification

Vous devriez voir dans les résultats :
- ✅ 3 plans insérés (Solo, Duo, Quattro)
- ✅ Table `subscriptions_plans` avec 3 lignes
- ✅ Table `user_subscriptions` vide
- ✅ Table `subscription_usage` vide

Si erreurs : vérifier que les tables n'existent pas déjà.

---

## 🎯 ÉTAPE 2 : INTÉGRER DANS index.html

### A. Ajouter les imports dans `<head>`

```html
<!-- Système d'abonnements -->
<link rel="stylesheet" href="css/subscription-styles.css">
<script src="js/subscription-manager.js" defer></script>
```

### B. Ajouter le bandeau d'abonnement (après header)

```html
<!-- Bandeau abonnement -->
<div id="subscription-banner"></div>
```

### C. Marquer les features IA existantes

**Exemple 1 : Bouton AI autocomplete (DUO+)**
```html
<!-- AVANT -->
<button id="btn-ai-complete" class="btn-ai">
  🤖 Auto-compléter
</button>

<!-- APRÈS -->
<button id="btn-ai-complete" class="btn-ai" data-feature="ai_autocomplete">
  🤖 Auto-compléter
</button>
```

**Exemple 2 : Communication IA (QUATTRO)**
```html
<!-- AVANT -->
<button id="btn-ia-message" class="btn-ai">
  ✉️ Générer message IA
</button>

<!-- APRÈS -->
<button id="btn-ia-message" class="btn-ai" data-feature="ai_communication">
  ✉️ Générer message IA
</button>
```

### D. Marquer le tableau Gîtes de France (DUO+)

```html
<!-- AVANT -->
<div id="gdf-table-section">
  <!-- Contenu GDF -->
</div>

<!-- APRÈS -->
<div id="gdf-table-section" data-feature="gdf_table">
  <!-- Contenu GDF -->
</div>
```

### E. Marquer les boutons d'ajout de gîte

```html
<!-- AVANT -->
<button onclick="ajouterGite()">➕ Ajouter un gîte</button>

<!-- APRÈS -->
<button onclick="ajouterGite()" data-action="add-gite">
  ➕ Ajouter un gîte
</button>
```

### F. Ajouter compteur de gîtes (optionnel)

```html
<div class="gites-counter">
  <span data-display="gites-limit"></span>
</div>
```

---

## 🎯 ÉTAPE 3 : INTÉGRER DANS LES AUTRES PAGES

### Pages à modifier

Appliquer les mêmes data-attributes dans :
- **`pages/admin-channel-manager.html`** (si features IA présentes)
- **`app.html`** (si c'est l'app principale)
- Tous les tabs qui utilisent l'IA ou GDF

### Exemple tab-infos-gites.html

```html
<!-- En haut du <head> -->
<link rel="stylesheet" href="../css/subscription-styles.css">
<script src="../js/subscription-manager.js" defer></script>

<!-- Bandeau -->
<div id="subscription-banner"></div>

<!-- Boutons IA -->
<button data-feature="ai_autocomplete">🤖 Auto-compléter</button>
```

---

## 🎯 ÉTAPE 4 : CRÉER ABONNEMENTS DE TEST

### Dans Supabase SQL Editor

```sql
-- Créer un abonnement SOLO pour l'utilisateur actuel
INSERT INTO user_subscriptions (user_id, plan_id, status, billing_cycle)
SELECT 
  auth.uid(),
  (SELECT id FROM subscriptions_plans WHERE name = 'solo'),
  'active',
  'monthly';

-- Ou DUO
INSERT INTO user_subscriptions (user_id, plan_id, status, billing_cycle)
SELECT 
  auth.uid(),
  (SELECT id FROM subscriptions_plans WHERE name = 'duo'),
  'active',
  'monthly';

-- Ou QUATTRO
INSERT INTO user_subscriptions (user_id, plan_id, status, billing_cycle)
SELECT 
  auth.uid(),
  (SELECT id FROM subscriptions_plans WHERE name = 'quattro'),
  'active',
  'monthly';
```

**⚠️ Remplacer `auth.uid()` par votre UUID utilisateur si pas connecté.**

---

## 🎯 ÉTAPE 5 : TESTER

### Test 1 : Plan SOLO (pas d'IA)

1. Créer abonnement SOLO (voir SQL ci-dessus)
2. Recharger la page
3. **Vérifier :**
   - ✅ Badge "SOLO" visible dans bandeau
   - ✅ Boutons IA désactivés avec 🔒
   - ✅ Clic sur bouton IA → modal "Fonctionnalité Premium"
   - ✅ Tableau GDF caché avec placeholder

### Test 2 : Plan DUO (IA + GDF)

1. Modifier abonnement → DUO
2. Recharger
3. **Vérifier :**
   - ✅ Badge "DUO" visible
   - ✅ Boutons IA autocomplete actifs
   - ✅ Tableau GDF visible
   - ✅ Communication IA toujours verrouillée 🔒

### Test 3 : Plan QUATTRO (tout débloqué)

1. Modifier abonnement → QUATTRO
2. Recharger
3. **Vérifier :**
   - ✅ Badge "QUATTRO" visible
   - ✅ Tous les boutons IA actifs
   - ✅ Tableau GDF visible
   - ✅ Aucune feature verrouillée

### Test 4 : Limite de gîtes

1. En plan SOLO (max 1 gîte)
2. Si déjà 1 gîte existant
3. **Vérifier :**
   - ✅ Compteur affiche "1/1 gîtes utilisés" en rouge
   - ✅ Bouton "Ajouter gîte" désactivé
   - ✅ Clic → modal "Limite atteinte"

---

## 🔍 DÉBOGAGE

### Problème : Modal ne s'affiche pas

**Cause possible :** CSS non chargé ou conflit de z-index

**Solution :**
```css
/* Dans subscription-styles.css, forcer z-index */
.modal-overlay {
  z-index: 99999 !important;
}
```

### Problème : Features non contrôlées

**Cause :** JavaScript pas chargé ou erreur console

**Solution :**
1. Ouvrir Console (F12)
2. Chercher erreurs rouges
3. Vérifier que `subscriptionManager` existe :
   ```javascript
   console.log(subscriptionManager);
   ```
4. Vérifier que Supabase est initialisé avant subscription-manager

### Problème : Abonnement non détecté

**Cause :** User pas connecté ou pas d'abonnement en DB

**Solution :**
```javascript
// Dans console
const { data: user } = await supabase.auth.getUser();
console.log('User:', user);

const { data: sub } = await supabase
  .from('user_subscriptions')
  .select('*, plan:subscriptions_plans(*)')
  .eq('user_id', user.user.id)
  .eq('status', 'active')
  .single();
console.log('Subscription:', sub);
```

---

## 📊 ORDRE D'INTÉGRATION RECOMMANDÉ

```
✅ 1. Exécuter SQL Supabase (5 min)
✅ 2. Ajouter imports CSS/JS dans index.html (2 min)
   3. Ajouter bandeau abonnement (2 min)
   4. Marquer 2-3 features de test (5 min)
   5. Créer abonnement test (2 min)
   6. Tester et valider (10 min)
   7. Déployer sur toutes les pages (30 min)
   8. Tests finaux par plan (15 min)
```

**Total : ~1h15**

---

## 🎨 PERSONNALISATION

### Changer les couleurs des badges

Dans `css/subscription-styles.css` :

```css
.plan-solo { background: #48bb78; }    /* Vert */
.plan-duo { background: #ed8936; }     /* Orange */
.plan-quattro { background: #9f7aea; } /* Violet */
```

### Changer le texte des modals

Dans `js/subscription-manager.js` :

```javascript
const featureLabels = {
  'ai_autocomplete': 'Auto-complétion IA',
  'gdf_table': 'Tableau Gîtes de France',
  // ... personnaliser ici
};
```

---

## 🚀 PROCHAINES ÉTAPES (APRÈS VALIDATION)

1. **Phase Stripe :**
   - Créer compte Stripe
   - Configurer 3 produits (Solo/Duo/Quattro)
   - 2 prix par produit (engagé/sans engagement)
   - Créer API `/api/create-checkout`
   - Webhooks Stripe → Supabase

2. **Page de gestion abonnement :**
   - Créer `pages/mon-abonnement.html`
   - Afficher plan actuel, facturation
   - Boutons upgrade/downgrade
   - Historique des paiements

3. **App mobile iOS :**
   - Synchroniser même logique
   - Intégrer In-App Purchase (IAP) Apple
   - Synchroniser avec Supabase

4. **Chat support (optionnel) :**
   - Installer Crisp (15 min)
   - Personnaliser par plan (1h)

---

## ✅ CHECKLIST COMPLÈTE

- [ ] SQL exécuté dans Supabase
- [ ] 3 plans visibles dans table `subscriptions_plans`
- [ ] CSS inclus dans `<head>` de index.html
- [ ] JS inclus dans `<head>` de index.html
- [ ] Bandeau abonnement ajouté
- [ ] Features IA marquées avec `data-feature`
- [ ] Tableau GDF marqué avec `data-feature`
- [ ] Boutons ajout gîte marqués avec `data-action`
- [ ] Abonnement test créé
- [ ] Test plan SOLO → IA verrouillée ✅
- [ ] Test plan DUO → IA débloquée ✅
- [ ] Test plan QUATTRO → tout débloqué ✅
- [ ] Test limite gîtes → modal ✅
- [ ] Console sans erreurs ✅
- [ ] Intégré dans pages admin si nécessaire
- [ ] Documentation projet mise à jour

---

## 📝 NOTES IMPORTANTES

### ⚠️ AVANT PRODUCTION

1. **Supprimer abonnements de test** :
   ```sql
   DELETE FROM user_subscriptions WHERE stripe_subscription_id IS NULL;
   ```

2. **Activer Stripe webhooks** pour gestion auto des abonnements

3. **Tester tous les parcours** :
   - Création compte → pas d'abonnement → page pricing
   - Souscription → activation features
   - Upgrade → nouvelles features débloquées
   - Downgrade → features verrouillées
   - Annulation → accès maintenu jusqu'à fin période

### 🔐 SÉCURITÉ

- ✅ RLS activée sur toutes les tables
- ✅ Users voient uniquement leur abonnement
- ✅ Plans consultables par tous (lecture seule)
- ⚠️ Contrôles backend à ajouter pour API calls
- ⚠️ Valider côté serveur les actions sensibles (Stripe)

---

**Questions ? Voir `docs/IMPLEMENTATION_ABONNEMENTS.md` pour détails.**

**Support : Consulter `docs/PROPOSITION_ABONNEMENTS.md` pour stratégie business.**
