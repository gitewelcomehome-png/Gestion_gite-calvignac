-- ============================================================
-- INJECTION réservations Couzon manquantes (passées 2026)
-- Jan → Mar 2026 — 7 réservations confirmées
-- ============================================================

DO $$
DECLARE
    v_user_id     UUID;
    v_gite_couzon UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;

    SELECT id INTO v_gite_couzon FROM public.gites
        WHERE owner_user_id = v_user_id
          AND (slug ILIKE 'couzon' OR name ILIKE '%couzon%')
        LIMIT 1;

    IF v_gite_couzon IS NULL THEN
        RAISE EXCEPTION 'Gîte Couzon introuvable.';
    END IF;

    RAISE NOTICE 'Injection Couzon passées pour user: % | gite_id: %',
        (SELECT email FROM auth.users WHERE id = v_user_id), v_gite_couzon;

    INSERT INTO public.reservations (
        owner_user_id, gite_id, id,
        check_in, check_out,
        client_name, client_phone, client_address,
        guest_count, platform, status,
        total_price, paid_amount, restant, paiement,
        source, ical_uid, manual_override, message_envoye,
        gite, created_at, updated_at
    ) VALUES
    (v_user_id, v_gite_couzon, '8f398bd1-7519-489c-9510-d91c3e71c466',
     '2026-01-05', '2026-01-09', '***', '***', '***', 6,
     'Gîtes de France (centrale)', 'confirmed',
     1000.0, 0.0, 1000.0, 'Non payé',
     'ical', 'deaad09f89fed900e912bd449deddb6e', true, false,
     'Couzon', '2026-01-13T21:23:28', '2026-01-13T21:23:28'),

    (v_user_id, v_gite_couzon, 'e5da4519-7d2b-4ede-bcd2-b30343f134ef',
     '2026-01-30', '2026-02-01', '***', '***', '***', 7,
     'Airbnb', 'confirmed',
     751.0, 0.0, 751.0, 'Non payé',
     'ical', '1418fb94e984-23fa518c1af3445b80f2cef0a0d8e24c@airbnb.com', true, false,
     'Couzon', '2026-01-13T21:23:03', '2026-01-13T21:23:03'),

    (v_user_id, v_gite_couzon, 'ceb55198-74ed-49c3-9e7b-bbee40a2d368',
     '2026-02-05', '2026-02-07', '***', '***', '***', 6,
     'Gîtes de France (centrale)', 'confirmed',
     720.0, 0.0, 720.0, 'Non payé',
     'ical', '08b015cd52af89e1f553bb12214ea637', true, false,
     'Couzon', '2026-02-03T15:42:18', '2026-02-03T15:42:18'),

    (v_user_id, v_gite_couzon, '804f85f4-a0e1-4f01-99ac-6785ce755c0f',
     '2026-02-20', '2026-02-22', '***', '***', '***', 0,
     'Airbnb', 'confirmed',
     694.0, 0.0, 694.0, 'Non payé',
     'ical', '1418fb94e984-654a1869df8b2fa080121ef4f9fdfd11@airbnb.com', true, false,
     'Couzon', '2026-01-13T21:23:03', '2026-01-13T21:23:03'),

    (v_user_id, v_gite_couzon, 'fbf54c0d-7328-44a7-97c4-2288bfbf68bc',
     '2026-02-22', '2026-02-25', '***', '***', '***', 0,
     'Abritel', 'confirmed',
     633.0, 0.0, 633.0, 'Non payé',
     'ical', 'c27b322b-f530-4aa7-9f3b-ffa617bce71d', true, false,
     'Couzon', '2026-01-13T21:23:18', '2026-01-13T21:23:18'),

    (v_user_id, v_gite_couzon, '0b2e3989-ce6c-4e1b-8410-75bc70b45a73',
     '2026-02-27', '2026-03-02', '***', '***', '***', 0,
     'Airbnb', 'confirmed',
     906.0, 0.0, 906.0, 'Non payé',
     'ical', '1418fb94e984-f17837035cbafbb10d41cea775cb6792@airbnb.com', true, false,
     'Couzon', '2026-02-02T09:22:17', '2026-02-02T09:22:17'),

    (v_user_id, v_gite_couzon, '68714254-61c7-41b5-95aa-8d9f963ece6a',
     '2026-03-06', '2026-03-08', '***', '***', '***', 0,
     'Airbnb', 'confirmed',
     573.0, 0.0, 573.0, 'Non payé',
     'ical', '1418fb94e984-9f63bfbe936e04c0e3e7b039b7fbce6a@airbnb.com', true, false,
     'Couzon', '2026-01-13T21:23:03', '2026-03-02T21:37:23')

    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE '✅ 7 réservations Couzon passées injectées (ON CONFLICT DO NOTHING)';
END $$;

-- Vérification
SELECT check_in, check_out, platform, total_price, status
FROM public.reservations r
JOIN public.gites g ON g.id = r.gite_id
WHERE g.name ILIKE '%couzon%'
  AND r.check_in >= '2026-01-01'
  AND r.check_in < '2026-03-16'
ORDER BY r.check_in;
