-- =====================================================
-- CORRECTION POLITIQUES RLS - 2 janvier 2026
-- =====================================================
-- Les colonnes existent mais les politiques RLS bloquent l'accès
-- Ce script désactive temporairement RLS pour permettre l'accès
-- =====================================================

-- Désactiver RLS sur simulations_fiscales (app privée)
ALTER TABLE simulations_fiscales DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur suivi_soldes_bancaires
ALTER TABLE suivi_soldes_bancaires DISABLE ROW LEVEL SECURITY;

-- Si tu veux garder RLS activé mais autoriser tout le monde :
-- (décommente ces lignes et commente les ALTER TABLE ci-dessus)

-- ALTER TABLE simulations_fiscales ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow all operations" ON simulations_fiscales;
-- CREATE POLICY "Allow all operations" ON simulations_fiscales FOR ALL USING (true) WITH CHECK (true);

-- ALTER TABLE suivi_soldes_bancaires ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow all operations" ON suivi_soldes_bancaires;
-- CREATE POLICY "Allow all operations" ON suivi_soldes_bancaires FOR ALL USING (true) WITH CHECK (true);
