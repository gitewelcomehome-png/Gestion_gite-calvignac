-- ================================================================
-- MIGRATION MULTILINGUE COMPLÈTE - FICHE CLIENT
-- Ajoute les colonnes _en pour traduction FR/EN
-- ================================================================
-- Date: 23 janvier 2026
-- Objectif: Support complet du bilinguisme FR/EN dans la fiche client
-- ================================================================

-- ========================================
-- 1. CHECKLIST_TEMPLATES
-- ========================================
ALTER TABLE checklist_templates 
ADD COLUMN IF NOT EXISTS texte_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT;

COMMENT ON COLUMN checklist_templates.texte_en IS 'Texte anglais de l''item de checklist';
COMMENT ON COLUMN checklist_templates.description_en IS 'Description anglaise de l''item de checklist';

-- ========================================
-- 2. FAQ
-- ========================================
ALTER TABLE faq 
ADD COLUMN IF NOT EXISTS question_en TEXT,
ADD COLUMN IF NOT EXISTS answer_en TEXT;

COMMENT ON COLUMN faq.question_en IS 'Question en anglais';
COMMENT ON COLUMN faq.answer_en IS 'Réponse en anglais';

-- Migration colonne reponse -> answer (compatibilité)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'faq' AND column_name = 'reponse') THEN
        -- Migrer les données
        UPDATE faq SET answer = reponse WHERE answer IS NULL AND reponse IS NOT NULL;
        -- Supprimer l'ancienne colonne
        ALTER TABLE faq DROP COLUMN IF EXISTS reponse;
        RAISE NOTICE '✅ Migration colonne reponse -> answer terminée';
    END IF;
END $$;

-- ========================================
-- 3. INFOS_GITES (Déjà fait)
-- ========================================
-- Les colonnes *_en existent déjà dans infos_gites
-- Exemple: adresse_en, wifi_ssid_en, heure_arrivee_en, etc.

-- ========================================
-- 4. ACTIVITES_GITES (Future implémentation)
-- ========================================
-- Note: La table activites_gites n'a pas encore de support multilingue
-- À implémenter si besoin dans le futur:
-- ALTER TABLE activites_gites 
-- ADD COLUMN IF NOT EXISTS nom_en TEXT,
-- ADD COLUMN IF NOT EXISTS description_en TEXT,
-- ADD COLUMN IF NOT EXISTS categorie_en TEXT;

-- ========================================
-- VÉRIFICATION FINALE
-- ========================================

-- Vérifier checklist_templates
SELECT 
    'checklist_templates' as table_name,
    COUNT(*) FILTER (WHERE texte_en IS NOT NULL) as items_traduits_en,
    COUNT(*) as total_items
FROM checklist_templates;

-- Vérifier FAQ
SELECT 
    'faq' as table_name,
    COUNT(*) FILTER (WHERE question_en IS NOT NULL) as faqs_traduites_en,
    COUNT(*) as total_faqs
FROM faq;

-- Vérifier infos_gites (colonnes _en)
SELECT 
    column_name
FROM information_schema.columns
WHERE table_name = 'infos_gites' 
  AND column_name LIKE '%_en'
ORDER BY column_name;

-- ✅ TERMINÉ: Support multilingue activé
-- 📝 TODO: Remplir les colonnes *_en avec les traductions
