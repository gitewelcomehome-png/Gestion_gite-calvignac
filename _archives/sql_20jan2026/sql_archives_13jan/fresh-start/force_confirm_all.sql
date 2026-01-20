-- Force la confirmation de TOUS les comptes créés
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Vérification
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC;
