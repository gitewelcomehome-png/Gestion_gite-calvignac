-- ================================================================
-- TABLE: problemes_signales
-- Description: Demandes, retours, améliorations et problèmes signalés par les clients
-- ================================================================

CREATE TABLE IF NOT EXISTS public.problemes_signales (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  reservation_id UUID NULL,
  gite_id UUID NULL,
  type TEXT NOT NULL CHECK (type IN ('demande', 'retour', 'amelioration', 'probleme')),
  sujet TEXT NOT NULL,
  description TEXT NOT NULL,
  urgence TEXT NULL CHECK (urgence IS NULL OR urgence IN ('basse', 'normale', 'haute')),
  statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'resolu', 'clos')),
  reponse TEXT NULL,
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  
  CONSTRAINT problemes_signales_pkey PRIMARY KEY (id),
  CONSTRAINT problemes_signales_owner_user_id_fkey FOREIGN KEY (owner_user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT problemes_signales_reservation_id_fkey FOREIGN KEY (reservation_id) 
    REFERENCES reservations(id) ON DELETE SET NULL,
  CONSTRAINT problemes_signales_gite_id_fkey FOREIGN KEY (gite_id) 
    REFERENCES gites(id) ON DELETE SET NULL
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_problemes_signales_owner ON public.problemes_signales USING btree (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_problemes_signales_reservation ON public.problemes_signales USING btree (reservation_id);
CREATE INDEX IF NOT EXISTS idx_problemes_signales_gite ON public.problemes_signales USING btree (gite_id);
CREATE INDEX IF NOT EXISTS idx_problemes_signales_statut ON public.problemes_signales USING btree (statut);
CREATE INDEX IF NOT EXISTS idx_problemes_signales_type ON public.problemes_signales USING btree (type);

-- RLS policies
ALTER TABLE public.problemes_signales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own problemes_signales" ON public.problemes_signales;
CREATE POLICY "Users can view own problemes_signales" 
  ON public.problemes_signales FOR SELECT 
  USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can insert own problemes_signales" ON public.problemes_signales;
CREATE POLICY "Users can insert own problemes_signales" 
  ON public.problemes_signales FOR INSERT 
  WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can update own problemes_signales" ON public.problemes_signales;
CREATE POLICY "Users can update own problemes_signales" 
  ON public.problemes_signales FOR UPDATE 
  USING (auth.uid() = owner_user_id);

COMMENT ON TABLE public.problemes_signales IS 
  'Demandes, retours, améliorations et problèmes signalés par les clients';
