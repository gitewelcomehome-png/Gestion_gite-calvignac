-- ================================================================
-- 🧠 SYSTÈME AUTO-APPRENTISSAGE IA
-- Enrichit automatiquement la base de solutions depuis tickets résolus
-- ================================================================

-- ================================================================
-- 📊 TABLE COMMENTAIRES TICKETS (si n'existe pas)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.cm_support_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.cm_support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  is_internal BOOLEAN DEFAULT false,
  content TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cm_support_comments_ticket ON public.cm_support_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_cm_support_comments_user ON public.cm_support_comments(user_id);

-- RLS Policies
ALTER TABLE public.cm_support_comments ENABLE ROW LEVEL SECURITY;

-- Fonction helper pour vérifier admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT auth.jwt()->>'email' = 'stephanecalvignac@hotmail.fr');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Admin full access comments" ON public.cm_support_comments;
CREATE POLICY "Admin full access comments" ON public.cm_support_comments
    FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Clients view own ticket comments" ON public.cm_support_comments;
CREATE POLICY "Clients view own ticket comments" ON public.cm_support_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cm_support_tickets t
            JOIN cm_clients c ON c.id = t.client_id
            WHERE t.id = ticket_id
            AND c.user_id = auth.uid()
        )
    );

-- ================================================================
-- 🧠 FONCTION AUTO-APPRENTISSAGE
-- Appelée quand un ticket passe à "résolu"
-- ================================================================
CREATE OR REPLACE FUNCTION auto_learn_from_resolved_ticket()
RETURNS TRIGGER AS $$
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
        
        -- Extraire mots-clés pour symptômes (simple extraction)
        v_symptomes := ARRAY(
            SELECT DISTINCT LOWER(word)
            FROM regexp_split_to_table(v_ticket.description, '\s+') AS word
            WHERE LENGTH(word) > 4
            AND word !~* '^(http|www|bonjour|merci|cordialement)'
            LIMIT 10
        );
        
        -- Générer tags depuis catégorie et priorité
        v_tags := ARRAY[v_ticket.categorie, v_ticket.priorite];
        
        -- Construire texte solution depuis les commentaires
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
            created_by,
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
            0.7, -- Score initial optimiste
            NEW.assigned_to,
            NOW(),
            NOW()
        )
        ON CONFLICT DO NOTHING; -- Éviter doublons si même problème
        
        -- Logger l'apprentissage
        RAISE NOTICE 'IA: Nouveau problème appris - %', v_ticket.sujet;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 🎯 TRIGGER AUTO-APPRENTISSAGE
-- ================================================================
DROP TRIGGER IF EXISTS trigger_auto_learn ON cm_support_tickets;

CREATE TRIGGER trigger_auto_learn
AFTER UPDATE OF statut ON cm_support_tickets
FOR EACH ROW
WHEN (NEW.statut = 'résolu')
EXECUTE FUNCTION auto_learn_from_resolved_ticket();

-- ================================================================
-- 📈 FONCTION AMÉLIORATION CONTINUE
-- Appelée quand un feedback est donné sur une solution
-- ================================================================
CREATE OR REPLACE FUNCTION improve_solution_from_feedback()
RETURNS TRIGGER AS $$
DECLARE
    v_solution RECORD;
    v_feedback_positif INTEGER;
    v_feedback_total INTEGER;
BEGIN
    -- Récupérer statistiques de la solution
    SELECT 
        s.*,
        COUNT(f.id) FILTER (WHERE f.utile = true) as positifs,
        COUNT(f.id) as total
    INTO v_solution
    FROM cm_support_solutions s
    LEFT JOIN cm_support_solution_feedback f ON f.solution_id = s.id
    WHERE s.id = NEW.solution_id
    GROUP BY s.id;
    
    v_feedback_positif := v_solution.positifs;
    v_feedback_total := v_solution.total;
    
    -- Ajuster score d'efficacité
    UPDATE cm_support_solutions
    SET 
        efficacite_score = CASE 
            WHEN v_feedback_total >= 5 THEN 
                ROUND((v_feedback_positif::DECIMAL / v_feedback_total), 2)
            ELSE 
                -- Pas assez de données, garder score initial
                efficacite_score
        END,
        updated_at = NOW()
    WHERE id = NEW.solution_id;
    
    -- Si solution peu efficace (< 30% après 10 feedbacks), la marquer comme obsolète
    IF v_feedback_total >= 10 AND (v_feedback_positif::DECIMAL / v_feedback_total) < 0.3 THEN
        UPDATE cm_support_solutions
        SET tags = array_append(tags, 'obsolete')
        WHERE id = NEW.solution_id
        AND NOT ('obsolete' = ANY(tags));
        
        RAISE NOTICE 'IA: Solution % marquée comme obsolète (efficacité < 30%%)', NEW.solution_id;
    END IF;
    
    -- Enrichir solution avec commentaires des feedbacks
    IF NEW.commentaire IS NOT NULL AND LENGTH(NEW.commentaire) > 10 THEN
        UPDATE cm_support_solutions
        SET prevention = COALESCE(prevention, '') || E'\n\n💬 Retour utilisateur: ' || NEW.commentaire
        WHERE id = NEW.solution_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 🎯 TRIGGER AMÉLIORATION CONTINUE
-- ================================================================
DROP TRIGGER IF EXISTS trigger_improve_solution ON cm_support_solution_feedback;

CREATE TRIGGER trigger_improve_solution
AFTER INSERT ON cm_support_solution_feedback
FOR EACH ROW
EXECUTE FUNCTION improve_solution_from_feedback();

-- ================================================================
-- 🔍 FONCTION DÉTECTION DOUBLONS INTELLIGENTE
-- Fusionne les solutions similaires automatiquement
-- ================================================================
CREATE OR REPLACE FUNCTION merge_similar_solutions()
RETURNS void AS $$
DECLARE
    v_solution RECORD;
    v_similar RECORD;
    v_similarity DECIMAL;
BEGIN
    -- Parcourir toutes les solutions
    FOR v_solution IN 
        SELECT * FROM cm_support_solutions 
        WHERE NOT ('obsolete' = ANY(tags))
        ORDER BY created_at DESC
    LOOP
        -- Chercher solutions similaires (simple comparaison mots-clés)
        FOR v_similar IN
            SELECT s2.*,
                   array_length(
                       ARRAY(SELECT unnest(v_solution.symptomes) INTERSECT SELECT unnest(s2.symptomes)),
                       1
                   )::DECIMAL / GREATEST(
                       array_length(v_solution.symptomes, 1),
                       array_length(s2.symptomes, 1)
                   ) as similarity
            FROM cm_support_solutions s2
            WHERE s2.id != v_solution.id
            AND s2.categorie = v_solution.categorie
            AND NOT ('obsolete' = ANY(s2.tags))
            AND array_length(
                ARRAY(SELECT unnest(v_solution.symptomes) INTERSECT SELECT unnest(s2.symptomes)),
                1
            ) > 3 -- Au moins 3 symptômes en commun
        LOOP
            v_similarity := v_similar.similarity;
            
            -- Si similarité > 70%, fusionner
            IF v_similarity > 0.7 THEN
                -- Garder la solution avec le meilleur score
                IF v_solution.efficacite_score >= v_similar.efficacite_score THEN
                    -- Fusionner dans v_solution
                    UPDATE cm_support_solutions
                    SET 
                        nb_utilisations = nb_utilisations + v_similar.nb_utilisations,
                        symptomes = ARRAY(SELECT DISTINCT unnest(symptomes || v_similar.symptomes)),
                        tags = ARRAY(SELECT DISTINCT unnest(tags || v_similar.tags)),
                        updated_at = NOW()
                    WHERE id = v_solution.id;
                    
                    -- Marquer similaire comme obsolète
                    UPDATE cm_support_solutions
                    SET tags = array_append(tags, 'merged')
                    WHERE id = v_similar.id;
                    
                    RAISE NOTICE 'IA: Solutions % et % fusionnées (similarité: %)', v_solution.id, v_similar.id, v_similarity;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- ⏰ FONCTION MAINTENANCE AUTOMATIQUE
-- À appeler périodiquement (cron job)
-- ================================================================
CREATE OR REPLACE FUNCTION ai_maintenance_routine()
RETURNS TABLE (
    action TEXT,
    count INTEGER
) AS $$
DECLARE
    v_merged INTEGER;
    v_obsolete INTEGER;
BEGIN
    -- 1. Fusionner solutions similaires
    PERFORM merge_similar_solutions();
    
    -- 2. Compter solutions obsolètes
    SELECT COUNT(*) INTO v_obsolete
    FROM cm_support_solutions
    WHERE 'obsolete' = ANY(tags);
    
    -- 3. Compter solutions fusionnées
    SELECT COUNT(*) INTO v_merged
    FROM cm_support_solutions
    WHERE 'merged' = ANY(tags);
    
    -- Retourner stats
    RETURN QUERY
    SELECT 'Solutions actives', COUNT(*)::INTEGER
    FROM cm_support_solutions
    WHERE NOT ('obsolete' = ANY(tags)) AND NOT ('merged' = ANY(tags))
    UNION ALL
    SELECT 'Solutions obsolètes', v_obsolete
    UNION ALL
    SELECT 'Solutions fusionnées', v_merged;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- ✅ VÉRIFICATION
-- ================================================================
SELECT 
    'Trigger auto_learn' as trigger_name,
    tgname,
    tgenabled
FROM pg_trigger
WHERE tgname = 'trigger_auto_learn';

SELECT 
    'Trigger improve_solution' as trigger_name,
    tgname,
    tgenabled
FROM pg_trigger
WHERE tgname = 'trigger_improve_solution';

-- Test maintenance
SELECT * FROM ai_maintenance_routine();

COMMENT ON FUNCTION auto_learn_from_resolved_ticket() IS '🧠 Apprentissage automatique depuis tickets résolus';
COMMENT ON FUNCTION improve_solution_from_feedback() IS '📈 Amélioration continue via feedback';
COMMENT ON FUNCTION merge_similar_solutions() IS '🔍 Fusion automatique solutions similaires';
COMMENT ON FUNCTION ai_maintenance_routine() IS '⏰ Routine maintenance IA (à planifier)';
