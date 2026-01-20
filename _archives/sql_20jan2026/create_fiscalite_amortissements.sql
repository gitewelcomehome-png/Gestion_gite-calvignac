-- ==========================================
-- TABLE : fiscalite_amortissements
-- Stocke les lignes d'amortissement pour les années futures
-- ==========================================

CREATE TABLE IF NOT EXISTS public.fiscalite_amortissements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Informations de la ligne d'amortissement
    annee INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('travaux', 'frais', 'produits')),
    description TEXT NOT NULL,
    gite TEXT NOT NULL,
    montant NUMERIC(10,2) NOT NULL,
    
    -- Traçabilité de l'origine de l'amortissement
    amortissement_origine JSONB,
    -- Structure du JSONB :
    -- {
    --   "annee_origine": 2026,
    --   "duree": 3,
    --   "montant_total": 2000
    -- }
    
    -- Audit
    user_id UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_fiscalite_amortissements_annee ON public.fiscalite_amortissements(annee);
CREATE INDEX IF NOT EXISTS idx_fiscalite_amortissements_type ON public.fiscalite_amortissements(type);
CREATE INDEX IF NOT EXISTS idx_fiscalite_amortissements_user ON public.fiscalite_amortissements(user_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_fiscalite_amortissements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fiscalite_amortissements_updated_at
    BEFORE UPDATE ON public.fiscalite_amortissements
    FOR EACH ROW
    EXECUTE FUNCTION update_fiscalite_amortissements_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.fiscalite_amortissements ENABLE ROW LEVEL SECURITY;

-- Policy : Un utilisateur ne peut voir que ses propres amortissements
CREATE POLICY "Users can view their own amortissements"
    ON public.fiscalite_amortissements
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy : Un utilisateur peut insérer ses propres amortissements
CREATE POLICY "Users can insert their own amortissements"
    ON public.fiscalite_amortissements
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy : Un utilisateur peut modifier ses propres amortissements
CREATE POLICY "Users can update their own amortissements"
    ON public.fiscalite_amortissements
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy : Un utilisateur peut supprimer ses propres amortissements
CREATE POLICY "Users can delete their own amortissements"
    ON public.fiscalite_amortissements
    FOR DELETE
    USING (auth.uid() = user_id);

-- Commentaires
COMMENT ON TABLE public.fiscalite_amortissements IS 'Stocke les lignes d''amortissement automatiques pour les années futures';
COMMENT ON COLUMN public.fiscalite_amortissements.annee IS 'Année fiscale concernée par cette ligne d''amortissement';
COMMENT ON COLUMN public.fiscalite_amortissements.type IS 'Type de dépense : travaux, frais divers ou produits d''accueil';
COMMENT ON COLUMN public.fiscalite_amortissements.amortissement_origine IS 'Informations sur l''origine de l''amortissement (année, durée, montant total)';
