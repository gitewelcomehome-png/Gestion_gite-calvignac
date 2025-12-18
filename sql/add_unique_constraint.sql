-- Migration: Ajouter contrainte UNIQUE sur reservation_id
-- À exécuter dans Supabase SQL Editor

-- Supprimer les doublons éventuels en gardant le plus récent
DELETE FROM cleaning_schedule a
USING cleaning_schedule b
WHERE a.id < b.id
  AND a.reservation_id = b.reservation_id;

-- Ajouter la contrainte UNIQUE
ALTER TABLE cleaning_schedule 
ADD CONSTRAINT cleaning_schedule_reservation_id_unique 
UNIQUE (reservation_id);
