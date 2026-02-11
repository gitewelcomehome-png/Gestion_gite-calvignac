-- ============================================================================
-- VÉRIFICATION TABLE DEMANDES_HORAIRES
-- ============================================================================

-- 1. Vérifier si la table existe
SELECT 
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'demandes_horaires'
    ) as table_existe;

-- 2. Compter les enregistrements
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE statut = 'en_attente') as en_attente,
    COUNT(*) FILTER (WHERE statut = 'validee') as validee,
    COUNT(*) FILTER (WHERE statut = 'refusee') as refusee
FROM demandes_horaires;

-- 3. Afficher toutes les demandes (avec joins)
SELECT 
    dh.*,
    r.client_name,
    g.name as gite_name,
    g.color as gite_color
FROM demandes_horaires dh
LEFT JOIN reservations r ON dh.reservation_id = r.id
LEFT JOIN gites g ON r.gite_id = g.id
ORDER BY dh.created_at DESC
LIMIT 20;

-- 4. Lister les statuts utilisés (pour détecter des variations)
SELECT DISTINCT statut
FROM demandes_horaires;
