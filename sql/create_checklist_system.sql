-- ================================================
-- SYSTÈME DE GESTION DES CHECKLISTS ENTRÉE/SORTIE
-- ================================================

-- Table des templates de checklist (items à créer par le gestionnaire)
CREATE TABLE IF NOT EXISTS checklist_templates (
    id SERIAL PRIMARY KEY,
    gite TEXT NOT NULL CHECK (gite IN ('Trevoux', 'Couzon')),
    type TEXT NOT NULL CHECK (type IN ('entree', 'sortie')),
    ordre INTEGER NOT NULL DEFAULT 0,
    texte TEXT NOT NULL,
    description TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de progression des checklists par réservation
CREATE TABLE IF NOT EXISTS checklist_progress (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER NOT NULL,
    template_id INTEGER NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reservation_id, template_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_checklist_templates_gite ON checklist_templates(gite);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_type ON checklist_templates(type);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_actif ON checklist_templates(actif);
CREATE INDEX IF NOT EXISTS idx_checklist_progress_reservation ON checklist_progress(reservation_id);
CREATE INDEX IF NOT EXISTS idx_checklist_progress_template ON checklist_progress(template_id);

-- Désactiver RLS
ALTER TABLE checklist_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_progress DISABLE ROW LEVEL SECURITY;

-- Données de démo (à supprimer après test)
INSERT INTO checklist_templates (gite, type, ordre, texte, description) VALUES
('Trevoux', 'entree', 1, 'Vérifier l''état général du logement', 'Inspection visuelle à l''arrivée'),
('Trevoux', 'entree', 2, 'Tester le WiFi', 'Se connecter au réseau'),
('Trevoux', 'entree', 3, 'Localiser les extincteurs', 'Sécurité'),
('Trevoux', 'sortie', 1, 'Sortir les poubelles', 'Dans les containers extérieurs'),
('Trevoux', 'sortie', 2, 'Fermer toutes les fenêtres', 'Vérifier chaque pièce'),
('Trevoux', 'sortie', 3, 'Éteindre tous les appareils', 'Chauffage, lumières, TV'),
('Couzon', 'entree', 1, 'Vérifier l''état général du logement', 'Inspection visuelle à l''arrivée'),
('Couzon', 'entree', 2, 'Tester le WiFi', 'Se connecter au réseau'),
('Couzon', 'entree', 3, 'Localiser les extincteurs', 'Sécurité'),
('Couzon', 'sortie', 1, 'Sortir les poubelles', 'Dans les containers extérieurs'),
('Couzon', 'sortie', 2, 'Fermer toutes les fenêtres', 'Vérifier chaque pièce'),
('Couzon', 'sortie', 3, 'Éteindre tous les appareils', 'Chauffage, lumières, TV')
ON CONFLICT DO NOTHING;

-- Commentaires
COMMENT ON TABLE checklist_templates IS 'Templates des items de checklist créés par le gestionnaire';
COMMENT ON TABLE checklist_progress IS 'Progression des checklists par réservation (côté client)';
COMMENT ON COLUMN checklist_templates.gite IS 'Gîte concerné: Trevoux ou Couzon';
COMMENT ON COLUMN checklist_templates.type IS 'Type de checklist: entree ou sortie';
COMMENT ON COLUMN checklist_templates.ordre IS 'Ordre d''affichage';
COMMENT ON COLUMN checklist_progress.completed IS 'Item coché par le client';
