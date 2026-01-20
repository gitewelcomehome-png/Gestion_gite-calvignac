-- ================================================================
-- TABLE : linen_needs (Configuration des besoins par gîte)
-- ================================================================
-- Stocke la configuration des besoins en linge par gîte
-- Permet items standards + items personnalisés
-- Une ligne par item par gîte
-- ================================================================

-- 1. Créer la table
CREATE TABLE IF NOT EXISTS public.linen_needs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id UUID NOT NULL REFERENCES public.gites(id) ON DELETE CASCADE,
    item_key TEXT NOT NULL, -- Ex: 'draps_plats_grands' ou 'custom_item_1234567890_1'
    item_label TEXT NOT NULL, -- Ex: 'Draps plats grands' ou nom personnalisé
    quantity INTEGER NOT NULL DEFAULT 0,
    is_custom BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Un item_key unique par gîte
    UNIQUE(gite_id, item_key)
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_linen_needs_owner ON public.linen_needs(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_linen_needs_gite ON public.linen_needs(gite_id);
CREATE INDEX IF NOT EXISTS idx_linen_needs_custom ON public.linen_needs(is_custom);

-- 3. RLS : Enable Row Level Security
ALTER TABLE public.linen_needs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy : Lecture/Écriture pour l'utilisateur propriétaire
DROP POLICY IF EXISTS "Users can manage their own linen needs" ON public.linen_needs;
CREATE POLICY "Users can manage their own linen needs"
    ON public.linen_needs
    FOR ALL
    USING (auth.uid() = owner_user_id)
    WITH CHECK (auth.uid() = owner_user_id);

-- 5. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_linen_needs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_linen_needs_updated_at ON public.linen_needs;
CREATE TRIGGER trigger_linen_needs_updated_at
    BEFORE UPDATE ON public.linen_needs
    FOR EACH ROW
    EXECUTE FUNCTION update_linen_needs_updated_at();

-- 6. Migration des données depuis gites.settings.linen_needs vers la nouvelle table
-- (Optionnel - à exécuter si vous avez déjà des données dans settings)
INSERT INTO public.linen_needs (owner_user_id, gite_id, item_key, item_label, quantity, is_custom)
SELECT 
    g.owner_user_id,
    g.id as gite_id,
    key as item_key,
    -- Conversion du key en label lisible
    CASE 
        WHEN key = 'draps_plats_grands' THEN 'Draps plats grands'
        WHEN key = 'draps_plats_petits' THEN 'Draps plats petits'
        WHEN key = 'housses_couettes_grandes' THEN 'Housses de couette grandes'
        WHEN key = 'housses_couettes_petites' THEN 'Housses de couette petites'
        WHEN key = 'taies_oreillers' THEN 'Taies d''oreillers'
        WHEN key = 'serviettes' THEN 'Serviettes'
        WHEN key = 'tapis_bain' THEN 'Tapis de bain'
        ELSE replace(initcap(replace(key, '_', ' ')), ' ', ' ')
    END as item_label,
    value::integer as quantity,
    -- Items customs sont ceux qui ne sont pas dans la liste standard
    NOT (key IN ('draps_plats_grands', 'draps_plats_petits', 'housses_couettes_grandes', 
                 'housses_couettes_petites', 'taies_oreillers', 'serviettes', 'tapis_bain')) as is_custom
FROM public.gites g,
     jsonb_each_text(g.settings->'linen_needs')
WHERE g.settings->'linen_needs' IS NOT NULL
ON CONFLICT (gite_id, item_key) DO NOTHING;

-- 7. Commentaires
COMMENT ON TABLE public.linen_needs IS 'Configuration des besoins en linge par gîte et par réservation';
COMMENT ON COLUMN public.linen_needs.item_key IS 'Clé technique unique de l''item (ex: draps_plats_grands)';
COMMENT ON COLUMN public.linen_needs.item_label IS 'Libellé affiché à l''utilisateur (modifiable)';
COMMENT ON COLUMN public.linen_needs.quantity IS 'Quantité nécessaire par réservation';
COMMENT ON COLUMN public.linen_needs.is_custom IS 'TRUE si item personnalisé, FALSE si item standard';
