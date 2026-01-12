# 🏗️ ROADMAP MULTI-TENANT - PARTIE 2/4
# ARCHITECTURE TECHNIQUE DÉTAILLÉE

**Date**: 7 janvier 2026  
**Suite de**: PART1_ANALYSE_CONCURRENTIELLE.md  
**Focus**: Conception technique complète

---

## 🎯 OBJECTIFS ARCHITECTURE

1. **Multi-tenant natif**: Isolation complète des données
2. **Scalabilité**: 1 → 10 000 clients
3. **Zéro configuration**: Onboarding automatique
4. **Backward compatible**: Migration progressive
5. **Performance**: <200ms page load

---

## 📊 SCHÉMA ENTITÉ-RELATION COMPLET

```
┌─────────────────────────────────────────────────────────────────┐
│                     🏢 ORGANIZATIONS                             │
│  - Représente UN CLIENT PAYANT (ex: "Gîtes Calvignac SARL")    │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ 1:N
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                        🏠 GITES                                  │
│  - Appartient à une organization                                 │
│  - Un client peut avoir 1-N gîtes                                │
└──────────────────┬──────────────────────────────────────────────┘
                   │
      ┌────────────┼────────────┬──────────────────────┐
      │            │            │                      │
      │ 1:N        │ 1:N        │ 1:N                  │ 1:N
      ▼            ▼            ▼                      ▼
┌─────────┐  ┌──────────┐  ┌──────────┐        ┌──────────┐
│RÉSERVA- │  │CLEANING  │  │STOCKS    │        │CHARGES   │
│TIONS    │  │SCHEDULE  │  │DRAPS     │        │          │
└─────────┘  └──────────┘  └──────────┘        └──────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   👥 ORGANIZATION_MEMBERS                        │
│  - Lie users à organizations                                     │
│  - Gère les rôles (owner, admin, femme_menage, viewer)         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   💳 SUBSCRIPTIONS                               │
│  - Gère abonnements Stripe                                       │
│  - Historique paiements                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ SCHÉMA SQL COMPLET

### **1. Organizations (Tenants)**

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identité
    name TEXT NOT NULL,                          -- "Gîtes du Calvignac"
    slug TEXT UNIQUE NOT NULL,                   -- "gites-calvignac" (URL friendly)
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Contact
    email TEXT NOT NULL,
    phone TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'FR',
    
    -- Abonnement
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'unpaid')),
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
    
    -- Limites par plan
    max_gites INTEGER DEFAULT 1,
    max_users INTEGER DEFAULT 1,
    max_reservations_per_month INTEGER DEFAULT 100,
    max_storage_mb INTEGER DEFAULT 100,
    
    -- Utilisation actuelle
    current_gites_count INTEGER DEFAULT 0,
    current_users_count INTEGER DEFAULT 1,
    current_storage_mb DECIMAL(10,2) DEFAULT 0,
    
    -- Branding (white label)
    logo_url TEXT,
    primary_color TEXT DEFAULT '#667eea',
    secondary_color TEXT DEFAULT '#764ba2',
    favicon_url TEXT,
    custom_domain TEXT UNIQUE,                   -- pro.example.com
    
    -- Feature flags
    features JSONB DEFAULT '{
        "channel_manager": false,
        "booking_engine": false,
        "advanced_reports": false,
        "api_access": false,
        "white_label": false,
        "priority_support": false
    }'::jsonb,
    
    -- Settings
    settings JSONB DEFAULT '{
        "timezone": "Europe/Paris",
        "currency": "EUR",
        "language": "fr",
        "date_format": "DD/MM/YYYY",
        "first_day_of_week": 1
    }'::jsonb,
    
    -- Metadata
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,                      -- Soft delete
    
    -- Indexes
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner ON organizations(owner_user_id);
CREATE INDEX idx_organizations_status ON organizations(subscription_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_stripe ON organizations(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER set_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

### **2. Gites (Properties)**

```sql
CREATE TABLE gites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Identité
    name TEXT NOT NULL,                          -- "Le Trévoux"
    slug TEXT NOT NULL,                          -- "trevoux"
    display_name TEXT,                           -- "Gîte Le Trévoux - Vue Vallée"
    description TEXT,
    display_order INTEGER DEFAULT 0,
    
    -- État
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,          -- Visible sur booking engine
    
    -- Caractéristiques
    type TEXT DEFAULT 'apartment' CHECK (type IN ('apartment', 'house', 'villa', 'chalet', 'studio', 'room')),
    max_personnes INTEGER NOT NULL DEFAULT 4,
    nombre_chambres INTEGER DEFAULT 1,
    nombre_lits_simples INTEGER DEFAULT 0,
    nombre_lits_doubles INTEGER DEFAULT 0,
    nombre_salles_bain INTEGER DEFAULT 1,
    surface_m2 INTEGER,
    
    -- Équipements (checkbox list)
    equipements JSONB DEFAULT '{
        "wifi": true,
        "parking": true,
        "cuisine": true,
        "lave_linge": true,
        "lave_vaisselle": false,
        "tv": true,
        "climatisation": false,
        "chauffage": true,
        "jardin": false,
        "terrasse": false,
        "piscine": false,
        "jacuzzi": false,
        "cheminee": false,
        "barbecue": false,
        "velo": false,
        "jeux_enfants": false
    }'::jsonb,
    
    -- Localisation
    adresse TEXT,
    adresse_complement TEXT,
    ville TEXT,
    code_postal TEXT,
    region TEXT,
    pays TEXT DEFAULT 'France',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Coordonnées
    telephone TEXT,
    telephone_urgence TEXT,
    email TEXT,
    code_acces TEXT,                             -- Code porte/boîte à clés
    instructions_acces TEXT,
    
    -- Tarification de base
    prix_nuit_base DECIMAL(10,2) DEFAULT 100.00,
    prix_weekend_supplement DECIMAL(10,2) DEFAULT 0,
    prix_personne_supp DECIMAL(10,2) DEFAULT 20.00,
    caution DECIMAL(10,2) DEFAULT 300.00,
    frais_menage DECIMAL(10,2) DEFAULT 60.00,
    taxe_sejour_par_nuit DECIMAL(5,2) DEFAULT 0.80,
    
    -- Durées de séjour
    duree_min_nuits INTEGER DEFAULT 2,
    duree_max_nuits INTEGER DEFAULT 30,
    delai_reservation_min_jours INTEGER DEFAULT 2,
    
    -- Horaires
    heure_arrivee_min TIME DEFAULT '16:00',
    heure_arrivee_max TIME DEFAULT '20:00',
    heure_depart TIME DEFAULT '11:00',
    
    -- Liens externes
    url_airbnb TEXT,
    url_booking TEXT,
    url_abritel TEXT,
    url_site_web TEXT,
    
    -- iCal URLs (import)
    ical_airbnb_url TEXT,
    ical_booking_url TEXT,
    ical_abritel_url TEXT,
    ical_custom_urls JSONB DEFAULT '[]'::jsonb,  -- [{name: "Gites de France", url: "..."}]
    
    -- iCal Export
    ical_export_token TEXT UNIQUE,               -- Token sécurisé pour export
    ical_export_url TEXT,                         -- URL générée automatiquement
    last_ical_sync_at TIMESTAMPTZ,
    
    -- Photos
    photos JSONB DEFAULT '[]'::jsonb,            -- [{url: "...", is_cover: true, order: 1}]
    cover_photo_url TEXT,
    
    -- Infos pratiques (FR + EN)
    infos_pratiques JSONB DEFAULT '{}'::jsonb,   -- Structure complète comme infos_gites actuel
    
    -- Règlement intérieur
    reglement JSONB DEFAULT '{
        "tabac_interdit": true,
        "animaux_acceptes": false,
        "fetes_interdites": true,
        "arrivee_tardive_possible": true
    }'::jsonb,
    
    -- Metadata
    notes_internes TEXT,                          -- Notes privées admin
    
    -- Statistiques (cache)
    stats_taux_occupation_30j DECIMAL(5,2) DEFAULT 0,
    stats_revenu_30j DECIMAL(10,2) DEFAULT 0,
    stats_nb_reservations_30j INTEGER DEFAULT 0,
    stats_note_moyenne DECIMAL(3,2) DEFAULT 0,
    stats_last_calculated_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Contraintes
    UNIQUE(organization_id, slug)
);

-- Indexes
CREATE INDEX idx_gites_organization ON gites(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_gites_active ON gites(organization_id, is_active) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_gites_location ON gites(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_gites_ical_token ON gites(ical_export_token) WHERE ical_export_token IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER set_gites_updated_at
    BEFORE UPDATE ON gites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Générer ical_export_token à la création
CREATE OR REPLACE FUNCTION generate_gite_ical_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ical_export_token IS NULL THEN
        NEW.ical_export_token := encode(gen_random_bytes(32), 'hex');
        NEW.ical_export_url := 'https://votreapp.com/ical/export/' || NEW.ical_export_token || '.ics';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_gite_ical_token
    BEFORE INSERT ON gites
    FOR EACH ROW
    EXECUTE FUNCTION generate_gite_ical_token();
```

---

### **3. Organization Members (Multi-users)**

```sql
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Rôle
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'femme_menage', 'viewer')),
    
    -- Permissions granulaires (override role defaults)
    permissions JSONB DEFAULT '{
        "reservations": {"read": true, "write": true, "delete": false},
        "charges": {"read": true, "write": false, "delete": false},
        "reports": {"read": true, "write": false, "delete": false},
        "settings": {"read": false, "write": false, "delete": false},
        "users": {"read": false, "write": false, "delete": false}
    }'::jsonb,
    
    -- Restriction par gîte (si vide = tous les gîtes)
    gites_access UUID[] DEFAULT ARRAY[]::UUID[], -- Si vide = accès à tous
    
    -- Invitation
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    invitation_token TEXT UNIQUE,
    invitation_expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    
    -- État
    is_active BOOLEAN DEFAULT true,
    last_activity_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id)
);

-- Indexes
CREATE INDEX idx_members_organization ON organization_members(organization_id);
CREATE INDEX idx_members_user ON organization_members(user_id);
CREATE INDEX idx_members_role ON organization_members(organization_id, role);
CREATE INDEX idx_members_invitation ON organization_members(invitation_token) WHERE invitation_token IS NOT NULL;
```

---

### **4. Reservations (refonte avec tenant)**

```sql
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    
    -- Dates
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    nuits INTEGER GENERATED ALWAYS AS (date_fin - date_debut) STORED,
    
    -- Horaires (optionnels, override défaut gîte)
    heure_arrivee TIME,
    heure_depart TIME,
    arrivee_tardive BOOLEAN DEFAULT false,
    depart_tardif BOOLEAN DEFAULT false,
    
    -- Client
    client_nom TEXT,
    client_prenom TEXT,
    client_email TEXT,
    client_telephone TEXT,
    client_adresse TEXT,
    client_ville TEXT,
    client_pays TEXT DEFAULT 'France',
    client_langue TEXT DEFAULT 'fr',
    
    -- Séjour
    nb_adultes INTEGER DEFAULT 2,
    nb_enfants INTEGER DEFAULT 0,
    nb_bebes INTEGER DEFAULT 0,
    nb_animaux INTEGER DEFAULT 0,
    
    -- Tarification
    prix_nuitee DECIMAL(10,2) NOT NULL,
    nb_nuits INTEGER,
    prix_total_nuitees DECIMAL(10,2),
    prix_menage DECIMAL(10,2) DEFAULT 0,
    prix_taxe_sejour DECIMAL(10,2) DEFAULT 0,
    prix_extras DECIMAL(10,2) DEFAULT 0,
    prix_total_ht DECIMAL(10,2),
    prix_total_ttc DECIMAL(10,2) NOT NULL,
    
    -- Paiement
    montant_acompte DECIMAL(10,2) DEFAULT 0,
    montant_caution DECIMAL(10,2) DEFAULT 0,
    montant_reste_du DECIMAL(10,2),
    statut_paiement TEXT DEFAULT 'en_attente' CHECK (statut_paiement IN (
        'en_attente', 'acompte_recu', 'paye', 'rembourse', 'annule'
    )),
    methode_paiement TEXT CHECK (methode_paiement IN (
        'virement', 'cheque', 'especes', 'carte', 'stripe', 'paypal', 'autre'
    )),
    
    -- Stripe (si paiement en ligne)
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    date_paiement_acompte TIMESTAMPTZ,
    date_paiement_solde TIMESTAMPTZ,
    
    -- Plateforme / Source
    source TEXT DEFAULT 'direct' CHECK (source IN (
        'direct', 'airbnb', 'booking', 'abritel', 'gites_de_france', 'autre'
    )),
    reference_externe TEXT,                       -- ID réservation plateforme
    commission_plateforme DECIMAL(5,2) DEFAULT 0, -- % commission
    montant_commission DECIMAL(10,2) DEFAULT 0,
    
    -- Statut réservation
    statut TEXT DEFAULT 'confirmee' CHECK (statut IN (
        'devis', 'option', 'confirmee', 'en_cours', 'terminee', 'annulee', 'no_show'
    )),
    date_confirmation TIMESTAMPTZ,
    date_annulation TIMESTAMPTZ,
    motif_annulation TEXT,
    
    -- Sync iCal
    synced_from TEXT,                             -- 'airbnb_ical', 'booking_ical', etc.
    synced_at TIMESTAMPTZ,
    ical_uid TEXT,                                -- UID de l'événement iCal source
    
    -- Communication
    fiche_client_envoyee BOOLEAN DEFAULT false,
    date_envoi_fiche TIMESTAMPTZ,
    confirmation_envoyee BOOLEAN DEFAULT false,
    date_confirmation_email TIMESTAMPTZ,
    rappel_envoye BOOLEAN DEFAULT false,
    date_rappel TIMESTAMPTZ,
    
    -- Check-in/out
    check_in_fait BOOLEAN DEFAULT false,
    check_in_at TIMESTAMPTZ,
    check_out_fait BOOLEAN DEFAULT false,
    check_out_at TIMESTAMPTZ,
    
    -- Évaluation
    note_globale INTEGER CHECK (note_globale BETWEEN 1 AND 5),
    commentaire_client TEXT,
    date_evaluation TIMESTAMPTZ,
    
    -- Notes
    notes_internes TEXT,
    demandes_speciales TEXT,
    
    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_reservations_organization ON reservations(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_gite ON reservations(gite_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_dates ON reservations(gite_id, date_debut, date_fin) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_client ON reservations(client_email) WHERE client_email IS NOT NULL;
CREATE INDEX idx_reservations_statut ON reservations(organization_id, statut) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_source ON reservations(organization_id, source);
CREATE INDEX idx_reservations_ical ON reservations(ical_uid) WHERE ical_uid IS NOT NULL;

-- Contrainte: Pas de chevauchement
CREATE UNIQUE INDEX idx_no_overlapping_reservations 
ON reservations(gite_id, daterange(date_debut, date_fin, '[]'))
WHERE deleted_at IS NULL AND statut NOT IN ('annulee', 'no_show');
```

---

### **5. Toutes les autres tables (même principe)**

**Pattern à répéter:**
```sql
-- Ajouter à CHAQUE table existante:
ALTER TABLE nom_table ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE nom_table ADD COLUMN gite_id UUID REFERENCES gites(id) ON DELETE CASCADE; -- si lié à un gîte

-- Exemples:
-- cleaning_schedule
-- stocks_draps
-- retours_menage
-- charges
-- todos
-- activites_gites
-- infos_gites (devient infos par gite)
-- etc.
```

---

## 🔐 RLS MULTI-TENANT (Isolation totale)

### **Helper Functions**

```sql
-- Récupérer l'organization_id de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
    SELECT om.organization_id 
    FROM organization_members om
    WHERE om.user_id = auth.uid() 
    AND om.is_active = true
    AND om.accepted_at IS NOT NULL
    LIMIT 1;
$$;

-- Vérifier si user a un rôle spécifique
CREATE OR REPLACE FUNCTION public.user_has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM organization_members om
        WHERE om.user_id = auth.uid()
        AND om.organization_id = public.get_user_organization_id()
        AND om.role = required_role
        AND om.is_active = true
    );
$$;

-- Vérifier si user a accès à un gîte spécifique
CREATE OR REPLACE FUNCTION public.user_has_gite_access(gite_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM organization_members om
        WHERE om.user_id = auth.uid()
        AND om.organization_id = public.get_user_organization_id()
        AND om.is_active = true
        AND (
            om.role IN ('owner', 'admin') -- Owner/Admin ont accès à tout
            OR cardinality(om.gites_access) = 0 -- Tableau vide = accès à tous
            OR gite_uuid = ANY(om.gites_access) -- Ou gîte dans liste autorisée
        )
    );
$$;
```

### **Policies Standard (template)**

```sql
-- POLICY TEMPLATE à appliquer sur TOUTES les tables

-- 1. Organizations (read only own)
DROP POLICY IF EXISTS "tenant_isolation_read" ON organizations;
CREATE POLICY "tenant_isolation_read"
ON organizations FOR SELECT
TO authenticated
USING (
    id = public.get_user_organization_id()
    OR owner_user_id = auth.uid()
);

-- 2. Gites
DROP POLICY IF EXISTS "tenant_isolation_gites" ON gites;
CREATE POLICY "tenant_isolation_gites"
ON gites FOR ALL
TO authenticated
USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- 3. Reservations (avec restriction gite si besoin)
DROP POLICY IF EXISTS "tenant_isolation_reservations" ON reservations;
CREATE POLICY "tenant_isolation_reservations"
ON reservations FOR ALL
TO authenticated
USING (
    organization_id = public.get_user_organization_id()
    AND public.user_has_gite_access(gite_id)
)
WITH CHECK (
    organization_id = public.get_user_organization_id()
    AND public.user_has_gite_access(gite_id)
);

-- Répéter ce pattern pour:
-- - cleaning_schedule
-- - stocks_draps
-- - retours_menage
-- - charges
-- - todos
-- - etc.
```

---

## 📝 CONCLUSION PARTIE 2

**Architecture complète définie** ✅

**Next**: Partie 3 - Roadmap d'implémentation détaillée

---

**📄 SUITE**: `ROADMAP_MULTI_TENANT_PART3_IMPLEMENTATION.md`
