# ✅ Système de Photos des Gîtes - CRÉÉ

## 📦 Ce qui a été créé

### 1. Script SQL ✅
**Fichier:** `/sql/add_photos_gites.sql`

- ✅ Ajoute la colonne `photos` (JSONB) à la table `gites`
- ✅ Structure avec catégories: `couverture`, `galerie`, `boite_cles`, `parking`, `entree`, `autres`
- ✅ Index GIN pour performances
- ✅ Trigger de validation de structure
- ✅ Exemples d'utilisation en commentaires

**À exécuter** dans votre base de données Supabase :
```bash
# Connexion Supabase → SQL Editor → Copier/coller le contenu du fichier
```

---

### 2. Interface d'Upload ✅
**Fichier:** `/tabs/tab-fiches-clients.html`

- ✅ Section "Images Fiche Client" ajoutée dans le modal `modalEditGite`
- ✅ Upload pour:
  - Photo de couverture (unique)
  - Galerie intérieur (multiple)
  - Boîte à clés (multiple)
  - Parking (multiple)
  - Entrée principale (multiple)
- ✅ Prévisualisation des photos
- ✅ Boutons de suppression
- ✅ Design responsive et moderne

---

### 3. JavaScript de Gestion ✅
**Fichier:** `/js/gites-photos.js`

**Fonctionnalités implémentées:**
- ✅ Upload vers Supabase Storage (bucket `gite-photos`)
- ✅ Sauvegarde des URLs en base de données
- ✅ Chargement des photos existantes
- ✅ Prévisualisation en temps réel
- ✅ Suppression de photos (couverture + grille)
- ✅ Gestion de la structure JSONB
- ✅ Messages de notification

---

### 4. Intégration ✅
**Fichier:** `/app.html`

- ✅ Script `gites-photos.js` chargé après `fiches-clients.js`
- ✅ Hook sur `editGiteInfo()` pour charger les photos

---

## 🚀 Prochaines étapes

### Étape 1: Configuration Supabase Storage
```sql
-- Créer le bucket dans Supabase Dashboard
-- Storage > New Bucket
-- Nom: gite-photos
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp
```

Ou via SQL :
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('gite-photos', 'gite-photos', true);

-- Politique de sécurité: Propriétaires peuvent upload/lire/supprimer
CREATE POLICY "Owners can manage their gite photos"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'gite-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM gites WHERE owner_user_id = auth.uid()
  )
);
```

---

### Étape 2: Exécuter le script SQL
1. Ouvrir Supabase Dashboard
2. SQL Editor
3. Copier/coller le contenu de `/sql/add_photos_gites.sql`
4. Exécuter

---

### Étape 3: Tester l'interface
1. Se connecter au back-office
2. Aller dans "Fiches Clients"
3. Cliquer sur "Configuration gîtes" > "Configurer [Nom du gîte]"
4. Scroller jusqu'à "Images Fiche Client"
5. Upload des photos
6. Vérifier la prévisualisation
7. Vérifier que ça sauvegarde en BD

---

### Étape 4: Afficher les photos sur la fiche client (À FAIRE)
**Fichier à modifier:** `/pages/fiche-client.html` et `/js/fiche-client-app.js`

**À implémenter:**
- [ ] Section Hero avec photo de couverture en arrière-plan
- [ ] Carousel/galerie swipeable des photos intérieures
- [ ] Afficher photos de la boîte à clés dans la section "Code d'accès"
- [ ] Afficher photo du parking dans la section "Arrivée"
- [ ] Afficher photo de l'entrée dans les "Instructions d'accès"

**Code exemple:**
```javascript
// Dans fiche-client-app.js
async function loadGitePhotos(giteId) {
  const { data } = await supabase
    .from('gites')
    .select('photos')
    .eq('id', giteId)
    .single();
    
  if (data?.photos?.couverture) {
    // Afficher en hero
    document.querySelector('.hero-section').style.backgroundImage = 
      `url(${data.photos.couverture})`;
  }
  
  if (data?.photos?.boite_cles?.length > 0) {
    // Afficher dans section code d'accès
    const container = document.getElementById('boiteAClesPhotos');
    container.innerHTML = data.photos.boite_cles.map(photo => 
      `<img src="${photo.url || photo}" class="photo-boite-cles">`
    ).join('');
  }
}
```

---

## 🐛 Points d'attention

### 1. Taille des fichiers
- Limite actuelle: Non définie
- **Recommandé:** Max 5MB par image
- Ajouter compression côté client si besoin (library `browser-image-compression`)

### 2. Format des images
- Acceptés: JPG, PNG, WebP
- **Recommandé:** WebP pour performance (compression + qualité)

### 3. Nommage des fichiers
- Format: `{giteId}/{categorie}/{timestamp}_{index}.{ext}`
- Exemple: `abc-123/boite_cles/1707924000000_0.jpg`

### 4. Permissions Supabase
- Vérifier RLS activé sur `gites`
- Vérifier Storage policies pour lecture/écriture

---

## 📁 Structure JSONB finale

```json
{
  "couverture": "https://...storage.supabase.co/.../facade.jpg",
  "galerie": [
    "https://.../salon.jpg",
    "https://.../cuisine.jpg",
    "https://.../chambre.jpg"
  ],
  "boite_cles": [
    "https://.../boite-emplacement.jpg",
    "https://.../boite-code.jpg"
  ],
  "parking": [
    "https://.../parking-vue.jpg"
  ],
  "entree": [
    "https://.../porte-entree.jpg"
  ],
  "autres": []
}
```

**Alternative avec descriptions:**
```json
{
  "boite_cles": [
    {
      "url": "https://.../boite.jpg",
      "description": "À droite de la porte bleue"
    }
  ]
}
```

---

## 🎯 Améliorations futures

- [ ] Compression d'image automatique avant upload
- [ ] Drag & drop pour réorganiser l'ordre
- [ ] Crop/rotation d'images
- [ ] Galerie lightbox en modal
- [ ] Descriptions optionnelles par photo
- [ ] Détection automatique de doublons
- [ ] Optimisation WebP automatique
- [ ] CDN pour delivery global

---

## 📞 Support

En cas de problème:
1. Vérifier les logs console navigateur
2. Vérifier les erreurs Supabase dans Network tab
3. Vérifier les permissions Storage
4. Vérifier le script SQL a bien été exécuté

---

**Date de création:** 14 février 2026  
**Version:** 1.0
