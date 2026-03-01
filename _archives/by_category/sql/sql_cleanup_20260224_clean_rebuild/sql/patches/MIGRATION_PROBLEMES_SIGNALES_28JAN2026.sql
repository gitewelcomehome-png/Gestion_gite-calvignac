-- ============================================================================
-- MIGRATION : problemes_signales - Structure Simple → Structure Évoluée
-- ============================================================================
-- Date: 28 janvier 2026
-- Raison: Le code JavaScript attend des colonnes qui n'existent pas dans le backup
-- 
-- Structure BACKUP (23/01/2026):
--   - description, categorie, priorite, resolu
--
-- Structure ATTENDUE par JS (fiche-client-app.js ligne 2605-2630):
--   - type, sujet, urgence, description, telephone, statut
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : Ajouter les colonnes manquantes
-- ============================================================================

ALTER TABLE problemes_signales 
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS sujet TEXT,
ADD COLUMN IF NOT EXISTS urgence TEXT DEFAULT 'moyenne',
ADD COLUMN IF NOT EXISTS telephone TEXT,
ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'nouveau',
ADD COLUMN IF NOT EXISTS traite_par TEXT,
ADD COLUMN IF NOT EXISTS traite_le TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS commentaire_admin TEXT,
ADD COLUMN IF NOT EXISTS reservation_id UUID;

-- ============================================================================
-- ÉTAPE 2 : Migrer les données existantes (7 lignes si restaurées)
-- ============================================================================

-- Mapper categorie → type
UPDATE problemes_signales
SET type = CASE
    WHEN categorie = 'equipement' THEN 'equipement'
    WHEN categorie = 'proprete' THEN 'proprete'
    WHEN categorie = 'chauffage' THEN 'chauffage'
    WHEN categorie = 'electricite' THEN 'electricite'
    ELSE 'autre'
END
WHERE type IS NULL;

-- Mapper priorite → urgence
UPDATE problemes_signales
SET urgence = CASE
    WHEN priorite = 'urgente' THEN 'haute'
    WHEN priorite = 'haute' THEN 'haute'
    WHEN priorite = 'normale' THEN 'moyenne'
    WHEN priorite = 'basse' THEN 'faible'
    ELSE 'moyenne'
END
WHERE urgence IS NULL;

-- Mapper resolu → statut
UPDATE problemes_signales
SET statut = CASE
    WHEN resolu = true THEN 'resolu'
    ELSE 'nouveau'
END
WHERE statut IS NULL;

-- Créer sujet depuis type si vide
UPDATE problemes_signales
SET sujet = COALESCE(type, 'Problème signalé')
WHERE sujet IS NULL;

-- ============================================================================
-- ÉTAPE 3 : Ajouter contraintes et index
-- ============================================================================

-- Contrainte sur FK reservation_id (optionnelle car peut être NULL)
-- PostgreSQL ne supporte pas IF NOT EXISTS pour ADD CONSTRAINT
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'problemes_signales_reservation_id_fkey'
    ) THEN
        ALTER TABLE problemes_signales
        ADD CONSTRAINT problemes_signales_reservation_id_fkey 
            FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Index pour recherche
CREATE INDEX IF NOT EXISTS idx_problemes_reservation ON problemes_signales(reservation_id);
CREATE INDEX IF NOT EXISTS idx_problemes_type ON problemes_signales(type);
CREATE INDEX IF NOT EXISTS idx_problemes_urgence ON problemes_signales(urgence);
CREATE INDEX IF NOT EXISTS idx_problemes_statut ON problemes_signales(statut);

-- ============================================================================
-- ÉTAPE 4 : Garder anciennes colonnes pour compatibilité
-- ============================================================================
-- Ne PAS supprimer categorie, priorite, resolu
-- Elles peuvent servir de fallback ou pour historique

COMMIT;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

SELECT 
    id,
    COALESCE(type, categorie) as type_ou_categorie,
    sujet,
    COALESCE(urgence, priorite) as urgence_ou_priorite,
    COALESCE(statut, CASE WHEN resolu THEN 'resolu' ELSE 'nouveau' END) as statut_ou_resolu,
    description
FROM problemes_signales
LIMIT 10;

-- ============================================================================
-- RÉSULTAT
-- ============================================================================
-- Table problemes_signales maintenant compatible avec le code JavaScript
-- Anciennes colonnes conservées pour historique
-- ============================================================================
