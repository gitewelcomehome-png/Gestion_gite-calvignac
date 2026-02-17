# 🚨 Guide Système de Surveillance des Erreurs Admin

## Vue d'ensemble

Le système de surveillance des erreurs permet à l'admin du Channel Manager d'intercepter et de suivre **toutes les erreurs critiques** en temps réel avec :

- ✅ **Notifications instantanées** des erreurs critiques
- ✅ **Dashboard de surveillance** avec statistiques
- ✅ **Historique des erreurs** avec filtrage
- ✅ **Alertes sonores** et notifications système
- ✅ **Détails complets** de chaque erreur (stack trace, utilisateur, URL)
- ✅ **Système d'alerte** pour les rafales d'erreurs

---

## 📊 Architecture

### 1. Composants

**Fichiers principaux :**
- `js/error-tracker.js` - Capture automatique des erreurs JS
- `js/admin-error-monitor.js` - Dashboard admin de surveillance
- `js/error-logger.js` - Logger centralisé (optionnel)

**Base de données :**
- Table `cm_error_logs` - Stockage des erreurs avec métadonnées

### 2. Flux de données

```
Erreur JS → error-tracker.js → Supabase (cm_error_logs)
                                      ↓
                          Realtime Updates (WebSocket)
                                      ↓
                          admin-error-monitor.js
                                      ↓
                          Dashboard + Notifications
```

---

## 🎯 Fonctionnalités

### 1. Surveillance en temps réel

Le dashboard affiche automatiquement :
- **Erreurs critiques** (🔴 Rouge)
- **Warnings** (⚠️ Jaune)
- **Statistiques** : Total, Aujourd'hui, Par type

### 2. Notifications

**Erreurs critiques :**
- 🔔 Notification système (si autorisée)
- 🔊 Son d'alerte
- 📢 Toast persistant avec actions

**Rafales d'erreurs :**
- ⚠️ Alerte si ≥5 erreurs en 5 minutes
- Message de warning dans l'interface

### 3. Actions disponibles

Pour chaque erreur :
- **Voir détails** - Stack trace, métadonnées, utilisateur
- **Marquer résolu** - Archive l'erreur
- **Filtrer** - Par type (critique/warning/tous)
- **Effacer résolues** - Nettoyage en masse

---

## 🚀 Installation / Activation

### Étape 1 : Vérifier la table BDD

Exécuter dans Supabase :

```sql
-- Vérifier que la table existe
SELECT * FROM cm_error_logs LIMIT 5;

-- Si la table n'existe pas, créer :
-- Voir fichier sql/CREATE_ERROR_TRACKING.sql
```

### Étape 2 : Activer sur les pages admin

Le module est **déjà activé** sur :
- ✅ `pages/admin-channel-manager.html`
- ⚠️ À ajouter sur d'autres pages admin si nécessaire

```html
<!-- Dans le <head> ou avant </body> -->
<script src="../js/error-tracker.js"></script>
<script src="../js/admin-error-monitor.js?v=2.0"></script>
```

### Étape 3 : Autoriser les notifications (optionnel)

Au premier chargement, le navigateur demandera :
> "Voulez-vous autoriser les notifications ?"

**Recommandé : Accepter** pour recevoir les alertes critiques même en arrière-plan.

---

## 📖 Utilisation

### Dashboard principal

Le dashboard s'affiche automatiquement en haut de la page admin :

```
┌─────────────────────────────────────────────────┐
│ 🚨 Surveillance Erreurs                  [▼]   │
├─────────────────────────────────────────────────┤
│  [🔴 5]    [⚠️ 12]    [📅 3]    [📊 45]       │
│ Critiques  Warnings  Aujourd'hui  Total        │
└─────────────────────────────────────────────────┘
```

**Cliquer sur [▼]** pour développer et voir :
- Liste des erreurs récentes (dernières 24h)
- Filtres par type
- Actions par erreur

### Voir les détails d'une erreur

1. Cliquer sur **"Détails"** sur une erreur
2. Modal affiche :
   - Type et message
   - Fichier source (ligne/colonne)
   - Stack trace complète
   - URL de la page
   - Utilisateur concerné
   - Métadonnées additionnelles
   - Date/heure précise

3. Actions possibles :
   - **Marquer comme résolu** ✓
   - **Fermer** sans action

### Marquer une erreur comme résolue

Deux méthodes :
1. **Depuis la liste** : Cliquer "Marquer résolu"
2. **Depuis les détails** : Bouton "✓ Marquer comme résolu"

→ L'erreur disparaît de la liste et est archivée avec `resolved = true`

### Effacer les erreurs résolues

Bouton **"🗑️ Effacer résolues"** :
- Supprime **définitivement** toutes les erreurs marquées comme résolues
- ⚠️ Action irréversible - Confirmation demandée

### Filtrer les erreurs

Menu déroulant :
- **Tous les types** (par défaut)
- **Critiques uniquement** (erreurs 🔴)
- **Warnings uniquement** (erreurs ⚠️)

---

## 🔔 Types d'alertes

### Alerte critique (🚨)

**Déclenchée quand :** Une erreur de type `critical` est détectée

**Actions automatiques :**
1. 🔔 Notification système (si autorisée)
2. 🔊 Son d'alerte (beep court)
3. 📢 Toast rouge persistant avec :
   - Message de l'erreur
   - Bouton "Voir détails"
   - Bouton "Ignorer"

**Exemple de toast :**
```
┌─────────────────────────────────────────┐
│ 🚨 ERREUR CRITIQUE               [×]   │
├─────────────────────────────────────────┤
│ Cannot read properties of null         │
│ (reading 'querySelector')              │
├─────────────────────────────────────────┤
│ [Voir détails]  [Ignorer]             │
└─────────────────────────────────────────┘
```

### Alerte rafale (⚠️)

**Déclenchée quand :** ≥5 erreurs détectées en 5 minutes

**But :** Détecter les bugs systémiques ou les problèmes de service

**Action :** Toast orange avec le nombre d'erreurs récentes

---

## ⚙️ Configuration avancée

### Modifier les seuils d'alerte

Dans `js/admin-error-monitor.js`, ligne ~18 :

```javascript
this.alertThresholds = {
    critical: 1,      // Alerte immédiate (actuel)
    errorBurst: 5,    // Nombre d'erreurs pour alerte rafale
    burstWindow: 300000 // Fenêtre de temps (5 min en ms)
};
```

**Exemples d'ajustement :**
- Plus sensible : `errorBurst: 3` (alerte dès 3 erreurs)
- Moins sensible : `errorBurst: 10` (alerte à partir de 10 erreurs)
- Fenêtre plus courte : `burstWindow: 120000` (2 minutes)

### Désactiver le son d'alerte

Commenter la ligne ~157 :

```javascript
// this.playAlertSound();
```

### Afficher plus d'erreurs dans la liste

Ligne ~339, modifier le slice :

```javascript
return this.errors.slice(0, 50).map(error => `  // Au lieu de 20
```

---

## 🔍 Cas d'usage typiques

### Cas 1 : Bug côté client

**Scénario :** Un utilisateur rencontre une erreur JS

**Ce qui se passe :**
1. `error-tracker.js` capture l'erreur automatiquement
2. L'erreur est envoyée à Supabase avec :
   - Email de l'utilisateur
   - Page exacte (URL)
   - Navigateur (User Agent)
   - Stack trace
3. L'admin reçoit **immédiatement** une notification
4. L'admin peut voir les détails et reproduire le bug

**Bénéfice :** Détection proactive, correction rapide

### Cas 2 : Erreur serveur Supabase

**Scénario :** Supabase répond avec une erreur 500

**Ce qui se passe :**
1. Le code qui appelle Supabase doit catcher l'erreur
2. Appeler manuellement le logger :

```javascript
try {
    const { data, error } = await supabase.from('cm_clients').select();
    if (error) throw error;
} catch (err) {
    window.errorTracker?.logError({
        type: 'critical',
        source: 'Supabase API',
        message: `Erreur BDD: ${err.message}`,
        stack: err.stack,
        metadata: {
            query: 'SELECT cm_clients'
        }
    });
}
```

### Cas 3 : Monitoring production

**Scénario :** Surveiller l'application en production

**Actions recommandées :**
1. **Matin** : Vérifier le dashboard, voir s'il y a des erreurs nocturnes
2. **Live** : Garder la page admin ouverte → notifications en temps réel
3. **Fin de journée** : Marquer les erreurs traitées comme résolues
4. **Hebdomadaire** : Effacer les erreurs résolues pour garder une base propre

---

## 🛠️ Développement / Debugging

### Tester le système

**1. Déclencher une erreur test :**

```javascript
// Dans la console du navigateur (page admin)
window.testErrorMonitor = function() {
    throw new Error('Test erreur critique - Système de monitoring');
};
testErrorMonitor();
```

**2. Vérifier dans Supabase :**

```sql
SELECT * FROM cm_error_logs 
WHERE message LIKE '%Test erreur%'
ORDER BY timestamp DESC 
LIMIT 1;
```

**3. Observer le dashboard :**
- Le compteur "Critiques" doit augmenter de +1
- Une notification doit apparaître
- L'erreur doit apparaître dans la liste (si développée)

### Logger manuellement

Pour logger une erreur personnalisée :

```javascript
if (window.errorTracker) {
    window.errorTracker.logError({
        type: 'critical',      // ou 'warning'
        source: 'mon-fichier.js',
        message: 'Description de l\'erreur',
        stack: new Error().stack,
        metadata: {
            custom_data: 'valeur',
            context: 'info supplémentaire'
        }
    });
}
```

### Debug du système lui-même

Vérifier l'état du monitor :

```javascript
// Dans la console
console.log('Monitor:', window.errorMonitor);
console.log('Erreurs chargées:', window.errorMonitor?.errors.length);
console.log('Stats:', window.errorMonitor?.stats);
```

---

## 📋 Checklist Production

Avant de mettre en production :

- [ ] Table `cm_error_logs` créée dans Supabase
- [ ] RLS (Row Level Security) configurée correctement
- [ ] Script `js/error-tracker.js` chargé sur toutes les pages sensibles
- [ ] Script `js/admin-error-monitor.js` chargé sur pages admin
- [ ] Notifications navigateur testées et fonctionnelles
- [ ] Realtime Supabase activé (WebSocket)
- [ ] Au moins 1 admin a autorisé les notifications
- [ ] Dashboard testé avec erreurs réelles

---

## 🚨 Alertes recommandées

### Alertes critiques

Surveiller particulièrement :
1. **Erreurs répétées** sur même page → Bug à corriger
2. **Erreurs multi-utilisateurs** → Problème systémique
3. **Rafales** (>5 erreurs/5min) → Service down ?
4. **Erreurs Supabase** → Quota dépassé ? Problème réseau ?

### Actions correctives

**Si erreur isolée :**
- Noter l'utilisateur concerné
- Reproduire le bug
- Corriger et déployer
- Marquer comme résolu

**Si erreur massive :**
- Vérifier le statut de Supabase
- Vérifier les quotas API
- Rollback si nécessaire
- Contacter les utilisateurs affectés

---

## 🔐 Sécurité

### Données sensibles

⚠️ **Attention :** Les stack traces peuvent contenir des données sensibles

**Bonnes pratiques :**
- Ne pas logger de mots de passe dans les métadonnées
- Ne pas logger de tokens d'authentification
- Nettoyer les données utilisateur sensibles avant envoi

### Permissions RLS

Vérifier que seuls les **admins** peuvent :
- Lire `cm_error_logs`
- Modifier `cm_error_logs` (marquer résolu)
- Supprimer `cm_error_logs` (effacer résolues)

### Configuration RLS recommandée

```sql
-- Lecture admin uniquement
CREATE POLICY "Admins can read error logs"
ON cm_error_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM cm_clients
        WHERE email = auth.jwt() ->> 'email'
        AND role = 'admin'
    )
);

-- Update/Delete admin uniquement
CREATE POLICY "Admins can update error logs"
ON cm_error_logs FOR UPDATE
TO authenticated
USING (/* même condition */);
```

---

## 📞 Support

**En cas de problème avec le système de monitoring :**

1. Vérifier la console navigateur (erreurs JS)
2. Vérifier Supabase (table accessible ?)
3. Vérifier les permissions RLS
4. Tester avec `window.errorMonitor.init()` manuel

**Contact :** Développeur principal du projet

---

## 📚 Ressources

### Fichiers liés
- `js/error-tracker.js` - Capteur d'erreurs
- `js/admin-error-monitor.js` - Dashboard admin
- `js/error-logger.js` - Logger centralisé
- `sql/CREATE_ERROR_TRACKING.sql` - Structure BDD

### Documentation externe
- [Supabase Realtime](https://supabase.com/docs/guides/realtime) - WebSocket
- [MDN Error Events](https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent) - API JS
- [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) - Notifications système

---

**Version:** 2.0  
**Dernière mise à jour:** 06 Février 2026  
**Statut:** ✅ Actif en production
