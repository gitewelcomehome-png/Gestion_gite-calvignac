-- ================================================================
-- FIX URGENT : Désactiver RLS temporairement pour reservations
-- ================================================================
-- PROBLÈME : RLS bloque les insertions car owner_user_id manque
-- SOLUTION TEMPORAIRE : Désactiver RLS le temps de corriger le schéma

-- 1. DÉSACTIVER RLS sur reservations
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques
DROP POLICY IF EXISTS rgpd_all_own_reservations ON reservations;
DROP POLICY IF EXISTS rgpd_select_own_reservations ON reservations;
DROP POLICY IF EXISTS rgpd_insert_own_reservations ON reservations;
DROP POLICY IF EXISTS rgpd_update_own_reservations ON reservations;
DROP POLICY IF EXISTS rgpd_delete_own_reservations ON reservations;

-- ================================================================
-- VÉRIFICATION : Afficher l'état actuel
-- ================================================================
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'reservations';

-- ================================================================
-- ALTERNATIVE : Ajouter owner_user_id si besoin futur
-- ================================================================
-- Si vous voulez réactiver RLS plus tard :
-- 1. Ajouter la colonne : ALTER TABLE reservations ADD COLUMN owner_user_id UUID REFERENCES auth.users(id);
-- 2. Remplir avec user actuel : UPDATE reservations SET owner_user_id = (SELECT id FROM auth.users LIMIT 1);
-- 3. Réactiver RLS : ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
-- 4. Créer politique : CREATE POLICY rgpd_all_own_reservations ON reservations FOR ALL USING (owner_user_id = auth.uid());
