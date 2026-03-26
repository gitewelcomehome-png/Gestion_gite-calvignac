BEGIN;
INSERT INTO auth.users (id, aud, role, created_at, updated_at) VALUES ('12296d3d-696b-4c5d-95b7-e0b3a1dd1814'::uuid, 'authenticated', 'authenticated', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.infos_gites (owner_user_id, gite_id, adresse, adresse_en, telephone, telephone_en, email, email_en, latitude, longitude, wifi_ssid, wifi_password, wifi_debit, wifi_debit_en, wifi_localisation, wifi_localisation_en, wifi_zones, wifi_zones_en, arrivee_heure, arrivee_parking, arrivee_parking_en, arrivee_acces, arrivee_acces_en, arrivee_codes, arrivee_instructions_cles, arrivee_instructions_cles_en, arrivee_etage, arrivee_etage_en, chauffage_type, chauffage_utilisation, chauffage_utilisation_en, cuisine_equipements, cuisine_equipements_en, chambre_literie, chambre_literie_en, dechets_tri, dechets_tri_en, dechets_collecte, dechets_collecte_en, dechets_decheterie, dechets_decheterie_en, securite_detecteurs, securite_detecteurs_en, securite_extincteur, securite_extincteur_en, securite_coupures, securite_coupures_en, depart_heure, depart_checklist, depart_checklist_en, depart_restitution_cles, depart_restitution_cles_en, reglement_tabac, reglement_tabac_en, reglement_animaux, reglement_animaux_en, reglement_nb_personnes, reglement_caution) VALUES
('12296d3d-696b-4c5d-95b7-e0b3a1dd1814', '655e201e-f0ae-40a1-90d7-1dd7876e5d97', NULL, NULL, NULL, NULL, NULL, NULL, 45.8435075, 4.8252704, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('12296d3d-696b-4c5d-95b7-e0b3a1dd1814', '5e3af1b2-f344-4f1e-90cb-6b999f87393a', NULL, NULL, NULL, NULL, NULL, NULL, 46.06386860, 4.94724730, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'À partir de 18h00', 'cours cloturée pour garer les voiture', NULL, 'Boîte à clés', 'boxes for keys', '{"code_acces":"1304"}'::jsonb, '**Instructions pour récupérer les clés du gîte**

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

Si vous rencontrez des problèmes, n''hésitez pas à contacter le propriétaire au numéro indiqué dans votre confirmation.', '**Instructions pour récupérer les clés du gîte**

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

Si vous rencontrez des problèmes, n''hésitez pas à contacter le propriétaire au numéro indiqué dans votre confirmation.', 'Rez-de-chaussée', 'Ground floor', 'Pompe à chaleur', 'à remplir', 'to be filled', 'à remplir  équipement', NULL, 'à remplir chambres', NULL, 'à remplir tri', 'to be filled', 'jaune le mercredi 
vert tout les vendredi  
verre à jeter à 500m sur la droite en sortant du gite', 'yellow on wednesday 
green every Friday  
glass to throw at 500m on the right when leaving the cottage', NULL, NULL, 'oui', 'yes', 'non', NULL, 'derrière le chauffe eau | buanderie', 'Laundry room', 'Avant 10h00', 'à remplir', 'to be filled', 'à remettre dans la boite à clé', 'to put back in the lockbox', 'Interdit intérieur', 'Prohibited inside', 'Sur demande', '⏳ Traduction...', 15, NULL),
('12296d3d-696b-4c5d-95b7-e0b3a1dd1814', '2ee6c0bb-1a6a-4490-85e6-af75a1ff3f03', NULL, NULL, NULL, NULL, NULL, NULL, 45.9362558, 4.7931857, 'Livebox-D758', 'Trevoux2026', '> 750 Mbps', '> 750 Mbps', 'buanderie', 'Laundry room', 'salle à mangé', 'dining room', 'À partir de 18h00', 'cours cloturée pour garer les 5 voitures', 'closed course to park the 5 cars', 'Boîte à clés', 'boxes for keys', '{"code_acces":"1304"}'::jsonb, 'Après le porche sur la droite : vous trouverez une boite à clé . puis en entrant dans la maison vous trouverez une deuxième paire de clé et le Bip du portail .', 'After the porch on the right: you will find a lockbox . Then when entering the house you will find a second pair of keys and the Portal Beep.', 'Rez-de-chaussée', 'Ground floor', 'Pompe à chaleur', 'ne pas toucher mode climatisation . en hiver mode heat . si température froides ne pas fermer chauffage au départ . mettre à 17 degré . 
en été mode cool . En cas de grosse chaleur laisser la clim marché au 2ème étage. Attention ne pas augmenter ou trop baisser les température car inutile et réduit les performances .', 'do not touch air conditioning mode. in winter heat mode. if cold temperatures do not close heating at the start . set to 17 degrees . 
in summer cool fashion. In case of severe heat, leave the A/C market on the 2nd floor. Be careful not to raise or lower temperatures too much because it is useless and reduces performance .', 'nécessaires pour 15 personnes . Machine a raclette et a fondue . Cafetière a filtre et à capsule l''OR .', 'required for 15 people . Squeegee and melting machine. Coffee maker with filter and capsule the gold .', 'rdc : 1 chambres lit 140 
1er : 4 chambre lits 140
2ème : 1 lit 140 et 3 lits 90', 'ground floor: 1 bedrooms bed 140 
1st: 4 Bedroom 140 Beds
2nd: 1 bed 140 and 3 beds 90', 'Poubelle verte : standard à sortir le vendredi matin
Poubelle jaune : tri à sortir 1 semaine sur deux le mardi soir

le verre doit être absolument vidé dans les poubelles a verres publique a 300m en sortant du gite sur la droite', 'Green bin: standard to take out on Friday mornings
Yellow bin: sort to go out every other week on Tuesday evening

the glass must be absolutely emptied in the public glass bins at 300m leaving the cottage on the right', 'jaune le mercredi 
vert tout les vendredi  
verre à jeter à 500m sur la droite en sortant du gite', 'yellow on wednesday 
green every Friday  
glass to throw at 500m on the right when leaving the cottage', NULL, NULL, 'oui', 'yes', 'non', 'not', 'derrière le chauffe eau | buanderie', 'behind the water heater | Laundry room', 'Avant 10h00', 'faire le tours de la maison, descendre draps et servviette utilisée . ne pas enlevé alaises si non tachées .  Fermer les volet sauf celle porte puscine . adpater la températures des clims lors de viotre départ si période chaude ou froide .', 'walk around the house, lower sheets and use a shuttle. do not remove slats if not stained .  Close the shutters except the puscine door . adapt the temperature of the air conditioners during your departure if hot or cold period.', 'à remettre dans la boite à clé', 'to put back in the lockbox', 'Interdit intérieur', 'Prohibited inside', 'Sur demande', 'On request', 15, NULL)
ON CONFLICT (gite_id) DO UPDATE SET
adresse=EXCLUDED.adresse,
adresse_en=EXCLUDED.adresse_en,
telephone=EXCLUDED.telephone,
telephone_en=EXCLUDED.telephone_en,
email=EXCLUDED.email,
email_en=EXCLUDED.email_en,
latitude=EXCLUDED.latitude,
longitude=EXCLUDED.longitude,
wifi_ssid=EXCLUDED.wifi_ssid,
wifi_password=EXCLUDED.wifi_password,
wifi_debit=EXCLUDED.wifi_debit,
wifi_debit_en=EXCLUDED.wifi_debit_en,
wifi_localisation=EXCLUDED.wifi_localisation,
wifi_localisation_en=EXCLUDED.wifi_localisation_en,
wifi_zones=EXCLUDED.wifi_zones,
wifi_zones_en=EXCLUDED.wifi_zones_en,
arrivee_heure=EXCLUDED.arrivee_heure,
arrivee_parking=EXCLUDED.arrivee_parking,
arrivee_parking_en=EXCLUDED.arrivee_parking_en,
arrivee_acces=EXCLUDED.arrivee_acces,
arrivee_acces_en=EXCLUDED.arrivee_acces_en,
arrivee_codes=EXCLUDED.arrivee_codes,
arrivee_instructions_cles=EXCLUDED.arrivee_instructions_cles,
arrivee_instructions_cles_en=EXCLUDED.arrivee_instructions_cles_en,
arrivee_etage=EXCLUDED.arrivee_etage,
arrivee_etage_en=EXCLUDED.arrivee_etage_en,
chauffage_type=EXCLUDED.chauffage_type,
chauffage_utilisation=EXCLUDED.chauffage_utilisation,
chauffage_utilisation_en=EXCLUDED.chauffage_utilisation_en,
cuisine_equipements=EXCLUDED.cuisine_equipements,
cuisine_equipements_en=EXCLUDED.cuisine_equipements_en,
chambre_literie=EXCLUDED.chambre_literie,
chambre_literie_en=EXCLUDED.chambre_literie_en,
dechets_tri=EXCLUDED.dechets_tri,
dechets_tri_en=EXCLUDED.dechets_tri_en,
dechets_collecte=EXCLUDED.dechets_collecte,
dechets_collecte_en=EXCLUDED.dechets_collecte_en,
dechets_decheterie=EXCLUDED.dechets_decheterie,
dechets_decheterie_en=EXCLUDED.dechets_decheterie_en,
securite_detecteurs=EXCLUDED.securite_detecteurs,
securite_detecteurs_en=EXCLUDED.securite_detecteurs_en,
securite_extincteur=EXCLUDED.securite_extincteur,
securite_extincteur_en=EXCLUDED.securite_extincteur_en,
securite_coupures=EXCLUDED.securite_coupures,
securite_coupures_en=EXCLUDED.securite_coupures_en,
depart_heure=EXCLUDED.depart_heure,
depart_checklist=EXCLUDED.depart_checklist,
depart_checklist_en=EXCLUDED.depart_checklist_en,
depart_restitution_cles=EXCLUDED.depart_restitution_cles,
depart_restitution_cles_en=EXCLUDED.depart_restitution_cles_en,
reglement_tabac=EXCLUDED.reglement_tabac,
reglement_tabac_en=EXCLUDED.reglement_tabac_en,
reglement_animaux=EXCLUDED.reglement_animaux,
reglement_animaux_en=EXCLUDED.reglement_animaux_en,
reglement_nb_personnes=EXCLUDED.reglement_nb_personnes,
reglement_caution=EXCLUDED.reglement_caution;
INSERT INTO public.notification_preferences (id,user_id,email_enabled,push_enabled,sms_enabled,notification_types,notify_menage_modifications,menage_company_email,updated_at) VALUES (COALESCE('ee6a7873-09bd-4e37-8138-f66042617b97'::uuid, gen_random_uuid()), '12296d3d-696b-4c5d-95b7-e0b3a1dd1814'::uuid, true, true, false, '{"notify_demandes": true, "notify_reservations": true, "notify_taches": true, "notify_retours": true, "email_frequency": null}'::jsonb, true, NULL, now()) ON CONFLICT (user_id) DO UPDATE SET email_enabled=EXCLUDED.email_enabled, push_enabled=EXCLUDED.push_enabled, sms_enabled=EXCLUDED.sms_enabled, notification_types=EXCLUDED.notification_types, notify_menage_modifications=EXCLUDED.notify_menage_modifications, menage_company_email=COALESCE(EXCLUDED.menage_company_email, public.notification_preferences.menage_company_email), updated_at=now();
COMMIT;
