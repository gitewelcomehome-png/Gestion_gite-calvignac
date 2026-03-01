-- ═══════════════════════════════════════════════════════════════════
-- RECRÉATION TABLE retours_menage
-- Supprimée le 23/01/2026 par nettoyage BDD mais toujours utilisée par :
--   - pages/femme-menage.html (envoi de retours)
--   - tabs/tab-menage.html (affichage des retours dans le dashboard)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS retours_menage (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_by     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id         UUID NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    date_menage     DATE NOT NULL,
    commentaires    TEXT,
    validated       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour accélérer les requêtes de chargement
CREATE INDEX IF NOT EXISTS idx_retours_menage_owner   ON retours_menage(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_retours_menage_date    ON retours_menage(date_menage DESC);
CREATE INDEX IF NOT EXISTS idx_retours_menage_gite    ON retours_menage(gite_id);

-- ═══ RLS ═══
ALTER TABLE retours_menage ENABLE ROW LEVEL SECURITY;

-- Le propriétaire (owner) voit et gère tous les retours de ses gîtes
CREATE POLICY "owner_full_access" ON retours_menage
    FOR ALL
    USING (owner_user_id = auth.uid())
    WITH CHECK (owner_user_id = auth.uid());

-- La femme de ménage peut insérer et lire ses propres retours
CREATE POLICY "reporter_insert_read" ON retours_menage
    FOR ALL
    USING (reported_by = auth.uid())
    WITH CHECK (reported_by = auth.uid());
