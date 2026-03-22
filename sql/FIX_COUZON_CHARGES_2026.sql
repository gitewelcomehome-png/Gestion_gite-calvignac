-- ============================================================
-- FIX RAPIDE : Charges Couzon manquantes dans fiscal_history 2026
-- ============================================================
-- La simulation 2026 avait les charges Couzon à 0
-- Ce script les remet avec les mêmes valeurs que 2024/2025
-- ============================================================

UPDATE public.fiscal_history
SET donnees_detaillees = jsonb_set(
    donnees_detaillees,
    '{charges_gites,couzon}',
    '{"cfe": 0, "eau": 60, "linge": 350, "menage": 0, "internet": 60, "logiciel": 50,
      "commissions": 0, "copropriete": 0, "electricite": 300, "amortissement": 20000,
      "assurance_hab": 60, "taxe_fonciere": 1600, "interets_emprunt": 0, "assurance_emprunt": 0}'::jsonb
),
updated_at = NOW()
WHERE year = 2026
  AND gite = 'multi';

-- Vérification
SELECT
    year,
    donnees_detaillees->'charges_gites'->'couzon' AS charges_couzon
FROM public.fiscal_history
WHERE year = 2026 AND gite = 'multi';
