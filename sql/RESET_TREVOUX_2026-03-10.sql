-- ============================================================
-- RESET COMPLET RÉSERVATIONS TRÉVOUX
-- ============================================================
-- 1. Supprime TOUTES les réservations Trévoux (sans exception)
-- 2. Réinsère proprement les 35 réservations de référence
-- ⚠️  À exécuter UNE SEULE FOIS dans Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
    v_user_id      UUID;
    v_gite_trevoux UUID;
    v_nb_deleted   INT;
BEGIN
    -- Récupérer le propriétaire
    SELECT id INTO v_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
    RAISE NOTICE 'Utilisateur : %', (SELECT email FROM auth.users WHERE id = v_user_id);

    -- Récupérer l''ID du gîte Trévoux
    SELECT id INTO v_gite_trevoux FROM public.gites
        WHERE owner_user_id = v_user_id
          AND (slug ILIKE 'trevoux' OR slug ILIKE 'trévoux'
               OR name ILIKE '%trevoux%' OR name ILIKE '%trévoux%')
        LIMIT 1;

    IF v_gite_trevoux IS NULL THEN
        RAISE EXCEPTION 'Gîte Trévoux introuvable. Gîtes disponibles : %',
            (SELECT string_agg(slug || ' (' || name || ')', ', ') FROM public.gites WHERE owner_user_id = v_user_id);
    END IF;

    RAISE NOTICE 'Gîte Trévoux ID : %', v_gite_trevoux;

    -- ❶ SUPPRESSION TOTALE de toutes les réservations Trévoux
    DELETE FROM public.reservations WHERE gite_id = v_gite_trevoux;
    GET DIAGNOSTICS v_nb_deleted = ROW_COUNT;
    RAISE NOTICE '🗑️  % réservations Trévoux supprimées', v_nb_deleted;

    -- ❷ RÉINSERTION PROPRE des 35 réservations (pas de ON CONFLICT, table est vide)
    INSERT INTO public.reservations (
        owner_user_id, gite_id, id,
        check_in, check_out,
        client_name, client_email, client_phone, client_address,
        guest_count,
        platform, platform_booking_id,
        status,
        total_price, paid_amount, restant, paiement,
        notes, source, ical_uid,
        manual_override, message_envoye,
        gite, created_at, updated_at
    ) VALUES
    (v_user_id, v_gite_trevoux, '6796ead9-2d44-495f-81b0-58400a9280e3',
     '2026-01-04','2026-01-09','***',NULL,'***','***',7.0,
     'Gîtes de France (centrale)',NULL,'confirmed',
     1500.0,0.0,1500.0,'Non payé',NULL,'ical','a7799deaca1868f873535d77a641ec50',
     true,false,'Trévoux','2026-01-13T21:23:02','2026-01-13T21:23:02'),

    (v_user_id, v_gite_trevoux, 'feb33125-130a-4299-b9fd-1ea17784fc73',
     '2026-01-12','2026-01-16','***',NULL,'***','***',7.0,
     'Airbnb',NULL,'confirmed',
     1137.0,1.0,1136.0,'Acompte versé',NULL,'ical','1418fb94e984-eb2d14b69ebe688e413c6b588eadb73a@airbnb.com',
     true,false,'Trévoux','2026-01-13T21:22:59','2026-01-13T21:22:59'),

    (v_user_id, v_gite_trevoux, '85fa0359-a443-4887-8757-51c803b3aad4',
     '2026-01-16','2026-01-18','***',NULL,'***','***',15.0,
     'Airbnb',NULL,'cancelled',
     780.0,0.0,780.0,'Non payé','Annulée automatiquement (disparue du flux iCal)','ical','1418fb94e984-00e270cc28986ea519c4af805a7109a7@airbnb.com',
     true,false,'Trévoux','2026-01-13T21:22:59','2026-01-13T21:22:59'),

    (v_user_id, v_gite_trevoux, 'b8587cbb-176b-49ad-bdad-370733c94feb',
     '2026-01-22','2026-01-25','***',NULL,'***','***',10.0,
     'Airbnb',NULL,'confirmed',
     1060.0,0.0,1060.0,'Non payé',NULL,'ical','1418fb94e984-7122b97d862b7037d9951e1530de8d3e@airbnb.com',
     true,false,'Trévoux','2026-01-13T21:22:59','2026-01-28T21:35:41'),

    (v_user_id, v_gite_trevoux, '4671a2d3-ea0c-49bc-bc65-37ce67e1ca39',
     '2026-01-26','2026-01-30','***',NULL,'***','***',5.0,
     'Gîtes de France (centrale)',NULL,'confirmed',
     1000.0,0.0,1000.0,'Non payé',NULL,'ical','def4be67411ea3a7676eafd901b5fa4f',
     true,false,'Trévoux','2026-01-13T21:23:02','2026-01-28T16:34:12'),

    (v_user_id, v_gite_trevoux, '3377fd8c-2dc8-4db5-9908-3b41a3296ef0',
     '2026-01-30','2026-02-01','***',NULL,'***','***',0.0,
     'Airbnb',NULL,'cancelled',
     819.0,0.0,819.0,'Non payé','Annulée automatiquement (disparue du flux iCal)','ical','1418fb94e984-636ebb394a66414c60e9e85ed81be979@airbnb.com',
     true,false,'Trévoux','2026-01-13T21:22:59','2026-01-13T21:22:59'),

    (v_user_id, v_gite_trevoux, 'e40fef57-a6e2-4440-a670-4e6a2f15852c',
     '2026-02-02','2026-02-06','***',NULL,'***','***',6.0,
     'Gîtes de France (centrale)',NULL,'confirmed',
     1000.0,0.0,1000.0,'Non payé',NULL,'ical','21ce3cfa5936f5fb24c0d996586f1a9f',
     true,false,'Trévoux','2026-01-13T21:23:02','2026-02-02T15:43:05'),

    (v_user_id, v_gite_trevoux, 'ca55fe96-e27a-446d-b561-6296aebbf74e',
     '2026-02-09','2026-02-13','***',NULL,'***','***',6.0,
     'Gîtes de France (centrale)',NULL,'confirmed',
     1000.0,0.0,1000.0,'Non payé',NULL,'ical','884aca79da6696aa0381fb1a256491ce',
     true,false,'Trévoux','2026-01-13T21:23:02','2026-02-09T20:58:17'),

    (v_user_id, v_gite_trevoux, '0e6d6434-5b05-4ef3-9616-f46cbfe7bba5',
     '2026-02-20','2026-02-22','***',NULL,'***','***',0.0,
     'Airbnb',NULL,'confirmed',
     848.0,0.0,848.0,'Non payé',NULL,'ical','1418fb94e984-76b218f11a215b4c407767f062e4a655@airbnb.com',
     true,false,'Trévoux','2026-01-13T21:22:59','2026-02-21T15:12:58'),

    (v_user_id, v_gite_trevoux, '90b425cf-cb02-4d09-9a38-ad3b89d740b1',
     '2026-02-22','2026-02-26','***',NULL,'***','***',0.0,
     'Abritel',NULL,'confirmed',
     1245.0,0.0,1245.0,'Non payé',NULL,'ical','0cba6702-2c18-4347-894e-d49eee9c1c81',
     true,false,'Trévoux','2026-01-13T21:23:01','2026-02-23T17:12:36'),

    (v_user_id, v_gite_trevoux, 'd4c74772-e257-4468-a373-23cac49b9ded',
     '2026-03-06','2026-03-08','***',NULL,'***','***',0.0,
     'Airbnb',NULL,'confirmed',
     1089.0,0.0,1089.0,'Non payé',NULL,'ical','1418fb94e984-0426fef3c104d651a89b1dbb376d619f@airbnb.com',
     true,false,'Trévoux','2026-01-13T21:22:59','2026-03-05T15:50:54'),

    (v_user_id, v_gite_trevoux, 'f07487c3-9738-4cce-bcd9-f6ffcb2983ff',
     '2026-03-13','2026-03-15','***',NULL,'***','***',0.0,
     'Abritel',NULL,'cancelled',
     803.0,0.0,803.0,'Non payé','Annulée automatiquement (disparue du flux iCal)','ical','c7062049-2ca4-4eb0-9906-2d98cae87c22',
     true,false,'Trévoux','2026-01-13T21:23:01','2026-01-13T21:23:01'),

    (v_user_id, v_gite_trevoux, '339d619e-c83b-418f-a740-3fa97289e93d',
     '2026-03-16','2026-03-20','***',NULL,'***','***',6.0,
     'Gîtes de France (centrale)',NULL,'confirmed',
     1000.0,0.0,1000.0,'Non payé',NULL,'ical','e3f3ac0b6364c3238fa3ee25540a0956',
     true,false,'Trévoux','2026-01-13T21:23:02','2026-01-13T21:23:02'),

    (v_user_id, v_gite_trevoux, 'b2580c46-a7f1-42fe-8716-88ffcdc371b8',
     '2026-04-04','2026-04-06','***',NULL,'***','***',0.0,
     'Airbnb',NULL,'confirmed',
     997.0,0.0,997.0,'Non payé',NULL,'ical','1418fb94e984-27f65dfa12ce0b8d36a06bd12476607f@airbnb.com',
     true,false,'Trévoux','2026-01-13T21:22:59','2026-01-13T21:22:59'),

    (v_user_id, v_gite_trevoux, '925c41f3-adfe-4573-82f0-fc80f9a5d2d0',
     '2026-04-10','2026-04-12','***',NULL,'***','***',0.0,
     'Airbnb',NULL,'confirmed',
     997.0,0.0,997.0,'Non payé',NULL,'ical','1418fb94e984-68a8e39495a66b71d0e3bfb66bc80d5f@airbnb.com',
     true,false,'Trévoux','2026-01-13T21:23:00','2026-01-13T21:23:00'),

    (v_user_id, v_gite_trevoux, '0ade01bc-9459-429a-b0f4-f5c2bd5eab17',
     '2026-04-13','2026-04-17','***',NULL,'***','***',0.0,
     'Gîtes de France (centrale)',NULL,'confirmed',
     859.0,0.0,859.0,'Non payé',NULL,'ical','030c36b94f3b4757e4be9d5963b4201c',
     true,false,'Trévoux','2026-02-02T09:22:08','2026-02-02T09:22:08'),

    (v_user_id, v_gite_trevoux, '177374a0-9dde-432e-a8e9-bb8d2f9ad108',
     '2026-04-20','2026-04-24','***',NULL,'***','***',6.0,
     'Gîtes de France (centrale)',NULL,'confirmed',
     1000.0,0.0,1000.0,'Non payé',NULL,'ical','4ef307642a8430df8370fd4d685bb647',
     true,false,'Trévoux','2026-01-13T21:23:03','2026-01-13T21:23:03'),

    (v_user_id, v_gite_trevoux, 'cdc13861-4d9c-4f1f-8897-f00e68004b06',
     '2026-04-24','2026-04-27','***',NULL,'***','***',0.0,
     'Airbnb',NULL,'confirmed',
     1409.0,0.0,1409.0,'Non payé',NULL,'ical','1418fb94e984-d9a4a951d07065f0dd3afa1565a60cfe@airbnb.com',
     true,false,'Trévoux','2026-01-13T21:23:00','2026-01-13T21:23:00'),

    (v_user_id, v_gite_trevoux, '9a112845-5060-4301-9797-fc50e475aefd',
     '2026-05-01','2026-05-03','***',NULL,'***','***',0.0,
     'Airbnb',NULL,'confirmed',
     997.0,0.0,997.0,'Non payé',NULL,'ical','1418fb94e984-ce3c69e29aa4757de1c7c4121dc056c9@airbnb.com',
     true,false,'Trévoux','2026-01-13T21:23:00','2026-01-13T21:23:00'),

    (v_user_id, v_gite_trevoux, 'c06b056f-41d4-4b2f-8bf6-20685b80b7b1',
     '2026-05-08','2026-05-10','***',NULL,'***','***',0.0,
     'Airbnb',NULL,'confirmed',
     997.0,0.0,997.0,'Non payé',NULL,'ical','1418fb94e984-dbbb914820a6a55cc9d8dd4c6c6c7a6b@airbnb.com',
     true,false,'Trévoux','2026-01-13T21:23:00','2026-01-13T21:23:00'),

    (v_user_id, v_gite_trevoux, '56696355-9cb6-4a95-bc45-6022ff118277',
     '2026-05-14','2026-05-17','***',NULL,'***','***',0.0,
     'Abritel',NULL,'confirmed',
     1517.0,0.0,1517.0,'Non payé',NULL,'ical','008ed9cb-87a7-42f6-a7f2-4579dc598818',
     true,false,'Trévoux','2026-01-13T21:23:02','2026-01-13T21:23:02'),

    (v_user_id, v_gite_trevoux, '0903a12d-f615-4ae6-a60f-4c70018b0b0d',
     '2026-05-22','2026-05-25','***',NULL,'***','***',14.0,
     'Gîtes de France (centrale)',NULL,'confirmed',
     1500.0,0.0,1500.0,'Non payé',NULL,'ical','0309704739a13d1faebb9037c5412fb1',
     true,false,'Trévoux','2026-01-13T21:23:03','2026-01-13T21:23:03'),

    (v_user_id, v_gite_trevoux, 'c3366459-7799-4d0f-b228-3fc7f6e13454',
     '2026-05-29','2026-05-31','***',NULL,'***','***',0.0,
     'Airbnb',NULL,'confirmed',
     997.0,0.0,997.0,'Non payé',NULL,'ical','1418fb94e984-0968ca7fb9b4f61591f40f32778c41cf@airbnb.com',
     true,false,'Trévoux','2026-01-13T21:23:00','2026-01-13T21:23:00'),

    (v_user_id, v_gite_trevoux, '545ac8da-c691-418f-8e44-782aa32dce5e',
     '2026-06-03','2026-06-07','***',NULL,'***','***',0.0,
     'Abritel',NULL,'confirmed',
     1791.0,0.0,1791.0,'Non payé',NULL,'ical','1dda9e54-bf07-4e00-b16a-6b6794b58905',
     true,false,'Trévoux','2026-01-13T21:23:02','2026-01-13T21:23:02'),

    (v_user_id, v_gite_trevoux, 'af65cea0-3994-4f9c-922b-4cbe98e98abd',
     '2026-06-12','2026-06-14','***',NULL,NULL,NULL,0.0,
     'Airbnb',NULL,'confirmed',
     0.0,0.0,0.0,'Payé',NULL,'ical','1418fb94e984-60fe4e6ffed246f19c74b8c7476c98b3@airbnb.com',
     false,false,'Trévoux','2026-02-11T20:46:22','2026-02-11T20:46:22'),

    (v_user_id, v_gite_trevoux, '523e5311-e632-4706-a5f5-f4577c0277dd',
     '2026-07-10','2026-07-12','***',NULL,'***','***',0.0,
     'Abritel',NULL,'confirmed',
     993.0,0.0,993.0,'Non payé',NULL,'ical','c8b7718d-baff-4d65-ba2d-a8d5474e0884',
     true,false,'Trévoux','2026-01-13T21:23:02','2026-01-13T21:23:02'),

    (v_user_id, v_gite_trevoux, 'e67cf176-7bfa-4eed-adf6-55f696287f22',
     '2026-07-12','2026-07-15','***',NULL,'***','***',8.0,
     'Abritel',NULL,'confirmed',
     1547.0,0.0,1547.0,'Non payé',NULL,'ical','47dc95a7-f2c4-4c8e-8512-51692b92ccda',
     true,false,'Trévoux','2026-02-15T10:14:20','2026-02-15T10:14:20'),

    (v_user_id, v_gite_trevoux, 'bf1d1f04-b9a5-45a0-af3f-f94c0b731658',
     '2026-08-01','2026-08-10','***',NULL,NULL,NULL,0.0,
     'Abritel',NULL,'confirmed',
     0.0,0.0,0.0,'Payé',NULL,'ical','ab45341c-362e-4918-b088-a983f987036d',
     false,false,'Trévoux','2026-02-23T17:27:18','2026-02-23T17:27:18'),

    (v_user_id, v_gite_trevoux, '2c91c226-c348-4cec-b549-1756d638ffda',
     '2026-08-03','2026-08-08','***',NULL,NULL,NULL,0.0,
     'Abritel',NULL,'cancelled',
     0.0,0.0,0.0,'Payé','Annulée automatiquement (disparue du flux iCal)','ical','dfb47527-fb8f-44ab-ad53-4db52fa21849',
     false,false,'Trévoux','2026-02-13T13:39:01','2026-02-13T13:39:01'),

    (v_user_id, v_gite_trevoux, 'ad6630a6-bef7-4e1e-9e56-146be9978692',
     '2026-08-28','2026-08-30','***',NULL,'***','***',0.0,
     'Airbnb',NULL,'confirmed',
     997.0,0.0,997.0,'Non payé',NULL,'ical','1418fb94e984-7e172d212e6ad4e0c3fd36aed9fe8f2a@airbnb.com',
     true,false,'Trévoux','2026-01-13T21:23:00','2026-01-13T21:23:00'),

    (v_user_id, v_gite_trevoux, 'd66c0bad-4ba7-42de-992e-ab3c3fdbd0d6',
     '2026-09-11','2026-09-13','***',NULL,NULL,NULL,0.0,
     'Airbnb',NULL,'confirmed',
     0.0,0.0,0.0,'Payé',NULL,'ical','1418fb94e984-63e0aceb9717b112145eadd3d2f05e41@airbnb.com',
     false,false,'Trévoux','2026-02-23T17:12:30','2026-02-23T17:12:30'),

    (v_user_id, v_gite_trevoux, '0539be77-c653-4f85-a462-955f7c8eec42',
     '2026-10-02','2026-10-04','***',NULL,NULL,NULL,0.0,
     'Abritel',NULL,'confirmed',
     0.0,0.0,0.0,'Payé',NULL,'ical','57700e88-99b6-4e72-aab4-63a6e7d21e8e',
     false,false,'Trévoux','2026-03-01T18:34:39','2026-03-01T18:34:39'),

    (v_user_id, v_gite_trevoux, '7ee3b5fe-2aff-4947-bda3-ac7d7e4644ea',
     '2026-10-23','2026-10-25','***',NULL,NULL,NULL,0.0,
     'Airbnb',NULL,'confirmed',
     0.0,0.0,0.0,'Payé',NULL,'ical','1418fb94e984-60772e7e73d3281729e1059df6263934@airbnb.com',
     false,false,'Trévoux','2026-02-11T20:46:23','2026-02-11T20:46:23'),

    (v_user_id, v_gite_trevoux, 'f2a23858-f2cb-48d4-ae4a-2a503d3c70a6',
     '2026-11-27','2026-11-29','***',NULL,'***','***',0.0,
     'Airbnb',NULL,'confirmed',
     997.0,0.0,997.0,'Non payé',NULL,'ical','1418fb94e984-145ad19cd9422823100c098aa2cd59e1@airbnb.com',
     true,false,'Trévoux','2026-01-13T21:23:00','2026-01-13T21:23:00'),

    (v_user_id, v_gite_trevoux, '19fa1075-82d8-45e8-ac6f-e1a5cf79909f',
     '2026-12-22','2026-12-26','***',NULL,'***','***',15.0,
     'Airbnb',NULL,'confirmed',
     1821.0,0.0,1821.0,'Non payé',NULL,'ical','1418fb94e984-7371baf5702637afb556b91be48892a7@airbnb.com',
     true,false,'Trévoux','2026-02-04T15:17:59','2026-02-04T15:17:59');

    RAISE NOTICE '✅ 35 réservations Trévoux insérées proprement';
END $$;

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================
SELECT
    COUNT(*)                        AS total,
    COUNT(DISTINCT r.id)            AS ids_uniques,
    COUNT(*) - COUNT(DISTINCT r.id) AS doublons
FROM public.reservations r
JOIN public.gites g ON g.id = r.gite_id
WHERE g.name ILIKE '%trévoux%' OR g.name ILIKE '%trevoux%';

-- Détail complet
SELECT r.id, r.check_in, r.check_out, r.platform, r.status, r.total_price
FROM public.reservations r
JOIN public.gites g ON g.id = r.gite_id
WHERE g.name ILIKE '%trévoux%' OR g.name ILIKE '%trevoux%'
ORDER BY r.check_in;
