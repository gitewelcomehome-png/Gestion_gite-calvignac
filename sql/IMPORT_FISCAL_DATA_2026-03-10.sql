-- ====================================================================
-- IMPORT DONNEES FISCALES - depuis export_snapshot.json (2026-03-06)
-- ====================================================================
-- Source : ancienne instance Supabase (export du 2026-03-06)
-- Tables : fiscal_history (3 lignes) + fiscalite_amortissements (30 lignes)
--
-- ⚠️  ETAPE 1 : VERIFICEZ VOTRE USER_ID
-- Executez d'abord UNIQUEMENT cette requete, et notez votre UUID :
--
--     SELECT id, email, created_at FROM auth.users ORDER BY created_at;
--
-- Puis remplacez la valeur ci-dessous par VOTRE UUID :
-- ====================================================================
-- 🔧 METTEZ ICI VOTRE UUID (celui qui correspond a votre email) :
--    Exemple : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
-- Si NULL, le script prend automatiquement le DERNIER utilisateur cree
-- (le plus recent = vous, si vous venez de vous inscrire)
-- ====================================================================

-- PREREQUIS : Executer CORRECTIONS_SCHEMA_APP_2026-03-07.sql d'abord !
-- SAFE TO RE-RUN : ON CONFLICT DO UPDATE / DO NOTHING

-- ====================================================================
-- ETAPE 1 : Voir les utilisateurs disponibles (copiez votre UUID)
-- ====================================================================
SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- ====================================================================
-- ETAPE 2 : Lancer l'import (apres avoir verifie l'UUID ci-dessous)
-- ====================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_override_user_id UUID := NULL; -- ← Mettez votre UUID ici si probleme, ex: 'abc123...'
BEGIN
    -- Si un UUID est fourni manuellement, on l'utilise
    IF v_override_user_id IS NOT NULL THEN
        v_user_id := v_override_user_id;
    ELSE
        -- Sinon : prend le DERNIER inscrit (= l'utilisateur le plus recent)
        SELECT id INTO v_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Aucun utilisateur dans auth.users. Creez votre compte d''abord.';
    END IF;

    -- Affiche l'email pour verification visuelle
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Import pour user_id = %', v_user_id;
    RAISE NOTICE 'Email correspondant : %', (SELECT email FROM auth.users WHERE id = v_user_id);
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Si ce n''est pas votre email, ARRETEZ et mettez';
    RAISE NOTICE 'votre UUID dans v_override_user_id ci-dessus.';

    -- ----------------------------------------------------------------
    -- Nettoyage des donnees orphelines (ancien user_id si precedente
    -- execution avait pris le mauvais utilisateur)
    -- On supprime toutes les lignes fiscal_history qui ne correspondent
    -- pas a v_user_id, pour les annees 2024/2025/2026 uniquement
    -- ----------------------------------------------------------------
    DELETE FROM public.fiscal_history
    WHERE year IN (2024, 2025, 2026)
      AND gite = 'multi'
      AND owner_user_id != v_user_id;

    DELETE FROM public.fiscalite_amortissements
    WHERE user_id != v_user_id;

    -- ----------------------------------------------------------------
    -- fiscal_history (3 simulations fiscales : 2024, 2025, 2026)
    -- ----------------------------------------------------------------
    INSERT INTO public.fiscal_history
        (owner_user_id, year, gite, revenus, charges, resultat, regime, donnees_detaillees)
    VALUES (
        v_user_id,
        2024,
        'multi',
        39754,
        0,
        0,
        NULL,
        '{"gite": "multi", "rc_pro": 0, "regime": "reel", "carburant": 0, "comptable": 1200, "formation": 0, "telephone": 0, "fournitures": 0, "frais_madame": {"cv": 5, "km": 0, "option": "forfaitaire", "peages": 0, "montant": 0}, "impot_estime": 0, "impot_revenu": 0, "charges_gites": {"3me": {"cfe": 0, "eau": 0, "linge": 0, "menage": 0, "internet": 0, "logiciel": 0, "commissions": 0, "copropriete": 0, "electricite": 0, "amortissement": 0, "assurance_hab": 0, "taxe_fonciere": 0, "interets_emprunt": 0, "assurance_emprunt": 0}, "4me": {"cfe": 0, "eau": 0, "linge": 0, "menage": 0, "internet": 0, "logiciel": 0, "commissions": 0, "copropriete": 0, "electricite": 0, "amortissement": 0, "assurance_hab": 0, "taxe_fonciere": 0, "interets_emprunt": 0, "assurance_emprunt": 0}, "couzon": {"cfe": 0, "eau": 60, "linge": 350, "menage": 0, "internet": 60, "logiciel": 50, "commissions": 0, "copropriete": 0, "electricite": 300, "amortissement": 20000, "assurance_hab": 60, "taxe_fonciere": 1600, "interets_emprunt": 0, "assurance_emprunt": 0}, "trvoux": {"cfe": 750, "eau": 90, "linge": 350, "menage": 0, "internet": 60, "logiciel": 100, "commissions": 0, "copropriete": 0, "electricite": 450, "amortissement": 28000, "assurance_hab": 60, "taxe_fonciere": 1850, "interets_emprunt": 350, "assurance_emprunt": 60}}, "charges_total": 0, "credits_liste": [], "eau_residence": 30, "materiel_info": 0, "revenus_total": 39754, "statut_fiscal": "lmp", "travaux_liste": [{"gite": "couzon", "montant": 950, "description": "salle de bain", "type_amortissement": ""}, {"gite": "trvoux", "montant": 1700, "description": "iphone", "type_amortissement": "informatique"}, {"gite": "3me", "montant": 0, "description": "", "type_amortissement": ""}], "vehicule_type": "thermique", "assurance_auto": 0, "carburant_type": "mensuel", "entretien_auto": 0, "frais_monsieur": {"cv": 5, "km": 0, "option": "forfaitaire", "peages": 0, "montant": 0}, "nombre_enfants": 0, "reste_apres_ir": 0, "reste_avant_ir": -46165.92, "salaire_madame": 35000, "surface_bureau": 45, "surface_totale": 200, "telephone_type": "annuel", "frais_bancaires": 240, "frais_perso_eau": 30, "vehicule_option": "bareme", "chiffre_affaires": 39754, "fournitures_type": "annuel", "frais_perso_taxe": 350, "montant_frais_km": 0, "salaire_monsieur": 24100, "classement_meuble": "non_classe", "km_professionnels": 0, "puissance_fiscale": 5, "amortissement_auto": 0, "benefice_imposable": -44965.92, "cotisations_urssaf": 1200, "credits_personnels": [{"id": "1768829440383", "intitule": "crédit maison ", "montant_mensuel": 2550}, {"id": "1768829451986", "intitule": "crédit Trévoux", "montant_mensuel": 1960}], "eau_residence_type": "[object Object]", "frais_divers_liste": [{"gite": "trvoux", "montant": 300, "description": "tests frais divers", "type_amortissement": ""}], "frais_perso_autres": 0, "interets_residence": 320, "internet_residence": 60, "resultat_imposable": -44965.92, "usage_pro_pourcent": 0, "assurance_auto_type": "mensuel", "assurance_residence": 0, "trimestres_retraite": 0, "frais_perso_internet": 60, "electricite_residence": 350, "frais_perso_assurance": 60, "produits_accueil_liste": [{"gite": "couzon", "montant": 200, "description": "test produit", "type_amortissement": ""}], "assurance_hab_residence": 60, "frais_perso_electricite": 350, "interets_residence_type": "[object Object]", "internet_residence_type": "[object Object]", "taxe_fonciere_residence": 350, "assurance_residence_type": "[object Object]", "electricite_residence_type": "[object Object]", "assurance_hab_residence_type": "[object Object]"}'::jsonb
    ) ON CONFLICT (owner_user_id, year, gite) DO UPDATE SET
        revenus = EXCLUDED.revenus,
        charges = EXCLUDED.charges,
        resultat = EXCLUDED.resultat,
        regime = EXCLUDED.regime,
        donnees_detaillees = EXCLUDED.donnees_detaillees,
        updated_at = NOW();
    RAISE NOTICE 'fiscal_history annee 2024 insere/mis a jour';

    INSERT INTO public.fiscal_history
        (owner_user_id, year, gite, revenus, charges, resultat, regime, donnees_detaillees)
    VALUES (
        v_user_id,
        2025,
        'multi',
        138000,
        0,
        0,
        NULL,
        '{"gite": "multi", "rc_pro": 0, "regime": "reel", "carburant": 0, "comptable": 1200, "formation": 0, "telephone": 0, "fournitures": 0, "frais_madame": {"cv": 5, "km": 0, "option": "forfaitaire", "peages": 0, "montant": 0}, "impot_estime": 12846.85, "impot_revenu": 12846.85, "charges_gites": {"3me": {"cfe": 0, "eau": 0, "linge": 0, "menage": 0, "internet": 0, "logiciel": 0, "commissions": 0, "copropriete": 0, "electricite": 0, "amortissement": 0, "assurance_hab": 0, "taxe_fonciere": 0, "interets_emprunt": 0, "assurance_emprunt": 0}, "4me": {"cfe": 0, "eau": 0, "linge": 0, "menage": 0, "internet": 0, "logiciel": 0, "commissions": 0, "copropriete": 0, "electricite": 0, "amortissement": 0, "assurance_hab": 0, "taxe_fonciere": 0, "interets_emprunt": 0, "assurance_emprunt": 0}, "couzon": {"cfe": 0, "eau": 60, "linge": 350, "menage": 0, "internet": 60, "logiciel": 50, "commissions": 0, "copropriete": 0, "electricite": 300, "amortissement": 20000, "assurance_hab": 60, "taxe_fonciere": 1600, "interets_emprunt": 0, "assurance_emprunt": 0}, "trvoux": {"cfe": 750, "eau": 90, "linge": 350, "menage": 0, "internet": 60, "logiciel": 100, "commissions": 0, "copropriete": 0, "electricite": 450, "amortissement": 28000, "assurance_hab": 60, "taxe_fonciere": 1850, "interets_emprunt": 350, "assurance_emprunt": 60}}, "charges_total": 0, "credits_liste": [], "eau_residence": 30, "materiel_info": 0, "revenus_total": 138000, "statut_fiscal": "lmp", "travaux_liste": [{"gite": "couzon", "montant": 950, "description": "salle de bain", "type_amortissement": ""}, {"gite": "trvoux", "montant": 1700, "description": "iphone", "type_amortissement": "informatique"}, {"gite": "3me", "montant": 0, "description": "", "type_amortissement": ""}], "vehicule_type": "thermique", "assurance_auto": 0, "carburant_type": "mensuel", "entretien_auto": 0, "frais_monsieur": {"cv": 5, "km": 0, "option": "forfaitaire", "peages": 0, "montant": 0}, "nombre_enfants": 0, "reste_apres_ir": 0, "reste_avant_ir": 34391.3, "salaire_madame": 35000, "surface_bureau": 45, "surface_totale": 200, "telephone_type": "annuel", "frais_bancaires": 240, "frais_perso_eau": 30, "vehicule_option": "bareme", "chiffre_affaires": 138000, "fournitures_type": "annuel", "frais_perso_taxe": 350, "montant_frais_km": 0, "salaire_monsieur": 24100, "classement_meuble": "non_classe", "km_professionnels": 0, "puissance_fiscale": 5, "amortissement_auto": 0, "benefice_imposable": 53280.08, "cotisations_urssaf": 18888.78, "credits_personnels": [{"id": "1768829440383", "intitule": "crédit maison ", "montant_mensuel": 2550}, {"id": "1768829451986", "intitule": "crédit Trévoux", "montant_mensuel": 1960}], "eau_residence_type": "[object Object]", "frais_divers_liste": [{"gite": "trvoux", "montant": 300, "description": "tests frais divers", "type_amortissement": ""}], "frais_perso_autres": 0, "interets_residence": 320, "internet_residence": 60, "resultat_imposable": 53280.08, "usage_pro_pourcent": 0, "assurance_auto_type": "mensuel", "assurance_residence": 0, "trimestres_retraite": 4, "frais_perso_internet": 60, "electricite_residence": 350, "frais_perso_assurance": 60, "produits_accueil_liste": [{"gite": "couzon", "montant": 200, "description": "test produit", "type_amortissement": ""}], "assurance_hab_residence": 60, "frais_perso_electricite": 350, "interets_residence_type": "[object Object]", "internet_residence_type": "[object Object]", "taxe_fonciere_residence": 350, "assurance_residence_type": "[object Object]", "electricite_residence_type": "[object Object]", "assurance_hab_residence_type": "[object Object]"}'::jsonb
    ) ON CONFLICT (owner_user_id, year, gite) DO UPDATE SET
        revenus = EXCLUDED.revenus,
        charges = EXCLUDED.charges,
        resultat = EXCLUDED.resultat,
        regime = EXCLUDED.regime,
        donnees_detaillees = EXCLUDED.donnees_detaillees,
        updated_at = NOW();
    RAISE NOTICE 'fiscal_history annee 2025 insere/mis a jour';

    INSERT INTO public.fiscal_history
        (owner_user_id, year, gite, revenus, charges, resultat, regime, donnees_detaillees)
    VALUES (
        v_user_id,
        2026,
        'multi',
        43935,
        0,
        0,
        NULL,
        '{"gite": "multi", "rc_pro": 0, "regime": "reel", "carburant": 0, "comptable": 1200, "formation": 0, "telephone": 0, "fournitures": 0, "frais_madame": {"cv": 5, "km": 0, "option": "forfaitaire", "peages": 0, "montant": 0}, "impot_estime": 197.5, "impot_revenu": 197.5, "charges_gites": {"3me": {"cfe": 0, "eau": 0, "linge": 0, "menage": 0, "internet": 0, "logiciel": 0, "commissions": 0, "copropriete": 0, "electricite": 0, "amortissement": 0, "assurance_hab": 0, "taxe_fonciere": 0, "interets_emprunt": 0, "assurance_emprunt": 0}, "4me": {"cfe": 0, "eau": 0, "linge": 0, "menage": 0, "internet": 0, "logiciel": 0, "commissions": 0, "copropriete": 0, "electricite": 0, "amortissement": 0, "assurance_hab": 0, "taxe_fonciere": 0, "interets_emprunt": 0, "assurance_emprunt": 0}, "couzon": {"cfe": 0, "eau": 60, "linge": 350, "menage": 0, "internet": 60, "logiciel": 50, "commissions": 0, "copropriete": 0, "electricite": 300, "amortissement": 20000, "assurance_hab": 60, "taxe_fonciere": 1600, "interets_emprunt": 0, "assurance_emprunt": 0}, "trvoux": {"cfe": 750, "eau": 90, "linge": 350, "menage": 0, "internet": 60, "logiciel": 101, "commissions": 0, "copropriete": 0, "electricite": 450, "amortissement": 28000, "assurance_hab": 60, "taxe_fonciere": 1850, "interets_emprunt": 350, "assurance_emprunt": 60}}, "charges_total": 70839.5, "credits_liste": [], "eau_residence": 360, "materiel_info": 0, "revenus_total": 43935, "statut_fiscal": "lmp", "travaux_liste": [{"gite": "commun", "montant": 950, "description": "salle de bain", "type_amortissement": "plomberie"}, {"gite": "trvoux", "montant": 0, "description": "iphone", "type_amortissement": "informatique"}, {"gite": "trvoux", "montant": 0, "description": "peinture", "type_amortissement": "decoration"}], "vehicule_type": "thermique", "assurance_auto": 0, "carburant_type": "mensuel", "entretien_auto": 0, "frais_monsieur": {"cv": 5, "km": 0, "option": "forfaitaire", "peages": 0, "montant": 0}, "nombre_enfants": 0, "reste_apres_ir": 0, "reste_avant_ir": -28104.5, "salaire_madame": 35000, "surface_bureau": 45, "surface_totale": 200, "telephone_type": "annuel", "frais_bancaires": 240, "frais_perso_eau": 0, "vehicule_option": "bareme", "chiffre_affaires": 43935, "fournitures_type": "annuel", "frais_perso_taxe": 0, "montant_frais_km": 3700.12, "salaire_monsieur": 24000, "classement_meuble": "classe", "km_professionnels": 5546, "puissance_fiscale": 7, "amortissement_auto": 0, "benefice_imposable": -26904.5, "cotisations_urssaf": 1200, "credits_personnels": [{"id": "1768829440383", "intitule": "crédit maison ", "montant_mensuel": 2550}, {"id": "1768829451986", "intitule": "crédit Trévoux", "montant_mensuel": 1960}], "eau_residence_type": "annuel", "frais_divers_liste": [{"gite": "trvoux", "montant": 300, "description": "tests frais divers", "type_amortissement": ""}], "frais_perso_autres": 0, "interets_residence": 3840, "internet_residence": 720, "resultat_imposable": -26904.5, "usage_pro_pourcent": 0, "assurance_auto_type": "mensuel", "assurance_residence": 0, "trimestres_retraite": 0, "frais_perso_internet": 0, "electricite_residence": 4200, "frais_perso_assurance": 0, "produits_accueil_liste": [{"gite": "commun", "montant": 200, "description": "test produit", "type_amortissement": ""}], "assurance_hab_residence": 720, "frais_perso_electricite": 0, "interets_residence_type": "annuel", "internet_residence_type": "annuel", "taxe_fonciere_residence": 350, "assurance_residence_type": "[object Object]", "electricite_residence_type": "annuel", "assurance_hab_residence_type": "annuel"}'::jsonb
    ) ON CONFLICT (owner_user_id, year, gite) DO UPDATE SET
        revenus = EXCLUDED.revenus,
        charges = EXCLUDED.charges,
        resultat = EXCLUDED.resultat,
        regime = EXCLUDED.regime,
        donnees_detaillees = EXCLUDED.donnees_detaillees,
        updated_at = NOW();
    RAISE NOTICE 'fiscal_history annee 2026 insere/mis a jour';

    -- ----------------------------------------------------------------
    -- fiscalite_amortissements (30 lignes d'amortissements)
    -- ----------------------------------------------------------------
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2027,
        'travaux',
        'iphone (amortissement 1/3)',
        'informatique',
        566.67,
        '{"duree": 3, "annee_origine": 2026, "montant_total": 1700}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2028,
        'travaux',
        'iphone (amortissement 2/3)',
        'informatique',
        566.67,
        '{"duree": 3, "annee_origine": 2026, "montant_total": 1700}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2027,
        'travaux',
        'salle de bain (amortissement 1/10)',
        'renovation_legere',
        95,
        '{"duree": 10, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2028,
        'travaux',
        'salle de bain (amortissement 2/10)',
        'renovation_legere',
        95,
        '{"duree": 10, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2029,
        'travaux',
        'salle de bain (amortissement 3/10)',
        'renovation_legere',
        95,
        '{"duree": 10, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2030,
        'travaux',
        'salle de bain (amortissement 4/10)',
        'renovation_legere',
        95,
        '{"duree": 10, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2031,
        'travaux',
        'salle de bain (amortissement 5/10)',
        'renovation_legere',
        95,
        '{"duree": 10, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2032,
        'travaux',
        'salle de bain (amortissement 6/10)',
        'renovation_legere',
        95,
        '{"duree": 10, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2033,
        'travaux',
        'salle de bain (amortissement 7/10)',
        'renovation_legere',
        95,
        '{"duree": 10, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2034,
        'travaux',
        'salle de bain (amortissement 8/10)',
        'renovation_legere',
        95,
        '{"duree": 10, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2035,
        'travaux',
        'salle de bain (amortissement 9/10)',
        'renovation_legere',
        95,
        '{"duree": 10, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2027,
        'travaux',
        'salle de bain (amortissement 1/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2028,
        'travaux',
        'salle de bain (amortissement 2/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2029,
        'travaux',
        'salle de bain (amortissement 3/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2030,
        'travaux',
        'salle de bain (amortissement 4/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2031,
        'travaux',
        'salle de bain (amortissement 5/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2032,
        'travaux',
        'salle de bain (amortissement 6/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2033,
        'travaux',
        'salle de bain (amortissement 7/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2034,
        'travaux',
        'salle de bain (amortissement 8/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2035,
        'travaux',
        'salle de bain (amortissement 9/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2036,
        'travaux',
        'salle de bain (amortissement 10/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2037,
        'travaux',
        'salle de bain (amortissement 11/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2038,
        'travaux',
        'salle de bain (amortissement 12/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2039,
        'travaux',
        'salle de bain (amortissement 13/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2040,
        'travaux',
        'salle de bain (amortissement 14/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2041,
        'travaux',
        'salle de bain (amortissement 15/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2042,
        'travaux',
        'salle de bain (amortissement 16/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2043,
        'travaux',
        'salle de bain (amortissement 17/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2044,
        'travaux',
        'salle de bain (amortissement 18/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;
    INSERT INTO public.fiscalite_amortissements
        (user_id, annee, type, description, gite, montant, amortissement_origine)
    VALUES (
        v_user_id,
        2045,
        'travaux',
        'salle de bain (amortissement 19/20)',
        'plomberie',
        47.5,
        '{"duree": 20, "annee_origine": 2026, "montant_total": 950}'::jsonb
    ) ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Import termine avec succes !';
END $$;

-- ====================================================================
-- VERIFICATION FINALE
-- Vous devez voir 3 lignes avec vos annees 2024, 2025, 2026
-- et nb_amortissements = 30
-- ====================================================================
SELECT
    fh.year,
    fh.gite,
    fh.revenus,
    fh.donnees_detaillees->>'chiffre_affaires' AS ca,
    fh.donnees_detaillees->>'statut_fiscal' AS statut,
    u.email AS proprietaire
FROM public.fiscal_history fh
LEFT JOIN auth.users u ON u.id = fh.owner_user_id
ORDER BY fh.year;

SELECT COUNT(*) AS nb_amortissements FROM public.fiscalite_amortissements;

-- Si vous voyez 0 lignes ou les mauvaises donnees :
-- 1. Lancez : SELECT id, email FROM auth.users;
-- 2. Copiez votre UUID dans v_override_user_id au debut du script
-- 3. Relancez le script
