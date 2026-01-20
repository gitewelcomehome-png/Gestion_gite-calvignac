-- ================================================================
-- AJOUT DES TABLES CHECKLIST_TEMPLATES ET CHECKLIST_PROGRESS
-- Date: 2026-01-14
-- ================================================================

-- Supprimer les tables si elles existent déjà (pour recréer proprement)
DROP TABLE IF EXISTS checklist_progress CASCADE;
DROP TABLE IF EXISTS checklist_templates CASCADE;

-- TABLE: CHECKLIST_TEMPLATES
-- Templates de checklist pour les entrées/sorties par gîte
CREATE TABLE checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('entree', 'sortie')),
    ordre INTEGER NOT NULL DEFAULT 1,
    texte TEXT NOT NULL,
    description TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklist_templates_owner ON checklist_templates(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_gite ON checklist_templates(gite_id);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_type ON checklist_templates(type);

-- TABLE: CHECKLIST_PROGRESS
-- Progression des checklists par réservation
CREATE TABLE checklist_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reservation_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_checklist_progress_owner ON checklist_progress(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_progress_resa ON checklist_progress(reservation_id);
CREATE INDEX IF NOT EXISTS idx_checklist_progress_template ON checklist_progress(template_id);

-- ACTIVATION ROW LEVEL SECURITY
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_progress ENABLE ROW LEVEL SECURITY;

-- POLICIES RLS
DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_checklist_templates ON checklist_templates;
    CREATE POLICY rgpd_all_own_checklist_templates ON checklist_templates 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS rgpd_all_own_checklist_progress ON checklist_progress;
    CREATE POLICY rgpd_all_own_checklist_progress ON checklist_progress 
    FOR ALL USING (owner_user_id = auth.uid());
END $$;
