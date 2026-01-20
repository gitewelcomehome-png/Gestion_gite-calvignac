-- ================================================================
-- CONFIRMER EMAIL MANUELLEMENT (pour dev uniquement)
-- ================================================================
-- Exécute cette requête dans Supabase SQL Editor pour confirmer ton email

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'stephanecalvignac@hotmail.fr';

-- Vérifier que c'est bien confirmé
SELECT 
    email,
    email_confirmed_at,
    confirmed_at,
    created_at
FROM auth.users
WHERE email = 'stephanecalvignac@hotmail.fr';
