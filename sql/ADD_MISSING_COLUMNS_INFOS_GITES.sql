-- ================================================================
-- AJOUT COLONNES SUPPLÉMENTAIRES infos_gites
-- ================================================================
-- Date: 20 janvier 2026
-- Ajout des colonnes utilisées par fiches-clients.js

-- Colonnes pour horaires détaillés
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS heure_arrivee_min TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS heure_arrivee_menage TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS heure_depart_max TEXT;
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS heure_depart_dimanche TEXT;

-- Colonne pour QR code WiFi
ALTER TABLE public.infos_gites ADD COLUMN IF NOT EXISTS wifi_qr_url TEXT;

-- Migration: Copier code_porte vers code_acces si code_acces est vide
UPDATE public.infos_gites 
SET code_acces = code_porte 
WHERE (code_acces IS NULL OR code_acces = '') AND code_porte IS NOT NULL;
