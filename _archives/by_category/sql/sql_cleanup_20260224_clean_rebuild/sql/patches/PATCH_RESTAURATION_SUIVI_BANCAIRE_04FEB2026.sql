-- ============================================
-- PATCH: RESTAURATION SUIVI BANCAIRE
-- Date: 04 Février 2026
-- Auteur: Copilot
-- ============================================
-- Description: Restaure la table suivi_soldes_bancaires 
--              supprimée le 23/01/2026
-- ============================================

-- 1. Recréer la table suivi_soldes_bancaires
CREATE TABLE IF NOT EXISTS public.suivi_soldes_bancaires (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  annee INTEGER NOT NULL,
  mois INTEGER NOT NULL, -- 1-12
  solde NUMERIC(10,2) NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  
  CONSTRAINT suivi_soldes_bancaires_pkey PRIMARY KEY (id),
  CONSTRAINT suivi_soldes_bancaires_owner_user_id_annee_mois_key 
    UNIQUE (owner_user_id, annee, mois),
  CONSTRAINT suivi_soldes_bancaires_owner_user_id_fkey 
    FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT suivi_soldes_bancaires_mois_check 
    CHECK (mois >= 1 AND mois <= 12)
);

-- 2. Créer les index pour la performance
CREATE INDEX IF NOT EXISTS idx_soldes_owner 
  ON public.suivi_soldes_bancaires USING btree (owner_user_id);
  
CREATE INDEX IF NOT EXISTS idx_soldes_annee 
  ON public.suivi_soldes_bancaires USING btree (annee);

-- 3. Activer RLS
ALTER TABLE public.suivi_soldes_bancaires ENABLE ROW LEVEL SECURITY;

-- 4. Créer les politiques RLS
CREATE POLICY "Users can view their own bank balances"
  ON public.suivi_soldes_bancaires
  FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert their own bank balances"
  ON public.suivi_soldes_bancaires
  FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own bank balances"
  ON public.suivi_soldes_bancaires
  FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete their own bank balances"
  ON public.suivi_soldes_bancaires
  FOR DELETE
  USING (auth.uid() = owner_user_id);

-- 5. Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Table suivi_soldes_bancaires restaurée avec succès';
  RAISE NOTICE '✅ Index créés';
  RAISE NOTICE '✅ RLS activé et politiques créées';
END $$;
