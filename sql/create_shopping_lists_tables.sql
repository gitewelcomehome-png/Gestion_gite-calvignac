-- ============================================================================
-- TABLES LISTES D'ACHATS
-- Created: 09/02/2026
-- Description: Système de gestion des listes d'achats pour l'application mobile
-- ============================================================================

-- Table des listes d'achats
CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'validé')),
    validated_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table des items de liste d'achats
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    is_checked BOOLEAN NOT NULL DEFAULT FALSE,
    added_by TEXT NULL, -- 'femme_menage', 'proprietaire'
    gite_id UUID NULL REFERENCES public.gites(id) ON DELETE SET NULL,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_shopping_lists_owner ON public.shopping_lists(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_status ON public.shopping_lists(status);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list ON public.shopping_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_checked ON public.shopping_list_items(is_checked);

-- Row Level Security (RLS)
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Policies pour shopping_lists
DROP POLICY IF EXISTS "Users can view their own shopping lists" ON public.shopping_lists;
CREATE POLICY "Users can view their own shopping lists"
    ON public.shopping_lists FOR SELECT
    USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can insert their own shopping lists" ON public.shopping_lists;
CREATE POLICY "Users can insert their own shopping lists"
    ON public.shopping_lists FOR INSERT
    WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can update their own shopping lists" ON public.shopping_lists;
CREATE POLICY "Users can update their own shopping lists"
    ON public.shopping_lists FOR UPDATE
    USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can delete their own shopping lists" ON public.shopping_lists;
CREATE POLICY "Users can delete their own shopping lists"
    ON public.shopping_lists FOR DELETE
    USING (auth.uid() = owner_user_id);

-- Policies pour shopping_list_items
DROP POLICY IF EXISTS "Users can view items of their shopping lists" ON public.shopping_list_items;
CREATE POLICY "Users can view items of their shopping lists"
    ON public.shopping_list_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = shopping_list_items.list_id
            AND shopping_lists.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert items to their shopping lists" ON public.shopping_list_items;
CREATE POLICY "Users can insert items to their shopping lists"
    ON public.shopping_list_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = shopping_list_items.list_id
            AND shopping_lists.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update items of their shopping lists" ON public.shopping_list_items;
CREATE POLICY "Users can update items of their shopping lists"
    ON public.shopping_list_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = shopping_list_items.list_id
            AND shopping_lists.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete items of their shopping lists" ON public.shopping_list_items;
CREATE POLICY "Users can delete items of their shopping lists"
    ON public.shopping_list_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = shopping_list_items.list_id
            AND shopping_lists.owner_user_id = auth.uid()
        )
    );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_shopping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_shopping_lists_updated_at ON public.shopping_lists;
CREATE TRIGGER update_shopping_lists_updated_at
    BEFORE UPDATE ON public.shopping_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_shopping_updated_at();

DROP TRIGGER IF EXISTS update_shopping_list_items_updated_at ON public.shopping_list_items;
CREATE TRIGGER update_shopping_list_items_updated_at
    BEFORE UPDATE ON public.shopping_list_items
    FOR EACH ROW
    EXECUTE FUNCTION update_shopping_updated_at();

-- Permissions pour PostgREST
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_lists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_list_items TO authenticated;

-- Commentaires
COMMENT ON TABLE public.shopping_lists IS 'Listes d''achats pour l''application mobile';
COMMENT ON TABLE public.shopping_list_items IS 'Items des listes d''achats';
COMMENT ON COLUMN public.shopping_lists.status IS 'Statut: en_cours ou validé';
COMMENT ON COLUMN public.shopping_list_items.added_by IS 'Source de l''ajout: femme_menage ou proprietaire';
