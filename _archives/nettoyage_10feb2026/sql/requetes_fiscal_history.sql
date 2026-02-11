-- ═══════════════════════════════════════════════════════════════
-- 📊 REQUÊTES SQL - TABLE fiscal_history
-- ═══════════════════════════════════════════════════════════════
-- Base de données: Supabase PostgreSQL
-- Table: public.fiscal_history
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1️⃣ RÉCUPÉRER TOUTES LES DONNÉES
-- ───────────────────────────────────────────────────────────────
SELECT 
    id,
    owner_user_id,
    year,
    gite,
    revenus,
    charges,
    resultat,
    taux_occupation,
    nb_reservations,
    donnees_detaillees,
    created_at,
    updated_at
FROM public.fiscal_history
ORDER BY year DESC, created_at DESC;

-- ───────────────────────────────────────────────────────────────
-- 2️⃣ RÉCUPÉRER UNIQUEMENT LES COLONNES PRINCIPALES
-- ───────────────────────────────────────────────────────────────
SELECT 
    year AS "Année",
    gite AS "Gîte",
    revenus AS "Revenus (€)",
    charges AS "Charges (€)",
    resultat AS "Résultat (€)",
    taux_occupation AS "Taux occupation (%)",
    nb_reservations AS "Nb réservations",
    created_at AS "Créé le"
FROM public.fiscal_history
ORDER BY year DESC;

-- ───────────────────────────────────────────────────────────────
-- 3️⃣ EXTRAIRE LES DONNÉES DÉTAILLÉES (JSONB)
-- ───────────────────────────────────────────────────────────────
SELECT 
    year,
    gite,
    donnees_detaillees->>'chiffre_affaires' AS "CA",
    donnees_detaillees->>'benefice_imposable' AS "Bénéfice imposable",
    donnees_detaillees->>'cotisations_urssaf' AS "URSSAF",
    donnees_detaillees->>'impot_revenu' AS "Impôt revenu",
    donnees_detaillees->>'reste_apres_ir' AS "Reste après IR",
    donnees_detaillees->>'trimestres_retraite' AS "Trimestres"
FROM public.fiscal_history
ORDER BY year DESC;

-- ───────────────────────────────────────────────────────────────
-- 4️⃣ RÉCUPÉRER UNE ANNÉE SPÉCIFIQUE
-- ───────────────────────────────────────────────────────────────
SELECT *
FROM public.fiscal_history
WHERE year = 2026
ORDER BY created_at DESC;

-- ───────────────────────────────────────────────────────────────
-- 5️⃣ RÉCUPÉRER LA DERNIÈRE SIMULATION SAUVEGARDÉE
-- ───────────────────────────────────────────────────────────────
SELECT *
FROM public.fiscal_history
ORDER BY updated_at DESC
LIMIT 1;

-- ───────────────────────────────────────────────────────────────
-- 6️⃣ EXTRAIRE LES CHARGES PAR GÎTE (depuis JSONB)
-- ───────────────────────────────────────────────────────────────
SELECT 
    year,
    gite,
    jsonb_pretty(donnees_detaillees->'charges_gites') AS "Charges par gîte"
FROM public.fiscal_history
WHERE donnees_detaillees->'charges_gites' IS NOT NULL
ORDER BY year DESC;

-- ───────────────────────────────────────────────────────────────
-- 7️⃣ EXTRAIRE LES TRAVAUX (depuis JSONB array)
-- ───────────────────────────────────────────────────────────────
SELECT 
    year,
    gite,
    travail->>'description' AS "Description",
    (travail->>'montant')::numeric AS "Montant (€)"
FROM public.fiscal_history,
     jsonb_array_elements(donnees_detaillees->'travaux_liste') AS travail
WHERE donnees_detaillees->'travaux_liste' IS NOT NULL
ORDER BY year DESC;

-- ───────────────────────────────────────────────────────────────
-- 8️⃣ EXTRAIRE LES CRÉDITS (depuis JSONB array)
-- ───────────────────────────────────────────────────────────────
SELECT 
    year,
    credit->>'nom' AS "Nom crédit",
    (credit->>'mensualite')::numeric AS "Mensualité (€)",
    (credit->>'capital')::numeric AS "Capital restant (€)"
FROM public.fiscal_history,
     jsonb_array_elements(donnees_detaillees->'credits_liste') AS credit
WHERE donnees_detaillees->'credits_liste' IS NOT NULL
ORDER BY year DESC;

-- ───────────────────────────────────────────────────────────────
-- 9️⃣ STATISTIQUES PAR ANNÉE
-- ───────────────────────────────────────────────────────────────
SELECT 
    year AS "Année",
    COUNT(*) AS "Nb sauvegardes",
    ROUND(AVG(revenus), 2) AS "Revenus moyens",
    ROUND(SUM(revenus), 2) AS "Revenus total",
    ROUND(AVG(charges), 2) AS "Charges moyennes",
    ROUND(SUM(charges), 2) AS "Charges total",
    ROUND(AVG(resultat), 2) AS "Résultat moyen"
FROM public.fiscal_history
GROUP BY year
ORDER BY year DESC;

-- ───────────────────────────────────────────────────────────────
-- 🔟 EXPORT JSON COMPLET (pour backup)
-- ───────────────────────────────────────────────────────────────
SELECT jsonb_pretty(jsonb_agg(row_to_json(fiscal_history.*)))
FROM public.fiscal_history
ORDER BY year DESC;

-- ───────────────────────────────────────────────────────────────
-- 1️⃣1️⃣ RECHERCHER PAR USER (si vous connaissez votre user_id)
-- ───────────────────────────────────────────────────────────────
-- Remplacez 'VOTRE_USER_ID' par votre ID utilisateur
SELECT *
FROM public.fiscal_history
WHERE owner_user_id = 'VOTRE_USER_ID'
ORDER BY year DESC, created_at DESC;

-- ───────────────────────────────────────────────────────────────
-- 1️⃣2️⃣ AFFICHER LE JSON DÉTAILLÉ DE MANIÈRE LISIBLE
-- ───────────────────────────────────────────────────────────────
SELECT 
    year,
    gite,
    jsonb_pretty(donnees_detaillees) AS "Données complètes (JSON formaté)"
FROM public.fiscal_history
ORDER BY year DESC
LIMIT 5;

-- ───────────────────────────────────────────────────────────────
-- 1️⃣3️⃣ VÉRIFIER SI LA TABLE EST VIDE
-- ───────────────────────────────────────────────────────────────
SELECT 
    COUNT(*) AS "Nombre total d'enregistrements",
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ Table vide - Aucune donnée sauvegardée'
        ELSE '✅ Table contient des données'
    END AS "Statut"
FROM public.fiscal_history;

-- ───────────────────────────────────────────────────────────────
-- 1️⃣4️⃣ LISTE DES ANNÉES DISPONIBLES
-- ───────────────────────────────────────────────────────────────
SELECT DISTINCT year AS "Années disponibles"
FROM public.fiscal_history
ORDER BY year DESC;

-- ───────────────────────────────────────────────────────────────
-- 1️⃣5️⃣ DERNIÈRE MISE À JOUR PAR ANNÉE
-- ───────────────────────────────────────────────────────────────
SELECT 
    year AS "Année",
    MAX(updated_at) AS "Dernière modification",
    COUNT(*) AS "Nb modifications"
FROM public.fiscal_history
GROUP BY year
ORDER BY year DESC;

-- ═══════════════════════════════════════════════════════════════
-- 📝 NOTES D'UTILISATION
-- ═══════════════════════════════════════════════════════════════
-- 
-- Pour exécuter ces requêtes :
-- 
-- 1. Via Supabase Dashboard:
--    - Allez sur https://supabase.com/dashboard
--    - Projet: fgqimtpjjhdqeyyaptoj
--    - Menu: SQL Editor
--    - Copiez/collez la requête souhaitée
--    - Cliquez sur "Run"
--
-- 2. Via psql (ligne de commande):
--    psql "postgresql://postgres:[PASSWORD]@db.fgqimtpjjhdqeyyaptoj.supabase.co:5432/postgres"
--    Puis copier/coller la requête
--
-- 3. Via l'application:
--    Ouvrez la console navigateur (F12)
--    Utilisez: await window.supabaseClient.from('fiscal_history').select('*')
--
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 🔧 REQUÊTES DE MAINTENANCE (à utiliser avec précaution)
-- ───────────────────────────────────────────────────────────────

-- ⚠️ SUPPRIMER TOUTES LES DONNÉES (DANGER)
-- DELETE FROM public.fiscal_history;

-- ⚠️ SUPPRIMER UNE ANNÉE SPÉCIFIQUE
-- DELETE FROM public.fiscal_history WHERE year = 2025;

-- ⚠️ SUPPRIMER UN ENREGISTREMENT PAR ID
-- DELETE FROM public.fiscal_history WHERE id = 'uuid-ici';

-- ═══════════════════════════════════════════════════════════════
