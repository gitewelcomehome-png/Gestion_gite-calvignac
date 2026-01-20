-- ==========================================
-- AJOUT GESTION VÉHICULE ÉLECTRIQUE
-- Date : 19/01/2026
-- Objectif : Ajouter le type de véhicule (thermique/électrique) pour les barèmes kilométriques
-- ==========================================

-- Pas de nouvelle colonne nécessaire, tout est dans details (JSONB)
-- Ce script documente juste la structure attendue dans le JSONB

-- Structure attendue dans simulations_fiscales.details :
-- {
--   "puissance_fiscale": 5,           -- Puissance en CV (3-7)
--   "vehicule_type": "thermique",     -- "thermique" ou "electrique"
--   "km_professionnels": 5000,        -- Total km pro de l'année
--   "montant_frais_km": 3180.00       -- Montant déductible calculé
-- }

-- Barème 2024 pour véhicules THERMIQUES (source: impots.gouv.fr)
-- ┌────────────┬───────────────┬────────────────┬─────────────────┐
-- │ Puissance  │ 0-5000 km     │ 5001-20000 km  │ Plus de 20000   │
-- ├────────────┼───────────────┼────────────────┼─────────────────┤
-- │ 3 CV       │ d × 0,529     │ (d × 0,316)+1065 │ d × 0,370     │
-- │ 4 CV       │ d × 0,606     │ (d × 0,340)+1330 │ d × 0,407     │
-- │ 5 CV       │ d × 0,636     │ (d × 0,357)+1395 │ d × 0,427     │
-- │ 6 CV       │ d × 0,665     │ (d × 0,374)+1457 │ d × 0,447     │
-- │ 7 CV et +  │ d × 0,697     │ (d × 0,394)+1515 │ d × 0,470     │
-- └────────────┴───────────────┴────────────────┴─────────────────┘

-- Barème 2024 pour véhicules ÉLECTRIQUES (source: impots.gouv.fr)
-- ┌─────────────┬───────────────┬────────────────┬─────────────────┐
-- │ Puissance   │ 0-5000 km     │ 5001-20000 km  │ Plus de 20000   │
-- ├─────────────┼───────────────┼────────────────┼─────────────────┤
-- │ Électrique  │ d × 0,679     │ (d × 0,379)+1500 │ d × 0,454     │
-- └─────────────┴───────────────┴────────────────┴─────────────────┘
-- Note : Le barème électrique est unique, pas de distinction par puissance

-- ✅ Aucune migration SQL nécessaire
-- Les données sont stockées dans le JSONB existant
-- Il faut juste mettre à jour le code JavaScript pour :
-- 1. Ajouter un champ "Type de véhicule" dans le formulaire
-- 2. Calculer avec le bon barème selon le type
-- 3. Sauvegarder vehicule_type dans details

SELECT '✅ Documentation barème électrique ajoutée - Pas de migration SQL nécessaire' as status;
