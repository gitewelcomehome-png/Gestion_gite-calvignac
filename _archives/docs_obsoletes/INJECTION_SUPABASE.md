# ⚡ INJECTION SUPABASE - GUIDE RAPIDE

## 📋 Structure Confirmée

La table existe avec cette structure:
```sql
CREATE TABLE activites_gites (
  id bigserial PRIMARY KEY,
  gite text NOT NULL (Trévoux ou Couzon),
  nom text NOT NULL,
  categorie text NOT NULL,
  description text NULL,
  adresse text NOT NULL,
  distance numeric(5, 1) NULL,
  website text NULL,
  telephone text NULL,
  note numeric(2, 1) NULL (0-5),
  avis integer NULL,
  prix text NULL (€ € € € € € €),
  google_maps_link text NULL,
  latitude numeric(10, 8) NULL,
  longitude numeric(11, 8) NULL,
  created_at timestamp NULL,
  updated_at timestamp NULL
)
```

## 🚀 3 ÉTAPES POUR INJECTER

### 1️⃣ EXÉCUTER LE SCRIPT (Sur votre ordinateur)

```bash
cd ~/gites-process
node process_all.js
```

**Durée:** 15-25 minutes

**Cela génère:** `sql/insert_activites.sql`

---

### 2️⃣ ADAPTER LE SQL GÉNÉRÉ

Le script génère maintenant le SQL avec la bonne structure:
- ✅ Champs corrects (gite, nom, categorie, etc.)
- ✅ Valeurs NULL pour note/avis/prix (à remplir)
- ✅ Lien Google Maps automatique
- ✅ Distance en numeric(5,1)

**Optionnel:** Éditer pour ajouter des valeurs:
```sql
-- Avant
('Trévoux', 'Restaurant', ..., NULL, NULL, NULL, NULL, ...)

-- Après (optionnel)
('Trévoux', 'Restaurant', ..., 4.5, 128, '€€', 'https://maps...', ...)
```

---

### 3️⃣ COPIER-COLLER DANS SUPABASE

1. **Allez sur:** https://app.supabase.com/
2. **Sélectionnez:** Votre projet
3. **Allez dans:** SQL Editor
4. **Cliquez:** "New Query"
5. **Copiez:** Le contenu de `sql/insert_activites.sql`
6. **Collez:** Dans l'éditeur
7. **Cliquez:** "Run"

**Résultat attendu:**
```
SUCCESS: 501 rows inserted
```

---

## 📊 VÉRIFICATION POST-INJECTION

### Vérifier dans Supabase

```sql
-- Compter les POIs par gîte
SELECT gite, COUNT(*) as total
FROM activites_gites
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY gite;

-- Voir quelques POIs
SELECT gite, nom, categorie, distance, website
FROM activites_gites
LIMIT 5;

-- Statistiques complètes
SELECT 
  gite,
  COUNT(*) as total,
  COUNT(DISTINCT categorie) as categories,
  ROUND(AVG(distance)::numeric, 1) as distance_moyenne
FROM activites_gites
GROUP BY gite;
```

### Vérifier sur votre site

1. Allez sur votre site Vercel
2. Onglet "Activités"
3. Vous devriez voir:
   - ✅ Carte avec 500+ épingles
   - ✅ Filtres par catégorie
   - ✅ Détails au clic

---

## 💡 DONNÉES REMPLIES

Le script génère automatiquement:
- ✅ nom (depuis OpenStreetMap)
- ✅ categorie (Restaurant, Musée, Parc, etc.)
- ✅ adresse (adresse GPS)
- ✅ latitude/longitude (8 décimales)
- ✅ distance (en km depuis gîte)
- ✅ website (si disponible dans OSM)
- ✅ telephone (si disponible dans OSM)
- ✅ google_maps_link (auto-généré)

**Non remplies (optionnel):**
- note (vous pouvez ajouter manuellement)
- avis (nombre d'avis)
- prix (vous pouvez estimer par type)
- description (NULL)

---

## 🎯 C'EST TOUT!

**Synthèse des 3 étapes:**

```bash
# 1. Exécuter
node process_all.js  (15-25 min)

# 2. Copier
sql/insert_activites.sql

# 3. Injecter
Supabase → SQL Editor → Run
```

**Résultat:** 501 POIs dans votre BDD! 🎉

---

## ❓ FAQ

**Q: Les données vont être écrasées?**
R: Non, elles seront ajoutées. Utilisez `DELETE FROM activites_gites;` avant si vous voulez nettoyer.

**Q: Comment ajouter des notes/prix?**
R: Éditez le SQL ou remplissez manuellement dans Supabase après injection.

**Q: Je peux relancer le script?**
R: Oui! Les POIs déjà géocodés ne seront pas refaits.

**Q: Où voir les logs?**
R: `geocode_log.txt`, `poi_search_log.txt`

---

## 📌 IMPORTANT

L'injection doit respecter les contraintes:
- `gite` = 'Trévoux' ou 'Couzon' ✅ (auto)
- `note` = 0-5 ou NULL ✅
- `prix` = '€'|'€€'|'€€€'|'€€€€' ou NULL ✅

Toutes les contraintes sont respectées automatiquement par le script!

---

## 🚀 C'EST PRÊT!

Lancez: `node process_all.js` et injectez dans Supabase! 🎉
