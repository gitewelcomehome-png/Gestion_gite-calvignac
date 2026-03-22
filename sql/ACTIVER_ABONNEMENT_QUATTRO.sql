-- ============================================================
-- ACTIVER ABONNEMENT QUATTRO
-- ============================================================
-- Ce script :
-- 1. Crée la table subscriptions_plans (avec display_name, level)
-- 2. Insère les 3 plans (solo, duo, quattro)
-- 3. Active l'abonnement quattro du dernier utilisateur créé
-- ============================================================

-- STEP 1 : Créer la table subscriptions_plans (si vue ou absente)
DROP VIEW IF EXISTS public.subscriptions_plans;
CREATE TABLE IF NOT EXISTS public.subscriptions_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    level INTEGER NOT NULL,
    price_monthly NUMERIC(10,2),
    price_yearly NUMERIC(10,2),
    nb_gites_max INTEGER,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscriptions_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_plans" ON public.subscriptions_plans;
CREATE POLICY "public_read_plans" ON public.subscriptions_plans
    FOR SELECT TO authenticated USING (true);

-- STEP 2 : Insérer les plans
INSERT INTO public.subscriptions_plans (code, display_name, level, price_monthly, price_yearly, nb_gites_max, features) VALUES
  ('solo', 'Solo', 1, 15.00, 150.00, 1,
   '["1 gîte maximum","Calendrier & réservations","Planning ménage basique","Fiscalité LMNP complète","Fiche voyageur QR WiFi"]'::jsonb),
  ('duo', 'Duo', 2, 22.00, 220.00, 2,
   '["2 gîtes maximum","Tout Solo +","Auto-complétion IA","Tableau Gîtes de France","Vue multi-propriétés","Formation vidéo"]'::jsonb),
  ('quattro', 'Quattro', 3, 33.00, 330.00, 4,
   '["4 gîtes maximum","Tout Duo +","Communication IA","Tableaux de bord avancés","Webinaire mensuel collectif","Support VIP (réponse 4h)"]'::jsonb)
ON CONFLICT (code) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    level = EXCLUDED.level,
    price_monthly = EXCLUDED.price_monthly,
    nb_gites_max = EXCLUDED.nb_gites_max;

-- STEP 2b : Corriger la FK user_subscriptions → subscriptions_plans
ALTER TABLE public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_plan_id_fkey;
ALTER TABLE public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey
    FOREIGN KEY (plan_id) REFERENCES public.subscriptions_plans(id);

-- STEP 3 : Activer l'abonnement quattro pour votre compte
DO $$
DECLARE
    v_user_id UUID;
    v_plan_id UUID;
BEGIN
    -- Prendre le dernier utilisateur créé (= vous)
    SELECT id INTO v_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
    RAISE NOTICE 'User: %', (SELECT email FROM auth.users WHERE id = v_user_id);

    -- Récupérer l'id du plan quattro
    SELECT id INTO v_plan_id FROM public.subscriptions_plans WHERE code = 'quattro';

    -- Insérer ou mettre à jour l'abonnement
    INSERT INTO public.user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
    VALUES (
        v_user_id,
        v_plan_id,
        'active',
        now(),
        now() + INTERVAL '1 year'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        plan_id = v_plan_id,
        status = 'active',
        current_period_start = now(),
        current_period_end = now() + INTERVAL '1 year',
        updated_at = now();

    RAISE NOTICE 'Abonnement QUATTRO activé pour le compte %', (SELECT email FROM auth.users WHERE id = v_user_id);
END $$;

-- VÉRIFICATION
SELECT
    u.email,
    sp.display_name AS plan,
    sp.level,
    us.status,
    us.current_period_end
FROM user_subscriptions us
JOIN auth.users u ON u.id = us.user_id
LEFT JOIN subscriptions_plans sp ON sp.id = us.plan_id
ORDER BY us.created_at DESC;
