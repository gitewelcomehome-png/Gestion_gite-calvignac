-- ================================================================
-- SCRIPT DÉFINITIF - CORRECTION COMPLÈTE DU SCHÉMA
-- ================================================================
-- Ce script corrige TOUS les problèmes de contraintes
-- À exécuter UNE SEULE FOIS dans Supabase SQL Editor
-- Date: 11 janvier 2026
-- ================================================================

-- ================================================================
-- 1. TABLE GITES - Supprimer contraintes trop restrictives
-- ================================================================

-- Supprimer CHECK sur icon (accepter n'importe quel string)
ALTER TABLE gites DROP CONSTRAINT IF EXISTS gites_icon_check;

-- Supprimer CHECK sur color (regex peut échouer)
ALTER TABLE gites DROP CONSTRAINT IF EXISTS gites_color_check;

-- Supprimer CHECK sur capacity (doit accepter NULL)
ALTER TABLE gites DROP CONSTRAINT IF EXISTS gites_capacity_check;

-- Garder CHECK sur slug (bon format) mais moins strict
ALTER TABLE gites DROP CONSTRAINT IF EXISTS gites_slug_check;
ALTER TABLE gites ADD CONSTRAINT gites_slug_check CHECK (slug ~ '^[a-z0-9-_]+$');

-- Garder CHECK sur name (longueur minimale)
-- gites_name_check est OK, on ne touche pas

-- ================================================================
-- 2. TABLE RESERVATIONS - Assouplir contraintes
-- ================================================================

-- Supprimer CHECK sur platform (liste trop limitée)
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_platform_check;

-- Supprimer CHECK sur status (liste trop limitée)  
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

-- Supprimer CHECK sur source (liste trop limitée)
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_source_check;

-- Supprimer CHECK sur guest_count (doit accepter NULL)
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_guest_count_check;

-- Garder CHECK sur dates (logique métier importante)
-- reservations_dates_check est OK, on ne touche pas

-- ================================================================
-- 3. TABLE CHARGES - Assouplir contraintes
-- ================================================================

-- Supprimer CHECK sur category (liste trop limitée)
ALTER TABLE charges DROP CONSTRAINT IF EXISTS charges_category_check;

-- Supprimer CHECK sur payment_method (liste trop limitée)
ALTER TABLE charges DROP CONSTRAINT IF EXISTS charges_payment_method_check;

-- Garder CHECK sur amount > 0 (logique métier)
-- charges_amount_check est OK, on ne touche pas

-- ================================================================
-- 4. TABLE RETOURS_MENAGE - Simplifier colonnes
-- ================================================================

-- Garder validated check (booléen simple)
-- retours_menage validé peut rester

-- ================================================================
-- 5. TABLE CLEANING_SCHEDULE - Assouplir
-- ================================================================

ALTER TABLE cleaning_schedule DROP CONSTRAINT IF EXISTS cleaning_schedule_time_of_day_check;
ALTER TABLE cleaning_schedule DROP CONSTRAINT IF EXISTS cleaning_schedule_status_check;

-- ================================================================
-- 6. TABLE DEMANDES_HORAIRES - Assouplir
-- ================================================================

ALTER TABLE demandes_horaires DROP CONSTRAINT IF EXISTS demandes_horaires_type_check;
ALTER TABLE demandes_horaires DROP CONSTRAINT IF EXISTS demandes_horaires_statut_check;

-- ================================================================
-- 7. TABLE PROBLEMES_SIGNALES - Assouplir
-- ================================================================

ALTER TABLE problemes_signales DROP CONSTRAINT IF EXISTS problemes_signales_priorite_check;

-- ================================================================
-- 8. TABLE TODOS - Assouplir
-- ================================================================

ALTER TABLE todos DROP CONSTRAINT IF EXISTS todos_category_check;

-- ================================================================
-- 9. TABLE INFOS_PRATIQUES - Assouplir
-- ================================================================

ALTER TABLE infos_pratiques DROP CONSTRAINT IF EXISTS infos_pratiques_info_type_check;

-- ================================================================
-- 10. TABLE STOCKS_DRAPS - Assouplir
-- ================================================================

ALTER TABLE stocks_draps DROP CONSTRAINT IF EXISTS stocks_draps_item_type_check;

-- ================================================================
-- FORCER RECHARGEMENT CACHE POSTGREST
-- ================================================================

NOTIFY pgrst, 'reload schema';

-- ================================================================
-- VÉRIFICATION - Lister les contraintes restantes
-- ================================================================

SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('gites', 'reservations', 'charges')
    AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;

-- ================================================================
-- RÉSULTAT ATTENDU
-- ================================================================
-- Après ce script, les contraintes CHECK restantes sont:
-- - gites: name (length >= 2), slug (format), bedrooms/bathrooms >= 0
-- - reservations: dates (check_out > check_in), client_name (length >= 2)
-- - charges: amount > 0, description NOT NULL
--
-- TOUTES les contraintes enum strictes sont supprimées
-- ================================================================
