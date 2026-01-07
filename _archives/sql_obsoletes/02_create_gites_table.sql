-- ================================================================
-- TABLE GITES - Propriétés louées
-- Phase Multi-Tenant - Étape 1.2
-- ================================================================
-- Date: 7 janvier 2026
-- Description: Table représentant UNE PROPRIÉTÉ louée
--              Un gîte appartient à UNE organization
--              Une organization peut avoir PLUSIEURS gîtes
-- ================================================================

-- ================================================================
-- CRÉATION DE LA TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS gites (
    -- Identifiants
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,  -- URL-friendly: "villa-mediterranee"
    
    -- Informations de base
    name TEXT NOT NULL,  -- "Villa Méditerranée"
    internal_code TEXT,  -- Code interne optionnel (ex: "V001")
    description TEXT,
    
    -- Caractéristiques
    property_type TEXT DEFAULT 'gite' CHECK (
        property_type IN ('gite', 'villa', 'appartement', 'maison', 'chambre_hote', 'other')
    ),
    max_capacity INTEGER NOT NULL DEFAULT 4,
    bedrooms INTEGER DEFAULT 1,
    bathrooms INTEGER DEFAULT 1,
    surface_m2 DECIMAL(8,2),  -- Surface en m²
    
    -- Adresse complète
    address TEXT NOT NULL,
    address_complement TEXT,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT DEFAULT 'FR',
    
    -- Coordonnées GPS (pour carte)
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Contact sur place (si différent de l'organization)
    local_contact_name TEXT,
    local_contact_phone TEXT,
    local_contact_email TEXT,
    
    -- Accès & Clés
    access_instructions TEXT,  -- Instructions d'accès
    wifi_ssid TEXT,
    wifi_password TEXT,
    alarm_code TEXT,
    gate_code TEXT,
    
    -- Équipements (JSON pour flexibilité)
    amenities JSONB DEFAULT '{
        "wifi": true,
        "parking": true,
        "piscine": false,
        "jacuzzi": false,
        "climatisation": false,
        "chauffage": true,
        "lave_vaisselle": true,
        "lave_linge": true,
        "seche_linge": false,
        "television": true,
        "bbq": false,
        "jardin": false,
        "terrasse": false,
        "vue_mer": false,
        "animaux_acceptes": false
    }'::jsonb,
    
    -- Calendrier & Synchronisation
    ical_url TEXT,  -- URL iCal (Airbnb, Booking, etc.)
    ical_last_sync TIMESTAMPTZ,
    ical_sync_enabled BOOLEAN DEFAULT false,
    calendar_color TEXT DEFAULT '#3B82F6',  -- Couleur dans le calendrier
    
    -- Tarification
    default_price_per_night DECIMAL(10,2),
    cleaning_fee DECIMAL(10,2) DEFAULT 0,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    
    -- Disponibilité
    min_stay_nights INTEGER DEFAULT 1,
    max_stay_nights INTEGER,
    checkin_time TIME DEFAULT '16:00',
    checkout_time TIME DEFAULT '10:00',
    buffer_days INTEGER DEFAULT 0,  -- Jours entre réservations
    
    -- Règlement intérieur (fichier markdown)
    house_rules TEXT,
    check_in_instructions TEXT,
    check_out_instructions TEXT,
    
    -- Images
    main_image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,  -- Array d'URLs
    
    -- Documents associés
    documents JSONB DEFAULT '[]'::jsonb,  -- Contrats, inventaires, etc.
    
    -- Intégrations externes
    airbnb_listing_id TEXT,
    booking_property_id TEXT,
    abritel_listing_id TEXT,
    external_ids JSONB DEFAULT '{}'::jsonb,  -- Autres plateformes
    
    -- Statistiques
    total_bookings INTEGER DEFAULT 0,
    total_nights_booked INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    total_revenue DECIMAL(12,2) DEFAULT 0,
    
    -- Métadonnées
    settings JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,  -- Soft delete
    
    -- Statut
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,  -- Visible sur booking engine
    is_featured BOOLEAN DEFAULT false,
    
    -- Contraintes
    UNIQUE(organization_id, slug),  -- Slug unique par organization
    CONSTRAINT valid_capacity CHECK (max_capacity > 0),
    CONSTRAINT valid_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    )
);

-- ================================================================
-- INDEX POUR PERFORMANCES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_gites_organization ON gites(organization_id);
CREATE INDEX IF NOT EXISTS idx_gites_slug ON gites(organization_id, slug);
CREATE INDEX IF NOT EXISTS idx_gites_active ON gites(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_gites_published ON gites(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_gites_location ON gites(city, country);
CREATE INDEX IF NOT EXISTS idx_gites_coords ON gites(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gites_airbnb ON gites(airbnb_listing_id) WHERE airbnb_listing_id IS NOT NULL;

-- ================================================================
-- COMMENTAIRES
-- ================================================================

COMMENT ON TABLE gites IS 'Propriétés louées - Appartient à une organization';
COMMENT ON COLUMN gites.slug IS 'Identifiant URL-friendly unique par organization';
COMMENT ON COLUMN gites.amenities IS 'Équipements disponibles (JSON)';
COMMENT ON COLUMN gites.ical_url IS 'URL de synchronisation iCal externe';
COMMENT ON COLUMN gites.calendar_color IS 'Couleur hex pour affichage calendrier';
COMMENT ON COLUMN gites.buffer_days IS 'Jours de battement entre réservations';

-- ================================================================
-- TRIGGER UPDATED_AT
-- ================================================================

CREATE OR REPLACE FUNCTION update_gites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gites_updated_at ON gites;
CREATE TRIGGER trigger_gites_updated_at
    BEFORE UPDATE ON gites
    FOR EACH ROW
    EXECUTE FUNCTION update_gites_updated_at();

-- ================================================================
-- TRIGGER MISE À JOUR COMPTEUR ORGANIZATION
-- ================================================================

CREATE OR REPLACE FUNCTION update_organization_gites_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Incrémenter le compteur
        UPDATE organizations 
        SET current_gites_count = current_gites_count + 1
        WHERE id = NEW.organization_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- Décrémenter le compteur
        UPDATE organizations 
        SET current_gites_count = current_gites_count - 1
        WHERE id = OLD.organization_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.organization_id != NEW.organization_id THEN
        -- Changement d'organization (rare mais possible)
        UPDATE organizations 
        SET current_gites_count = current_gites_count - 1
        WHERE id = OLD.organization_id;
        
        UPDATE organizations 
        SET current_gites_count = current_gites_count + 1
        WHERE id = NEW.organization_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_organization_gites_count ON gites;
CREATE TRIGGER trigger_update_organization_gites_count
    AFTER INSERT OR UPDATE OR DELETE ON gites
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_gites_count();

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================
-- NOTE: RLS sera activé dans le script 05_create_rls_policies.sql
--       APRÈS la migration des données

-- ALTER TABLE gites ENABLE ROW LEVEL SECURITY;

-- Policy 1: Les members peuvent voir les gîtes de leur organization
-- DROP POLICY IF EXISTS "Members can view their gites" ON gites;
-- CREATE POLICY "Members can view their gites" ON gites
--     FOR SELECT
--     USING (
--         organization_id IN (
--             SELECT organization_id 
--             FROM organization_members 
--             WHERE user_id = auth.uid()
--         )
--     );

-- Policy 2: Seuls owner/admin/manager peuvent créer des gîtes
-- DROP POLICY IF EXISTS "Managers can create gites" ON gites;
-- CREATE POLICY "Managers can create gites" ON gites
--     FOR INSERT
--     WITH CHECK (
--         organization_id IN (
--             SELECT organization_id 
--             FROM organization_members 
--             WHERE user_id = auth.uid() 
--             AND role IN ('owner', 'admin', 'manager')
--         )
--     );

-- Policy 3: Seuls owner/admin/manager peuvent modifier des gîtes
-- DROP POLICY IF EXISTS "Managers can update gites" ON gites;
-- CREATE POLICY "Managers can update gites" ON gites
--     FOR UPDATE
--     USING (
--         organization_id IN (
--             SELECT organization_id 
--             FROM organization_members 
--             WHERE user_id = auth.uid() 
--             AND role IN ('owner', 'admin', 'manager')
--         )
--     );

-- Policy 4: Seuls owner/admin peuvent supprimer des gîtes
-- DROP POLICY IF EXISTS "Admins can delete gites" ON gites;
-- CREATE POLICY "Admins can delete gites" ON gites
--     FOR DELETE
--     USING (
--         organization_id IN (
--             SELECT organization_id 
--             FROM organization_members 
--             WHERE user_id = auth.uid() 
--             AND role IN ('owner', 'admin')
--         )
--     );

-- ================================================================
-- DONNÉES DE TEST (à supprimer en production)
-- ================================================================

-- Exemple d'insertion
-- INSERT INTO gites (organization_id, slug, name, address, city, postal_code, max_capacity)
-- VALUES (
--     'xxx-org-id-xxx',
--     'villa-mediterranee',
--     'Villa Méditerranée',
--     '123 Avenue de la Mer',
--     'Nice',
--     '06000',
--     8
-- );

-- ================================================================
-- FIN DU SCRIPT
-- ================================================================
