-- ================================================================
-- AJOUT DES COLONNES DE TRADUCTION POUR LA TABLE FAQ
-- Date: 2026-01-23
-- ================================================================

-- Ajouter les colonnes manquantes si elles n'existent pas
ALTER TABLE faq 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;

-- Ajouter les colonnes de traduction anglaise
ALTER TABLE faq 
ADD COLUMN IF NOT EXISTS question_en TEXT,
ADD COLUMN IF NOT EXISTS answer_en TEXT;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_faq_category ON faq(category);
CREATE INDEX IF NOT EXISTS idx_faq_priority ON faq(priority);
CREATE INDEX IF NOT EXISTS idx_faq_translations ON faq(question_en, answer_en);

-- Commentaires
COMMENT ON COLUMN faq.category IS 'Catégorie de la FAQ (arrivee, depart, equipements, etc.)';
COMMENT ON COLUMN faq.priority IS 'Ordre d''affichage (0 = priorité maximale)';
COMMENT ON COLUMN faq.question_en IS 'Question traduite en anglais (auto-générée)';
COMMENT ON COLUMN faq.answer_en IS 'Réponse traduite en anglais (auto-générée)';
