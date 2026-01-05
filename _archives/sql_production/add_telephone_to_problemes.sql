-- ============================================================================
-- AJOUT COLONNE TELEPHONE à problemes_signales
-- ============================================================================

-- Ajouter la colonne telephone (si pas déjà présente dans le schéma initial)
ALTER TABLE problemes_signales 
ADD COLUMN IF NOT EXISTS telephone TEXT;

-- Index pour recherche par téléphone
CREATE INDEX IF NOT EXISTS idx_problemes_telephone ON problemes_signales(telephone);

-- Commentaire
COMMENT ON COLUMN problemes_signales.telephone IS 'Numéro de téléphone du client pour contact WhatsApp';
