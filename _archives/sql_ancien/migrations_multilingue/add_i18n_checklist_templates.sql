-- ================================================================
-- AJOUT SUPPORT MULTILINGUE pour checklist_templates
-- Ajoute colonnes _en pour traduction anglaise
-- ================================================================

-- 1. Ajouter colonnes anglaises
ALTER TABLE checklist_templates 
ADD COLUMN IF NOT EXISTS texte_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT;

-- 2. Vérification
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_name = 'checklist_templates'
  AND column_name IN ('texte', 'texte_en', 'description', 'description_en')
ORDER BY column_name;

-- ✅ TERMINÉ: Les checklists peuvent maintenant être traduites
