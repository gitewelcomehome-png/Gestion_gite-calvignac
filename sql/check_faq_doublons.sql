-- Vérifier les doublons dans la table FAQ
-- À exécuter dans l'éditeur SQL de Supabase

-- Voir toutes les FAQs avec leur gite et question
SELECT id, gite, categorie, question, visible, ordre
FROM faq
ORDER BY gite, categorie, question;

-- Compter les doublons exacts (même question, même gite)
SELECT question, gite, COUNT(*) as nb_doublons
FROM faq
GROUP BY question, gite
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- Supprimer les doublons (garder le plus ancien ID)
-- NE PAS EXÉCUTER SANS VÉRIFIER LES RÉSULTATS CI-DESSUS !
/*
DELETE FROM faq
WHERE id NOT IN (
    SELECT MIN(id)
    FROM faq
    GROUP BY question, gite
);
*/
