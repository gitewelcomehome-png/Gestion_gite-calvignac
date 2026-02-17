# 🎫 Filtrage des Erreurs par UUID Client

## 📊 Vue d'ensemble

Le système de monitoring capture maintenant l'**UUID du client** (`window.currentUser.id`) pour chaque erreur, permettant de :
- ✅ Filtrer les erreurs par client dans le dashboard admin
- ✅ Récupérer l'historique d'erreurs d'un client lors de la création d'un ticket support
- ✅ Générer des rapports d'erreurs par client
- ✅ Identifier automatiquement les clients avec erreurs critiques

---

## 🗄️ Structure Base de Données

### Table `cm_error_logs`

```sql
CREATE TABLE cm_error_logs (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    error_type TEXT NOT NULL,      -- 'critical', 'warning'
    source TEXT NOT NULL,
    message TEXT NOT NULL,
    stack_trace TEXT,
    user_id UUID,                   -- 🆕 UUID du client
    user_email TEXT,
    user_agent TEXT,
    url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    resolved BOOLEAN DEFAULT false
);

-- Index pour recherche rapide par user_id
CREATE INDEX idx_error_logs_user_id ON cm_error_logs(user_id);
```

### Installation

Exécutez le script SQL :
```bash
# Appliquer la migration
psql [CONNECTION_STRING] < sql/ADD_USER_ID_TO_ERROR_LOGS.sql
```

---

## 🎯 Utilisation dans le Dashboard Admin

### 1. Filtrage Visual

![Screenshot filtrage UUID](https://via.placeholder.com/800x200?text=Dashboard+avec+filtre+UUID)

Dans le dashboard de surveillance erreurs :

1. **Filtre par type** : Critiques, Warnings, Tous
2. **Filtre par client** : 
   - Entrer un UUID (complet ou partiel)
   - Entrer un email client
   - Le filtrage est instantané (keyup)

### 2. Affichage UUID

Chaque erreur affiche maintenant :
- 📁 Nom du fichier source
- 👤 Email du client
- 🆔 UUID du client (8 premiers caractères)
- 📋 Bouton "Copier UUID" pour copie rapide

### 3. Détails Erreur

Modal détails affiche :
- UUID complet avec bouton copie
- Toutes les infos de l'erreur
- Stack trace complet

---

## 🔧 API JavaScript

### Récupérer les erreurs d'un client

```javascript
// Récupérer les erreurs des 7 derniers jours
const errors = await window.errorMonitor.getClientErrors(clientUuid, 7);

console.log(`${errors.length} erreur(s) trouvée(s)`);
```

### Paramètres
- `clientUuid` (string) : UUID du client
- `limitDays` (number) : Nombre de jours à analyser (défaut: 7)

### Retour
```javascript
[
  {
    id: "uuid-erreur",
    timestamp: "2026-02-06T10:30:00Z",
    error_type: "critical",
    message: "Cannot read properties of null",
    source: "dashboard.js",
    user_id: "uuid-client",
    user_email: "client@example.com",
    stack_trace: "Error: ...",
    metadata: { ... }
  },
  // ...
]
```

---

## 🎫 Intégration Tickets Support

### Exemple 1 : Vérifier erreurs avant création ticket

```javascript
async function createSupportTicket(clientData) {
    const { uuid, email, subject, message } = clientData;
    
    // Récupérer les erreurs du client
    const errors = await window.errorMonitor.getClientErrors(uuid, 7);
    
    // Créer le ticket avec contexte
    const ticket = {
        client_uuid: uuid,
        client_email: email,
        subject: subject,
        message: message,
        has_errors: errors.length > 0,
        error_count: errors.length,
        critical_count: errors.filter(e => e.error_type === 'critical').length,
        priority: errors.length > 5 ? 'high' : 'normal'
    };
    
    // Sauvegarder le ticket
    await saveTicket(ticket);
    
    // Alerter si erreurs critiques
    if (ticket.critical_count > 0) {
        alert(`⚠️ ${ticket.critical_count} erreur(s) critique(s) détectée(s) pour ce client !`);
    }
}
```

### Exemple 2 : Afficher erreurs dans formulaire ticket

```javascript
async function showTicketForm(clientUuid) {
    const errors = await window.errorMonitor.getClientErrors(clientUuid, 7);
    
    if (errors.length > 0) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-warning';
        alertDiv.innerHTML = `
            <h4>⚠️ Erreurs détectées !</h4>
            <p>${errors.length} erreur(s) dans les 7 derniers jours</p>
            <ul>
                <li>🔴 Critiques : ${errors.filter(e => e.error_type === 'critical').length}</li>
                <li>⚠️ Warnings : ${errors.filter(e => e.error_type === 'warning').length}</li>
            </ul>
            <button onclick="showClientErrorsModal('${clientUuid}')">
                Voir les détails
            </button>
        `;
        
        document.getElementById('ticket-form').prepend(alertDiv);
    }
}
```

### Exemple 3 : Rapport formaté pour email

```javascript
async function sendClientErrorsReport(clientUuid, clientEmail) {
    const errors = await window.errorMonitor.getClientErrors(clientUuid, 7);
    const report = window.errorMonitor.formatErrorsReport(errors);
    
    // Envoyer par email
    await sendEmail({
        to: 'support@example.com',
        subject: `Rapport erreurs - ${clientEmail}`,
        body: report
    });
}
```

---

## 📋 Fonctions Utilitaires

### `formatErrorsReport(errors)`

Génère un rapport texte formaté des erreurs.

```javascript
const errors = await window.errorMonitor.getClientErrors(uuid, 7);
const report = window.errorMonitor.formatErrorsReport(errors);

console.log(report);
```

**Sortie :**
```
📊 RAPPORT D'ERREURS CLIENT
==================================================

Période: 01/02/2026 - 06/02/2026
Nombre d'erreurs: 12

🔴 Critiques: 3
⚠️ Warnings: 9

==================================================

1. [CRITICAL] 06/02/2026 10:30:55
   Message: Cannot read properties of null
   Source: dashboard.js

2. [WARNING] 06/02/2026 09:15:22
   Message:⚠️ Aucune simulation fiscale
   Source: fiscalite.js

...
```

---

## 🎨 Widget Erreurs Client

Afficher un widget dans l'interface support :

```javascript
// HTML
<div id="client-errors-widget"></div>

// JavaScript
await window.ClientErrorsIntegration.renderWidget(
    clientUuid, 
    'client-errors-widget'
);
```

**Résultat :**
```
┌─────────────────────────────┐
│ ⚠️ Erreurs client (7j)      │
├─────────────────────────────┤
│ Total: 12                   │
│ 🔴 Critiques: 3             │
│ ⚠️ Warnings: 9              │
│                             │
│ [Voir les détails]          │
└─────────────────────────────┘
```

---

## 🔍 Filtrage Avancé

### Requête SQL personnalisée

```sql
-- Clients avec plus de 5 erreurs critiques
SELECT 
    user_id,
    user_email,
    COUNT(*) as error_count,
    MAX(timestamp) as last_error
FROM cm_error_logs
WHERE 
    error_type = 'critical'
    AND timestamp >= NOW() - INTERVAL '7 days'
    AND user_id IS NOT NULL
GROUP BY user_id, user_email
HAVING COUNT(*) > 5
ORDER BY error_count DESC;
```

### Avec Supabase

```javascript
const { data, error } = await window.supabaseClient
    .from('cm_error_logs')
    .select('user_id, user_email, error_type')
    .eq('error_type', 'critical')
    .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .not('user_id', 'is', null);

// Grouper par user_id
const clientsWithErrors = data.reduce((acc, item) => {
    if (!acc[item.user_id]) {
        acc[item.user_id] = {
            user_id: item.user_id,
            user_email: item.user_email,
            count: 0
        };
    }
    acc[item.user_id].count++;
    return acc;
}, {});

console.log(Object.values(clientsWithErrors));
```

---

## 🚀 Cas d'Usage

### 1. Support Réactif
Quand un client crée un ticket, vérifier automatiquement s'il a des erreurs récentes et ajuster la priorité.

### 2. Analyse Proactive
Identifier les clients avec erreurs critiques pour les contacter avant qu'ils ne créent un ticket.

### 3. Debugging Contextualisé
Quand un client signale un problème, voir immédiatement toutes ses erreurs récentes.

### 4. Statistiques Client
Générer des rapports de santé par client pour identifier les utilisateurs ayant des difficultés.

---

## 📊 Exemples Complets

Consultez le fichier `js/client-errors-ticket-integration.js` pour 8 exemples d'intégration :

1. ✅ Récupérer erreurs d'un client
2. ✅ Afficher erreurs dans formulaire ticket
3. ✅ Générer rapport pour email
4. ✅ Modal d'affichage erreurs
5. ✅ Copier rapport dans presse-papier
6. ✅ Création ticket avec contexte erreurs
7. ✅ Filtrer tickets par clients avec erreurs
8. ✅ Widget erreurs client

---

## 🔒 Sécurité et Confidentialité

- ✅ Les UUIDs sont **indexés** pour recherche rapide
- ✅ Les erreurs sont liées aux **comptes utilisateurs authentifiés**
- ✅ Seuls les **admins** peuvent voir les erreurs des clients
- ✅ Les **données sensibles** ne sont jamais loggées dans les erreurs

---

## 📝 Notes Importantes

1. **UUID requis** : L'UUID n'est capturé que si `window.currentUser.id` existe
2. **Anonymat** : Les erreurs sans utilisateur connecté auront `user_id = null`
3. **Performance** : L'index sur `user_id` garantit des requêtes rapides
4. **Historique** : Par défaut, on analyse les 7 derniers jours (configurable)

---

## 🐛 Troubleshooting

### Problème : UUID toujours null

**Cause** : `window.currentUser` n'est pas défini ou n'a pas de propriété `id`

**Solution** :
```javascript
// Vérifier dans la console
console.log(window.currentUser);
// Devrait afficher: { id: "uuid", email: "...", ... }

// S'assurer que auth.js charge currentUser au login
```

### Problème : Filtre ne fonctionne pas

**Cause** : `error-tracker.js` non chargé en premier

**Solution** :
```html
<!-- DOIT être EN PREMIER -->
<script src="js/error-tracker.js"></script>
<!-- Puis les autres scripts -->
```

---

## 📚 Documentation Complémentaire

- [GUIDE_SURVEILLANCE_ERREURS.md](../docs/GUIDE_SURVEILLANCE_ERREURS.md) - Guide complet monitoring
- [README_ERROR_MONITORING.md](../README_ERROR_MONITORING.md) - Quick start
- [sql/CREATE_ERROR_TRACKING.sql](../sql/CREATE_ERROR_TRACKING.sql) - Structure BDD complète

---

**✅ Système opérationnel depuis le 06/02/2026**
