-- Ajouter une colonne pour savoir qui a proposé la date
-- 'owner' = site principal, 'company' = société de ménage

ALTER TABLE cleaning_schedule 
ADD COLUMN IF NOT EXISTS proposed_by TEXT CHECK (proposed_by IN ('owner', 'company', NULL));

COMMENT ON COLUMN cleaning_schedule.proposed_by IS 'Qui a proposé la date: owner (site principal) ou company (société de ménage)';
