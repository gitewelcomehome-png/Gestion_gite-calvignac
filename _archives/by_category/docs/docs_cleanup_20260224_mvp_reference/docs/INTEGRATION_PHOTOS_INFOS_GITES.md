# 📸 Intégration Photos - Infos Gîtes

**Date:** 14 février 2026  
**Statut:** ✅ Implémentation complète - En attente de validation

---

## 🎯 Objectif

Permettre aux propriétaires de gîtes de gérer leurs photos directement depuis l'onglet **"Infos Gîtes"** dans l'interface propriétaire, afin que ces photos soient ensuite affichées sur la **fiche client voyageur**.

---

## ✅ Ce qui a été fait

### 1. Interface Utilisateur (HTML)

📁 **Fichier:** `/tabs/tab-infos-gites.html`

**Ajouté (~ligne 595)** : Section complète de gestion des photos comprenant :

- **Alert explicatif** : Informe le propriétaire que ces photos seront visibles sur la fiche voyageur
- **Photo de couverture** : Upload unique avec preview et suppression
- **Galerie photos** : Upload multiple avec grille de previews
- **Photos pratiques** : 
  - Boîte à clés (instructions d'arrivée)
  - Parking (localisation et accès)
  - Entrée (repérage du logement)
- **Conseils photographiques** : Tips pour prendre de bonnes photos

**Position** : Après la section "Règlement Intérieur", avant les champs anglais.

---

### 2. Module JavaScript

📁 **Fichier:** `/js/infos-gites-photos.js` (NOUVEAU - ~350 lignes)

**Fonctionnalités implémentées :**

#### Gestion des photos temporaires
```javascript
tempPhotosData = {
  couverture: null,
  galerie: [],
  boite_cles: [],
  parking: [],
  entree: []
}
```

#### Fonctions principales

| Fonction | Description |
|----------|-------------|
| `handlePhotoUploadInfosGites(event, category)` | Upload vers Supabase Storage avec validation (5MB max, formats image) |
| `displayPhotoPreviews(category)` | Affichage des previews avec boutons de suppression |
| `removePhotoInfosGites(category)` | Suppression photo couverture (Storage + mémoire) |
| `removePhotoFromGridInfosGites(category, index)` | Suppression photo des arrays (galerie, etc.) |
| `loadExistingPhotos(giteName)` | Chargement photos depuis `infos_gites.photos` JSONB |
| `savePhotosToDatabase(giteName)` | Sauvegarde dans `infos_gites.photos` JSONB |
| `resetTempPhotos()` | Nettoyage mémoire et masquage previews |

**Stockage Supabase :**
- **Bucket:** `gite-photos`
- **Path:** `{giteName}/{category}/{timestamp}_{filename}`
- **Formats acceptés:** JPG, JPEG, PNG, WebP
- **Taille max:** 5MB par image

---

### 3. Intégration avec le flux existant

📁 **Fichier:** `/js/infos-gites.js` (MODIFIÉ)

#### Chargement des photos lors de la sélection d'un gîte

```javascript
// Ligne ~1143 (dans selectGiteFromDropdown)
await chargerDonneesInfos();

// AJOUTÉ ⬇️
if (typeof window.loadExistingPhotos === 'function') {
    await window.loadExistingPhotos(giteName);
}
```

#### Sauvegarde des photos avec les autres données

```javascript
// Ligne ~1392 (dans sauvegarderDonneesInfos)
saveInfosGiteToSupabase(currentGiteInfos, formData);

// AJOUTÉ ⬇️
if (typeof window.savePhotosToDatabase === 'function') {
    await window.savePhotosToDatabase(currentGiteInfos);
}
```

---

### 4. Chargement du script

📁 **Fichier:** `/app.html` (MODIFIÉ)

```html
<!-- Ligne 148 -->
<script src="js/infos-gites-photos.js?v=1.0"></script>
```

**Ordre de chargement :**
1. `fiches-clients.js`
2. `gites-photos.js` (gestion photos dans modalEditGite - admin)
3. **`infos-gites-photos.js`** ← NOUVEAU (gestion photos tab propriétaire)
4. `checklists.js`

---

### 5. Base de données SQL

📁 **Fichier:** `/_archives/sql_cleanup_20260224_clean_rebuild/sql/add_photos_gites.sql` (HISTORIQUE ARCHIVÉ)

**Structure JSONB dans `infos_gites.photos` :**

```json
{
  "couverture": "https://storage.supabase.co/...",
  "galerie": [
    {"url": "https://...", "description": "..."},
    {"url": "https://...", "description": "..."}
  ],
  "boite_cles": [
    {"url": "https://...", "description": "..."}
  ],
  "parking": [
    {"url": "https://...", "description": "..."}
  ],
  "entree": [
    {"url": "https://...", "description": "..."}
  ],
  "autres": []
}
```

**Index GIN créé** pour optimiser les requêtes sur le JSONB.  
**Trigger de validation** pour garantir la structure.

---

## ⚠️ Actions requises

### 1. 🗄️ Vérifier/Exécuter le script SQL

```bash
# Vérifier si la colonne existe déjà
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'infos_gites' AND column_name = 'photos';
```

Si la colonne n'existe pas :
```sql
-- Exécuter le script complet
\i /_archives/sql_cleanup_20260224_clean_rebuild/sql/add_photos_gites.sql
```

---

### 2. 🪣 Créer le bucket Supabase Storage

**Dans l'interface Supabase :**

1. Aller dans **Storage** → **New Bucket**
2. Nom : `gite-photos`
3. **Public** : ✅ Coché (ou gérer avec RLS si préféré)
4. **File size limit** : 5MB
5. **Allowed MIME types** : `image/jpeg, image/jpg, image/png, image/webp`

**Politiques RLS suggérées :**

```sql
-- Lecture publique (pour affichage fiche client)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'gite-photos');

-- Upload uniquement authentifiés (propriétaires)
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gite-photos' AND auth.role() = 'authenticated');

-- Suppression uniquement authentifiés
CREATE POLICY "Authenticated delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'gite-photos' AND auth.role() = 'authenticated');
```

---

### 3. 🧪 Tests à effectuer

#### Test 1 : Sélection d'un gîte
1. Ouvrir l'onglet "Infos Gîtes"
2. Sélectionner un gîte dans le dropdown
3. ✅ Vérifier que les photos existantes se chargent (si elles existent)

#### Test 2 : Upload photo couverture
1. Cliquer sur "Choisir une photo de couverture"
2. Sélectionner une image < 5MB
3. ✅ Vérifier que la preview s'affiche
4. ✅ Vérifier que le bouton "Supprimer" fonctionne

#### Test 3 : Upload galerie
1. Cliquer sur "Ajouter des photos" (galerie)
2. Sélectionner 2-3 images
3. ✅ Vérifier que la grille s'affiche avec les previews
4. ✅ Vérifier que chaque bouton "×" supprime la bonne photo

#### Test 4 : Upload photos pratiques
1. Upload 1 photo dans "Boîte à clés"
2. Upload 1 photo dans "Parking"
3. Upload 1 photo dans "Entrée"
4. ✅ Vérifier les previews individuelles

#### Test 5 : Sauvegarde
1. Uploader plusieurs photos
2. Cliquer sur "💾 Sauvegarder" (bouton principal)
3. ✅ Vérifier en BDD que `infos_gites.photos` contient le JSONB
4. ✅ Changer de gîte puis revenir : les photos doivent se recharger

#### Test 6 : Validation
1. Essayer d'uploader un fichier > 5MB → ❌ Erreur attendue
2. Essayer d'uploader un PDF → ❌ Erreur attendue

---

### 4. 🎨 Affichage sur la fiche client (TODO ultérieur)

📁 **Fichier à modifier :** `/pages/fiche-client.html`

**Exemple d'intégration :**

```javascript
// Charger les photos depuis infos_gites
const { data: infos } = await supabaseClient
  .from('infos_gites')
  .select('photos')
  .eq('gite', giteName)
  .single();

if (infos?.photos) {
  // Photo de couverture en hero
  if (infos.photos.couverture) {
    document.getElementById('hero-image').src = infos.photos.couverture;
  }
  
  // Galerie complète
  if (infos.photos.galerie?.length > 0) {
    displayGallery(infos.photos.galerie);
  }
  
  // Photos pratiques dans les sections concernées
  if (infos.photos.boite_cles?.length > 0) {
    displayKeyBoxPhotos(infos.photos.boite_cles);
  }
  if (infos.photos.parking?.length > 0) {
    displayParkingPhotos(infos.photos.parking);
  }
  if (infos.photos.entree?.length > 0) {
    displayEntrancePhotos(infos.photos.entree);
  }
}
```

---

## 🚀 Statut d'implémentation

| Composant | Statut | Fichier |
|-----------|--------|---------|
| Interface HTML | ✅ Complète | `tabs/tab-infos-gites.html` |
| Module JS photos | ✅ Complet | `js/infos-gites-photos.js` |
| Intégration charge | ✅ Complète | `js/infos-gites.js` ligne ~1143 |
| Intégration save | ✅ Complète | `js/infos-gites.js` ligne ~1397 |
| Chargement script | ✅ Complet | `app.html` ligne 148 |
| Script SQL | ⚠️ À vérifier | `/_archives/sql_cleanup_20260224_clean_rebuild/sql/add_photos_gites.sql` |
| Bucket Storage | ⚠️ À créer | Supabase Dashboard |
| Affichage fiche client | ⏳ TODO | `/pages/fiche-client.html` |

---

## 📋 Checklist finale avant mise en production

- [ ] Script SQL exécuté (colonne `photos` créée)
- [ ] Bucket `gite-photos` créé avec bonnes policies
- [ ] Test upload + preview fonctionnel
- [ ] Test sauvegarde + rechargement OK
- [ ] Test suppression photos OK
- [ ] Validation 5MB fonctionne
- [ ] Validation formats images OK
- [ ] Affichage sur fiche client implémenté
- [ ] Tests avec plusieurs gîtes différents
- [ ] Vérification console sans erreurs

---

## 🔧 Dépannage

### ❌ "Cannot read properties of undefined (reading 'from')"
**Cause:** `supabaseClient` non initialisé  
**Solution:** Vérifier que `supabase.js` est chargé avant `infos-gites-photos.js`

### ❌ Upload échoue silencieusement
**Cause:** Bucket n'existe pas ou policies incorrectes  
**Solution:** Créer le bucket + vérifier policies RLS

### ❌ Photos ne se rechargent pas au changement de gîte
**Cause:** `loadExistingPhotos()` non appelée  
**Solution:** Vérifier l'intégration dans `selectGiteFromDropdown()` ligne ~1143

### ❌ Photos ne se sauvent pas
**Cause:** `savePhotosToDatabase()` non appelée  
**Solution:** Vérifier l'intégration dans `sauvegarderDonneesInfos()` ligne ~1397

---

## 📝 Notes importantes

1. **Séparation des concerns** : 
   - `gites-photos.js` gère les photos dans **modalEditGite** (admin back-office)
   - `infos-gites-photos.js` gère les photos dans **tab Infos Gîtes** (propriétaire)

2. **JSONB vs Relations** : Le choix du JSONB dans `infos_gites.photos` évite de créer une table supplémentaire et simplifie les requêtes.

3. **Performances** : L'index GIN permet des requêtes rapides même avec beaucoup de photos.

4. **Architecture** :
   ```
   Admin Channel Manager (vous)
       ↓
   Propriétaires de gîtes (gèrent leurs infos + photos)
       ↓
   Voyageurs (voient la fiche client avec les photos)
   ```

---

## 📞 Contact

Pour toute question sur cette intégration, consulter ce fichier en priorité.  
Toutes les fonctions sont documentées inline dans le code.
