-- ================================================================
-- FIX: Fonction create_gite avec les bons paramètres
-- ================================================================
-- À exécuter dans Supabase SQL Editor
-- Date: 11 janvier 2026
-- ================================================================

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS create_gite(TEXT, TEXT, TEXT, TEXT, INT, TEXT);

-- Créer la nouvelle fonction avec les bons paramètres
CREATE OR REPLACE FUNCTION create_gite(
    p_name TEXT,
    p_slug TEXT,
    p_color TEXT DEFAULT '#667eea',
    p_emoji TEXT DEFAULT 'house-simple',
    p_capacity INT DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_ical_urls JSONB DEFAULT '[]'
)
RETURNS JSONB AS $$
DECLARE
    v_gite_id UUID;
BEGIN
    INSERT INTO gites (
        owner_user_id, 
        name, 
        slug, 
        icon, 
        color, 
        capacity, 
        address,
        ical_sources
    )
    VALUES (
        auth.uid(), 
        p_name, 
        p_slug, 
        p_emoji, 
        p_color, 
        p_capacity, 
        p_location,
        CASE 
            WHEN p_ical_urls IS NOT NULL AND jsonb_array_length(p_ical_urls) > 0 
            THEN jsonb_build_object('urls', p_ical_urls)
            ELSE '{}'::jsonb
        END
    )
    RETURNING id INTO v_gite_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'gite_id', v_gite_id,
        'message', 'Gîte créé avec succès'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_gite TO authenticated;

-- Forcer le rechargement du cache PostgREST
NOTIFY pgrst, 'reload schema';

-- Vérifier que la fonction existe
SELECT 
    routine_name,
    string_agg(parameter_name || ' ' || data_type, ', ' ORDER BY ordinal_position) as parameters
FROM information_schema.parameters
WHERE specific_schema = 'public'
AND routine_name = 'create_gite'
GROUP BY routine_name;
