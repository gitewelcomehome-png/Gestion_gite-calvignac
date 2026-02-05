-- =====================================================
-- VÉRIFIER LES CAMPAGNES DANS LA BASE DE DONNÉES
-- =====================================================

-- 1. Vérifier si la table existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'referral_campaigns'
) AS table_exists;

-- 2. Compter les campagnes totales
SELECT COUNT(*) AS total_campaigns 
FROM referral_campaigns;

-- 3. Compter les campagnes ACTIVES
SELECT COUNT(*) AS active_campaigns 
FROM referral_campaigns
WHERE is_active = true 
AND end_date >= NOW();

-- 4. Lister TOUTES les campagnes avec leur statut
SELECT 
    id,
    name,
    is_active,
    start_date::date,
    end_date::date,
    CASE 
        WHEN end_date < NOW() THEN '⏰ Expirée'
        WHEN is_active = false THEN '❌ Désactivée'
        ELSE '✅ Active'
    END AS status,
    CASE
        WHEN discount_pct_bonus IS NOT NULL THEN CONCAT('+', discount_pct_bonus, '% par filleul')
        WHEN discount_fixed_bonus IS NOT NULL THEN CONCAT('+', discount_fixed_bonus, '% Bonus')
        WHEN points_multiplier IS NOT NULL THEN CONCAT('x', points_multiplier, ' Points')
        WHEN points_fixed_bonus IS NOT NULL THEN CONCAT('+', points_fixed_bonus, ' Points')
    END AS bonus
FROM referral_campaigns
ORDER BY end_date DESC;

-- 5. Afficher les campagnes qui DEVRAIENT être visibles
SELECT 
    id,
    name,
    description,
    is_featured,
    start_date::date,
    end_date::date,
    EXTRACT(DAY FROM end_date - NOW()) AS jours_restants
FROM referral_campaigns
WHERE is_active = true 
AND end_date >= NOW()
ORDER BY end_date ASC;
