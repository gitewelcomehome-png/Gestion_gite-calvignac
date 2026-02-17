-- ================================================================
-- 🤖 RÉPONSE AUTOMATIQUE IA AUX NOUVEAUX TICKETS
-- ================================================================
-- Trigger qui analyse et répond automatiquement aux tickets entrants
-- ================================================================

-- Fonction de matching simple par mots-clés
CREATE OR REPLACE FUNCTION auto_respond_to_ticket()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_solution RECORD;
    v_confidence FLOAT;
    v_keyword_match_count INT;
    v_total_keywords INT;
    v_response_text TEXT;
BEGIN
    -- Ne traiter que les nouveaux tickets
    IF TG_OP = 'INSERT' THEN
        
        -- Rechercher une solution correspondante dans la même catégorie
        SELECT 
            s.*,
            -- Compter combien de symptômes matchent avec la description du ticket
            (
                SELECT COUNT(*)
                FROM unnest(s.symptomes) AS symptom
                WHERE LOWER(NEW.description) LIKE '%' || LOWER(symptom) || '%'
                   OR LOWER(NEW.sujet) LIKE '%' || LOWER(symptom) || '%'
            ) as keyword_matches,
            ARRAY_LENGTH(s.symptomes, 1) as total_keywords
        INTO v_solution
        FROM cm_support_solutions s
        WHERE s.categorie = NEW.categorie
        AND s.efficacite_score >= 0.6
        ORDER BY (
            -- Score : nombre de symptômes matchés + score d'efficacité + nombre d'utilisations
            SELECT COUNT(*)
            FROM unnest(s.symptomes) AS symptom
            WHERE LOWER(NEW.description) LIKE '%' || LOWER(symptom) || '%'
               OR LOWER(NEW.sujet) LIKE '%' || LOWER(symptom) || '%'
        ) DESC, 
        s.efficacite_score DESC,
        s.nb_utilisations DESC
        LIMIT 1;
        
        -- Si une solution est trouvée
        IF v_solution.id IS NOT NULL THEN
            v_keyword_match_count := v_solution.keyword_matches;
            v_total_keywords := GREATEST(v_solution.total_keywords, 1);
            
            -- Calculer score de confiance (% de symptômes matchés + efficacité)
            v_confidence := (v_keyword_match_count::FLOAT / v_total_keywords::FLOAT * 0.6) + (v_solution.efficacite_score * 0.4);
            
            -- Créer diagnostic
            INSERT INTO cm_support_diagnostics (
                ticket_id,
                solution_matched_id,
                confidence_score,
                created_at
            ) VALUES (
                NEW.id,
                v_solution.id,
                v_confidence,
                NOW()
            );
            
            -- Si confiance raisonnable (>= 40%), poster réponse automatique
            IF v_confidence >= 0.40 THEN
                
                -- Construire message IA personnalisé
                v_response_text := 'Bonjour ! 👋

Notre système d''assistance automatique a analysé votre demande concernant : "' || NEW.sujet || '"

**💡 Solution suggérée :**

' || v_solution.solution || '

**⏱️ Temps de résolution estimé :** ' || COALESCE(v_solution.temps_resolution_estime::TEXT || ' minutes', 'Variable selon la situation') || '

---

Cette réponse est générée automatiquement avec un niveau de confiance de **' || ROUND(v_confidence * 100) || '%**.

Si cette solution ne résout pas votre problème, notre équipe support humaine prendra en charge votre ticket dans les plus brefs délais. N''hésitez pas à répondre pour plus de précisions ! 😊';
                
                -- Poster la réponse automatique
                INSERT INTO cm_support_comments (
                    ticket_id,
                    user_id,
                    content,
                    is_internal,
                    is_ai_generated,
                    author_role,
                    created_at
                ) VALUES (
                    NEW.id,
                    (SELECT user_id FROM cm_clients WHERE id = NEW.client_id), -- Récupère le vrai user_id
                    v_response_text,
                    false,
                    true,
                    'ai',
                    NOW()
                );
                
                -- Mettre à jour le statut du ticket
                UPDATE cm_support_tickets
                SET 
                    statut = 'en_cours',
                    updated_at = NOW()
                WHERE id = NEW.id;
                
                -- Incrémenter le compteur d'utilisation de la solution
                UPDATE cm_support_solutions
                SET 
                    nb_utilisations = nb_utilisations + 1,
                    updated_at = NOW()
                WHERE id = v_solution.id;
                
                RAISE NOTICE 'IA: Réponse automatique envoyée au ticket % (confiance: %)', NEW.id, ROUND(v_confidence * 100);
                
            ELSE
                RAISE NOTICE 'IA: Solution trouvée mais confiance trop faible (%) pour auto-réponse', ROUND(v_confidence * 100);
            END IF;
            
        ELSE
            RAISE NOTICE 'IA: Aucune solution trouvée pour le ticket %', NEW.id;
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$;

-- Créer le trigger sur les nouveaux tickets
DROP TRIGGER IF EXISTS trigger_auto_respond ON cm_support_tickets;
CREATE TRIGGER trigger_auto_respond
AFTER INSERT ON cm_support_tickets
FOR EACH ROW
EXECUTE FUNCTION auto_respond_to_ticket();

-- ================================================================
-- ✅ TRIGGER RÉPONSE AUTOMATIQUE CRÉÉ
-- ================================================================
-- L'IA analysera automatiquement chaque nouveau ticket
-- et postera une solution si elle trouve un match avec confiance >= 65%
-- ================================================================
