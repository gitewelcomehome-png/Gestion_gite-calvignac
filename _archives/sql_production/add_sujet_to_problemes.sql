-- ============================================================================
-- AJOUT COLONNE SUJET à problemes_signales
-- ============================================================================

-- Ajouter la colonne sujet pour stocker le titre de la demande/problème
ALTER TABLE problemes_signales 
ADD COLUMN IF NOT EXISTS sujet TEXT;

-- Index pour recherche par sujet
CREATE INDEX IF NOT EXISTS idx_problemes_sujet ON problemes_signales(sujet);

-- Commentaire
COMMENT ON COLUMN problemes_signales.sujet IS 'Titre/sujet de la demande ou du problème';
