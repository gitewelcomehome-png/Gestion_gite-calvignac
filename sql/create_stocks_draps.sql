-- ============================================================================
-- TABLE STOCKS DRAPS - GESTION DES RÉSERVES DE LINGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS stocks_draps (
    id SERIAL PRIMARY KEY,
    gite TEXT NOT NULL CHECK (gite IN ('trévoux', 'couzon')),
    draps_plats_grands INTEGER DEFAULT 0,
    draps_plats_petits INTEGER DEFAULT 0,
    housses_couettes_grandes INTEGER DEFAULT 0,
    housses_couettes_petites INTEGER DEFAULT 0,
    taies_oreillers INTEGER DEFAULT 0,
    serviettes INTEGER DEFAULT 0,
    tapis_bain INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(gite)
);

-- Commentaires
COMMENT ON TABLE stocks_draps IS 'Stock de draps et linge pour chaque gîte';
COMMENT ON COLUMN stocks_draps.gite IS 'Nom du gîte (trévoux ou couzon)';
COMMENT ON COLUMN stocks_draps.draps_plats_grands IS 'Nombre de draps plats pour lits doubles';
COMMENT ON COLUMN stocks_draps.draps_plats_petits IS 'Nombre de draps plats pour lits simples';
COMMENT ON COLUMN stocks_draps.housses_couettes_grandes IS 'Nombre de housses de couette grandes';
COMMENT ON COLUMN stocks_draps.housses_couettes_petites IS 'Nombre de housses de couette petites';
COMMENT ON COLUMN stocks_draps.taies_oreillers IS 'Nombre de taies d''oreillers';
COMMENT ON COLUMN stocks_draps.serviettes IS 'Nombre de serviettes';
COMMENT ON COLUMN stocks_draps.tapis_bain IS 'Nombre de tapis de bain';

-- Insertion données initiales
INSERT INTO stocks_draps (gite, draps_plats_grands, draps_plats_petits, housses_couettes_grandes, housses_couettes_petites, taies_oreillers, serviettes, tapis_bain)
VALUES 
    ('trévoux', 0, 0, 0, 0, 0, 0, 0),
    ('couzon', 0, 0, 0, 0, 0, 0, 0)
ON CONFLICT (gite) DO NOTHING;

-- Désactiver RLS pour faciliter l'accès
ALTER TABLE stocks_draps DISABLE ROW LEVEL SECURITY;
