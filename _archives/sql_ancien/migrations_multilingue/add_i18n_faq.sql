-- ================================================================
-- AJOUT SUPPORT MULTILINGUE pour FAQ
-- Ajoute colonnes _en pour traduction anglaise
-- ================================================================

-- 1. Ajouter colonnes anglaises
ALTER TABLE faq 
ADD COLUMN IF NOT EXISTS question_en TEXT,
ADD COLUMN IF NOT EXISTS answer_en TEXT;

-- 2. Migration colonne reponse -> answer (au cas où l'ancienne existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'faq' AND column_name = 'reponse') THEN
        -- Migrer les données
        UPDATE faq SET answer = reponse WHERE answer IS NULL AND reponse IS NOT NULL;
        -- Supprimer l'ancienne colonne
        ALTER TABLE faq DROP COLUMN IF EXISTS reponse;
    END IF;
END $$;

-- 3. Vérification
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_name = 'faq'
  AND column_name IN ('question', 'question_en', 'answer', 'answer_en', 'reponse')
ORDER BY column_name;

-- ✅ TERMINÉ: Les FAQ peuvent maintenant être traduites
