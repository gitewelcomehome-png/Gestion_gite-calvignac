# 🎫 Système de Ticketing Automatique

## 📋 Vue d'ensemble

Système complet de gestion automatique des erreurs avec création de tickets, notifications clients, monitoring 24h et clôture automatique.

## 🔄 Workflow Complet

```
1. Erreur détectée (3+ occurrences en 1h)
   ↓
2. Ticket créé automatiquement
   ↓
3. Email envoyé au client
   ↓
4. Notification admin
   ↓
5. Correction appliquée par Copilot
   ↓
6. Tests générés et exécutés
   ↓
7. Monitoring 24h activé
   ↓
8. Si pas de réapparition → Clôture auto + Email
```

## 📁 Fichiers du Système

### JavaScript
- **`js/auto-ticket-system.js`** : Système principal de ticketing
- **`js/auto-validator.js`** : Validation en 2 phases (immédiat + 24h)
- **`js/test-generator.js`** : Génération automatique de tests
- **`js/admin-monitoring.js`** : Interface admin de monitoring

### Pages
- **`pages/admin-monitoring.html`** : Dashboard de monitoring
- **`pages/admin-error-details.html`** : Vue détaillée erreur + corrections
- **`pages/admin-support.html`** : Gestion des tickets (existant)
- **`pages/client-support.html`** : Interface client support (existant)

### SQL
- **`sql/create_auto_ticket_tables.sql`** : Tables nécessaires
  - `cm_support_ticket_history` : Historique des tickets
  - `cm_error_corrections` : Historique des corrections
  - Colonnes ajoutées à `cm_support_tickets`

### API
- **`api/send-email.js`** : Envoi d'emails automatiques

## 🗄️ Tables de Base de Données

### cm_support_tickets (modifiée)
```sql
id, client_id, client_email, subject, message, priority, status, category
+ error_signature TEXT         -- Signature unique erreur
+ error_id INTEGER              -- FK vers cm_error_logs
+ source TEXT                   -- 'manual', 'auto_detection'
+ resolution TEXT               -- Méthode de résolution
+ closed_at TIMESTAMPTZ         -- Date de clôture
+ metadata JSONB                -- Infos monitoring, auto_closed, etc.
```

### cm_support_ticket_history (nouvelle)
```sql
id SERIAL PRIMARY KEY
ticket_id INTEGER               -- FK vers cm_support_tickets
action TEXT                     -- 'created', 'email_sent', 'status_changed', 'auto_closed'
description TEXT
created_by TEXT                 -- 'system', 'admin', 'copilot'
created_at TIMESTAMPTZ
```

### cm_error_corrections (nouvelle)
```sql
id SERIAL PRIMARY KEY
error_id INTEGER                -- FK vers cm_error_logs
file_path TEXT                  -- Fichier modifié
old_code TEXT                   -- Code avant
new_code TEXT                   -- Code après
description TEXT                -- Description correction
applied_by TEXT                 -- 'copilot', 'admin'
applied_at TIMESTAMPTZ
test_status TEXT                -- 'passed', 'failed', 'pending'
test_results JSONB              -- Résultats des tests
```

## 🚀 Installation

### 1. Créer les tables
```bash
# Exécuter dans Supabase SQL Editor
psql -f sql/create_auto_ticket_tables.sql
```

### 2. Configurer l'email
Créer un fichier `.env` à la racine :
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
SMTP_FROM="Support Gîtes <support@votre-site.com>"
```

**Pour Gmail :**
1. Activer l'authentification à 2 facteurs
2. Générer un "Mot de passe d'application"
3. Utiliser ce mot de passe dans SMTP_PASS

### 3. Déployer l'API
L'API `/api/send-email.js` est déjà configurée pour Vercel.

Si vous utilisez un autre hébergeur :
```bash
npm install nodemailer
```

## 💡 Utilisation

### Côté Admin

#### 1. Voir les erreurs
- Aller sur `pages/admin-monitoring.html`
- Les erreurs s'affichent en temps réel

#### 2. Créer un ticket manuellement
- Cliquer sur "Auto-Fix" pour les erreurs groupées
- OU le système crée automatiquement après 3 occurrences

#### 3. Voir les corrections
```javascript
// Depuis n'importe où
window.viewCorrections(errorId);
```

#### 4. Voir les détails complets
- Cliquer sur l'icône "info" ℹ️
- Ou accéder directement : `admin-error-details.html?error=123`

### Côté Copilot (après correction)

#### Enregistrer une correction
```javascript
await window.logCorrection(errorId, {
    filePath: '/workspaces/Gestion_gite-calvignac/js/mon-fichier.js',
    oldCode: 'const x = y.value;',
    newCode: 'const x = y?.value || "";',
    description: 'Ajout optional chaining pour éviter null'
});
```

#### Enregistrer un batch
```javascript
await window.logAllCorrections([
    {
        errorId: 42,
        filePath: 'js/file1.js',
        oldCode: '...',
        newCode: '...',
        description: 'Fix null check'
    },
    {
        errorId: 43,
        filePath: 'js/file2.js',
        oldCode: '...',
        newCode: '...',
        description: 'Fix async await'
    }
]);
```

## 🎯 Configuration

### Seuil de création de ticket
```javascript
// Dans js/auto-ticket-system.js
this.config = {
    autoCreateTicketThreshold: 3, // Nombre d'occurrences avant création
    monitoringDuration: 24 * 60 * 60 * 1000, // Durée monitoring (24h)
    emailTemplate: 'error-detected',
    ticketPriority: 'high'
};
```

### Personnaliser les emails
Modifier les templates dans `api/send-email.js` :
```javascript
const emailTemplates = {
    'error-notification': (data) => ({
        subject: data.subject,
        html: `... votre HTML ...`
    })
};
```

## 📊 Fonctionnalités

### Création Automatique
✅ Détection d'erreur après seuil d'occurrences  
✅ Création ticket dans `cm_support_tickets`  
✅ Email automatique au client  
✅ Notification admin  
✅ Lien vers interface support

### Monitoring 24h
✅ Surveillance continue de l'erreur  
✅ Vérification toutes les heures  
✅ Détection de réapparition  
✅ Persistance après rechargement page

### Clôture Automatique
✅ Après 24h sans réapparition  
✅ Mise à jour `status = 'closed'`  
✅ Marquage erreur `resolved = true`  
✅ Email confirmation au client  
✅ Historique complet

### Traçabilité
✅ Historique complet des tickets  
✅ Liste de toutes les corrections  
✅ Diff ancien/nouveau code  
✅ Statut des tests  
✅ Timeline des événements

## 🔍 Interface Admin

### Vue Monitoring
- Liste des erreurs en temps réel
- Bouton "Auto-Fix" pour corrections groupées
- Bouton ℹ️ pour voir détails + corrections
- Bouton 🔧 pour voir corrections en modal
- Bouton ✓ pour marquer résolu manuellement

### Vue Détails Erreur
- Informations complètes erreur
- Ticket support associé (si existe)
- Liste des corrections avec diff
- Statut des tests (passed/failed/pending)
- Timeline complète des événements
- Métadonnées (fichier, ligne, stack trace)

## 🔐 Sécurité

### Permissions
- Seuls les admins peuvent accéder aux pages `admin-*`
- Les clients accèdent uniquement à `client-support.html`
- Les corrections sont signées (`applied_by`)

### Validation
- Signature d'erreur unique (fichier|message|ligne)
- Vérification de doublon avant création ticket
- Tests automatiques avant validation

## 📧 Templates Email

### Email de détection
- Sujet : `[Ticket #X] Erreur détectée sur votre site`
- Contenu : Détails erreur, action en cours, monitoring 24h
- Bouton : Accès au ticket

### Email de clôture
- Sujet : `[Ticket #X] Incident résolu ✅`
- Contenu : Confirmation résolution, durée monitoring
- Message : Aucune réapparition détectée

## 🧪 Tests

### Tester la création auto de tickets
```javascript
// Simuler 3 erreurs similaires
for (let i = 0; i < 3; i++) {
    window.errorTracker.logError(
        new Error('Test error'),
        'test.js',
        123
    );
}

// Vérifier la création du ticket
// SELECT * FROM cm_support_tickets WHERE source = 'auto_detection';
```

### Tester l'envoi d'email
```bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "template": "error-notification",
    "data": {
      "ticketId": 123,
      "errorMessage": "Test error",
      "errorFile": "test.js",
      "timestamp": "2026-02-07 10:00:00",
      "monitoringDuration": "24 heures",
      "supportUrl": "http://localhost/pages/client-support.html?ticket=123"
    }
  }'
```

### Tester la clôture auto
```javascript
// Réduire la durée de monitoring pour test
autoTicketSystemInstance.config.monitoringDuration = 60000; // 1 minute

// Créer ticket puis attendre 1 minute
// Vérifier : status = 'closed'
```

## 📈 Métriques

### Rapports disponibles
```sql
-- Nombre de tickets auto-créés
SELECT COUNT(*) FROM cm_support_tickets WHERE source = 'auto_detection';

-- Taux de clôture automatique
SELECT 
    COUNT(CASE WHEN metadata->>'auto_closed' = 'true' THEN 1 END) * 100.0 / COUNT(*),
    COUNT(*)
FROM cm_support_tickets 
WHERE source = 'auto_detection';

-- Temps moyen de résolution
SELECT AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/3600) as avg_hours
FROM cm_support_tickets 
WHERE source = 'auto_detection' AND closed_at IS NOT NULL;

-- Top erreurs corrigées
SELECT 
    e.source,
    e.message,
    COUNT(c.id) as corrections_count
FROM cm_error_logs e
JOIN cm_error_corrections c ON c.error_id = e.id
GROUP BY e.source, e.message
ORDER BY corrections_count DESC
LIMIT 10;
```

## 🚨 Dépannage

### Les emails ne partent pas
1. Vérifier les variables `.env`
2. Tester avec `curl` (voir section Tests)
3. Vérifier les logs Vercel si déployé
4. Activer l'authentification 2FA Gmail

### Les tickets ne se créent pas
1. Vérifier le seuil : 3 erreurs en 1h
2. Vérifier que Supabase Realtime est activé
3. Vérifier la console : `activeTickets` doit se remplir

### La clôture auto ne fonctionne pas
1. Vérifier `resumePendingValidations()` est appelé
2. Vérifier l'interval de monitoring (1h)
3. Vérifier que l'erreur ne réapparaît pas réellement

## 🔄 Workflow Complet avec Copilot

### Étape 1 : Détection
```
Erreur → AutoTicketSystem → Ticket créé → Email client
```

### Étape 2 : Correction
```
Admin clique "Auto-Fix" → Rapport copié → Copilot applique fixes
```

### Étape 3 : Enregistrement
```javascript
// Copilot exécute après corrections
await window.logAllCorrections([...]);
```

### Étape 4 : Validation
```javascript
// Tests générés automatiquement
const validator = window.autoValidatorInstance;
await validator.validateImmediately(errorId, testConfig);
```

### Étape 5 : Monitoring
```
AutoValidator surveille 24h → Si OK → Clôture auto + email
```

## 📞 Support

Pour toute question sur le système :
- Consulter `admin-error-details.html?error=X` pour détails
- Vérifier les logs console
- Consulter la timeline dans l'interface

---

**Version :** 1.0  
**Dernière mise à jour :** 07/02/2026  
**Auteur :** Système de monitoring automatisé
