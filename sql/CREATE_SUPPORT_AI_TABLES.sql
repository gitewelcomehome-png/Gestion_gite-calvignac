-- ================================================================
-- 🤖 SYSTÈME IA SUPPORT - Base de connaissances & Diagnostic
-- ================================================================

-- ================================================================
-- 📚 TABLE SOLUTIONS (Base de connaissances)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.cm_support_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description_probleme TEXT NOT NULL,
  symptomes TEXT[] NOT NULL DEFAULT '{}', -- Liste de symptômes pour le matching
  tags TEXT[] NOT NULL DEFAULT '{}', -- Tags pour catégorisation
  categorie TEXT CHECK (categorie IN ('technique', 'facturation', 'fonctionnalité', 'bug', 'question', 'autre')),
  solution TEXT NOT NULL, -- Solution complète en markdown
  etapes JSONB, -- Étapes de résolution structurées [{"titre": "...", "description": "...", "code": "..."}]
  prevention TEXT, -- Conseils pour éviter le problème
  niveau_difficulte TEXT CHECK (niveau_difficulte IN ('facile', 'moyen', 'difficile')),
  temps_resolution_estime INTEGER, -- en minutes
  nb_utilisations INTEGER DEFAULT 0, -- Compteur d'utilisation
  efficacite_score DECIMAL(3,2) DEFAULT 0, -- Score 0-1 basé sur feedback
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cm_support_solutions IS 'Base de connaissances IA : problèmes connus et solutions';
COMMENT ON COLUMN public.cm_support_solutions.symptomes IS 'Symptômes pour matching sémantique IA';
COMMENT ON COLUMN public.cm_support_solutions.efficacite_score IS 'Score calculé depuis feedback clients (0-1)';

CREATE INDEX idx_cm_support_solutions_tags ON public.cm_support_solutions USING GIN(tags);
CREATE INDEX idx_cm_support_solutions_symptomes ON public.cm_support_solutions USING GIN(symptomes);
CREATE INDEX idx_cm_support_solutions_categorie ON public.cm_support_solutions(categorie);
CREATE INDEX idx_cm_support_solutions_efficacite ON public.cm_support_solutions(efficacite_score DESC);

-- ================================================================
-- 🔍 TABLE DIAGNOSTICS (Workflow guidé)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.cm_support_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.cm_support_tickets(id) ON DELETE CASCADE,
  solution_matched_id UUID REFERENCES public.cm_support_solutions(id),
  confidence_score DECIMAL(3,2), -- Score de confiance du matching (0-1)
  etape_courante INTEGER DEFAULT 1,
  questions JSONB, -- Questions du workflow [{"id": 1, "question": "...", "type": "text|choice", "options": []}]
  reponses JSONB, -- Réponses du client {"1": "...", "2": "..."}
  contexte_collecte JSONB, -- Infos techniques collectées (navigateur, OS, logs...)
  statut TEXT NOT NULL DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'terminé', 'abandonné')),
  solution_proposee TEXT, -- Solution générée par IA
  feedback_client TEXT CHECK (feedback_client IN ('résolu', 'non_résolu', 'partiellement_résolu')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cm_support_diagnostics IS 'Diagnostics guidés IA pour problèmes inconnus';
COMMENT ON COLUMN public.cm_support_diagnostics.confidence_score IS 'Confiance du matching IA (0-1)';
COMMENT ON COLUMN public.cm_support_diagnostics.contexte_collecte IS 'Contexte technique collecté automatiquement';

CREATE INDEX idx_cm_support_diagnostics_ticket ON public.cm_support_diagnostics(ticket_id);
CREATE INDEX idx_cm_support_diagnostics_statut ON public.cm_support_diagnostics(statut);
CREATE INDEX idx_cm_support_diagnostics_confidence ON public.cm_support_diagnostics(confidence_score DESC);

-- ================================================================
-- 📊 TABLE FEEDBACK SOLUTIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.cm_support_solution_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID NOT NULL REFERENCES public.cm_support_solutions(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.cm_support_tickets(id) ON DELETE CASCADE,
  utile BOOLEAN NOT NULL,
  commentaire TEXT,
  temps_resolution_reel INTEGER, -- en minutes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cm_support_solution_feedback IS 'Feedback clients sur efficacité des solutions';

CREATE INDEX idx_cm_support_solution_feedback_solution ON public.cm_support_solution_feedback(solution_id);
CREATE INDEX idx_cm_support_solution_feedback_utile ON public.cm_support_solution_feedback(utile);

-- ================================================================
-- 🔄 TRIGGER MAJ EFFICACITÉ SOLUTIONS
-- ================================================================
CREATE OR REPLACE FUNCTION update_solution_efficacy()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE cm_support_solutions
    SET 
        efficacite_score = (
            SELECT 
                COALESCE(AVG(CASE WHEN utile THEN 1.0 ELSE 0.0 END), 0)
            FROM cm_support_solution_feedback
            WHERE solution_id = NEW.solution_id
        ),
        nb_utilisations = nb_utilisations + 1,
        updated_at = NOW()
    WHERE id = NEW.solution_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_solution_efficacy
AFTER INSERT ON cm_support_solution_feedback
FOR EACH ROW
EXECUTE FUNCTION update_solution_efficacy();

-- ================================================================
-- 🔐 RLS POLICIES
-- ================================================================
ALTER TABLE public.cm_support_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cm_support_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cm_support_solution_feedback ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access solutions" ON public.cm_support_solutions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id 
            AND email = 'stephanecalvignac@hotmail.fr'
        )
    );

CREATE POLICY "Admin full access diagnostics" ON public.cm_support_diagnostics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id 
            AND email = 'stephanecalvignac@hotmail.fr'
        )
    );

CREATE POLICY "Admin full access feedback" ON public.cm_support_solution_feedback
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id 
            AND email = 'stephanecalvignac@hotmail.fr'
        )
    );

-- Clients peuvent voir solutions et leurs propres diagnostics
CREATE POLICY "Clients can view solutions" ON public.cm_support_solutions
    FOR SELECT USING (true);

CREATE POLICY "Clients can view own diagnostics" ON public.cm_support_diagnostics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cm_support_tickets t
            JOIN cm_clients c ON c.id = t.client_id
            WHERE t.id = ticket_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Clients can submit feedback" ON public.cm_support_solution_feedback
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM cm_support_tickets t
            JOIN cm_clients c ON c.id = t.client_id
            WHERE t.id = ticket_id
            AND c.user_id = auth.uid()
        )
    );

-- ================================================================
-- ✅ VÉRIFICATION
-- ================================================================
SELECT 
    schemaname,
    tablename,
    COUNT(*) as nb_policies
FROM pg_policies
WHERE tablename IN ('cm_support_solutions', 'cm_support_diagnostics', 'cm_support_solution_feedback')
GROUP BY schemaname, tablename;
