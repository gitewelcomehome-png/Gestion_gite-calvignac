-- Ajouter colonne pour la raison de refus client
ALTER TABLE cleaning_schedule 
ADD COLUMN IF NOT EXISTS refusal_reason TEXT;

COMMENT ON COLUMN cleaning_schedule.refusal_reason IS 'Raison du refus de la proposition par le client';
