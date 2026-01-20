-- ==========================================
-- 🔧 REFONTE TABLES FISCALITÉ
-- ==========================================

-- ============================================
-- 1. TABLE PRINCIPALE : fiscal_history
-- ============================================
-- USAGE : Données fiscales annuelles par propriétaire
-- STOCKAGE : Travaux, frais divers, produits dans donnees_detaillees (JSONB)
-- CONTRAINTE : Une seule entrée par (owner_user_id, year, gite)

-- Table déjà correcte, aucune modification nécessaire
-- Juste s'assurer que la contrainte unique est bien là :

ALTER TABLE public.fiscal_history 
DROP CONSTRAINT IF EXISTS fiscal_history_owner_user_id_year_gite_key;

ALTER TABLE public.fiscal_history 
ADD CONSTRAINT fiscal_history_owner_user_id_year_gite_key 
UNIQUE (owner_user_id, year, gite);

-- Ajouter un trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fiscal_history_updated_at ON public.fiscal_history;
CREATE TRIGGER update_fiscal_history_updated_at
    BEFORE UPDATE ON public.fiscal_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. TABLE CHARGES : OPTIONNELLE
-- ============================================
-- USAGE FUTUR : Gestion comptable détaillée (factures, fournisseurs)
-- DÉCISION : À conserver seulement si vous prévoyez ce module
-- SINON : Supprimer pour simplifier

-- Option A : SUPPRIMER (si pas nécessaire)
-- DROP TABLE IF EXISTS public.charges CASCADE;

-- Option B : GARDER mais avec amélioration (pour usage futur)
-- Si vous gardez, améliorer la structure :

DROP TABLE IF EXISTS public.charges CASCADE;

CREATE TABLE public.charges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  gite_id uuid NULL,
  charge_date date NOT NULL,
  year integer GENERATED ALWAYS AS (EXTRACT(YEAR FROM charge_date)) STORED,
  amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'EUR',
  category text NOT NULL,
  subcategory text NULL,
  description text NOT NULL,
  supplier text NULL,
  invoice_number text NULL,
  invoice_file_url text NULL,
  payment_method text NULL,
  payment_date date NULL,
  is_deductible boolean DEFAULT true,
  is_paid boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  notes text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT charges_pkey PRIMARY KEY (id),
  CONSTRAINT charges_gite_id_fkey FOREIGN KEY (gite_id) REFERENCES gites(id) ON DELETE SET NULL,
  CONSTRAINT charges_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT charges_amount_check CHECK (amount > 0)
);

-- Index optimisés
CREATE INDEX idx_charges_owner_year ON charges(owner_user_id, year);
CREATE INDEX idx_charges_gite_year ON charges(gite_id, year);
CREATE INDEX idx_charges_date ON charges(charge_date);
CREATE INDEX idx_charges_category ON charges(category);
CREATE INDEX idx_charges_tags ON charges USING GIN(tags);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_charges_updated_at ON public.charges;
CREATE TRIGGER update_charges_updated_at
    BEFORE UPDATE ON public.charges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. VUE UTILE : Résumé fiscal par année
-- ============================================

CREATE OR REPLACE VIEW fiscal_summary AS
SELECT 
    owner_user_id,
    year,
    gite,
    revenus as ca,
    charges as total_charges,
    resultat as benefice,
    donnees_detaillees->'travaux_liste' as travaux,
    jsonb_array_length(COALESCE(donnees_detaillees->'travaux_liste', '[]'::jsonb)) as nb_travaux,
    jsonb_array_length(COALESCE(donnees_detaillees->'frais_divers_liste', '[]'::jsonb)) as nb_frais_divers,
    (donnees_detaillees->>'benefice_imposable')::numeric as benefice_imposable,
    (donnees_detaillees->>'cotisations_urssaf')::numeric as urssaf,
    (donnees_detaillees->>'impot_revenu')::numeric as impot_revenu,
    updated_at as derniere_modif
FROM fiscal_history
ORDER BY year DESC, updated_at DESC;

-- ============================================
-- 4. NETTOYAGE DES DOUBLONS (si nécessaire)
-- ============================================

-- Identifier les doublons
SELECT 
    owner_user_id,
    year,
    gite,
    COUNT(*) as nb_doublons,
    string_agg(id::text, ', ' ORDER BY updated_at DESC) as ids
FROM fiscal_history
GROUP BY owner_user_id, year, gite
HAVING COUNT(*) > 1;

-- Supprimer les doublons (garder le plus récent)
-- ATTENTION : Vérifier avant d'exécuter !
/*
DELETE FROM fiscal_history
WHERE id NOT IN (
    SELECT DISTINCT ON (owner_user_id, year, gite) id
    FROM fiscal_history
    ORDER BY owner_user_id, year, gite, updated_at DESC
);
*/

-- ============================================
-- 5. RLS (Row Level Security)
-- ============================================

-- S'assurer que RLS est activé
ALTER TABLE fiscal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;

-- Politique pour fiscal_history
DROP POLICY IF EXISTS "Users can manage their own fiscal data" ON fiscal_history;
CREATE POLICY "Users can manage their own fiscal data"
    ON fiscal_history
    FOR ALL
    USING (owner_user_id = auth.uid());

-- Politique pour charges
DROP POLICY IF EXISTS "Users can manage their own charges" ON charges;
CREATE POLICY "Users can manage their own charges"
    ON charges
    FOR ALL
    USING (owner_user_id = auth.uid());

-- ============================================
-- RÉSUMÉ DES DÉCISIONS
-- ============================================

/*
✅ FISCAL_HISTORY : Table principale, utilisée actuellement
   - Stocke les données fiscales annuelles
   - JSONB pour travaux, frais, produits
   - Contrainte unique garantit UNE entrée par année
   
❓ CHARGES : Table optionnelle, NON utilisée actuellement
   - Gardez-la si vous prévoyez une gestion comptable détaillée
   - Supprimez-la sinon pour simplifier
   
🔧 AMÉLIORATIONS :
   - Trigger updated_at automatique
   - Vue fiscal_summary pour analyses
   - Script de nettoyage des doublons
   - RLS renforcé
*/
