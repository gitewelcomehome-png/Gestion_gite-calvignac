# 🚀 GUIDE D'INTÉGRATION RAPIDE - SYSTÈME DE PARRAINAGE

## ✅ Ce qui a été créé

### Fichiers créés :
- ✅ `tabs/tab-parrainage.html` - Interface client complète
- ✅ `js/parrainage.js` - Logique métier
- ✅ `sql/parrainage_system.sql` - Tables et fonctions BDD
- ✅ `js/admin-clients.js` - Gestion admin (modifié)
- ✅ `DOCUMENTATION_SYSTEME_PARRAINAGE.md` - Doc complète

---

## 🎯 ÉTAPE 1 : Exécuter le script SQL

### Option A : Via interface Supabase

1. Ouvrir le **SQL Editor** dans Supabase
2. Copier le contenu de `sql/parrainage_system.sql`
3. Cliquer sur **Run**
4. Vérifier les messages de succès

### Option B : Via terminal

```bash
cd /workspaces/Gestion_gite-calvignac
psql -h <SUPABASE_HOST> -U postgres -d postgres -f sql/parrainage_system.sql
```

### ✅ Vérification

```sql
-- Vérifier que les tables existent
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('referrals', 'referral_invitations', 'referral_rewards', 'referral_point_conversions');

-- Devrait retourner 4 lignes
```

---

## 🎯 ÉTAPE 2 : Ajouter la librairie QRCode

Dans `index.html`, ajouter avant `</head>` :

```html
<!-- QR Code Generator -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
```

**📍 Position recommandée** : Après les autres scripts (Supabase, Lucide, etc.)

---

## 🎯 ÉTAPE 3 : Ajouter l'onglet dans la navigation

### A. Ajouter le bouton dans la navigation

Dans `index.html`, chercher la section `<nav class="icalou-modern-nav">` et ajouter :

```html
<button class="nav-tab" data-tab="parrainage" data-theme="purple">
    <i data-lucide="users" class="tab-icon"></i>
    <span class="tab-label">Parrainage</span>
</button>
```

**📍 Position recommandée** : Après l'onglet "Découvrir" ou avant "FAQ"

### B. Ajouter le conteneur

Dans `index.html`, chercher les `<div id="tab-xxx" class="tab-content">` et ajouter :

```html
<div id="tab-parrainage" class="tab-content"></div>
```

### C. Configuration du chargement dynamique

Dans le JavaScript de gestion des onglets (chercher `const tabContents` ou similar), ajouter :

```javascript
const tabContents = {
    // ... autres onglets existants
    'tab-parrainage': 'tabs/tab-parrainage.html'
};
```

---

## 🎯 ÉTAPE 4 : Charger le script JavaScript

Avant `</body>` dans `index.html`, ajouter :

```html
<script src="js/parrainage.js?v=1.0"></script>
```

**📍 Position recommandée** : Après les autres scripts métier

---

## 🎯 ÉTAPE 5 : Activer pour un client test

### Via l'interface admin

1. Aller sur `/pages/admin-clients.html`
2. Cliquer sur un client test
3. Onglet **"Parrainage"**
4. Configurer :
   - ✅ **Statut** : Activé
   - 🔄 **Type** : Standard (ou Gîtes de France selon le cas)

### Via SQL direct

```sql
-- Activer pour un client spécifique
INSERT INTO user_settings (user_id, referral_enabled, subscription_type)
VALUES ('<USER_ID>', true, 'standard')
ON CONFLICT (user_id) DO UPDATE
SET referral_enabled = true, subscription_type = 'standard';
```

---

## 🎯 ÉTAPE 6 : Tester le système

### Test côté client

1. Se connecter avec le compte test
2. Cliquer sur l'onglet **"Parrainage"**
3. Vérifier :
   - ✅ Génération du code de parrainage
   - ✅ Affichage du lien unique
   - ✅ QR Code généré
   - ✅ Boutons de partage fonctionnels
   - ✅ Statistiques affichées (0/20)

### Test côté admin

1. Ouvrir `/pages/admin-clients.html`
2. Sélectionner le client test
3. Onglet "Parrainage"
4. Vérifier :
   - ✅ Configuration visible
   - ✅ Statistiques affichées
   - ✅ Changement de type fonctionne

---

## 🎯 ÉTAPE 7 : Tester un parrainage complet

### 1. Copier le lien de parrainage

Exemple : `https://liveownerunit.com/login?ref=ABC12345`

### 2. Modifier la page d'inscription

Dans `pages/login.html` (ou équivalent), ajouter le traitement du paramètre `ref` :

```javascript
// Récupérer le code de parrainage depuis l'URL
const urlParams = new URLSearchParams(window.location.search);
const referralCode = urlParams.get('ref');

if (referralCode) {
    // Stocker en session pour utiliser après l'inscription
    sessionStorage.setItem('referral_code', referralCode);
}
```

### 3. Lors de la création du compte

```javascript
const referralCode = sessionStorage.getItem('referral_code');

if (referralCode) {
    // Enregistrer la référence
    const { data, error } = await supabase.rpc('process_referral_signup', {
        p_referral_code: referralCode,
        p_referred_email: newUserEmail,
        p_referred_user_id: newUserId
    });
    
    if (!error) {
        console.log('✅ Parrainage enregistré');
        sessionStorage.removeItem('referral_code');
    }
}
```

### 4. Lors du premier paiement

```javascript
// Activer le parrainage
await supabase.rpc('activate_referral', {
    p_referred_user_id: userId
});
```

---

## 📊 ÉTAPE 8 : Configuration du calcul mensuel

### Option A : Via Supabase Edge Function (recommandé)

Créer une Edge Function qui s'exécute le 1er de chaque mois :

```typescript
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Calculer les récompenses mensuelles
  const { error } = await supabase.rpc('calculate_monthly_referral_rewards')
  
  if (error) throw error
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### Option B : Via Cron Job externe

```bash
# Crontab : 1er du mois à 2h du matin
0 2 1 * * psql -h <HOST> -U postgres -d postgres -c "SELECT calculate_monthly_referral_rewards();"
```

---

## ✅ Checklist de déploiement

### Base de données
- [ ] Script SQL exécuté
- [ ] Tables vérifiées
- [ ] Fonctions testées
- [ ] RLS activé

### Frontend Client
- [ ] QRCode.js chargé
- [ ] Onglet ajouté à la navigation
- [ ] Conteneur créé
- [ ] JavaScript chargé
- [ ] Interface testée

### Frontend Admin
- [ ] Modifications admin-clients.js appliquées
- [ ] Onglet Parrainage accessible
- [ ] Configuration testée
- [ ] Stats affichées

### Processus métier
- [ ] Page d'inscription modifiée (paramètre ref)
- [ ] Enregistrement parrainage à l'inscription
- [ ] Activation parrainage au 1er paiement
- [ ] Calcul mensuel configuré

### Tests
- [ ] Client peut voir son onglet (si activé)
- [ ] Client peut partager son lien
- [ ] Admin peut activer/désactiver
- [ ] Admin peut changer le type
- [ ] Parrainage complet testé (inscription → paiement)

---

## 🐛 Résolution de problèmes

### Problème : "Parrainage non disponible"

**Cause** : Le parrainage n'est pas activé pour ce client

**Solution** :
```sql
UPDATE user_settings 
SET referral_enabled = true 
WHERE user_id = '<USER_ID>';
```

### Problème : QR Code ne s'affiche pas

**Cause** : Librairie QRCode.js non chargée

**Solution** : Vérifier que le `<script>` est bien présent dans `<head>`

### Problème : Erreur "supabase is not defined"

**Cause** : Ordre de chargement des scripts

**Solution** : S'assurer que `parrainage.js` est chargé **après** `shared-config.js`

### Problème : Onglet ne se charge pas

**Cause** : Chemin incorrect dans `tabContents`

**Solution** : Vérifier le mapping :
```javascript
'tab-parrainage': 'tabs/tab-parrainage.html' // Chemin relatif correct
```

---

## 📞 Support

En cas de problème :

1. ✅ Vérifier les logs console (F12)
2. ✅ Vérifier les erreurs réseau
3. ✅ Tester les requêtes SQL directement
4. ✅ Consulter `DOCUMENTATION_SYSTEME_PARRAINAGE.md`

---

## 🎉 Prochaines étapes recommandées

Après l'intégration de base :

1. **Personnaliser les messages de partage**
   - Adapter les textes WhatsApp/Email
   - Ajouter le branding

2. **Configurer les notifications**
   - Email de confirmation d'inscription d'un filleul
   - Alert quand un filleul devient actif
   - Rappel mensuel des stats

3. **Créer un Dashboard Admin Global**
   - Vue d'ensemble du programme
   - Top parrains
   - KPIs mensuels

4. **Implémenter la conversion de points**
   - Interface de validation admin
   - Processus de livraison des récompenses
   - Historique des conversions

5. **Gamification**
   - Badges (Bronze/Argent/Or/Platine)
   - Classement des parrains
   - Défis mensuels

---

**✨ Le système de parrainage est maintenant prêt à l'emploi !**

Bonne chance avec votre programme de parrainage ! 🚀
