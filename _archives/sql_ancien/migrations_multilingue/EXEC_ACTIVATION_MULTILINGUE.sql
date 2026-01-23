-- ================================================================
-- 🚀 ACTIVATION SYSTÈME TRADUCTION MULTILINGUE
-- Exécuter dans Supabase SQL Editor
-- ================================================================
-- Date: 23 janvier 2026
-- Durée: ~30 secondes
-- ================================================================

BEGIN;

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
-- Ajouter la colonne answer si elle n'existe pas
ALTER TABLE faq 
ADD COLUMN IF NOT EXISTS answer TEXT;

-- Ajouter les colonnes de traduction
ALTER TABLE faq 
ADD COLUMN IF NOT EXISTS question_en TEXT,
ADD COLUMN IF NOT EXISTS answer_en TEXT;

COMMENT ON COLUMN faq.answer IS 'Réponse en français';
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
-- 3. VÉRIFICATION
-- ========================================

-- Vérifier checklist_templates
SELECT 
    'checklist_templates' as table_name,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE texte_en IS NOT NULL) as items_traduits_en,
    ROUND(100.0 * COUNT(*) FILTER (WHERE texte_en IS NOT NULL) / COUNT(*), 1) as pourcentage_traduction
FROM checklist_templates;

-- Vérifier FAQ
SELECT 
    'faq' as table_name,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE question_en IS NOT NULL) as faqs_traduites_en,
    ROUND(100.0 * COUNT(*) FILTER (WHERE question_en IS NOT NULL) / COUNT(*), 1) as pourcentage_traduction
FROM faq;

-- Vérifier infos_gites (colonnes _en déjà existantes)
SELECT 
    COUNT(*) as nb_colonnes_en
FROM information_schema.columns
WHERE table_name = 'infos_gites' 
  AND column_name LIKE '%_en';

COMMIT;

-- ================================================================
-- ✅ TERMINÉ
-- ================================================================
-- Les colonnes multilingues sont maintenant activées.
-- 
-- PROCHAINES ÉTAPES:
-- 1. Tester l'interface: pages/fiche-client.html
-- 2. Remplir les traductions anglaises
-- 3. Consulter: docs/CHECKLIST_ACTIVATION_MULTILINGUE.md
-- ================================================================
