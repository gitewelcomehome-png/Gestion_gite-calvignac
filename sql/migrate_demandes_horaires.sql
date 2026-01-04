-- Migration de la table demandes_horaires
-- Ajoute les colonnes manquantes si elles n'existent pas

-- Supprimer l'ancienne contrainte CHECK sur type si elle existe
DO $$ 
BEGIN
    -- Supprimer toutes les contraintes CHECK sur la colonne type
    DECLARE
        constraint_name TEXT;
    BEGIN
        FOR constraint_name IN 
            SELECT con.conname
            FROM pg_constraint con
            INNER JOIN pg_class rel ON rel.oid = con.conrelid
            WHERE rel.relname = 'demandes_horaires' 
            AND con.contype = 'c'
            AND pg_get_constraintdef(con.oid) LIKE '%type%'
        LOOP
            EXECUTE format('ALTER TABLE demandes_horaires DROP CONSTRAINT IF EXISTS %I', constraint_name);
            RAISE NOTICE 'Contrainte % supprimée', constraint_name;
        END LOOP;
    END;
END $$;

-- Ajouter la colonne type avec la bonne contrainte si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'demandes_horaires' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE demandes_horaires ADD COLUMN type TEXT NOT NULL DEFAULT 'arrivee';
    END IF;
    
    -- Ajouter la nouvelle contrainte CHECK
    ALTER TABLE demandes_horaires DROP CONSTRAINT IF EXISTS demandes_horaires_type_check_new;
    ALTER TABLE demandes_horaires ADD CONSTRAINT demandes_horaires_type_check_new CHECK (type IN ('arrivee', 'depart'));
END $$;

-- Ajouter la colonne gite si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'demandes_horaires' 
        AND column_name = 'gite'
    ) THEN
        ALTER TABLE demandes_horaires ADD COLUMN gite TEXT NOT NULL DEFAULT 'Inconnu';
    END IF;
END $$;

-- Ajouter la colonne statut si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'demandes_horaires' 
        AND column_name = 'statut'
    ) THEN
        ALTER TABLE demandes_horaires 
        ADD COLUMN statut TEXT NOT NULL DEFAULT 'en_attente' 
        CHECK (statut IN ('en_attente', 'validee', 'refusee'));
    END IF;
END $$;

-- Ajouter la colonne heure_validee si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'demandes_horaires' 
        AND column_name = 'heure_validee'
    ) THEN
        ALTER TABLE demandes_horaires ADD COLUMN heure_validee TIME;
    END IF;
END $$;

-- Ajouter la colonne raison_refus si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'demandes_horaires' 
        AND column_name = 'raison_refus'
    ) THEN
        ALTER TABLE demandes_horaires ADD COLUMN raison_refus TEXT;
    END IF;
END $$;

-- Ajouter la colonne validated_at si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'demandes_horaires' 
        AND column_name = 'validated_at'
    ) THEN
        ALTER TABLE demandes_horaires ADD COLUMN validated_at TIMESTAMPTZ;
    END IF;
END $$;

-- Ajouter la colonne validated_by si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'demandes_horaires' 
        AND column_name = 'validated_by'
    ) THEN
        ALTER TABLE demandes_horaires ADD COLUMN validated_by TEXT;
    END IF;
END $$;

-- Ajouter la colonne client_nom si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'demandes_horaires' 
        AND column_name = 'client_nom'
    ) THEN
        ALTER TABLE demandes_horaires ADD COLUMN client_nom TEXT;
    END IF;
END $$;

-- Ajouter la colonne client_prenom si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'demandes_horaires' 
        AND column_name = 'client_prenom'
    ) THEN
        ALTER TABLE demandes_horaires ADD COLUMN client_prenom TEXT;
    END IF;
END $$;

-- Ajouter la colonne date_debut si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'demandes_horaires' 
        AND column_name = 'date_debut'
    ) THEN
        ALTER TABLE demandes_horaires ADD COLUMN date_debut DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- Ajouter la colonne date_fin si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'demandes_horaires' 
        AND column_name = 'date_fin'
    ) THEN
        ALTER TABLE demandes_horaires ADD COLUMN date_fin DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- Créer les index s'ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_demandes_horaires_reservation ON demandes_horaires(reservation_id);
CREATE INDEX IF NOT EXISTS idx_demandes_horaires_statut ON demandes_horaires(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_horaires_gite ON demandes_horaires(gite);
CREATE INDEX IF NOT EXISTS idx_demandes_horaires_dates ON demandes_horaires(date_debut, date_fin);

-- Désactiver RLS
ALTER TABLE public.demandes_horaires DISABLE ROW LEVEL SECURITY;

-- Afficher la structure finale
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'demandes_horaires'
ORDER BY ordinal_position;
