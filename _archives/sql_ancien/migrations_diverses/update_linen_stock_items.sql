-- Migration: stock de linge par type (dynamique)

-- 1) Table pour stocker les quantités par type et par gîte
CREATE TABLE IF NOT EXISTS linen_stock_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gite_id uuid NOT NULL REFERENCES gites(id) ON DELETE CASCADE,
    item_key text NOT NULL,
    quantity integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS linen_stock_items_gite_item_key
    ON linen_stock_items (gite_id, item_key);

CREATE INDEX IF NOT EXISTS linen_stock_items_owner_user_id
    ON linen_stock_items (owner_user_id);

ALTER TABLE linen_stock_items ENABLE ROW LEVEL SECURITY;

-- 2) Politiques RLS (alignées avec le reste du projet)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'linen_stock_items' AND policyname = 'linen_stock_items_select_own'
    ) THEN
        CREATE POLICY linen_stock_items_select_own
            ON linen_stock_items FOR SELECT
            USING (owner_user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'linen_stock_items' AND policyname = 'linen_stock_items_modify_own'
    ) THEN
        CREATE POLICY linen_stock_items_modify_own
            ON linen_stock_items FOR ALL
            USING (owner_user_id = auth.uid())
            WITH CHECK (owner_user_id = auth.uid());
    END IF;
END $$;

-- 3) Backfill optionnel depuis linen_stocks (colonnes fixes)
-- Exécuter UNE FOIS si vous avez des données existantes
-- (si linen_stocks est vide, cette partie n'a aucun effet)
INSERT INTO linen_stock_items (owner_user_id, gite_id, item_key, quantity)
SELECT owner_user_id, gite_id, 'draps_plats_grands', COALESCE(draps_plats_grands, 0)
FROM linen_stocks
WHERE COALESCE(draps_plats_grands, 0) > 0
ON CONFLICT (gite_id, item_key) DO UPDATE SET quantity = EXCLUDED.quantity;

INSERT INTO linen_stock_items (owner_user_id, gite_id, item_key, quantity)
SELECT owner_user_id, gite_id, 'draps_plats_petits', COALESCE(draps_plats_petits, 0)
FROM linen_stocks
WHERE COALESCE(draps_plats_petits, 0) > 0
ON CONFLICT (gite_id, item_key) DO UPDATE SET quantity = EXCLUDED.quantity;

INSERT INTO linen_stock_items (owner_user_id, gite_id, item_key, quantity)
SELECT owner_user_id, gite_id, 'housses_couettes_grandes', COALESCE(housses_couettes_grandes, 0)
FROM linen_stocks
WHERE COALESCE(housses_couettes_grandes, 0) > 0
ON CONFLICT (gite_id, item_key) DO UPDATE SET quantity = EXCLUDED.quantity;

INSERT INTO linen_stock_items (owner_user_id, gite_id, item_key, quantity)
SELECT owner_user_id, gite_id, 'housses_couettes_petites', COALESCE(housses_couettes_petites, 0)
FROM linen_stocks
WHERE COALESCE(housses_couettes_petites, 0) > 0
ON CONFLICT (gite_id, item_key) DO UPDATE SET quantity = EXCLUDED.quantity;

INSERT INTO linen_stock_items (owner_user_id, gite_id, item_key, quantity)
SELECT owner_user_id, gite_id, 'taies_oreillers', COALESCE(taies_oreillers, 0)
FROM linen_stocks
WHERE COALESCE(taies_oreillers, 0) > 0
ON CONFLICT (gite_id, item_key) DO UPDATE SET quantity = EXCLUDED.quantity;

INSERT INTO linen_stock_items (owner_user_id, gite_id, item_key, quantity)
SELECT owner_user_id, gite_id, 'serviettes', COALESCE(serviettes, 0)
FROM linen_stocks
WHERE COALESCE(serviettes, 0) > 0
ON CONFLICT (gite_id, item_key) DO UPDATE SET quantity = EXCLUDED.quantity;

INSERT INTO linen_stock_items (owner_user_id, gite_id, item_key, quantity)
SELECT owner_user_id, gite_id, 'tapis_bain', COALESCE(tapis_bain, 0)
FROM linen_stocks
WHERE COALESCE(tapis_bain, 0) > 0
ON CONFLICT (gite_id, item_key) DO UPDATE SET quantity = EXCLUDED.quantity;
