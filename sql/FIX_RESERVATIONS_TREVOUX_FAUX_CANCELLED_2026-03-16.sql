-- ============================================================
-- FIX : Réservations Trévoux faussement marquées cancelled
-- ============================================================
-- Cause : le sync iCal détecte une "annulation" quand une résa
--         disparaît du flux. Airbnb retire les réservations PASSÉES
--         de son flux après check-out → faux positif d'annulation.
--
-- Ces 2 séjours ont bien eu lieu (les clients ont séjourné) :
--   1. Jan 16-18  780€  (Airbnb)
--   2. Jan 30-Feb 1  819€  (Airbnb)
--
-- Le sync NE re-annulera PAS ces réservations lors de la prochaine
-- sync car elles sont dans le passé (check_out < aujourd'hui) et la
-- requête BDD filtre sur .gte('check_out', today).
-- ============================================================

UPDATE public.reservations
SET
    status  = 'confirmed',
    notes   = NULL,
    updated_at = NOW()
WHERE id IN (
    '85fa0359-a443-4887-8757-51c803b3aad4',  -- Trévoux 2026-01-16 → 2026-01-18  780€
    '3377fd8c-2dc8-4db5-9908-3b41a3296ef0'   -- Trévoux 2026-01-30 → 2026-02-01  819€
);

-- Vérification
SELECT id, check_in, check_out, total_price, status, notes
FROM public.reservations
WHERE id IN (
    '85fa0359-a443-4887-8757-51c803b3aad4',
    '3377fd8c-2dc8-4db5-9908-3b41a3296ef0'
)
ORDER BY check_in;
