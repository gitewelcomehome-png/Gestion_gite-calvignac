-- ================================================================
-- 🏗️ SCHÉMA COMPLET PRODUCTION - ONE-SHOT
-- ================================================================
-- Date création: 23 janvier 2026
-- Version: v4.4 Stable
-- Description: Création complète BDD Gestion Gîte Calvignac
-- Tables actives: 22 (19 essentielles + 3 optionnelles)
-- ================================================================
-- ⚠️ IMPORTANT: Exécuter sur base VIDE uniquement
-- Pour mise à jour: utiliser scripts de migration individuels
-- ================================================================

BEGIN;

-- ================================================================
-- 🔧 EXTENSIONS REQUISES
-- ================================================================

-- UUID pour les clés primaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 📋 GROUPE 1: CORE APPLICATION (3 tables)
-- ================================================================

-- --------------------------------------------------------------
-- TABLE 1: gites
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gites (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NULL,
  address TEXT NULL,
  icon TEXT NULL DEFAULT 'home',
  color TEXT NULL DEFAULT '#667eea',
  capacity INTEGER NULL,
  bedrooms INTEGER NULL,
  bathrooms INTEGER NULL,
  latitude NUMERIC(10,8) NULL,
  longitude NUMERIC(11,8) NULL,
  ical_sources JSONB NULL DEFAULT '{}'::jsonb,
  settings JSONB NULL DEFAULT '{}'::jsonb,
  tarifs_calendrier JSONB NULL DEFAULT '{}'::jsonb,
  regles_tarifaires JSONB NULL DEFAULT '{}'::jsonb,
  regles_tarifs JSONB NULL,
  display_order INTEGER NULL DEFAULT 0,
  is_active BOOLEAN NULL DEFAULT true,
  distance_km NUMERIC(6,2) NULL DEFAULT 0, -- Distance depuis domicile (ajout 19/01/2026)
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  
  CONSTRAINT gites_pkey PRIMARY KEY (id),
  CONSTRAINT gites_owner_user_id_slug_key UNIQUE (owner_user_id, slug),
  CONSTRAINT gites_owner_user_id_fkey FOREIGN KEY (owner_user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT gites_name_check CHECK (length(name) >= 2),
  CONSTRAINT gites_slug_check CHECK (slug ~ '^[a-z0-9_-]+$'),
  CONSTRAINT gites_capacity_check CHECK (capacity IS NULL OR capacity >= 0),
  CONSTRAINT gites_bedrooms_check CHECK (bedrooms IS NULL OR bedrooms >= 0),
  CONSTRAINT gites_bathrooms_check CHECK (bathrooms IS NULL OR bathrooms >= 0)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_gites_owner ON public.gites USING btree (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_gites_active ON public.gites USING btree (owner_user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_gites_slug ON public.gites USING btree (owner_user_id, slug);

-- --------------------------------------------------------------
-- TABLE 2: reservations
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  gite_id UUID NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NULL,
  client_phone TEXT NULL,
  client_address TEXT NULL,
  guest_count INTEGER NULL,
  nb_personnes INTEGER NULL, -- Alias
  platform TEXT NULL,
  plateforme TEXT NULL, -- Alias
  platform_booking_id TEXT NULL,
  status TEXT NULL DEFAULT 'confirmed',
  total_price NUMERIC(10,2) NULL,
  montant NUMERIC(10,2) NULL, -- Alias
  currency TEXT NULL DEFAULT 'EUR',
  paid_amount NUMERIC(10,2) NULL DEFAULT 0,
  acompte NUMERIC(10,2) NULL DEFAULT 0, -- Alias
  restant NUMERIC(10,2) NULL DEFAULT 0, -- Calculé par trigger
  paiement TEXT NULL,
  notes TEXT NULL,
  source TEXT NULL DEFAULT 'manual',
  provenance TEXT NULL, -- Alias
  synced_from TEXT NULL,
  ical_uid TEXT NULL,
  manual_override BOOLEAN NULL DEFAULT false,
  last_seen_in_ical TIMESTAMPTZ NULL,
  message_envoye BOOLEAN NULL DEFAULT false,
  check_in_time TIME NULL,
  check_out_time TIME NULL,
  telephone TEXT NULL, -- Alias
  gite TEXT NULL, -- Alias nom gîte
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  
  CONSTRAINT reservations_pkey PRIMARY KEY (id),
  CONSTRAINT reservations_owner_user_id_fkey FOREIGN KEY (owner_user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT reservations_gite_id_fkey FOREIGN KEY (gite_id) 
    REFERENCES gites(id) ON DELETE CASCADE,
  CONSTRAINT reservations_check_out_check CHECK (check_out > check_in),
  CONSTRAINT reservations_client_name_check CHECK (length(client_name) >= 2)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_reservations_owner ON public.reservations USING btree (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_gite ON public.reservations USING btree (gite_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON public.reservations USING btree (check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations USING btree (owner_user_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_ical_uid ON public.reservations USING btree (ical_uid) WHERE ical_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_last_seen ON public.reservations USING btree (last_seen_in_ical) 
  WHERE source = 'ical' AND manual_override = false;

-- Triggers reservations (calculer restant, sync aliases, sync nom gîte)
CREATE OR REPLACE FUNCTION trigger_calculate_restant()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync aliases montant/total_price
    IF NEW.total_price IS NOT NULL THEN NEW.montant := NEW.total_price; END IF;
    IF NEW.montant IS NOT NULL AND NEW.total_price IS NULL THEN NEW.total_price := NEW.montant; END IF;
    
    -- Sync aliases acompte/paid_amount
    IF NEW.paid_amount IS NOT NULL THEN NEW.acompte := NEW.paid_amount; END IF;
    IF NEW.acompte IS NOT NULL AND NEW.paid_amount IS NULL THEN NEW.paid_amount := NEW.acompte; END IF;
    
    -- Calculer restant
    IF NEW.montant IS NOT NULL AND NEW.acompte IS NOT NULL THEN
        NEW.restant := NEW.montant - NEW.acompte;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_sync_gite_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.gite_id IS NOT NULL THEN
        SELECT name INTO NEW.gite FROM gites WHERE id = NEW.gite_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_sync_aliases()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync platform <-> plateforme
    IF NEW.platform IS NOT NULL AND NEW.plateforme IS NULL THEN NEW.plateforme := NEW.platform; END IF;
    IF NEW.plateforme IS NOT NULL AND NEW.platform IS NULL THEN NEW.platform := NEW.plateforme; END IF;
    
    -- Sync guest_count <-> nb_personnes
    IF NEW.guest_count IS NOT NULL AND NEW.nb_personnes IS NULL THEN NEW.nb_personnes := NEW.guest_count; END IF;
    IF NEW.nb_personnes IS NOT NULL AND NEW.guest_count IS NULL THEN NEW.guest_count := NEW.nb_personnes; END IF;
    
    -- Sync client_phone <-> telephone
    IF NEW.client_phone IS NOT NULL AND NEW.telephone IS NULL THEN NEW.telephone := NEW.client_phone; END IF;
    IF NEW.telephone IS NOT NULL AND NEW.client_phone IS NULL THEN NEW.client_phone := NEW.telephone; END IF;
    
    -- Sync client_address <-> provenance
    IF NEW.client_address IS NOT NULL AND NEW.provenance IS NULL THEN NEW.provenance := NEW.client_address; END IF;
    IF NEW.provenance IS NOT NULL AND NEW.client_address IS NULL THEN NEW.client_address := NEW.provenance; END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_restant_reservations ON public.reservations;
CREATE TRIGGER trigger_calculate_restant_reservations
    BEFORE INSERT OR UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION trigger_calculate_restant();

DROP TRIGGER IF EXISTS trigger_sync_gite_name_reservations ON public.reservations;
CREATE TRIGGER trigger_sync_gite_name_reservations
    BEFORE INSERT OR UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION trigger_sync_gite_name();

DROP TRIGGER IF EXISTS trigger_sync_aliases_reservations ON public.reservations;
CREATE TRIGGER trigger_sync_aliases_reservations
    BEFORE INSERT OR UPDATE ON public.reservations
    FOR EACH ROW EXECUTE FUNCTION trigger_sync_aliases();

-- ================================================================
-- 📋 GROUPE 2: FICHES CLIENTS (5 tables)
-- ================================================================

-- --------------------------------------------------------------
-- TABLE 3: infos_gites (119 colonnes bilingues FR/EN)
-- --------------------------------------------------------------
-- Structure trop longue - Utiliser le script existant: sql/fix_infos_gites_table.sql
-- Référence: DESCRIPTION_COMPLETE_SITE.md section "infos_gites"
-- TODO: Intégrer ici ou exécuter séparément

-- --------------------------------------------------------------
-- TABLE 4: checklist_templates
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  gite_id UUID NULL,
  type TEXT NOT NULL,
  ordre INTEGER NULL DEFAULT 1,
  texte TEXT NOT NULL,
  texte_en TEXT NULL, -- Bilingue ajout 23/01/2026
  description TEXT NULL,
  description_en TEXT NULL, -- Bilingue ajout 23/01/2026
  actif BOOLEAN NULL DEFAULT true,
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  
  CONSTRAINT checklist_templates_pkey PRIMARY KEY (id),
  CONSTRAINT checklist_templates_owner_user_id_fkey FOREIGN KEY (owner_user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT checklist_templates_gite_id_fkey FOREIGN KEY (gite_id) 
    REFERENCES gites(id) ON DELETE CASCADE,
  CONSTRAINT checklist_templates_type_check CHECK (type = ANY(ARRAY['entree'::text, 'sortie'::text]))
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_checklist_templates_owner ON public.checklist_templates USING btree (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_gite ON public.checklist_templates USING btree (gite_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_type ON public.checklist_templates USING btree (type);
CREATE INDEX IF NOT EXISTS idx_checklist_translations ON public.checklist_templates USING btree (texte_en, description_en);

-- --------------------------------------------------------------
-- TABLE 5: checklist_progress
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.checklist_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  reservation_id UUID NOT NULL,
  template_id UUID NOT NULL,
  completed BOOLEAN NULL DEFAULT false,
  completed_at TIMESTAMPTZ NULL,
  completed_by UUID NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  
  CONSTRAINT checklist_progress_pkey PRIMARY KEY (id),
  CONSTRAINT checklist_progress_reservation_id_template_id_key UNIQUE (reservation_id, template_id),
  CONSTRAINT checklist_progress_completed_by_fkey FOREIGN KEY (completed_by) 
    REFERENCES auth.users(id),
  CONSTRAINT checklist_progress_owner_user_id_fkey FOREIGN KEY (owner_user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT checklist_progress_reservation_id_fkey FOREIGN KEY (reservation_id) 
    REFERENCES reservations(id) ON DELETE CASCADE,
  CONSTRAINT checklist_progress_template_id_fkey FOREIGN KEY (template_id) 
    REFERENCES checklist_templates(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_checklist_progress_owner ON public.checklist_progress USING btree (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_progress_resa ON public.checklist_progress USING btree (reservation_id);
CREATE INDEX IF NOT EXISTS idx_checklist_progress_template ON public.checklist_progress USING btree (template_id);

-- --------------------------------------------------------------
-- TABLE 6: faq
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faq (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  gite_id UUID NULL,
  question TEXT NOT NULL,
  question_en TEXT NULL, -- Bilingue ajout 23/01/2026
  answer TEXT NULL,
  answer_en TEXT NULL, -- Bilingue ajout 23/01/2026
  reponse_en TEXT NULL, -- Alias obsolète
  category TEXT NULL,
  categorie TEXT NULL, -- Alias
  priority INTEGER NULL DEFAULT 0,
  ordre INTEGER NULL DEFAULT 0, -- Alias
  is_visible BOOLEAN NULL DEFAULT true,
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  
  CONSTRAINT faq_pkey PRIMARY KEY (id),
  CONSTRAINT faq_owner_user_id_fkey FOREIGN KEY (owner_user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT faq_gite_id_fkey FOREIGN KEY (gite_id) 
    REFERENCES gites(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_faq_owner ON public.faq USING btree (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_faq_gite ON public.faq USING btree (gite_id);
CREATE INDEX IF NOT EXISTS idx_faq_category ON public.faq USING btree (category);
CREATE INDEX IF NOT EXISTS idx_faq_priority ON public.faq USING btree (priority);
CREATE INDEX IF NOT EXISTS idx_faq_translations ON public.faq USING btree (question_en, reponse_en);
CREATE INDEX IF NOT EXISTS idx_faq_categorie ON public.faq USING btree (categorie);
CREATE INDEX IF NOT EXISTS idx_faq_ordre ON public.faq USING btree (ordre);

-- --------------------------------------------------------------
-- TABLE 7: client_access_tokens
-- --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  reservation_id UUID NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NULL DEFAULT true,
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  
  CONSTRAINT client_access_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT client_access_tokens_token_key UNIQUE (token),
  CONSTRAINT client_access_tokens_owner_user_id_fkey FOREIGN KEY (owner_user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT client_access_tokens_reservation_id_fkey FOREIGN KEY (reservation_id) 
    REFERENCES reservations(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_tokens_owner ON public.client_access_tokens USING btree (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_token ON public.client_access_tokens USING btree (token);

-- ================================================================
-- 📋 GROUPE 3: GESTION MÉNAGE (2 tables)
-- ================================================================

-- Suite dans le prochain message (limite de tokens)...
