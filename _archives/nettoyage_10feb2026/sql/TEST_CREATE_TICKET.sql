-- ================================================================
-- 🧪 CRÉER UN TICKET DE TEST
-- ================================================================
-- Pour vérifier le widget dashboard
-- ================================================================

-- 1. Récupérer un client existant
DO $$
DECLARE
    v_client_id UUID;
BEGIN
    -- Prendre le premier client disponible
    SELECT id INTO v_client_id
    FROM cm_clients
    LIMIT 1;
    
    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'Aucun client trouvé dans cm_clients';
    END IF;
    
    -- Créer un ticket de test
    INSERT INTO cm_support_tickets (
        client_id,
        sujet,
        description,
        categorie,
        priorite,
        statut,
        created_at
    ) VALUES (
        v_client_id,
        'Test - Problème de connexion',
        'Je n''arrive pas à me connecter à l''application. Impossible de me connecter avec mon login et mon mot de passe. J''ai essayé plusieurs fois mais je reçois toujours une erreur d''authentification. Mon compte est-il bloqué ? Je n''ai plus accès à mon espace.',
        'technique',
        'haute',
        'ouvert',
        NOW()
    );
    
    RAISE NOTICE '✅ Ticket de test créé avec succès pour le client %', v_client_id;
END $$;

-- Vérifier les tickets créés
SELECT 
    t.id,
    t.sujet,
    t.statut,
    t.priorite,
    c.nom_entreprise,
    c.email,
    t.created_at
FROM cm_support_tickets t
JOIN cm_clients c ON c.id = t.client_id
WHERE t.statut IN ('ouvert', 'en_cours', 'en_attente')
ORDER BY t.created_at DESC
LIMIT 5;
