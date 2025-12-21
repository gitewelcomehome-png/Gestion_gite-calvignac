# ⚡ QUICK START - 3 ÉTAPES POUR METTRE EN LIGNE

## 1️⃣ TÉLÉCHARGER LE DOSSIER VERCEL (2 minutes)

```
VS Code → Clic droit sur "vercel-deploy" → Download Folder
```

**Contenu :**
- ✅ index.html (454 Ko)
- ✅ validation.html (29 Ko)  
- ✅ vercel.json

---

## 2️⃣ DÉPLOYER SUR VERCEL (2 minutes)

### Option A : Drag & Drop (RECOMMANDÉ)
1. Allez sur https://vercel.com/
2. Connectez-vous
3. Cliquez "Add New" → "Upload"
4. Glissez-déposez le dossier `vercel-deploy/`
5. **DONE!** ✨

### Option B : CLI (Si vous préférez)
```bash
cd vercel-deploy
vercel --prod
```

---

## 3️⃣ EXÉCUTER LE GÉOCODAGE (1 minute setup + 10s exécution)

### Sur votre ordinateur :

```bash
# 1. Téléchargez geocode_missing.js depuis VS Code

# 2. Ouvrez un terminal
mkdir ~/gites && cd ~/gites
# Mettez geocode_missing.js dans ce dossier

# 3. Exécutez
node geocode_missing.js

# Attendez ~10 secondes ✓
```

---

## ✅ VÉRIFICATION

### Site Vercel
- [ ] URL obtenue
- [ ] Titre : "🔧 GESTION GÎTES - VERSION CORRIGÉE"
- [ ] Onglets visibles
- [ ] Pas d'erreur console (F12)

### Supabase
- [ ] Colonnes latitude/longitude remplies ✓
- [ ] Activités géocodées

### Carte
- [ ] Épingles s'affichent sur la carte 🗺️
- [ ] Filtre localisation fonctionne

---

## 🎉 C'EST FAIT!

Votre site de gestion de gîtes est en ligne et opérationnel!

Pour plus de détails: [GUIDE_FINALISATION_COMPLET.md](GUIDE_FINALISATION_COMPLET.md)
