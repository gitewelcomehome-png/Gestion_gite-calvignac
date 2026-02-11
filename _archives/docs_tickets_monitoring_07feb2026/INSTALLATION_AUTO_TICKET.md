# 🚀 INSTALLATION : Système de Ticketing Automatique

## ✅ Ce qui a été créé

### Fichiers JavaScript
- ✅ `js/auto-ticket-system.js` - Système principal de ticketing
- ✅ `js/auto-validator.js` - Validation 2 phases (existant)
- ✅ `js/test-generator.js` - Génération tests (existant)
- ✅ Fonctions ajoutées dans `js/admin-monitoring.js`:
  - `viewErrorDetails()` - Voir détails erreur
  - `viewCorrections()` - Voir corrections en modal
  - `logCorrection()` - Enregistrer une correction
  - `logAllCorrections()` - Enregistrer un batch

### Pages HTML
- ✅ `pages/admin-error-details.html` - Page détails + corrections
- ✅ `pages/admin-monitoring.html` - Intégration auto-ticket-system.js

### SQL
- ✅ `sql/create_auto_ticket_tables.sql` - Tables nécessaires

### API
- ✅ `api/send-email.js` - Envoi emails automatiques

### Documentation
- ✅ `README_AUTO_TICKET_SYSTEM.md` - Documentation complète
- ✅ `.env.example` - Configuration email ajoutée

---

## 📋 ÉTAPES D'INSTALLATION

### 1️⃣ EXÉCUTER LES MIGRATIONS SQL (OBLIGATOIRE)

```bash
# Aller sur Supabase Dashboard > SQL Editor
# Copier/coller le contenu de :
cat sql/create_auto_ticket_tables.sql

# Exécuter le SQL
```

**Tables créées :**
- `cm_support_ticket_history` - Historique tickets
- `cm_error_corrections` - Historique corrections
- Colonnes ajoutées à `cm_support_tickets`

**Vérification :**
```sql
SELECT COUNT(*) FROM cm_support_ticket_history; -- Doit retourner 0
SELECT COUNT(*) FROM cm_error_corrections;      -- Doit retourner 0
```

---

### 2️⃣ CONFIGURER L'ENVOI D'EMAILS

#### Option A : Gmail (Recommandé pour tests)

1. **Activer l'authentification 2FA**
   - https://myaccount.google.com/security

2. **Créer un mot de passe d'application**
   - https://myaccount.google.com/apppasswords
   - Sélectionner "Mail" et votre appareil
   - Copier le mot de passe (16 caractères)

3. **Créer fichier `.env` à la racine**
   ```bash
   cp .env.example .env
   ```

4. **Remplir les variables**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=votre.email@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop
   SMTP_FROM="Support Gîtes <votre.email@gmail.com>"
   ```

#### Option B : Autre provider
Voir les exemples dans `.env.example`

---

### 3️⃣ INSTALLER LES DÉPENDANCES

```bash
# Si nodemailer n'est pas déjà installé
npm install nodemailer

# Vérifier
npm list nodemailer
```

---

### 4️⃣ TESTER L'ENVOI D'EMAIL

```bash
# Démarrer le serveur local si besoin
npm run dev

# Tester l'API
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "VOTRE_EMAIL@example.com",
    "template": "error-notification",
    "data": {
      "ticketId": 999,
      "errorMessage": "Test error pour vérification",
      "errorFile": "test.js",
      "errorLine": "42",
      "timestamp": "07/02/2026 15:30:00",
      "monitoringDuration": "24 heures",
      "supportUrl": "http://localhost:3000/pages/client-support.html?ticket=999"
    }
  }'
```

**Attendu :**
- Statut 200
- Email reçu dans votre boîte
- Format beau avec couleurs et bouton

---

### 5️⃣ DÉPLOYER SUR VERCEL (si applicable)

#### Ajouter les variables d'environnement

1. **Aller sur Vercel Dashboard**
   - Votre projet > Settings > Environment Variables

2. **Ajouter chaque variable**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=votre.email@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop
   SMTP_FROM="Support Gîtes <votre.email@gmail.com>"
   ```

3. **Redéployer**
   ```bash
   git push origin main
   # Ou via Vercel Dashboard > Deployments > Redeploy
   ```

4. **Tester en production**
   ```bash
   curl -X POST https://votre-domaine.vercel.app/api/send-email \
     -H "Content-Type: application/json" \
     -d '{...}'
   ```

---

## 🧪 TESTER LE SYSTÈME COMPLET

### Test 1 : Création automatique de ticket

1. **Simuler 3 erreurs similaires**
   ```javascript
   // Dans la console DevTools du site
   for (let i = 0; i < 3; i++) {
       window.errorTracker.logError(
           new Error('Test auto-ticket'),
           'test.js',
           123
       );
   }
   ```

2. **Vérifier dans Supabase**
   ```sql
   SELECT * FROM cm_support_tickets 
   WHERE source = 'auto_detection' 
   ORDER BY id DESC 
   LIMIT 1;
   ```

3. **Vérifier email reçu**
   - Sujet : `[Ticket #X] Erreur détectée sur votre site`
   - Contenu : Détails de l'erreur

### Test 2 : Workflow de correction

1. **Aller sur** `pages/admin-monitoring.html`

2. **Cliquer sur "Auto-Fix"**
   - Modal s'ouvre
   - Rapport copié dans presse-papier

3. **Coller le rapport dans Copilot Chat**

4. **Copilot applique les corrections**
   - ✅ Fichiers modifiés
   - ✅ Tests générés
   - ✅ Corrections enregistrées via `window.logAllCorrections()`

5. **Vérifier dans Supabase**
   ```sql
   SELECT * FROM cm_error_corrections 
   ORDER BY applied_at DESC;
   ```

### Test 3 : Voir les corrections

1. **Dans monitoring, cliquer sur 🔧 (icône wrench)**
   - Modal avec liste des corrections
   - Diff ancien/nouveau code
   - Statut des tests

2. **Cliquer sur ℹ️ (icône info)**
   - Page complète avec tous les détails
   - Timeline des événements
   - Ticket associé si existe

### Test 4 : Clôture automatique

1. **Réduire la durée de monitoring** (pour test uniquement)
   ```javascript
   // Dans console DevTools
   window.autoTicketSystemInstance.config.monitoringDuration = 60000; // 1 minute
   ```

2. **Créer un ticket de test**

3. **Attendre 1 minute**

4. **Vérifier la clôture**
   ```sql
   SELECT * FROM cm_support_tickets 
   WHERE status = 'closed' 
   AND resolution = 'auto_closed';
   ```

5. **Vérifier email de clôture reçu**

---

## ✅ CHECKLIST FINALE

- [ ] Tables SQL créées dans Supabase
- [ ] Fichier `.env` créé et configuré
- [ ] `nodemailer` installé
- [ ] Email de test reçu (test API)
- [ ] Variables Vercel configurées (si déployé)
- [ ] Test création ticket auto (3 erreurs)
- [ ] Test workflow correction complet
- [ ] Test affichage corrections en modal
- [ ] Test page détails erreur
- [ ] Test clôture automatique (1 min)

---

## 🎯 UTILISATION QUOTIDIENNE

### Workflow normal :

1. **Erreur détectée** → Ticket créé auto → Email client
2. **Admin voit dans monitoring** → Clic "Auto-Fix"
3. **Copilot corrige** → Tests générés → Validation
4. **24h de monitoring** → Si OK → Clôture auto + email

### Vérifications admin :

- 📊 **Monitoring** : `pages/admin-monitoring.html`
- 🎫 **Tickets** : `pages/admin-support.html`
- 🔍 **Détails** : Clic sur ℹ️ ou 🔧

### Traçabilité :

Toutes les corrections sont enregistrées avec :
- Fichier modifié
- Ancien code
- Nouveau code
- Description
- Qui l'a fait (Copilot)
- Quand
- Résultat des tests

---

## 🆘 DÉPANNAGE

### Les emails ne partent pas

❌ **Erreur : "Invalid login"**
→ Vérifier SMTP_USER et SMTP_PASS
→ Utiliser un mot de passe d'application Gmail

❌ **Erreur : "Connection timeout"**
→ Vérifier SMTP_HOST et SMTP_PORT
→ Vérifier firewall/proxy

❌ **Pas d'erreur mais email non reçu**
→ Vérifier dossier spam
→ Vérifier quotas d'envoi
→ Tester avec un autre destinataire

### Les tickets ne se créent pas

❌ **Pas de ticket après 3 erreurs**
→ Vérifier que Supabase Realtime est activé
→ Vérifier console : `window.autoTicketSystemInstance.activeTickets`
→ Vérifier les erreurs ont bien la même signature

❌ **Erreur "Table does not exist"**
→ Exécuter `sql/create_auto_ticket_tables.sql`
→ Vérifier dans Supabase Table Editor

### La clôture auto ne fonctionne pas

❌ **Ticket reste ouvert après 24h**
→ Vérifier que l'erreur n'est pas réapparue
→ Vérifier console : `activeTickets` Map
→ Vérifier `monitoring_start` dans BDD

---

## 📞 SUPPORT

- 📖 Documentation : `README_AUTO_TICKET_SYSTEM.md`
- 🗺️ Diagramme : Mermaid flowchart généré
- 💬 Pour aide : Consulter l'historique Copilot

---

**Système prêt à l'emploi !** 🚀

Prochaine étape : Exécuter les migrations SQL
