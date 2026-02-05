-- ================================================================
-- AJOUT CHAMPS ADRESSE À cm_clients
-- Note: La colonne email s'appelle 'email_principal' dans la table
-- ================================================================

ALTER TABLE public.cm_clients
ADD COLUMN IF NOT EXISTS adresse TEXT,
ADD COLUMN IF NOT EXISTS code_postal TEXT,
ADD COLUMN IF NOT EXISTS ville TEXT,
ADD COLUMN IF NOT EXISTS pays TEXT DEFAULT 'France',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.cm_clients.adresse IS 'Adresse postale complète du client';
COMMENT ON COLUMN public.cm_clients.code_postal IS 'Code postal';
COMMENT ON COLUMN public.cm_clients.ville IS 'Ville';
COMMENT ON COLUMN public.cm_clients.pays IS 'Pays (par défaut: France)';
COMMENT ON COLUMN public.cm_clients.onboarding_completed IS 'Onboarding terminé (infos obligatoires remplies)';

-- Index pour recherche par ville
CREATE INDEX IF NOT EXISTS idx_cm_clients_ville ON public.cm_clients(ville);

-- ================================================================
-- FONCTION POUR COMPTER LES GÎTES RÉELS
-- ================================================================

CREATE OR REPLACE FUNCTION update_client_nb_gites()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour le compteur de gîtes pour ce client
    UPDATE public.cm_clients
    SET nb_gites_actuels = (
        SELECT COUNT(*)
        FROM public.gites
        WHERE owner_user_id IN (
            SELECT user_id 
            FROM public.cm_clients 
            WHERE id = NEW.client_id OR user_id = NEW.owner_user_id
        )
    )
    WHERE user_id = NEW.owner_user_id 
       OR id = NEW.client_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- TRIGGER POUR MAJ AUTO DU COMPTEUR
-- ================================================================

-- Supprimer trigger existant si présent
DROP TRIGGER IF EXISTS trigger_update_gites_count ON public.gites;

-- Créer le trigger
CREATE TRIGGER trigger_update_gites_count
AFTER INSERT OR DELETE ON public.gites
FOR EACH ROW
EXECUTE FUNCTION update_client_nb_gites();

-- ================================================================
-- MAJ IMMÉDIATE DES COMPTEURS EXISTANTS
-- ================================================================

UPDATE public.cm_clients c
SET nb_gites_actuels = (
    SELECT COUNT(*)
    FROM public.gites g
    WHERE g.owner_user_id = c.user_id
)
WHERE c.user_id IS NOT NULL;
