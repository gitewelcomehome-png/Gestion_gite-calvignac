-- ==========================================
-- SCRIPT D'INSERTION DONNÉES TEST PRESTATIONS
-- Date: 15 février 2026
-- Instructions: Remplacer les UUIDs avant d'exécuter
-- ==========================================

-- ============================================
-- ÉTAPE 1: Récupérer les UUIDs de votre BDD
-- ============================================

-- Récupérer un UUID de gîte
SELECT id, name FROM gites LIMIT 5;
-- Copier un ID et remplacer 'VOTRE-UUID-GITE' ci-dessous

-- Récupérer un UUID de réservation
SELECT id, client_name, check_in, check_out FROM reservations LIMIT 5;
-- Copier un ID et remplacer 'VOTRE-UUID-RESERVATION' ci-dessous

-- ============================================
-- ÉTAPE 2: Remplacer les UUIDs dans ce script
-- ============================================

-- Définir les variables (à adapter)
DO $$
DECLARE
    v_gite_uuid UUID := 'VOTRE-UUID-GITE'::uuid; -- 📝 REMPLACER ICI
    v_reservation_uuid UUID := 'VOTRE-UUID-RESERVATION'::uuid; -- 📝 REMPLACER ICI
    v_numero_commande TEXT;
    v_commande_id BIGINT;
BEGIN
    -- ============================================
    -- Insérer 4 prestations exemple
    -- ============================================
    
    INSERT INTO prestations_catalogue (gite_id, nom, nom_en, description, description_en, prix, categorie, icone, is_active) VALUES
    (v_gite_uuid, 'Petit-déjeuner continental', 'Continental Breakfast', 
     'Pain frais, viennoiseries, confitures maison, jus de fruits, café/thé', 
     'Fresh bread, pastries, homemade jams, fruit juice, coffee/tea',
     12.00, 'repas', '🥐', true),
     
    (v_gite_uuid, 'Ménage intermédiaire', 'Mid-stay Cleaning',
     'Ménage complet du logement en milieu de séjour avec changement draps',
     'Complete cleaning mid-stay with bed linen change',
     50.00, 'menage', '🧹', true),
     
    (v_gite_uuid, 'Location vélo adulte (par jour)', 'Adult Bike Rental (per day)',
     'VTT tout-terrain avec casque, antivol et kit de réparation',
     'Mountain bike with helmet, lock and repair kit',
     15.00, 'location', '🚴', true),
     
    (v_gite_uuid, 'Panier gourmand local', 'Local Gourmet Basket',
     'Produits du terroir: foie gras, vin de Cahors, fromages fermiers, confitures artisanales',
     'Local products: foie gras, Cahors wine, farmhouse cheeses, artisan jams',
     45.00, 'repas', '🧺', true),
     
    (v_gite_uuid, 'Cours de cuisine française', 'French Cooking Class',
     'Atelier cuisine 3h avec chef local, recettes traditionnelles',
     '3h cooking workshop with local chef, traditional recipes',
     80.00, 'activite', '👨‍🍳', true),
     
    (v_gite_uuid, 'Massage relaxant à domicile', 'Home Relaxation Massage',
     'Séance de massage 1h par praticien diplômé',
     'One-hour massage session by certified practitioner',
     65.00, 'autre', '💆', true);
    
    RAISE NOTICE '✅ 6 prestations créées pour le gîte %', v_gite_uuid;
    
    -- ============================================
    -- Créer une commande exemple
    -- ============================================
    
    -- Générer numéro commande
    v_numero_commande := generer_numero_commande();
    
    -- Créer la commande (Petit-déjeuner x2 + Vélo x1 = 39€)
    INSERT INTO commandes_prestations (
        reservation_id, 
        gite_id, 
        numero_commande,
        montant_prestations, 
        montant_commission, 
        montant_net_owner,
        statut, 
        methode_paiement,
        date_paiement, 
        date_confirmation,
        date_livraison
    ) VALUES (
        v_reservation_uuid,
        v_gite_uuid,
        v_numero_commande,
        39.00,  -- Montant brut (12€ x 2 + 15€ x 1)
        1.95,   -- Commission 5% (39 x 0.05)
        37.05,  -- Net owner (39 - 1.95)
        'delivered',
        'carte',
        NOW(),
        NOW(),
        NOW()
    ) RETURNING id INTO v_commande_id;
    
    RAISE NOTICE '✅ Commande créée: % (ID: %)', v_numero_commande, v_commande_id;
    
    -- Créer les lignes de commande
    INSERT INTO lignes_commande_prestations (commande_id, prestation_id, nom_prestation, prix_unitaire, quantite, prix_total) VALUES
    (v_commande_id, (SELECT id FROM prestations_catalogue WHERE gite_id = v_gite_uuid AND nom = 'Petit-déjeuner continental'), 'Petit-déjeuner continental', 12.00, 2, 24.00),
    (v_commande_id, (SELECT id FROM prestations_catalogue WHERE gite_id = v_gite_uuid AND nom LIKE 'Location vélo%'), 'Location vélo adulte (par jour)', 15.00, 1, 15.00);
    
    RAISE NOTICE '✅ 2 lignes de commande ajoutées';
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ DONNÉES TEST INSÉRÉES AVEC SUCCÈS !';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Gîte UUID: %', v_gite_uuid;
    RAISE NOTICE 'Réservation UUID: %', v_reservation_uuid;
    RAISE NOTICE 'Numéro commande: %', v_numero_commande;
    RAISE NOTICE 'Montant total: 39.00 € (37.05 € net après 5%% commission)';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Vous pouvez maintenant :';
    RAISE NOTICE '1. Ouvrir pages/admin-prestations.html pour voir les 6 prestations';
    RAISE NOTICE '2. Ouvrir pages/desktop-owner-prestations.html pour voir les stats';
    RAISE NOTICE '3. Ouvrir pages/fiche-client.html?id=%&token=... pour tester l''onglet client', v_reservation_uuid;
    
END $$;

-- ============================================
-- VÉRIFICATIONS
-- ============================================

-- Vérifier les prestations créées
SELECT 
    id, 
    nom, 
    prix || ' €' as prix, 
    categorie, 
    icone, 
    is_active
FROM prestations_catalogue
ORDER BY created_at DESC
LIMIT 10;

-- Vérifier la commande créée
SELECT 
    numero_commande,
    montant_prestations || ' €' as montant_brut,
    montant_commission || ' €' as commission,
    montant_net_owner || ' €' as net_owner,
    statut,
    date_commande
FROM commandes_prestations
ORDER BY created_at DESC
LIMIT 5;

-- Vérifier les stats CA
SELECT 
    gite_nom,
    TO_CHAR(mois, 'Month YYYY') as periode,
    nb_commandes,
    ca_brut || ' €' as ca_brut,
    commissions || ' €' as commissions,
    ca_net || ' €' as ca_net
FROM v_ca_prestations_mensuel
WHERE mois >= DATE_TRUNC('month', NOW() - INTERVAL '3 months')
ORDER BY mois DESC;
