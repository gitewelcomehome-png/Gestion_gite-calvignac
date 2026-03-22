-- ============================================================
-- RESTAURER CHECKLIST TRÉVOUX
-- ============================================================
-- Ce script recrée les items de checklist entrée/sortie pour
-- le gîte Trévoux (gite_id = 5695d89b-6a70-401c-989b-4aa924c4c107)
-- à partir des données de l'export_snapshot.json du 06/03/2026
--
-- Items actifs récupérés depuis l'ancienne instance :
--   ENTRÉE : 5 items
--   SORTIE : 7 items (dédupliqués)
-- ============================================================

DO $$
DECLARE
    v_user_id  UUID;
    v_gite_id  UUID := '5695d89b-6a70-401c-989b-4aa924c4c107'; -- Trévoux
BEGIN
    -- Récupérer le dernier utilisateur créé (= propriétaire)
    SELECT id INTO v_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
    RAISE NOTICE 'Restauration checklist Trévoux pour user: %',
        (SELECT email FROM auth.users WHERE id = v_user_id);

    -- Supprimer les éventuels items existants pour ce gîte
    DELETE FROM public.checklist_templates WHERE gite_id = v_gite_id;
    RAISE NOTICE 'Items existants supprimés pour gite_id: %', v_gite_id;

    -- ──────────────────────────────────────────────────────
    -- ENTRÉE (5 items)
    -- ──────────────────────────────────────────────────────
    INSERT INTO public.checklist_templates
        (owner_user_id, gite_id, type, ordre, texte, texte_en, description, description_en, actif)
    VALUES
        (v_user_id, v_gite_id, 'entree', 1,
         'Récupérer le code de la boîte à clés, les clés dans la boite et envoyer un sms de confirmation',
         'Retrieve the keybox code, keys from the box and send a confirmation SMS',
         NULL, NULL, true),

        (v_user_id, v_gite_id, 'entree', 2,
         'Ouvrir le gîte et prendre possession des lieux et envoyé un message de confirmation',
         'Open the gite and take possession and send a confirmation message',
         NULL, NULL, true),

        (v_user_id, v_gite_id, 'entree', 3,
         'Rentrer tous les véhicules dans la cour privative',
         'Return all vehicles to the private courtyard',
         NULL, NULL, true),

        (v_user_id, v_gite_id, 'entree', 4,
         'Trouver le badge / bip pour le portail',
         'Find the badge / beep for the portal',
         NULL, NULL, true),

        (v_user_id, v_gite_id, 'entree', 5,
         'Vérifier que tout est en ordre avant de vous installer',
         'Check that everything is in order before settling in',
         NULL, NULL, true);

    -- ──────────────────────────────────────────────────────
    -- SORTIE (7 items)
    -- ──────────────────────────────────────────────────────
    INSERT INTO public.checklist_templates
        (owner_user_id, gite_id, type, ordre, texte, texte_en, description, description_en, actif)
    VALUES
        (v_user_id, v_gite_id, 'sortie', 1,
         'Descendre le linge utilisé (draps, serviettes) au rez-de-chaussée',
         'Lower the used linen (sheets, towels) to the ground floor',
         NULL, NULL, true),

        (v_user_id, v_gite_id, 'sortie', 2,
         'Laisser la cuisine dans un état correct (vaisselle faite, plans de travail essuyés)',
         'Leave the kitchen in proper condition (dishes done, worktops wiped)',
         NULL, NULL, true),

        (v_user_id, v_gite_id, 'sortie', 3,
         'Vider les poubelles et jeter les mégots bien éteints dans les poubelles',
         'Empty the bins and throw the extinguished butts into the bins',
         NULL, NULL, true),

        (v_user_id, v_gite_id, 'sortie', 4,
         'Nettoyer la plancha à gaz (non inclus dans le ménage)',
         'Clean the gas plancha (not included in the cleaning service)',
         NULL, NULL, true),

        (v_user_id, v_gite_id, 'sortie', 5,
         'Laisser le gîte dans l''état dans lequel vous l''avez trouvé',
         'Leave the cottage in the state in which you found it',
         NULL, NULL, true),

        (v_user_id, v_gite_id, 'sortie', 6,
         'Faire un tour complet de toutes les pièces pour ne rien oublier',
         'Take a complete tour of all the rooms so you don''t forget anything',
         NULL, NULL, true),

        (v_user_id, v_gite_id, 'sortie', 7,
         'Déposer les clés dans la boîte à clés, refermer et nous envoyer un message',
         'Drop the keys in the lockbox, close it and send us a message',
         NULL, NULL, true);

    RAISE NOTICE '✅ Checklist Trévoux restaurée : 5 items entrée + 7 items sortie';
END $$;

-- VÉRIFICATION
SELECT
    type,
    ordre,
    texte,
    actif
FROM public.checklist_templates
WHERE gite_id = '5695d89b-6a70-401c-989b-4aa924c4c107'
ORDER BY type, ordre;
