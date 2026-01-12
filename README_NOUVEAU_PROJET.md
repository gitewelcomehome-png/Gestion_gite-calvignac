# 🏡 Gestion Gîtes - Nouveau Projet

## ⚡ Démarrage Rapide

### 1. Créer Nouveau Projet Supabase

1. Va sur **supabase.com** → "New Project"
2. Note le mot de passe
3. Attends 2 minutes (provisioning)

---

### 2. Exécuter le SQL

1. **SQL Editor** → New Query
2. Copie tout `sql/nouveau_projet_supabase.sql`
3. Colle et Run
4. ✅ Attends messages verts

---

### 3. Vérifier

1. SQL Editor → Copie `sql/verifier_migration.sql`
2. Run
3. ✅ Doit afficher "MIGRATION RÉUSSIE"

---

### 4. Configurer l'App

1. Dans Supabase : **Settings** → **API**
2. Copie **Project URL** et **anon public key**
3. Ouvre `js/shared-config.js`
4. Lignes 9-10 : Remplace URL et KEY
5. Sauvegarde

---

### 5. C'est Prêt !

- Login sur `login.html`
- Crée tes gîtes sur `index.html`
- Tout fonctionne 🎉

---

## 📊 Ce Qui Est Créé

**6 Tables** :
- `gites` (avec colonnes tarifs_calendrier et regles_tarifaires)
- `reservations`
- `charges`
- `retours_menage`
- `stocks_draps`
- `infos_pratiques`

**RLS activé** : Chaque user voit uniquement SES données

---

## ⚠️ Si Problème

### "Column does not exist"
→ SQL Editor : `NOTIFY pgrst, 'reload schema';`

### "Invalid API key"
→ Vérifie que c'est la clé **anon** (pas service_role)

---

**Durée totale : 10 minutes**
