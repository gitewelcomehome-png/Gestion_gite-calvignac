-- ================================================================
-- 🔧 FIX PERMISSIONS TRIGGER AUTO-LEARNING
-- ================================================================
-- Correction des permissions pour le trigger d'apprentissage automatique
-- ================================================================

-- Recréer la fonction avec les bonnes permissions
CREATE OR REPLACE FUNCTION auto_learn_from_resolved_ticket()
RETURNS TRIGGER 
SECURITY DEFINER -- Important : exécute avec les droits du créateur
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_ticket RECORD;
    v_comments TEXT;
    v_solution_text TEXT;
    v_symptomes TEXT[];
    v_tags TEXT[];
BEGIN
    -- Vérifier si le ticket vient d'être résolu
    IF NEW.statut = 'résolu' AND (OLD.statut IS NULL OR OLD.statut != 'résolu') THEN
        
        -- Récupérer les détails du ticket
        SELECT 
            t.sujet,
            t.description,
            t.categorie,
            t.priorite,
            EXTRACT(EPOCH FROM (t.resolved_at - t.created_at))/60 as temps_resolution,
            STRING_AGG(c.content, E'\n\n---\n\n' ORDER BY c.created_at) as all_comments
        INTO v_ticket
        FROM cm_support_tickets t
        LEFT JOIN cm_support_comments c ON c.ticket_id = t.id AND c.is_internal = false
        WHERE t.id = NEW.id
        GROUP BY t.id, t.sujet, t.description, t.categorie, t.priorite, t.resolved_at, t.created_at;
        
        -- Extraire mots-clés pour symptômes
        v_symptomes := ARRAY(
            SELECT DISTINCT LOWER(word)
            FROM regexp_split_to_table(v_ticket.description, '\s+') AS word
            WHERE LENGTH(word) > 4
            AND word !~* '^(http|www|bonjour|merci|cordialement)'
            LIMIT 10
        );
        
        -- Générer tags
        v_tags := ARRAY[v_ticket.categorie, v_ticket.priorite];
        
        -- Construire texte solution
        v_solution_text := COALESCE(v_ticket.all_comments, 'Solution fournie par l''équipe support.');
        
        -- Insérer dans la base de solutions
        INSERT INTO cm_support_solutions (
            titre,
            description_probleme,
            symptomes,
            tags,
            categorie,
            solution,
            temps_resolution_estime,
            nb_utilisations,
            efficacite_score,
            created_at,
            updated_at
        ) VALUES (
            v_ticket.sujet,
            v_ticket.description,
            v_symptomes,
            v_tags,
            v_ticket.categorie,
            v_solution_text,
            CEIL(v_ticket.temps_resolution)::INTEGER,
            0,
            0.7,
            NOW(),
            NOW()
        )
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'IA: Nouveau problème appris - %', v_ticket.sujet;
        
    END IF;
    
    RETURN NEW;
END;
$$;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_auto_learn ON cm_support_tickets;
CREATE TRIGGER trigger_auto_learn
AFTER UPDATE OF statut ON cm_support_tickets
FOR EACH ROW
WHEN (NEW.statut = 'résolu')
EXECUTE FUNCTION auto_learn_from_resolved_ticket();

-- ================================================================
-- ✅ FIN DU SCRIPT
-- ================================================================
