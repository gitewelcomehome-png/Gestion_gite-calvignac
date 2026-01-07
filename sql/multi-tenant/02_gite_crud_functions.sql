-- ================================================================
-- GESTION CRUD GÎTES - AJOUTER/MODIFIER/SUPPRIMER DES GÎTES
-- ================================================================
-- Date: 7 janvier 2026
-- 
-- Fonctions pour gérer les gîtes dynamiquement
-- Utilisable depuis l'interface admin ou directement en SQL
-- ================================================================

-- ================================================================
-- FONCTION: Créer un nouveau gîte
-- ================================================================

CREATE OR REPLACE FUNCTION create_gite(
    p_organization_id UUID,
    p_name TEXT,
    p_slug TEXT,
    p_description TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_capacity INT DEFAULT 4,
    p_bedrooms INT DEFAULT 2,
    p_bathrooms INT DEFAULT 1,
    p_icon TEXT DEFAULT 'home',
    p_color TEXT DEFAULT '#667eea'
)
RETURNS UUID AS $$
DECLARE
    v_gite_id UUID;
BEGIN
    -- Vérifier que l'utilisateur a les droits admin
    IF NOT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = p_organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Permission denied: admin required';
    END IF;
    
    -- Créer le gîte
    INSERT INTO gites (
        organization_id,
        name,
        slug,
        description,
        address,
        capacity,
        bedrooms,
        bathrooms,
        icon,
        color,
        settings
    ) VALUES (
        p_organization_id,
        p_name,
        p_slug,
        p_description,
        p_address,
        p_capacity,
        p_bedrooms,
        p_bathrooms,
        p_icon,
        p_color,
        jsonb_build_object(
            'linen_needs', jsonb_build_object(
                'flat_sheet_large', GREATEST(p_bedrooms - 1, 1) * 2,
                'flat_sheet_small', 2,
                'duvet_cover_large', GREATEST(p_bedrooms - 1, 1) * 2,
                'duvet_cover_small', 2,
                'pillowcase', p_capacity + 2,
                'towel', p_capacity + 2,
                'bath_mat', p_bathrooms
            ),
            'check_in_time', '16:00',
            'check_out_time', '10:00'
        )
    ) RETURNING id INTO v_gite_id;
    
    -- Créer stocks draps initiaux (vides)
    INSERT INTO linen_stocks (organization_id, gite_id, item_type, quantity, min_quantity)
    SELECT 
        p_organization_id,
        v_gite_id,
        item_type,
        0,
        CASE item_type
            WHEN 'flat_sheet_large' THEN GREATEST(p_bedrooms - 1, 1) * 2
            WHEN 'flat_sheet_small' THEN 2
            WHEN 'duvet_cover_large' THEN GREATEST(p_bedrooms - 1, 1) * 2
            WHEN 'duvet_cover_small' THEN 2
            WHEN 'pillowcase' THEN p_capacity + 2
            WHEN 'towel' THEN p_capacity + 2
            WHEN 'bath_mat' THEN p_bathrooms
            ELSE 0
        END
    FROM unnest(ARRAY[
        'flat_sheet_large', 'flat_sheet_small',
        'duvet_cover_large', 'duvet_cover_small',
        'pillowcase', 'towel', 'bath_mat'
    ]::TEXT[]) AS item_type;
    
    RETURN v_gite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_gite IS 'Créer un nouveau gîte avec stocks draps par défaut';

-- ================================================================
-- FONCTION: Modifier un gîte existant
-- ================================================================

CREATE OR REPLACE FUNCTION update_gite(
    p_gite_id UUID,
    p_name TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_capacity INT DEFAULT NULL,
    p_bedrooms INT DEFAULT NULL,
    p_bathrooms INT DEFAULT NULL,
    p_icon TEXT DEFAULT NULL,
    p_color TEXT DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_organization_id UUID;
BEGIN
    -- Récupérer organization_id
    SELECT organization_id INTO v_organization_id
    FROM gites WHERE id = p_gite_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Gite not found: %', p_gite_id;
    END IF;
    
    -- Vérifier permissions
    IF NOT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = v_organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Permission denied: admin required';
    END IF;
    
    -- Mettre à jour (uniquement champs non NULL)
    UPDATE gites SET
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        address = COALESCE(p_address, address),
        capacity = COALESCE(p_capacity, capacity),
        bedrooms = COALESCE(p_bedrooms, bedrooms),
        bathrooms = COALESCE(p_bathrooms, bathrooms),
        icon = COALESCE(p_icon, icon),
        color = COALESCE(p_color, color),
        is_active = COALESCE(p_is_active, is_active),
        updated_at = NOW()
    WHERE id = p_gite_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_gite IS 'Modifier un gîte existant (champs optionnels)';

-- ================================================================
-- FONCTION: Supprimer un gîte (soft delete)
-- ================================================================

CREATE OR REPLACE FUNCTION archive_gite(p_gite_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_organization_id UUID;
BEGIN
    SELECT organization_id INTO v_organization_id
    FROM gites WHERE id = p_gite_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Gite not found: %', p_gite_id;
    END IF;
    
    -- Vérifier permissions
    IF NOT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = v_organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Permission denied: admin required';
    END IF;
    
    -- Désactiver (pas supprimer) pour garder historique
    UPDATE gites 
    SET is_active = false, updated_at = NOW()
    WHERE id = p_gite_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION archive_gite IS 'Désactiver un gîte (soft delete)';

-- ================================================================
-- FONCTION: Supprimer définitivement un gîte
-- ================================================================

CREATE OR REPLACE FUNCTION delete_gite_permanent(p_gite_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_organization_id UUID;
    v_reservation_count INT;
BEGIN
    SELECT organization_id INTO v_organization_id
    FROM gites WHERE id = p_gite_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Gite not found: %', p_gite_id;
    END IF;
    
    -- Vérifier permissions OWNER uniquement
    IF NOT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = v_organization_id
        AND user_id = auth.uid()
        AND role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Permission denied: owner required';
    END IF;
    
    -- Vérifier qu'il n'y a pas de réservations
    SELECT COUNT(*) INTO v_reservation_count
    FROM reservations
    WHERE gite_id = p_gite_id;
    
    IF v_reservation_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete gite with % reservations. Archive it instead.', v_reservation_count;
    END IF;
    
    -- Supprimer (CASCADE supprimera stocks, planning, etc.)
    DELETE FROM gites WHERE id = p_gite_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_gite_permanent IS 'Supprimer définitivement un gîte (DANGER: owner only, no reservations)';

-- ================================================================
-- FONCTION: Dupliquer un gîte
-- ================================================================

CREATE OR REPLACE FUNCTION duplicate_gite(
    p_source_gite_id UUID,
    p_new_name TEXT,
    p_new_slug TEXT
)
RETURNS UUID AS $$
DECLARE
    v_organization_id UUID;
    v_new_gite_id UUID;
    v_source_gite RECORD;
BEGIN
    -- Récupérer le gîte source
    SELECT * INTO v_source_gite
    FROM gites WHERE id = p_source_gite_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source gite not found: %', p_source_gite_id;
    END IF;
    
    v_organization_id := v_source_gite.organization_id;
    
    -- Vérifier permissions
    IF NOT EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = v_organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Permission denied: admin required';
    END IF;
    
    -- Dupliquer le gîte
    INSERT INTO gites (
        organization_id,
        name,
        slug,
        description,
        address,
        capacity,
        bedrooms,
        bathrooms,
        icon,
        color,
        settings
    ) VALUES (
        v_organization_id,
        p_new_name,
        p_new_slug,
        v_source_gite.description,
        v_source_gite.address,
        v_source_gite.capacity,
        v_source_gite.bedrooms,
        v_source_gite.bathrooms,
        v_source_gite.icon,
        v_source_gite.color,
        v_source_gite.settings
    ) RETURNING id INTO v_new_gite_id;
    
    -- Dupliquer les stocks draps
    INSERT INTO linen_stocks (organization_id, gite_id, item_type, quantity, min_quantity)
    SELECT 
        organization_id,
        v_new_gite_id,
        item_type,
        0, -- Stock initial vide
        min_quantity
    FROM linen_stocks
    WHERE gite_id = p_source_gite_id;
    
    -- Dupliquer les infos pratiques spécifiques au gîte
    INSERT INTO practical_info (organization_id, gite_id, info_type, title, content, icon, display_order)
    SELECT 
        organization_id,
        v_new_gite_id,
        info_type,
        title,
        content,
        icon,
        display_order
    FROM practical_info
    WHERE gite_id = p_source_gite_id;
    
    RETURN v_new_gite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION duplicate_gite IS 'Dupliquer un gîte avec sa config (stocks, infos pratiques)';

-- ================================================================
-- EXEMPLES D'UTILISATION
-- ================================================================

/*

-- 1. CRÉER UN NOUVEAU GÎTE
SELECT create_gite(
    'organization-uuid',
    'Mon Nouveau Gîte',
    'mon-nouveau-gite',
    'Description du gîte',
    'Adresse complète',
    6,  -- capacity
    3,  -- bedrooms
    2,  -- bathrooms
    'villa',
    '#42b883'
);

-- 2. MODIFIER UN GÎTE
SELECT update_gite(
    'gite-uuid',
    p_name := 'Nouveau Nom',
    p_capacity := 8,
    p_icon := 'castle'
);

-- 3. ARCHIVER UN GÎTE
SELECT archive_gite('gite-uuid');

-- 4. SUPPRIMER DÉFINITIVEMENT (si pas de réservations)
SELECT delete_gite_permanent('gite-uuid');

-- 5. DUPLIQUER UN GÎTE
SELECT duplicate_gite(
    'gite-source-uuid',
    'Copie du Gîte',
    'copie-du-gite'
);

*/
