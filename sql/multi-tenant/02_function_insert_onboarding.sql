-- ================================================================
-- FONCTION: Insertion complète onboarding (contourne cache API)
-- ================================================================
-- Crée organization + gites + member en une seule transaction
-- Contourne le cache PostgREST qui ne voit pas les nouvelles colonnes
-- ================================================================

CREATE OR REPLACE FUNCTION insert_onboarding_data(
    p_user_id UUID,
    p_org_name TEXT,
    p_org_slug TEXT,
    p_org_email TEXT,
    p_org_phone TEXT,
    p_gites JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_org_id UUID;
    v_gite JSONB;
    v_result JSONB;
BEGIN
    -- 1. Créer l'organization
    INSERT INTO organizations (name, slug, email, phone)
    VALUES (p_org_name, p_org_slug, p_org_email, p_org_phone)
    RETURNING id INTO v_org_id;
    
    -- 2. Créer les gîtes
    FOR v_gite IN SELECT * FROM jsonb_array_elements(p_gites)
    LOOP
        INSERT INTO gites (
            organization_id,
            name,
            slug,
            icon,
            color,
            capacity,
            address
        ) VALUES (
            v_org_id,
            v_gite->>'name',
            v_gite->>'slug',
            v_gite->>'icon',
            v_gite->>'color',
            (v_gite->>'capacity')::INT,
            v_gite->>'address'
        );
    END LOOP;
    
    -- 3. Créer le member (owner)
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org_id, p_user_id, 'owner');
    
    -- Retourner l'ID de l'organization créée
    v_result := jsonb_build_object(
        'success', true,
        'organization_id', v_org_id
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION insert_onboarding_data IS 'Crée organization + gites + member en contournant le cache PostgREST';
