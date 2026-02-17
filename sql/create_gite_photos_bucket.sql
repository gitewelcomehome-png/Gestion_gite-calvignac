-- ==========================================
-- CRÉATION BUCKET SUPABASE STORAGE POUR LES PHOTOS
-- Date: 15 février 2026
-- ==========================================
-- Description: Crée le bucket 'gite-photos' avec ses policies RLS
-- pour permettre l'upload et l'affichage des photos de gîtes
-- ==========================================

-- Créer le bucket gite-photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gite-photos',
  'gite-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Lecture publique (pour affichage sur fiche client)
CREATE POLICY "Public read access for gite photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'gite-photos');

-- Policy: Upload uniquement pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload gite photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gite-photos' 
  AND auth.role() = 'authenticated'
);

-- Policy: Update uniquement pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can update gite photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'gite-photos' 
  AND auth.role() = 'authenticated'
);

-- Policy: Suppression uniquement pour utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete gite photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gite-photos' 
  AND auth.role() = 'authenticated'
);

-- Vérification
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'gite-photos';
