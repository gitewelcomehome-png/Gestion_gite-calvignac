-- ================================================================
-- FIX: Ajouter owner_user_id à reservations si manquant
-- ================================================================
-- Ce script ajoute la colonne owner_user_id à la table reservations
-- et la remplit automatiquement avec le premier utilisateur trouvé

-- 1. Ajouter la colonne si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'reservations' 
          AND column_name = 'owner_user_id'
    ) THEN
        ALTER TABLE reservations 
        ADD COLUMN owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Colonne owner_user_id ajoutée';
    ELSE
        RAISE NOTICE 'Colonne owner_user_id existe déjà';
    END IF;
END $$;

-- 2. Remplir avec le premier utilisateur trouvé dans auth.users
DO $$ 
DECLARE
    default_user_id UUID;
    reservations_count INTEGER;
BEGIN
    -- Prendre le premier utilisateur de auth.users
    -- Note: auth.uid() ne fonctionne PAS dans un bloc DO, uniquement dans les policies
    SELECT id INTO default_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    
    IF default_user_id IS NOT NULL THEN
        -- Compter les réservations à mettre à jour
        SELECT COUNT(*) INTO reservations_count FROM reservations WHERE owner_user_id IS NULL;
        
        -- Mettre à jour les réservations qui n'ont pas encore d'owner
        UPDATE reservations 
        SET owner_user_id = default_user_id 
        WHERE owner_user_id IS NULL;
        
        RAISE NOTICE '✅ % réservations mises à jour avec owner_user_id: %', reservations_count, default_user_id;
    ELSE
        RAISE WARNING '⚠️ Aucun utilisateur trouvé dans auth.users - impossible de définir owner_user_id';
        RAISE NOTICE '📝 Créez un utilisateur d''abord, puis relancez ce script';
    END IF;
END $$;

-- 3. Rendre la colonne NOT NULL si toutes les lignes ont un owner
DO $$ 
BEGIN
    -- Vérifier qu'il n'y a pas de NULL
    IF NOT EXISTS (SELECT 1 FROM reservations WHERE owner_user_id IS NULL) THEN
        ALTER TABLE reservations 
        ALTER COLUMN owner_user_id SET NOT NULL;
        
        RAISE NOTICE 'Colonne owner_user_id définie comme NOT NULL';
    ELSE
        RAISE WARNING 'Certaines réservations n''ont pas d''owner_user_id - NOT NULL non appliqué';
    END IF;
END $$;

-- 4. Ajouter index si pas déjà présent
CREATE INDEX IF NOT EXISTS idx_reservations_owner ON reservations(owner_user_id);

-- 5. Vérification finale
DO $$ 
DECLARE
    total_count INTEGER;
    with_owner_count INTEGER;
BEGIN
    SELECT COUNT(*), COUNT(owner_user_id) 
    INTO total_count, with_owner_count
    FROM reservations;
    
    RAISE NOTICE 'Total réservations: %, Avec owner: %, Sans owner: %', 
        total_count, with_owner_count, (total_count - with_owner_count);
    RAISE NOTICE '✅ Vérification terminée';
END $$;
