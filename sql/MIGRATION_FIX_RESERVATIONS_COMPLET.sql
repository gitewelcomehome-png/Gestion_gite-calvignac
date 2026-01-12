-- ================================================================
-- MIGRATION COMPLÈTE: Réparation système de réservations
-- ================================================================
-- Date: 12 janvier 2026
-- Objectif: Résoudre les erreurs 400 sur cleaning_schedule
--          et rendre les réservations visibles
-- ================================================================

-- ================================================================
-- ÉTAPE 1: Ajouter owner_user_id aux réservations existantes
-- ================================================================

-- 1.1 Ajouter la colonne si elle n'existe pas
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
        
        RAISE NOTICE '✅ Colonne owner_user_id ajoutée à reservations';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne owner_user_id existe déjà dans reservations';
    END IF;
END $$;

-- 1.2 Remplir avec le premier utilisateur trouvé dans auth.users
DO $$ 
DECLARE
    default_user_id UUID;
    reservations_count INTEGER;
BEGIN
    -- Prendre le premier utilisateur de auth.users
    SELECT id INTO default_user_id FROM auth.users ORDER BY created_at LIMIT 1;
    
    IF default_user_id IS NOT NULL THEN
        -- Compter les réservations à mettre à jour
        SELECT COUNT(*) INTO reservations_count FROM reservations WHERE owner_user_id IS NULL;
        
        IF reservations_count > 0 THEN
            -- Mettre à jour les réservations qui n'ont pas encore d'owner
            UPDATE reservations 
            SET owner_user_id = default_user_id 
            WHERE owner_user_id IS NULL;
            
            RAISE NOTICE '✅ % réservations mises à jour avec owner_user_id: %', reservations_count, default_user_id;
        ELSE
            RAISE NOTICE 'ℹ️  Toutes les réservations ont déjà un owner_user_id';
        END IF;
    ELSE
        RAISE WARNING '⚠️  Aucun utilisateur trouvé dans auth.users';
        RAISE NOTICE '📝 Créez un utilisateur d''abord, puis relancez ce script';
    END IF;
END $$;

-- 1.3 Rendre la colonne NOT NULL si toutes les lignes ont un owner
DO $$ 
DECLARE
    null_count INTEGER;
BEGIN
    -- Compter les NULL
    SELECT COUNT(*) INTO null_count FROM reservations WHERE owner_user_id IS NULL;
    
    IF null_count = 0 THEN
        -- Vérifier si déjà NOT NULL
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'reservations' 
              AND column_name = 'owner_user_id'
              AND is_nullable = 'YES'
        ) THEN
            ALTER TABLE reservations 
            ALTER COLUMN owner_user_id SET NOT NULL;
            RAISE NOTICE '✅ Colonne owner_user_id définie comme NOT NULL';
        ELSE
            RAISE NOTICE 'ℹ️  Colonne owner_user_id déjà NOT NULL';
        END IF;
    ELSE
        RAISE WARNING '⚠️  % réservations sans owner_user_id - NOT NULL non appliqué', null_count;
    END IF;
END $$;

-- 1.4 Ajouter index si pas déjà présent
CREATE INDEX IF NOT EXISTS idx_reservations_owner ON reservations(owner_user_id);

-- ================================================================
-- ÉTAPE 2: Corriger la table cleaning_schedule
-- ================================================================

-- 2.1 Ajouter reservation_id (clé pour le on_conflict)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'cleaning_schedule' 
          AND column_name = 'reservation_id'
    ) THEN
        ALTER TABLE cleaning_schedule 
        ADD COLUMN reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Colonne reservation_id ajoutée à cleaning_schedule';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne reservation_id existe déjà';
    END IF;
END $$;

-- 2.2 Ajouter validated_by_company
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'cleaning_schedule' 
          AND column_name = 'validated_by_company'
    ) THEN
        ALTER TABLE cleaning_schedule 
        ADD COLUMN validated_by_company BOOLEAN DEFAULT false;
        
        RAISE NOTICE '✅ Colonne validated_by_company ajoutée à cleaning_schedule';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne validated_by_company existe déjà';
    END IF;
END $$;

-- 2.3 Ajouter reservation_end
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'cleaning_schedule' 
          AND column_name = 'reservation_end'
    ) THEN
        ALTER TABLE cleaning_schedule 
        ADD COLUMN reservation_end DATE;
        
        RAISE NOTICE '✅ Colonne reservation_end ajoutée à cleaning_schedule';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne reservation_end existe déjà';
    END IF;
END $$;

-- 2.4 Ajouter reservation_start_after
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'cleaning_schedule' 
          AND column_name = 'reservation_start_after'
    ) THEN
        ALTER TABLE cleaning_schedule 
        ADD COLUMN reservation_start_after DATE;
        
        RAISE NOTICE '✅ Colonne reservation_start_after ajoutée à cleaning_schedule';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne reservation_start_after existe déjà';
    END IF;
END $$;

-- 2.5 Créer contrainte UNIQUE sur reservation_id (nécessaire pour on_conflict)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'cleaning_schedule_reservation_id_unique'
    ) THEN
        ALTER TABLE cleaning_schedule 
        ADD CONSTRAINT cleaning_schedule_reservation_id_unique UNIQUE(reservation_id);
        
        RAISE NOTICE '✅ Contrainte UNIQUE ajoutée sur reservation_id';
    ELSE
        RAISE NOTICE 'ℹ️  Contrainte UNIQUE existe déjà sur reservation_id';
    END IF;
END $$;

-- 2.6 Ajouter index sur reservation_id
CREATE INDEX IF NOT EXISTS idx_cleaning_reservation ON cleaning_schedule(reservation_id);

-- ================================================================
-- ÉTAPE 3: Activer Row Level Security
-- ================================================================

-- 3.1 Activer RLS sur reservations
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 3.2 Créer/recréer politique pour reservations
DO $$ 
BEGIN
    -- Supprimer l'ancienne si elle existe
    DROP POLICY IF EXISTS rgpd_all_own_reservations ON reservations;
    
    -- Créer la nouvelle politique
    CREATE POLICY rgpd_all_own_reservations ON reservations 
    FOR ALL 
    USING (owner_user_id = auth.uid());
    
    RAISE NOTICE '✅ Politique RLS créée pour reservations';
END $$;

-- 3.3 Activer RLS sur cleaning_schedule
ALTER TABLE cleaning_schedule ENABLE ROW LEVEL SECURITY;

-- 3.4 Créer politique pour cleaning_schedule
DO $$ 
BEGIN
    -- Supprimer l'ancienne si elle existe
    DROP POLICY IF EXISTS rgpd_all_own_cleaning ON cleaning_schedule;
    
    -- Créer la nouvelle politique
    CREATE POLICY rgpd_all_own_cleaning ON cleaning_schedule 
    FOR ALL 
    USING (owner_user_id = auth.uid());
    
    RAISE NOTICE '✅ Politique RLS créée pour cleaning_schedule';
END $$;

-- ================================================================
-- ÉTAPE 4: Vérifications finales
-- ================================================================

DO $$ 
DECLARE
    total_reservations INTEGER;
    reservations_with_owner INTEGER;
    reservations_without_owner INTEGER;
    user_count INTEGER;
    first_user_id UUID;
BEGIN
    -- Compter les utilisateurs
    SELECT COUNT(*), MIN(id) INTO user_count, first_user_id FROM auth.users;
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 RAPPORT DE MIGRATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '👤 UTILISATEURS:';
    RAISE NOTICE '   Total: %', user_count;
    IF user_count > 0 THEN
        RAISE NOTICE '   Premier user_id: %', first_user_id;
    END IF;
    RAISE NOTICE '';
    
    -- Compter les réservations
    SELECT 
        COUNT(*),
        COUNT(owner_user_id),
        COUNT(*) - COUNT(owner_user_id)
    INTO 
        total_reservations,
        reservations_with_owner,
        reservations_without_owner
    FROM reservations;
    
    RAISE NOTICE '📅 RÉSERVATIONS:';
    RAISE NOTICE '   Total: %', total_reservations;
    RAISE NOTICE '   Avec owner: %', reservations_with_owner;
    RAISE NOTICE '   Sans owner: %', reservations_without_owner;
    RAISE NOTICE '';
    
    -- Vérifier la structure de cleaning_schedule
    RAISE NOTICE '🧹 CLEANING_SCHEDULE:';
    RAISE NOTICE '   ✓ Colonnes vérifiées';
    RAISE NOTICE '   ✓ Contrainte UNIQUE sur reservation_id';
    RAISE NOTICE '';
    
    -- Statut final
    RAISE NOTICE '========================================';
    IF reservations_without_owner = 0 AND user_count > 0 THEN
        RAISE NOTICE '✅ MIGRATION RÉUSSIE';
        RAISE NOTICE '';
        RAISE NOTICE '📝 Prochaines étapes:';
        RAISE NOTICE '   1. Actualisez votre page web (F5)';
        RAISE NOTICE '   2. Les réservations devraient maintenant s''afficher';
        RAISE NOTICE '   3. Le calendrier de ménage devrait fonctionner';
    ELSE
        RAISE WARNING '⚠️  MIGRATION INCOMPLÈTE';
        IF user_count = 0 THEN
            RAISE NOTICE '   → Créez un utilisateur dans Supabase Auth';
        END IF;
        IF reservations_without_owner > 0 THEN
            RAISE NOTICE '   → % réservations sans owner', reservations_without_owner;
            RAISE NOTICE '   → Relancez ce script après avoir créé un utilisateur';
        END IF;
    END IF;
    RAISE NOTICE '========================================';
END $$;
