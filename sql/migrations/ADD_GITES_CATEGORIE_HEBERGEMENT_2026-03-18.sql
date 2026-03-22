-- ============================================================
-- Migration : Ajout colonne categorie_hebergement sur gites
-- Date      : 2026-03-18
-- Objectif  : Distinguer gîtes et chambres d'hôtes
--             (impacts fiscaux et affichage différents)
-- Valeurs   : 'gite' (défaut) | 'chambre_hotes'
-- ============================================================

ALTER TABLE public.gites
    ADD COLUMN IF NOT EXISTS categorie_hebergement TEXT DEFAULT 'gite';

-- Contrainte de validation des valeurs acceptées
ALTER TABLE public.gites
    DROP CONSTRAINT IF EXISTS gites_categorie_hebergement_check;

ALTER TABLE public.gites
    ADD CONSTRAINT gites_categorie_hebergement_check
        CHECK (categorie_hebergement IN ('gite', 'chambre_hotes'));

-- Tous les gîtes existants sont des gîtes par défaut
UPDATE public.gites
    SET categorie_hebergement = 'gite'
    WHERE categorie_hebergement IS NULL;

-- Index pour les requêtes filtrées par catégorie
CREATE INDEX IF NOT EXISTS idx_gites_categorie_hebergement
    ON public.gites(categorie_hebergement);

-- Commentaire
COMMENT ON COLUMN public.gites.categorie_hebergement
    IS 'Catégorie d''hébergement : gite | chambre_hotes. Impacte le régime fiscal applicable.';
