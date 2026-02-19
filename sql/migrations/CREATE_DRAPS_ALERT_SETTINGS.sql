-- ================================================================
-- PARAMÈTRES D'ALERTE DRAPS (PERSISTENCE BDD)
-- ================================================================

-- Table user_settings (réutilisée) : création si absente
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Colonnes de configuration alerte draps
ALTER TABLE public.user_settings
    ADD COLUMN IF NOT EXISTS draps_alert_weekday TEXT NOT NULL DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS draps_alert_days_before INTEGER NOT NULL DEFAULT 7;

-- Contraintes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_draps_alert_weekday_ck'
    ) THEN
        ALTER TABLE public.user_settings
            ADD CONSTRAINT user_settings_draps_alert_weekday_ck
            CHECK (draps_alert_weekday IN ('all', '0', '1', '2', '3', '4', '5', '6'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_draps_alert_days_before_ck'
    ) THEN
        ALTER TABLE public.user_settings
            ADD CONSTRAINT user_settings_draps_alert_days_before_ck
            CHECK (draps_alert_days_before >= 0 AND draps_alert_days_before <= 30);
    END IF;
END $$;

COMMENT ON COLUMN public.user_settings.draps_alert_weekday IS 'Jour de déclenchement alerte draps: all ou 0-6 (dimanche=0)';
COMMENT ON COLUMN public.user_settings.draps_alert_days_before IS 'Nombre de jours avant rupture estimée pour déclencher la tâche';

-- Politiques RLS nécessaires pour lecture/écriture côté client
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'user_settings' AND policyname = 'Users can view their own settings'
    ) THEN
        CREATE POLICY "Users can view their own settings"
            ON public.user_settings FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'user_settings' AND policyname = 'Users can update their own settings'
    ) THEN
        CREATE POLICY "Users can update their own settings"
            ON public.user_settings FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'user_settings' AND policyname = 'Users can insert their own settings'
    ) THEN
        CREATE POLICY "Users can insert their own settings"
            ON public.user_settings FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id
    ON public.user_settings (user_id);
