# 🚨 ACTIONS IMMÉDIATES - Sécurisation Supabase

## ⚡ À FAIRE MAINTENANT (5 minutes)

### 1. 🔒 Restreindre les Domaines Autorisés

**Aller dans Supabase Dashboard** : https://supabase.com/dashboard/project/ivqiisnudabxemcxxyru

#### Étape 1 : Configuration Site URL
1. Menu latéral : **Settings** ⚙️
2. Cliquer sur **API** 
3. Section **Configuration**
4. **Site URL** : Mettre votre URL de production
   ```
   https://votre-app.vercel.app
   ```

#### Étape 2 : Allowed Origins (CRITIQUE)
1. Même page, section **CORS**
2. **Additional Allowed Origins** : Ajouter ligne par ligne
   ```
   https://votre-app.vercel.app
   https://www.votre-app.vercel.app
   http://localhost:5500
   http://127.0.0.1:5500
   ```

**Effet** : ✅ Seuls VOS domaines peuvent utiliser la clé API

---

### 2. 🛡️ Activer Rate Limiting

**Dans Supabase Dashboard** :
1. Rester dans **Settings** > **API**
2. Descendre à **Rate Limiting**
3. **Enable Rate Limiting** : ✅ Activer
4. Configurer :
   ```
   Anonymous requests: 100 per hour
   Authenticated requests: 1000 per hour
   ```
5. **Save**

**Effet** : ✅ Protection DDoS automatique

---

### 3. 📧 Email Confirmation (Important)

**Dans Supabase Dashboard** :
1. Menu latéral : **Authentication** 🔐
2. Onglet **Providers**
3. **Email** : Cliquer dessus
4. **Enable email confirmations** : ✅ Activer
5. **Save**

**Effet** : ✅ Empêche inscriptions robots

---

### 4. 🔍 Vérifier les Logs d'Accès

**Dans Supabase Dashboard** :
1. Menu latéral : **Logs** 📊
2. Filtrer par **API Logs**
3. Vérifier les dernières 24h
4. Chercher des patterns suspects :
   - Beaucoup de 403 (accès refusés)
   - Requêtes depuis IPs étrangères
   - Tentatives répétées

**Si suspect** : Contacter support Supabase

---

## ✅ Checklist Post-Configuration

Après avoir fait les étapes ci-dessus :

- [ ] Domain restrictions configurées
- [ ] Rate limiting activé
- [ ] Email confirmation activée
- [ ] Logs vérifiés (rien de suspect)
- [ ] Application testée (tout fonctionne encore)

---

## 📞 En Cas de Problème

### Si l'application ne fonctionne plus :

1. **Vérifier les Allowed Origins** : 
   - Votre domaine est-il bien dans la liste ?
   - Format correct : `https://` (pas de `/` à la fin)

2. **Vérifier la Site URL** :
   - Doit correspondre à votre domaine principal

3. **Vérifier les logs Supabase** :
   - Erreur CORS → problème de domaine
   - Erreur 429 → rate limit trop strict

### Support

- [Documentation Supabase CORS](https://supabase.com/docs/guides/api/cors)
- [Discord Supabase](https://discord.supabase.com)
- [Support Ticket](https://supabase.com/dashboard/support)

---

## 🎯 Résultat Final

Après ces 4 configurations :

✅ Clé API utilisable UNIQUEMENT depuis vos domaines
✅ Protection rate limiting active
✅ Inscriptions sécurisées
✅ Logs monitorés

**Temps estimé** : 5-10 minutes  
**Difficulté** : Facile (juste cliquer dans l'interface)  
**Impact sécurité** : 🔥 Maximum

---

**Date** : 7 janvier 2026  
**Priorité** : 🚨 URGENT - À faire avant mise en production
