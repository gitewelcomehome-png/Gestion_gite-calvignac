# 🚀 DÉPLOIEMENT RAPIDE - Auto-Ticket System

## ✅ État actuel (diagnostic)
```
✅ Supabase OK
✅ Auto-Ticket System initialisé
⚠️ Tables cm_support_ticket_history et cm_error_corrections manquantes
⚠️ Code adapté pour structure existante (statut FR au lieu de status EN)
✅ 5 erreurs détectées dans BDD
⚠️ Aucune erreur n'a 3+ occurrences (seuil non atteint)
```

---

## 🎯 ACTIONS IMMÉDIATES

### 1️⃣ EXÉCUTER LE SQL (OBLIGATOIRE)

**Copier/coller ce fichier dans Supabase SQL Editor :**
```
sql/create_auto_ticket_tables_v2.sql
```

**Ou directement :**

1. Allez sur **Supabase Dashboard**
2. **SQL Editor** (icône ⌘ à gauche)
3. **New Query**
4. Copier/coller le contenu de `sql/create_auto_ticket_tables_v2.sql`
5. **Run** (ou Ctrl+Enter)

**Résultat attendu :**
```
✅ 2 tables créées
✅ 6 colonnes ajoutées à cm_support_tickets
```

---

### 2️⃣ RECHARGER LA PAGE

1. **Recharger** `pages/admin-monitoring.html`
2. **Ouvrir console** (F12)
3. **Vérifier** :
   ```javascript
   await diagAutoTicket.checkStatus()
   ```

**Vous devriez maintenant voir :**
```
✅ cm_support_ticket_history existe (plus de 404)
✅ cm_error_corrections existe (plus de 404)
```

---

### 3️⃣ TESTER LA CRÉATION MANUELLE

Puisque vos erreurs ont seulement 1 occurrence chacune (seuil = 3), testez manuellement :

#### A. Lister les erreurs :
```javascript
await diagAutoTicket.checkStatus()
// Noter un UUID d'erreur
```

#### B. Créer un ticket :
```javascript
await diagAutoTicket.forceCreateTicket('UUID-DE-L-ERREUR')
```

**Exemple avec votre erreur HTTP 400 :**
```javascript
// Trouver l'UUID dans le diagnostic
// Puis :
await diagAutoTicket.forceCreateTicket('12345678-abcd-efgh-ijkl-123456789abc')
```

**Résultat attendu :**
```
🎫 Création forcée d'un ticket pour erreur #...
📝 Erreur: HTTP 400 - ...
✅ Ticket créé : xyz-...
📧 Email envoyé à: ...
```

---

### 4️⃣ VÉRIFIER LE TICKET

#### Dans Supabase :
1. **Table Editor** > `cm_support_tickets`
2. Chercher : `source = 'auto_detection'`
3. Vous devriez voir :
   - `sujet` : [AUTO] Erreur détectée...
   - `statut` : ouvert
   - `error_signature` : fetch|HTTP 400|...

#### Dans l'interface :
1. Aller sur `pages/admin-support.html`
2. Le ticket devrait s'afficher
3. Cliquez dessus pour voir les détails

---

## 🎯 POUR ACTIVER LA CRÉATION AUTOMATIQUE

Actuellement, les tickets ne se créent **PAS automatiquement** car :
- ⚠️ Realtime non activé
- ⚠️ Aucune erreur n'a 3+ occurrences

### Option A : Activer Realtime (recommandé pour prod)

1. **Supabase Dashboard** > Settings > **API**
2. Section **Realtime** > **Enable**
3. **Tables with Realtime enabled** > Ajouter : `cm_error_logs`
4. **Save**

**Ensuite** : Chaque nouvelle erreur sera détectée et si 3+ occurrences → ticket auto-créé

### Option B : Réduire le seuil (pour test)

```javascript
// Dans la console
window.autoTicketSystemInstance.config.autoCreateTicketThreshold = 1;
console.log('✅ Seuil réduit à 1 occurrence');
```

Maintenant **toute nouvelle erreur** créera un ticket automatiquement.

---

## 📧 CONFIGURATION EMAIL (optionnel)

Pour recevoir les emails de notification :

### 1. Créer fichier `.env` à la racine :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre@email.com
SMTP_PASS=votre-mot-de-passe-app
SMTP_FROM="Support Gîtes <votre@email.com>"
```

### 2. Pour Gmail :
1. Activer authentification 2FA
2. https://myaccount.google.com/apppasswords
3. Créer mot de passe d'application
4. Copier dans SMTP_PASS

### 3. Tester :
```bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "votre@email.com",
    "template": "error-notification",
    "data": {
      "ticketId": 123,
      "errorMessage": "Test",
      "errorFile": "test.js",
      "timestamp": "2026-02-07 15:00:00",
      "monitoringDuration": "24 heures",
      "supportUrl": "http://localhost/pages/client-support.html?ticket=123"
    }
  }'
```

---

## 🧪 TEST COMPLET AUTOMATISÉ

```javascript
await diagAutoTicket.testSystem()
```

Cette commande :
1. ✅ Crée 3 erreurs similaires
2. ⏳ Attend détection (si Realtime actif)
3. 🎫 Vérifie ticket créé
4. 🧹 Nettoie automatiquement

---

## ✅ CHECKLIST FINALE

- [ ] SQL `create_auto_ticket_tables_v2.sql` exécuté
- [ ] Page rechargée
- [ ] Tables existent (plus de 404)
- [ ] Test manuel fonctionne (`forceCreateTicket`)
- [ ] Ticket visible dans Supabase
- [ ] Ticket visible dans admin-support.html
- [ ] (Optionnel) Realtime activé
- [ ] (Optionnel) Email configuré

---

## 🎉 VOUS ÊTES PRÊT !

**Pour tester avec votre erreur HTTP 400 :**

```javascript
// 1. Trouver l'UUID
await diagAutoTicket.checkStatus()

// 2. Créer le ticket
await diagAutoTicket.forceCreateTicket('UUID-ICI')

// 3. Vérifier
// → Supabase > cm_support_tickets
// → admin-support.html
```

**Le système est maintenant fonctionnel !** 🚀
