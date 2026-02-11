-- ================================================================
-- 🔍 DIAGNOSTIC SYSTÈME IA
-- ================================================================
-- Vérifier que tous les éléments sont en place
-- ================================================================

-- 1. Vérifier les triggers
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('cm_support_tickets')
ORDER BY trigger_name;

-- 2. Vérifier les fonctions
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('auto_respond_to_ticket', 'auto_learn_from_resolved_ticket', 'delete_ticket_with_dependencies')
ORDER BY routine_name;

-- 3. Compter les solutions disponibles
SELECT 
    categorie,
    COUNT(*) as nb_solutions,
    AVG(efficacite_score) as score_moyen
FROM cm_support_solutions
GROUP BY categorie
ORDER BY categorie;

-- 4. Voir les derniers tickets créés
SELECT 
    id,
    sujet,
    categorie,
    statut,
    created_at,
    (SELECT COUNT(*) FROM cm_support_comments WHERE ticket_id = t.id AND is_ai_generated = true) as ai_responses
FROM cm_support_tickets t
ORDER BY created_at DESC
LIMIT 5;

-- 5. Vérifier les diagnostics IA
SELECT 
    d.ticket_id,
    t.sujet,
    s.titre as solution_trouvee,
    d.confidence_score,
    d.created_at
FROM cm_support_diagnostics d
JOIN cm_support_tickets t ON t.id = d.ticket_id
LEFT JOIN cm_support_solutions s ON s.id = d.solution_matched_id
ORDER BY d.created_at DESC
LIMIT 5;

-- ================================================================
-- 📊 RÉSULTAT ATTENDU
-- ================================================================
-- Triggers : trigger_auto_respond ET trigger_auto_learn doivent exister
-- Fonctions : Les 3 fonctions doivent être listées avec SECURITY DEFINER
-- Solutions : Au moins 5 solutions dans différentes catégories
-- Tickets : Les nouveaux tickets doivent avoir ai_responses > 0 si l'IA a répondu
-- Diagnostics : Les tickets doivent apparaître avec un score de confiance
-- ================================================================
