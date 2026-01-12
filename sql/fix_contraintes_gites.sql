-- COPIE CE SQL ET COLLE-LE DANS SUPABASE SQL EDITOR
-- Puis clique "Run"

ALTER TABLE gites DROP CONSTRAINT IF EXISTS gites_icon_check;
ALTER TABLE gites DROP CONSTRAINT IF EXISTS gites_color_check;
ALTER TABLE gites DROP CONSTRAINT IF EXISTS gites_capacity_check;
ALTER TABLE gites DROP CONSTRAINT IF EXISTS gites_slug_check;

NOTIFY pgrst, 'reload schema';
