# 🧪 TEST IMMÉDIAT - Système Auto-Ticket

## 🎯 Vous êtes ici
✅ SQL exécuté (tables créées)  
✅ Code déployé  
⏳ **À TESTER maintenant**

---

## 📋 Étape 1 : Diagnostic

**Ouvrir la console DevTools** sur `pages/admin-monitoring.html` :

```javascript
await diagAutoTicket.checkStatus()
```

**Vous devriez voir :**
```
✅ Supabase disponible
✅ Instance active
✅ cm_support_tickets existe
✅ cm_support_ticket_history existe
✅ cm_error_corrections existe
📊 X erreur(s) non résolue(s)
```

---

## 🧪 Étape 2 : Test automatique complet

```javascript
await diagAutoTicket.testSystem()
```

**Ce test va :**
1. ✅ Créer 3 erreurs similaires
2. ⏳ Attendre détection par Realtime
3. 🎫 Vérifier si ticket créé
4. 🧹 Nettoyer automatiquement

**Résultat attendu :**
```
✅ SUCCÈS ! Ticket créé automatiquement
   ID: 12345678-...
   Status: open
   Email: ...
```

---

## ⚠️ Si le test échoue

### Problème : "⚠️ Pas de ticket créé automatiquement"

**Cause probable : Realtime non activé**

#### Solution :
1. Aller sur **Supabase Dashboard**
2. Settings > **API** > **Realtime**
3. Enable Realtime si désactivé
4. Dans "Tables with Realtime enabled", ajouter : **`cm_error_logs`**
5. Save
6. Relancer le test

---

## 🔧 Étape 3 : Test manuel (si Realtime désactivé)

Si vous ne voulez pas activer Realtime, vous pouvez créer des tickets manuellement :

### Récupérer l'ID d'une erreur existante :

```javascript
await diagAutoTicket.checkStatus()
// Noter l'ID d'une erreur (UUID)
```

### Forcer la création du ticket :

```javascript
await diagAutoTicket.forceCreateTicket('UUID-DE-L-ERREUR')
```

**Exemple :**
```javascript
await diagAutoTicket.forceCreateTicket('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
```

**Résultat attendu :**
```
🎫 Création forcée d'un ticket pour erreur #...
📝 Erreur: HTTP 400 - ...
✅ Ticket créé : 12345678-...
📧 Email envoyé à: support@...
```

---

## 📧 Étape 4 : Vérifier l'email

### Si email non envoyé :

1. **Vérifier fichier `.env`** à la racine :
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=votre@email.com
   SMTP_PASS=mot-de-passe-app
   ```

2. **Tester l'API email** :
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

3. **Vérifier spam** 📬

---

## 🎯 Étape 5 : Tester avec votre erreur réelle

### Avec l'erreur HTTP 400 existante :

1. **Trouver l'ID de l'erreur dans BDD**
   
   Dans Supabase > Table Editor > `cm_error_logs` :
   - Chercher : `message` contient "HTTP 400"
   - Copier l'`id` (UUID)

2. **Créer le ticket manuellement**
   ```javascript
   await diagAutoTicket.forceCreateTicket('ID-COPIÉ-ICI')
   ```

3. **Vérifier dans Supabase**
   - Table `cm_support_tickets` → Nouveau ticket
   - Colonne `source` → `auto_detection`
   - Colonne `status` → `open`

4. **Vérifier l'interface admin**
   - Aller sur `pages/admin-support.html`
   - Le ticket devrait s'afficher

---

## 📊 Commandes utiles

| Commande | Description |
|----------|-------------|
| `await diagAutoTicket.checkStatus()` | État complet du système |
| `await diagAutoTicket.testSystem()` | Test automatique |
| `await diagAutoTicket.forceCreateTicket(id)` | Créer ticket manuellement |
| `await diagAutoTicket.reinit()` | Réinitialiser le système |
| `diagAutoTicket.troubleshoot()` | Guide dépannage |

---

## ✅ Checklist de test

- [ ] SQL `create_auto_ticket_tables.sql` exécuté
- [ ] Console montre "✅ Auto-Ticket System prêt"
- [ ] `diagAutoTicket.checkStatus()` OK
- [ ] Test manuel fonctionne (`forceCreateTicket`)
- [ ] Ticket visible dans Supabase
- [ ] Ticket visible dans admin-support.html
- [ ] Email reçu (si SMTP configuré)

**Si tout est ✅ → Système opérationnel !**

---

## 🔄 Pour activer la détection automatique

**2 options :**

### Option A : Avec Realtime (recommandé)
✅ Détection en temps réel des nouvelles erreurs  
✅ Ticket créé automatiquement après 3 occurrences  
⚠️ Nécessite Supabase Realtime activé

### Option B : Sans Realtime (mode manuel)
✅ Pas de config Supabase nécessaire  
✅ Admin crée tickets manuellement  
❌ Pas de détection automatique

**Je recommande Option A pour test, Option B pour production.**

---

## 🆘 En cas de problème

### Console DevTools affiche des erreurs ?
```javascript
diagAutoTicket.troubleshoot()
```

### Système ne démarre pas ?
```javascript
await diagAutoTicket.reinit()
```

### Besoin d'aide ?
Consulter :
- [README_AUTO_TICKET_SYSTEM.md](README_AUTO_TICKET_SYSTEM.md)
- [INSTALLATION_AUTO_TICKET.md](INSTALLATION_AUTO_TICKET.md)
- [SYSTEME_ANTI_DOUBLONS.md](SYSTEME_ANTI_DOUBLONS.md)

---

**🎉 Le système est prêt à tester !**

Commencez par : `await diagAutoTicket.checkStatus()`
