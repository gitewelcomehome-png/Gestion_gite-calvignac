-- ============================================
-- SYSTÈME DE FICHES CLIENTS INTERACTIVES
-- Tables pour la gestion des fiches personnalisées par réservation
-- ============================================

-- ============================================
-- TABLE 1 : Informations générales des gîtes
-- ============================================
CREATE TABLE IF NOT EXISTS public.infos_gites (
  id SERIAL PRIMARY KEY,
  gite TEXT NOT NULL UNIQUE CHECK (gite = ANY (ARRAY['Trévoux', 'Couzon'])),
  
  -- Accès
  code_entree TEXT NOT NULL,
  instructions_acces_fr TEXT NOT NULL,
  instructions_acces_en TEXT NOT NULL,
  adresse_complete TEXT NOT NULL,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  google_maps_link TEXT,
  
  -- WiFi
  wifi_ssid TEXT NOT NULL,
  wifi_password TEXT NOT NULL,
  wifi_qr_code_url TEXT, -- URL Cloudinary/Supabase Storage
  
  -- Horaires
  heure_arrivee_standard TIME DEFAULT '18:00',
  heure_depart_standard TIME DEFAULT '10:00',
  heure_arrivee_anticipee_min TIME DEFAULT '13:00',
  heure_arrivee_avec_menage TIME DEFAULT '17:00',
  heure_depart_semaine_max TIME DEFAULT '12:00',
  heure_depart_dimanche_max TIME DEFAULT '17:00',
  
  -- Règles en français
  reglement_interieur_fr TEXT,
  consignes_tri_fr TEXT,
  consignes_chauffage_fr TEXT,
  autres_consignes_fr TEXT,
  
  -- Règles en anglais
  reglement_interieur_en TEXT,
  consignes_tri_en TEXT,
  consignes_chauffage_en TEXT,
  autres_consignes_en TEXT,
  
  -- Équipements (JSON)
  equipements JSONB DEFAULT '[]'::jsonb,
  -- Ex: [{"nom_fr": "Lave-vaisselle", "nom_en": "Dishwasher", "icone": "🍽️"}]
  
  -- Contacts urgence (JSON)
  contacts_urgence JSONB DEFAULT '[]'::jsonb,
  -- Ex: [{"nom": "Propriétaire", "telephone": "+33...", "type": "urgence"}]
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger update timestamp
CREATE OR REPLACE FUNCTION update_infos_gites_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_infos_gites_timestamp ON infos_gites;
CREATE TRIGGER set_infos_gites_timestamp
BEFORE UPDATE ON infos_gites
FOR EACH ROW EXECUTE FUNCTION update_infos_gites_timestamp();


-- ============================================
-- TABLE 2 : Checklists (entrée/sortie)
-- ============================================
CREATE TABLE IF NOT EXISTS public.checklists (
  id SERIAL PRIMARY KEY,
  gite TEXT NOT NULL CHECK (gite = ANY (ARRAY['Trévoux', 'Couzon'])),
  type TEXT NOT NULL CHECK (type = ANY (ARRAY['entree', 'sortie'])),
  
  -- Contenu bilingue
  item_fr TEXT NOT NULL,
  item_en TEXT NOT NULL,
  
  ordre INTEGER NOT NULL,
  obligatoire BOOLEAN DEFAULT false,
  actif BOOLEAN DEFAULT true, -- Permet de désactiver sans supprimer
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(gite, type, ordre)
);

CREATE INDEX IF NOT EXISTS idx_checklists_gite_type ON checklists(gite, type, ordre);


-- ============================================
-- TABLE 3 : Validations checklists par client
-- ============================================
CREATE TABLE IF NOT EXISTS public.checklist_validations (
  id SERIAL PRIMARY KEY,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  checklist_id INTEGER NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  validated BOOLEAN DEFAULT false,
  validated_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(reservation_id, checklist_id)
);

CREATE INDEX IF NOT EXISTS idx_checklist_validations_reservation ON checklist_validations(reservation_id);


-- ============================================
-- TABLE 4 : Demandes horaires (arrivée/départ)
-- ============================================
CREATE TABLE IF NOT EXISTS public.demandes_horaires (
  id SERIAL PRIMARY KEY,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type = ANY (ARRAY['arrivee_anticipee', 'depart_tardif'])),
  
  heure_demandee TIME NOT NULL,
  motif TEXT,
  
  -- Statut
  status TEXT DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'approved', 'refused'])),
  raison_refus TEXT,
  note_admin TEXT, -- Note interne non visible client
  
  -- Validation
  validated_by TEXT, -- Email de l'admin
  validated_at TIMESTAMP WITH TIME ZONE,
  
  -- Calcul automatique de faisabilité
  automatiquement_approuvable BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demandes_horaires_reservation ON demandes_horaires(reservation_id);
CREATE INDEX IF NOT EXISTS idx_demandes_horaires_status ON demandes_horaires(status);


-- ============================================
-- TABLE 5 : Retours clients
-- ============================================
CREATE TABLE IF NOT EXISTS public.retours_clients (
  id SERIAL PRIMARY KEY,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type = ANY (ARRAY['demande', 'retour', 'amelioration', 'probleme'])),
  sujet TEXT NOT NULL,
  description TEXT NOT NULL,
  
  urgence TEXT DEFAULT 'normale' CHECK (urgence = ANY (ARRAY['basse', 'normale', 'haute'])),
  status TEXT DEFAULT 'nouveau' CHECK (status = ANY (ARRAY['nouveau', 'en_cours', 'resolu', 'archive'])),
  
  -- Réponse admin
  reponse TEXT,
  traite_par TEXT, -- Email admin
  traite_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retours_clients_reservation ON retours_clients(reservation_id);
CREATE INDEX IF NOT EXISTS idx_retours_clients_status ON retours_clients(status);
CREATE INDEX IF NOT EXISTS idx_retours_clients_urgence ON retours_clients(urgence, status);


-- ============================================
-- TABLE 6 : Tokens d'accès client (sécurité)
-- ============================================
CREATE TABLE IF NOT EXISTS public.client_access_tokens (
  id SERIAL PRIMARY KEY,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(reservation_id)
);

CREATE INDEX IF NOT EXISTS idx_client_tokens_token ON client_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_client_tokens_expiry ON client_access_tokens(expires_at);


-- ============================================
-- TABLE 7 : Logs génération fiches
-- ============================================
CREATE TABLE IF NOT EXISTS public.fiche_generation_logs (
  id SERIAL PRIMARY KEY,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  
  type_generation TEXT NOT NULL CHECK (type_generation = ANY (ARRAY['html', 'whatsapp', 'email'])),
  generated_by TEXT, -- Email admin
  
  -- URL générée
  fiche_url TEXT,
  
  -- Statistiques
  opened_count INTEGER DEFAULT 0,
  last_opened_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fiche_logs_reservation ON fiche_generation_logs(reservation_id);


-- ============================================
-- TABLE 8 : Statistiques activités consultées
-- ============================================
CREATE TABLE IF NOT EXISTS public.activites_consultations (
  id SERIAL PRIMARY KEY,
  activite_id BIGINT NOT NULL REFERENCES activites_gites(id) ON DELETE CASCADE,
  reservation_id BIGINT REFERENCES reservations(id) ON DELETE SET NULL,
  
  action TEXT NOT NULL CHECK (action = ANY (ARRAY['view', 'click_maps', 'click_website', 'click_phone'])),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activites_consultations_activite ON activites_consultations(activite_id);
CREATE INDEX IF NOT EXISTS idx_activites_consultations_date ON activites_consultations(created_at);


-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Insérer les infos par défaut pour les 2 gîtes
INSERT INTO public.infos_gites (
  gite, 
  code_entree, 
  instructions_acces_fr, 
  instructions_acces_en,
  adresse_complete,
  latitude,
  longitude,
  wifi_ssid,
  wifi_password
) VALUES 
(
  'Trévoux',
  '1234A',
  'À compléter : Instructions détaillées d''accès au gîte Trévoux',
  'To complete: Detailed access instructions for Trévoux cottage',
  'Adresse complète Trévoux à renseigner',
  45.9423,
  4.7681,
  'WiFi-Trevoux',
  'motdepasse'
),
(
  'Couzon',
  '5678B',
  'À compléter : Instructions détaillées d''accès au gîte Couzon',
  'To complete: Detailed access instructions for Couzon cottage',
  'Adresse complète Couzon à renseigner',
  45.8456,
  4.8234,
  'WiFi-Couzon',
  'motdepasse'
)
ON CONFLICT (gite) DO NOTHING;


-- Exemples de checklists d'entrée
INSERT INTO public.checklists (gite, type, item_fr, item_en, ordre, obligatoire) VALUES
('Trévoux', 'entree', 'Vérifier que toutes les clés sont présentes', 'Check that all keys are present', 1, true),
('Trévoux', 'entree', 'Localiser les extincteurs', 'Locate fire extinguishers', 2, true),
('Trévoux', 'entree', 'Tester le WiFi', 'Test WiFi connection', 3, false),
('Trévoux', 'entree', 'Vérifier le fonctionnement du chauffage', 'Check heating system', 4, false),
('Trévoux', 'entree', 'Repérer les poubelles de tri', 'Locate recycling bins', 5, false),

('Couzon', 'entree', 'Vérifier que toutes les clés sont présentes', 'Check that all keys are present', 1, true),
('Couzon', 'entree', 'Localiser les extincteurs', 'Locate fire extinguishers', 2, true),
('Couzon', 'entree', 'Tester le WiFi', 'Test WiFi connection', 3, false),
('Couzon', 'entree', 'Vérifier le fonctionnement du chauffage', 'Check heating system', 4, false),
('Couzon', 'entree', 'Repérer les poubelles de tri', 'Locate recycling bins', 5, false)
ON CONFLICT (gite, type, ordre) DO NOTHING;


-- Exemples de checklists de sortie
INSERT INTO public.checklists (gite, type, item_fr, item_en, ordre, obligatoire) VALUES
('Trévoux', 'sortie', 'Vider tous les réfrigérateurs', 'Empty all refrigerators', 1, true),
('Trévoux', 'sortie', 'Éteindre tous les appareils électriques', 'Turn off all electrical appliances', 2, true),
('Trévoux', 'sortie', 'Fermer toutes les fenêtres', 'Close all windows', 3, true),
('Trévoux', 'sortie', 'Sortir toutes les poubelles', 'Take out all trash', 4, true),
('Trévoux', 'sortie', 'Remettre les clés dans la boîte à clés', 'Return keys to key box', 5, true),

('Couzon', 'sortie', 'Vider tous les réfrigérateurs', 'Empty all refrigerators', 1, true),
('Couzon', 'sortie', 'Éteindre tous les appareils électriques', 'Turn off all electrical appliances', 2, true),
('Couzon', 'sortie', 'Fermer toutes les fenêtres', 'Close all windows', 3, true),
('Couzon', 'sortie', 'Sortir toutes les poubelles', 'Take out all trash', 4, true),
('Couzon', 'sortie', 'Remettre les clés dans la boîte à clés', 'Return keys to key box', 5, true)
ON CONFLICT (gite, type, ordre) DO NOTHING;


-- ============================================
-- RLS (Row Level Security) - À activer selon besoins
-- ============================================

-- Activer RLS sur les tables sensibles
ALTER TABLE public.client_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiche_generation_logs ENABLE ROW LEVEL SECURITY;

-- Policy : Les clients peuvent accéder uniquement avec un token valide
-- Note : À implémenter selon votre système d'authentification

COMMENT ON TABLE infos_gites IS 'Informations générales et configuration pour chaque gîte';
COMMENT ON TABLE checklists IS 'Items des checklists d''entrée et sortie par gîte';
COMMENT ON TABLE checklist_validations IS 'Validation des checklists par les clients pour chaque réservation';
COMMENT ON TABLE demandes_horaires IS 'Demandes d''arrivée anticipée ou départ tardif des clients';
COMMENT ON TABLE retours_clients IS 'Retours, demandes et problèmes signalés par les clients';
COMMENT ON TABLE client_access_tokens IS 'Tokens sécurisés pour l''accès des clients à leur fiche personnalisée';
COMMENT ON TABLE fiche_generation_logs IS 'Historique des générations de fiches clients';
COMMENT ON TABLE activites_consultations IS 'Statistiques de consultation des activités par les clients';
