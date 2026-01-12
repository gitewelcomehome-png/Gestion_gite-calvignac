-- ================================================================
-- CORRECTION FORMAT ical_sources - COUZON
-- ================================================================
-- Convertir le format tableau en format objet unifié
-- ================================================================

-- Vérifier le format actuel de Couzon
SELECT name, ical_sources 
FROM gites 
WHERE name = 'Couzon';

-- Correction manuelle : Remplacer le tableau par un objet
-- IMPORTANT : Adapter les URLs selon vos vraies URLs
UPDATE gites
SET ical_sources = jsonb_build_object(
    'airbnb', 'https://www.airbnb.fr/calendar/ical/13366259.ics?t=...',
    'abritel', 'http://www.abritel.fr/icalendar/d31158afb72048aabb...',
    'gites-de-france', 'https://reservation.itea.fr/iCal_753fbf35431f67e81...'
)
WHERE name = 'Couzon'
AND owner_user_id = '12296d3d-696b-4c5d-95b7-e0b3a1dd1814';

-- Vérifier le résultat
SELECT name, ical_sources 
FROM gites 
WHERE name = 'Couzon';

-- ================================================================
-- NOTE : Si vous ne connaissez pas les URLs exactes, utilisez
-- plutôt l'interface web (bouton "iCal" dans l'onglet Gîtes)
-- ================================================================
