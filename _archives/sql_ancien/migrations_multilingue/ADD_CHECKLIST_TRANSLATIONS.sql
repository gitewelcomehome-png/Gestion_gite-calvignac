-- ================================================================
-- AJOUT DES COLONNES DE TRADUCTION POUR LES CHECKLISTS
-- Date: 2026-01-23
-- ================================================================

-- Ajouter les colonnes de traduction anglaise pour checklist_templates
ALTER TABLE checklist_templates 
ADD COLUMN IF NOT EXISTS texte_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_checklist_translations ON checklist_templates(texte_en, description_en);

-- Commentaires
COMMENT ON COLUMN checklist_templates.texte_en IS 'Texte traduit en anglais (auto-généré)';
COMMENT ON COLUMN checklist_templates.description_en IS 'Description traduite en anglais (auto-générée)';
