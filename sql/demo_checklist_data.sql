-- =====================================================
-- DÉMO : Insertion de données de test pour check-lists
-- =====================================================
-- Ce fichier permet de tester rapidement le système
-- avec des réservations fictives et leur progression

-- ÉTAPE 1 : Vérifier que les tables existent
SELECT 
    COUNT(*) as total_templates 
FROM checklist_templates 
WHERE actif = true;

SELECT 
    COUNT(*) as total_progress 
FROM checklist_progress;

-- ÉTAPE 2 : Simuler la progression d'une réservation
-- (Remplacer RESERVATION_ID par un vrai ID de votre table reservations)

-- Exemple : Compléter 2 items d'entrée sur 3 pour la réservation #123
DO $$
DECLARE
    v_reservation_id bigint := 123; -- À REMPLACER
    v_gite text := 'Trevoux'; -- À REMPLACER
    v_template_ids bigint[];
BEGIN
    -- Récupérer les 2 premiers templates d'entrée pour ce gîte
    SELECT ARRAY_AGG(id ORDER BY ordre) 
    INTO v_template_ids
    FROM checklist_templates
    WHERE gite = v_gite 
        AND type = 'entree' 
        AND actif = true
    LIMIT 2;
    
    -- Insérer la progression
    IF array_length(v_template_ids, 1) > 0 THEN
        FOR i IN 1..array_length(v_template_ids, 1) LOOP
            INSERT INTO checklist_progress (reservation_id, template_id, completed, completed_at)
            VALUES (v_reservation_id, v_template_ids[i], true, NOW() - (i || ' hours')::interval)
            ON CONFLICT (reservation_id, template_id) 
            DO UPDATE SET completed = true, completed_at = NOW();
            
            RAISE NOTICE 'Item % complété pour réservation %', v_template_ids[i], v_reservation_id;
        END LOOP;
    END IF;
END $$;

-- ÉTAPE 3 : Vérifier la progression créée
SELECT 
    r.nom_client,
    r.gite,
    t.type,
    t.texte,
    p.completed,
    p.completed_at
FROM checklist_progress p
JOIN checklist_templates t ON p.template_id = t.id
JOIN reservations r ON p.reservation_id = r.id
ORDER BY r.id, t.type, t.ordre;

-- ÉTAPE 4 : Voir le résumé par réservation
SELECT 
    r.id,
    r.nom_client,
    r.gite,
    COUNT(t.id) FILTER (WHERE t.type = 'entree') as total_entree,
    COUNT(p.id) FILTER (WHERE t.type = 'entree' AND p.completed) as completed_entree,
    ROUND(
        100.0 * COUNT(p.id) FILTER (WHERE t.type = 'entree' AND p.completed) / 
        NULLIF(COUNT(t.id) FILTER (WHERE t.type = 'entree'), 0),
        0
    ) as percent_entree,
    COUNT(t.id) FILTER (WHERE t.type = 'sortie') as total_sortie,
    COUNT(p.id) FILTER (WHERE t.type = 'sortie' AND p.completed) as completed_sortie,
    ROUND(
        100.0 * COUNT(p.id) FILTER (WHERE t.type = 'sortie' AND p.completed) / 
        NULLIF(COUNT(t.id) FILTER (WHERE t.type = 'sortie'), 0),
        0
    ) as percent_sortie
FROM reservations r
CROSS JOIN checklist_templates t
LEFT JOIN checklist_progress p 
    ON t.id = p.template_id 
    AND p.reservation_id = r.id
WHERE t.actif = true 
    AND t.gite = r.gite
    AND r.date_fin >= CURRENT_DATE
GROUP BY r.id, r.nom_client, r.gite
ORDER BY r.date_debut;

-- ÉTAPE 5 : Nettoyer les données de test (si besoin)
-- ATTENTION : Ceci supprime toute la progression !
-- DELETE FROM checklist_progress WHERE reservation_id = 123;

-- ÉTAPE 6 : Ajouter des templates personnalisés
-- Exemple : Ajouter un item "Vérifier la terrasse" pour Couzon (sortie)
/*
INSERT INTO checklist_templates (gite, type, ordre, texte, description, actif)
VALUES (
    'Couzon',
    'sortie',
    (SELECT COALESCE(MAX(ordre), 0) + 1 FROM checklist_templates WHERE gite = 'Couzon' AND type = 'sortie'),
    'Vérifier la terrasse',
    'S''assurer que la terrasse est propre et rangée',
    true
);
*/

-- ÉTAPE 7 : Marquer tous les items comme complétés pour une réservation
-- Utile pour tester l'affichage 100% (vert)
/*
DO $$
DECLARE
    v_reservation_id bigint := 123;
    v_gite text := 'Trevoux';
    v_template record;
BEGIN
    FOR v_template IN 
        SELECT id FROM checklist_templates 
        WHERE gite = v_gite AND actif = true
    LOOP
        INSERT INTO checklist_progress (reservation_id, template_id, completed, completed_at)
        VALUES (v_reservation_id, v_template.id, true, NOW())
        ON CONFLICT (reservation_id, template_id) 
        DO UPDATE SET completed = true, completed_at = NOW();
    END LOOP;
    
    RAISE NOTICE 'Tous les items complétés pour réservation %', v_reservation_id;
END $$;
*/

-- FIN DU SCRIPT DE DÉMO
