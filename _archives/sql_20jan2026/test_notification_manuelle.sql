-- =====================================================
-- CRÉER UNE NOTIFICATION TEST (CLIENT)
-- Exécutez ce script pour simuler une notification
-- =====================================================

-- Remplacez 'VOTRE_USER_ID' par votre vrai ID utilisateur
-- Pour trouver votre ID : SELECT id FROM auth.users WHERE email = 'votre@email.com';

INSERT INTO referral_notifications (
    user_id,
    type,
    title,
    message,
    created_at
) VALUES (
    'VOTRE_USER_ID',  -- ⚠️ REMPLACER PAR VOTRE ID
    'new_campaign',
    '🎁 Nouvelle campagne disponible !',
    'La campagne "Double Bonus Février 2026" vient d''être lancée. Inscrivez-vous maintenant pour doubler vos récompenses !',
    NOW()
);

-- Vérifier la notification créée
SELECT * FROM referral_notifications 
WHERE user_id = 'VOTRE_USER_ID' 
ORDER BY created_at DESC 
LIMIT 1;
