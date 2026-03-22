-- ============================================================
-- IMPORT INFOS_GITES - Restauration depuis export 2026-03-06
-- VERSION 2 : Corrige la compatibilité avec le schéma JS (colonnes manquantes)
-- ============================================================
-- NOTE : Le schéma REBUILD avait renommé les colonnes (gite_id, arrivee_heure, etc.)
-- Ce script rajoute les colonnes avec les noms attendus par le JS AVANT l'import.
-- ============================================================

-- ÉTAPE 0 : Préparer le schéma pour la compatibilité JS
-- Le JS utilise la colonne 'gite' (TEXT) et non 'gite_id' (UUID)
ALTER TABLE public.infos_gites ALTER COLUMN gite_id DROP NOT NULL;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS gite TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS gps_lat NUMERIC(10,8);
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS gps_lon NUMERIC(11,8);
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_ssid TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_password TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_debit TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_localisation TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_zones TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_ssid_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_password_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_debit_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_localisation_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_zones_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS heure_arrivee TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS arrivee_tardive TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS parking_dispo TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS parking_places TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS parking_details TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS type_acces TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS code_acces TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_cles TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS etage TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS ascenseur TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS itineraire_logement TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS premiere_visite TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS heure_arrivee_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS arrivee_tardive_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS parking_dispo_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS parking_places_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS parking_details_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS type_acces_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS code_acces_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_cles_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS etage_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS ascenseur_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS itineraire_logement_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS premiere_visite_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS type_chauffage TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS climatisation TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_chauffage TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS equipements_cuisine TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_four TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_plaques TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_lave_vaisselle TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_lave_linge TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS seche_linge TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS fer_repasser TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS linge_fourni TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS configuration_chambres TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS type_chauffage_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS climatisation_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_chauffage_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS equipements_cuisine_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_four_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_plaques_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_lave_vaisselle_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_lave_linge_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS seche_linge_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS fer_repasser_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS linge_fourni_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS configuration_chambres_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_tri TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS jours_collecte TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS decheterie TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS instructions_tri_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS jours_collecte_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS decheterie_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS detecteur_fumee TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS extincteur TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS coupure_eau TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS disjoncteur TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS consignes_urgence TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS detecteur_fumee_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS extincteur_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS coupure_eau_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS disjoncteur_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS consignes_urgence_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS heure_depart TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS depart_tardif TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS checklist_depart TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS restitution_cles TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS heure_depart_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS depart_tardif_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS checklist_depart_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS restitution_cles_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS tabac TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS animaux TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS nb_max_personnes TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS caution TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS tabac_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS animaux_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS nb_max_personnes_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS caution_en TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS date_modification TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS fiche_client_theme TEXT;

-- Ajouter la contrainte UNIQUE sur gite (si pas déjà là)
DO $def$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.infos_gites'::regclass
          AND contype = 'u'
          AND conname = 'infos_gites_gite_key'
    ) THEN
        ALTER TABLE public.infos_gites ADD CONSTRAINT infos_gites_gite_key UNIQUE (gite);
    END IF;
END $def$;

-- ============================================================
-- STEP 1: Vérifier votre user_id (exécuter séparément)
-- SELECT id, email FROM auth.users ORDER BY created_at;
-- ============================================================

DO $$
DECLARE
    v_user_id UUID;
    v_override_user_id UUID := NULL; -- Collez votre UUID ici si nécessaire
BEGIN
    IF v_override_user_id IS NOT NULL THEN
        v_user_id := v_override_user_id;
    ELSE
        SELECT id INTO v_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
    END IF;

    RAISE NOTICE 'User ID utilisé: %', v_user_id;
    RAISE NOTICE 'Email: %', (SELECT email FROM auth.users WHERE id = v_user_id);

    -- === Gîte: couzon ===
    INSERT INTO infos_gites (owner_user_id, gite, gps_lat, gps_lon)
    VALUES (v_user_id, 'couzon', '45.8435075', '4.8252704')
    ON CONFLICT (gite) DO UPDATE SET
        owner_user_id = v_user_id,
        gps_lat = '45.8435075',
        gps_lon = '4.8252704';

    -- === Gîte: 3ème ===
    INSERT INTO infos_gites (owner_user_id, gite, gps_lat, gps_lon, heure_arrivee, arrivee_tardive, parking_dispo, parking_places, parking_details, type_acces, code_acces, instructions_cles, etage, type_acces_en, code_acces_en, instructions_cles_en, etage_en, seche_linge, fer_repasser, linge_fourni, configuration_chambres, seche_linge_en, linge_fourni_en, instructions_tri, jours_collecte, instructions_tri_en, jours_collecte_en, detecteur_fumee, extincteur, coupure_eau, disjoncteur, detecteur_fumee_en, disjoncteur_en, heure_depart, depart_tardif, checklist_depart, restitution_cles, depart_tardif_en, checklist_depart_en, restitution_cles_en, tabac, animaux, nb_max_personnes, tabac_en, animaux_en, nb_max_personnes_en, ascenseur, ascenseur_en, premiere_visite, premiere_visite_en, type_chauffage, type_chauffage_en, climatisation, climatisation_en, instructions_chauffage, instructions_chauffage_en, equipements_cuisine, instructions_lave_vaisselle, instructions_lave_vaisselle_en, instructions_lave_linge, instructions_lave_linge_en, instructions_four)
    VALUES (v_user_id, '3ème', '46.06386860', '4.94724730', 'À partir de 18h00', 'Oui, sans supplément', 'Oui, gratuit sur place', '5', 'cours cloturée pour garer les voiture', 'Boîte à clés', '1304 ', '**Instructions pour récupérer les clés du gîte**

1. **Arrivée au gîte**  
   Rendez-vous à l''adresse indiquée dans votre confirmation de réservation.

2. **Localisation de la boîte à clés**  
   Cherchez une boîte à clés fixée à gauche de la porte d''entrée après le porche orange
3. **Code d''accès**  
   Consultez votre diche client  confirmation pour trouver le code d''accès à la boîte. 

4. **Ouverture de la boîte**  
   Entrer le code et appuyer sur les deux cotés de la boite

5. **Récupération des clés**  
   Ouvrez la boîte et prenez les clés qui s''y trouvent. 

6. **Fermeture de la boîte**  
   Refermez la boîte à clés et assurez-vous qu''elle est bien verrouillée.

7. **Entrée dans le gîte**  
   Utilisez la clé principale pour ouvrir la porte d''entrée et profitez de votre séjour !

Si vous rencontrez des problèmes, n''hésitez pas à contacter le propriétaire au numéro indiqué dans votre confirmation.', 'Rez-de-chaussée', 'boxes for keys', '1304', '**Instructions pour récupérer les clés du gîte**

1. **Arrivée au gîte**  
   Rendez-vous à l''adresse indiquée dans votre confirmation de réservation.

2. **Localisation de la boîte à clés**  
   Cherchez une boîte à clés fixée à gauche de la porte d''entrée après le porche orange
3. **Code d''accès**  
   Consultez votre diche client  confirmation pour trouver le code d''accès à la boîte. 

4. **Ouverture de la boîte**  
   Entrer le code et appuyer sur les deux cotés de la boite

5. **Récupération des clés**  
   Ouvrez la boîte et prenez les clés qui s''y trouvent. 

6. **Fermeture de la boîte**  
   Refermez la boîte à clés et assurez-vous qu''elle est bien verrouillée.

7. **Entrée dans le gîte**  
   Utilisez la clé principale pour ouvrir la porte d''entrée et profitez de votre séjour !

Si vous rencontrez des problèmes, n''hésitez pas à contacter le propriétaire au numéro indiqué dans votre confirmation.', 'Ground floor', 'Oui', 'oui ', 'oui draps et serviettes de douche ', 'à remplir chambres ', 'Yes', 'yes sheets and shower towels', 'à remplir tri ', 'jaune le mercredi 
vert tout les vendredi  
verre à jeter à 500m sur la droite en sortant du gite ', 'to be filled', 'yellow on wednesday 
green every Friday  
glass to throw at 500m on the right when leaving the cottage', 'oui ', 'non ', 'derrière le chauffe eau  ', 'buanderie ', 'yes', 'Laundry room', 'Avant 10h00', 'Oui, sans supplément', 'à remplir  ', 'à remettre dans la boite à clé ', 'Yes, at no extra charge', 'to be filled', 'to put back in the lockbox', 'Interdit intérieur', 'Sur demande', '15', 'Prohibited inside', '⏳ Traduction...', '15', 'Non', 'No', 'à remplir ', 'to be filled', 'Pompe à chaleur', 'Heat pump:', 'Oui, clim seule', 'Yes, air conditioning only', 'à remplir   ', 'to be filled', 'à remplir  équipement ', 'à remplir lave vaiselle ', 'to fill dishwasher', 'à remplir buanderie ', 'to fill laundry room', 'à remplir four ')
    ON CONFLICT (gite) DO UPDATE SET
        owner_user_id = v_user_id,
        gps_lat = '46.06386860',
        gps_lon = '4.94724730',
        heure_arrivee = 'À partir de 18h00',
        arrivee_tardive = 'Oui, sans supplément',
        parking_dispo = 'Oui, gratuit sur place',
        parking_places = '5',
        parking_details = 'cours cloturée pour garer les voiture',
        type_acces = 'Boîte à clés',
        code_acces = '1304 ',
        instructions_cles = '**Instructions pour récupérer les clés du gîte**

1. **Arrivée au gîte**  
   Rendez-vous à l''adresse indiquée dans votre confirmation de réservation.

2. **Localisation de la boîte à clés**  
   Cherchez une boîte à clés fixée à gauche de la porte d''entrée après le porche orange
3. **Code d''accès**  
   Consultez votre diche client  confirmation pour trouver le code d''accès à la boîte. 

4. **Ouverture de la boîte**  
   Entrer le code et appuyer sur les deux cotés de la boite

5. **Récupération des clés**  
   Ouvrez la boîte et prenez les clés qui s''y trouvent. 

6. **Fermeture de la boîte**  
   Refermez la boîte à clés et assurez-vous qu''elle est bien verrouillée.

7. **Entrée dans le gîte**  
   Utilisez la clé principale pour ouvrir la porte d''entrée et profitez de votre séjour !

Si vous rencontrez des problèmes, n''hésitez pas à contacter le propriétaire au numéro indiqué dans votre confirmation.',
        etage = 'Rez-de-chaussée',
        type_acces_en = 'boxes for keys',
        code_acces_en = '1304',
        instructions_cles_en = '**Instructions pour récupérer les clés du gîte**

1. **Arrivée au gîte**  
   Rendez-vous à l''adresse indiquée dans votre confirmation de réservation.

2. **Localisation de la boîte à clés**  
   Cherchez une boîte à clés fixée à gauche de la porte d''entrée après le porche orange
3. **Code d''accès**  
   Consultez votre diche client  confirmation pour trouver le code d''accès à la boîte. 

4. **Ouverture de la boîte**  
   Entrer le code et appuyer sur les deux cotés de la boite

5. **Récupération des clés**  
   Ouvrez la boîte et prenez les clés qui s''y trouvent. 

6. **Fermeture de la boîte**  
   Refermez la boîte à clés et assurez-vous qu''elle est bien verrouillée.

7. **Entrée dans le gîte**  
   Utilisez la clé principale pour ouvrir la porte d''entrée et profitez de votre séjour !

Si vous rencontrez des problèmes, n''hésitez pas à contacter le propriétaire au numéro indiqué dans votre confirmation.',
        etage_en = 'Ground floor',
        seche_linge = 'Oui',
        fer_repasser = 'oui ',
        linge_fourni = 'oui draps et serviettes de douche ',
        configuration_chambres = 'à remplir chambres ',
        seche_linge_en = 'Yes',
        linge_fourni_en = 'yes sheets and shower towels',
        instructions_tri = 'à remplir tri ',
        jours_collecte = 'jaune le mercredi 
vert tout les vendredi  
verre à jeter à 500m sur la droite en sortant du gite ',
        instructions_tri_en = 'to be filled',
        jours_collecte_en = 'yellow on wednesday 
green every Friday  
glass to throw at 500m on the right when leaving the cottage',
        detecteur_fumee = 'oui ',
        extincteur = 'non ',
        coupure_eau = 'derrière le chauffe eau  ',
        disjoncteur = 'buanderie ',
        detecteur_fumee_en = 'yes',
        disjoncteur_en = 'Laundry room',
        heure_depart = 'Avant 10h00',
        depart_tardif = 'Oui, sans supplément',
        checklist_depart = 'à remplir  ',
        restitution_cles = 'à remettre dans la boite à clé ',
        depart_tardif_en = 'Yes, at no extra charge',
        checklist_depart_en = 'to be filled',
        restitution_cles_en = 'to put back in the lockbox',
        tabac = 'Interdit intérieur',
        animaux = 'Sur demande',
        nb_max_personnes = '15',
        tabac_en = 'Prohibited inside',
        animaux_en = '⏳ Traduction...',
        nb_max_personnes_en = '15',
        ascenseur = 'Non',
        ascenseur_en = 'No',
        premiere_visite = 'à remplir ',
        premiere_visite_en = 'to be filled',
        type_chauffage = 'Pompe à chaleur',
        type_chauffage_en = 'Heat pump:',
        climatisation = 'Oui, clim seule',
        climatisation_en = 'Yes, air conditioning only',
        instructions_chauffage = 'à remplir   ',
        instructions_chauffage_en = 'to be filled',
        equipements_cuisine = 'à remplir  équipement ',
        instructions_lave_vaisselle = 'à remplir lave vaiselle ',
        instructions_lave_vaisselle_en = 'to fill dishwasher',
        instructions_lave_linge = 'à remplir buanderie ',
        instructions_lave_linge_en = 'to fill laundry room',
        instructions_four = 'à remplir four ';

    -- === Gîte: trévoux ===
    INSERT INTO infos_gites (owner_user_id, gite, gps_lat, gps_lon, wifi_ssid, wifi_password, wifi_debit, wifi_localisation, wifi_zones, wifi_ssid_en, wifi_password_en, wifi_debit_en, wifi_localisation_en, wifi_zones_en, heure_arrivee, arrivee_tardive, parking_dispo, parking_places, parking_details, type_acces, code_acces, instructions_cles, etage, heure_arrivee_en, arrivee_tardive_en, parking_dispo_en, parking_places_en, parking_details_en, type_acces_en, code_acces_en, instructions_cles_en, etage_en, seche_linge, fer_repasser, linge_fourni, configuration_chambres, seche_linge_en, fer_repasser_en, linge_fourni_en, configuration_chambres_en, instructions_tri, jours_collecte, instructions_tri_en, jours_collecte_en, detecteur_fumee, extincteur, coupure_eau, disjoncteur, detecteur_fumee_en, extincteur_en, coupure_eau_en, disjoncteur_en, heure_depart, depart_tardif, checklist_depart, restitution_cles, heure_depart_en, depart_tardif_en, checklist_depart_en, restitution_cles_en, tabac, animaux, nb_max_personnes, tabac_en, animaux_en, nb_max_personnes_en, ascenseur, ascenseur_en, itineraire_logement, itineraire_logement_en, premiere_visite, premiere_visite_en, type_chauffage, type_chauffage_en, climatisation, climatisation_en, instructions_chauffage, instructions_chauffage_en, equipements_cuisine, equipements_cuisine_en, instructions_lave_vaisselle, instructions_lave_vaisselle_en, instructions_lave_linge, instructions_lave_linge_en, instructions_plaques, instructions_plaques_en)
    VALUES (v_user_id, 'trévoux', '45.9362558', '4.7931857', 'Livebox-D758', 'Trevoux2026', '> 750 Mbps', 'buanderie', 'salle à mangé ', 'Livebox-D758', 'Trevoux2026', '> 750 Mbps', 'Laundry room', 'dining room', 'À partir de 18h00', 'Oui, sans supplément', 'Oui, gratuit sur place', '5', 'cours cloturée pour garer les 5 voitures', 'Boîte à clés', '1304', 'Après le porche sur la droite : vous trouverez une boite à clé . puis en entrant dans la maison vous trouverez une deuxième paire de clé et le Bip du portail . ', 'Rez-de-chaussée', 'From 6:00 PM', 'Yes, at no extra charge', 'Yes, free on site', '5', 'closed course to park the 5 cars', 'boxes for keys', '1304', 'After the porch on the right: you will find a lockbox . Then when entering the house you will find a second pair of keys and the Portal Beep.', 'Ground floor', 'Oui', 'oui', 'oui draps et serviettes de douche ', 'rdc : 1 chambres lit 140 
1er : 4 chambre lits 140
2ème : 1 lit 140 et 3 lits 90', 'Yes', 'yes', 'yes sheets and shower towels', 'ground floor: 1 bedrooms bed 140 
1st: 4 Bedroom 140 Beds
2nd: 1 bed 140 and 3 beds 90', 'Poubelle verte : standard à sortir le vendredi matin
Poubelle jaune : tri à sortir 1 semaine sur deux le mardi soir

le verre doit être absolument vidé dans les poubelles a verres publique a 300m en sortant du gite sur la droite', 'jaune le mercredi 
vert tout les vendredi  
verre à jeter à 500m sur la droite en sortant du gite ', 'Green bin: standard to take out on Friday mornings
Yellow bin: sort to go out every other week on Tuesday evening

the glass must be absolutely emptied in the public glass bins at 300m leaving the cottage on the right', 'yellow on wednesday 
green every Friday  
glass to throw at 500m on the right when leaving the cottage', 'oui ', 'non ', 'derrière le chauffe eau  ', 'buanderie ', 'yes', 'not', 'behind the water heater', 'Laundry room', 'Avant 10h00', 'Oui, sans supplément', 'faire le tours de la maison, descendre draps et servviette utilisée . ne pas enlevé alaises si non tachées .  Fermer les volet sauf celle porte puscine . adpater la températures des clims lors de viotre départ si période chaude ou froide .', 'à remettre dans la boite à clé ', 'Before 10:00', 'Yes, at no extra charge', 'walk around the house, lower sheets and use a shuttle. do not remove slats if not stained .  Close the shutters except the puscine door . adapt the temperature of the air conditioners during your departure if hot or cold period.', 'to put back in the lockbox', 'Interdit intérieur', 'Sur demande', '15', 'Prohibited inside', 'On request', '15', 'Non', 'No', 'entrer toutes les voitures à l''intérieur', 'enter all cars inside', 'pour ouvrir et fermer piscine système de clé dans la box piscine . 
ouvrir le volet de piscine en cas d''orage . 
fermer le parasol en cas de vent . ', 'to open and close pool key system in the pool box. 
open the pool shutter in the event of a thunderstorm . 
close the umbrella in case of wind .', 'Pompe à chaleur', 'Heat pump:', 'Oui, réversible', 'Yes, reversible', 'ne pas toucher mode climatisation . en hiver mode heat . si température froides ne pas fermer chauffage au départ . mettre à 17 degré . 
en été mode cool . En cas de grosse chaleur laisser la clim marché au 2ème étage. Attention ne pas augmenter ou trop baisser les température car inutile et réduit les performances .', 'do not touch air conditioning mode. in winter heat mode. if cold temperatures do not close heating at the start . set to 17 degrees . 
in summer cool fashion. In case of severe heat, leave the A/C market on the 2nd floor. Be careful not to raise or lower temperatures too much because it is useless and reduces performance .', 'nécessaires pour 15 personnes . Machine a raclette et a fondue . Cafetière a filtre et à capsule l''OR . ', 'required for 15 people . Squeegee and melting machine. Coffee maker with filter and capsule the gold .', 'A vider avant chaque départ ', 'To be emptied before each departure', 'accessible dans la buanerie', 'accessible in the laundry room', 'Plaque a induction . si voyant rouge a coté du cadena laissé appuyer pour enlever sécurité ', 'Induction plate. if red light next to cadena let press to remove safety')
    ON CONFLICT (gite) DO UPDATE SET
        owner_user_id = v_user_id,
        gps_lat = '45.9362558',
        gps_lon = '4.7931857',
        wifi_ssid = 'Livebox-D758',
        wifi_password = 'Trevoux2026',
        wifi_debit = '> 750 Mbps',
        wifi_localisation = 'buanderie',
        wifi_zones = 'salle à mangé ',
        wifi_ssid_en = 'Livebox-D758',
        wifi_password_en = 'Trevoux2026',
        wifi_debit_en = '> 750 Mbps',
        wifi_localisation_en = 'Laundry room',
        wifi_zones_en = 'dining room',
        heure_arrivee = 'À partir de 18h00',
        arrivee_tardive = 'Oui, sans supplément',
        parking_dispo = 'Oui, gratuit sur place',
        parking_places = '5',
        parking_details = 'cours cloturée pour garer les 5 voitures',
        type_acces = 'Boîte à clés',
        code_acces = '1304',
        instructions_cles = 'Après le porche sur la droite : vous trouverez une boite à clé . puis en entrant dans la maison vous trouverez une deuxième paire de clé et le Bip du portail . ',
        etage = 'Rez-de-chaussée',
        heure_arrivee_en = 'From 6:00 PM',
        arrivee_tardive_en = 'Yes, at no extra charge',
        parking_dispo_en = 'Yes, free on site',
        parking_places_en = '5',
        parking_details_en = 'closed course to park the 5 cars',
        type_acces_en = 'boxes for keys',
        code_acces_en = '1304',
        instructions_cles_en = 'After the porch on the right: you will find a lockbox . Then when entering the house you will find a second pair of keys and the Portal Beep.',
        etage_en = 'Ground floor',
        seche_linge = 'Oui',
        fer_repasser = 'oui',
        linge_fourni = 'oui draps et serviettes de douche ',
        configuration_chambres = 'rdc : 1 chambres lit 140 
1er : 4 chambre lits 140
2ème : 1 lit 140 et 3 lits 90',
        seche_linge_en = 'Yes',
        fer_repasser_en = 'yes',
        linge_fourni_en = 'yes sheets and shower towels',
        configuration_chambres_en = 'ground floor: 1 bedrooms bed 140 
1st: 4 Bedroom 140 Beds
2nd: 1 bed 140 and 3 beds 90',
        instructions_tri = 'Poubelle verte : standard à sortir le vendredi matin
Poubelle jaune : tri à sortir 1 semaine sur deux le mardi soir

le verre doit être absolument vidé dans les poubelles a verres publique a 300m en sortant du gite sur la droite',
        jours_collecte = 'jaune le mercredi 
vert tout les vendredi  
verre à jeter à 500m sur la droite en sortant du gite ',
        instructions_tri_en = 'Green bin: standard to take out on Friday mornings
Yellow bin: sort to go out every other week on Tuesday evening

the glass must be absolutely emptied in the public glass bins at 300m leaving the cottage on the right',
        jours_collecte_en = 'yellow on wednesday 
green every Friday  
glass to throw at 500m on the right when leaving the cottage',
        detecteur_fumee = 'oui ',
        extincteur = 'non ',
        coupure_eau = 'derrière le chauffe eau  ',
        disjoncteur = 'buanderie ',
        detecteur_fumee_en = 'yes',
        extincteur_en = 'not',
        coupure_eau_en = 'behind the water heater',
        disjoncteur_en = 'Laundry room',
        heure_depart = 'Avant 10h00',
        depart_tardif = 'Oui, sans supplément',
        checklist_depart = 'faire le tours de la maison, descendre draps et servviette utilisée . ne pas enlevé alaises si non tachées .  Fermer les volet sauf celle porte puscine . adpater la températures des clims lors de viotre départ si période chaude ou froide .',
        restitution_cles = 'à remettre dans la boite à clé ',
        heure_depart_en = 'Before 10:00',
        depart_tardif_en = 'Yes, at no extra charge',
        checklist_depart_en = 'walk around the house, lower sheets and use a shuttle. do not remove slats if not stained .  Close the shutters except the puscine door . adapt the temperature of the air conditioners during your departure if hot or cold period.',
        restitution_cles_en = 'to put back in the lockbox',
        tabac = 'Interdit intérieur',
        animaux = 'Sur demande',
        nb_max_personnes = '15',
        tabac_en = 'Prohibited inside',
        animaux_en = 'On request',
        nb_max_personnes_en = '15',
        ascenseur = 'Non',
        ascenseur_en = 'No',
        itineraire_logement = 'entrer toutes les voitures à l''intérieur',
        itineraire_logement_en = 'enter all cars inside',
        premiere_visite = 'pour ouvrir et fermer piscine système de clé dans la box piscine . 
ouvrir le volet de piscine en cas d''orage . 
fermer le parasol en cas de vent . ',
        premiere_visite_en = 'to open and close pool key system in the pool box. 
open the pool shutter in the event of a thunderstorm . 
close the umbrella in case of wind .',
        type_chauffage = 'Pompe à chaleur',
        type_chauffage_en = 'Heat pump:',
        climatisation = 'Oui, réversible',
        climatisation_en = 'Yes, reversible',
        instructions_chauffage = 'ne pas toucher mode climatisation . en hiver mode heat . si température froides ne pas fermer chauffage au départ . mettre à 17 degré . 
en été mode cool . En cas de grosse chaleur laisser la clim marché au 2ème étage. Attention ne pas augmenter ou trop baisser les température car inutile et réduit les performances .',
        instructions_chauffage_en = 'do not touch air conditioning mode. in winter heat mode. if cold temperatures do not close heating at the start . set to 17 degrees . 
in summer cool fashion. In case of severe heat, leave the A/C market on the 2nd floor. Be careful not to raise or lower temperatures too much because it is useless and reduces performance .',
        equipements_cuisine = 'nécessaires pour 15 personnes . Machine a raclette et a fondue . Cafetière a filtre et à capsule l''OR . ',
        equipements_cuisine_en = 'required for 15 people . Squeegee and melting machine. Coffee maker with filter and capsule the gold .',
        instructions_lave_vaisselle = 'A vider avant chaque départ ',
        instructions_lave_vaisselle_en = 'To be emptied before each departure',
        instructions_lave_linge = 'accessible dans la buanerie',
        instructions_lave_linge_en = 'accessible in the laundry room',
        instructions_plaques = 'Plaque a induction . si voyant rouge a coté du cadena laissé appuyer pour enlever sécurité ',
        instructions_plaques_en = 'Induction plate. if red light next to cadena let press to remove safety';

    RAISE NOTICE 'Import infos_gites terminé.';
END $$;

-- Recharger le cache schema PostgREST pour que les nouvelles colonnes soient visibles
NOTIFY pgrst, 'reload schema';

-- VÉRIFICATION
SELECT ig.gite, ig.wifi_ssid, ig.code_acces, ig.nb_max_personnes, u.email AS proprietaire
FROM infos_gites ig
LEFT JOIN auth.users u ON u.id = ig.owner_user_id
ORDER BY ig.gite;