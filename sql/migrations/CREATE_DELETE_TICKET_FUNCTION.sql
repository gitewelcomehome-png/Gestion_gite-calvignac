-- ================================================================
-- 🗑️ FONCTION SUPPRESSION TICKET
-- ================================================================
-- Fonction qui supprime un ticket et toutes ses données associées
-- Utilise SECURITY DEFINER pour éviter les problèmes de permissions
-- ================================================================

CREATE OR REPLACE FUNCTION delete_ticket_with_dependencies(p_ticket_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_client_id UUID;
BEGIN
    -- Vérifier que le ticket appartient bien au client actuel
    SELECT t.client_id INTO v_client_id
    FROM cm_support_tickets t
    JOIN cm_clients c ON c.id = t.client_id
    WHERE t.id = p_ticket_id
    AND c.user_id = auth.uid();
    
    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'Ticket non trouvé ou accès non autorisé';
    END IF;
    
    -- Supprimer les commentaires
    DELETE FROM cm_support_comments WHERE ticket_id = p_ticket_id;
    
    -- Supprimer les notifications
    DELETE FROM cm_support_notifications WHERE ticket_id = p_ticket_id;
    
    -- Supprimer les diagnostics
    DELETE FROM cm_support_diagnostics WHERE ticket_id = p_ticket_id;
    
    -- Supprimer le ticket
    DELETE FROM cm_support_tickets WHERE id = p_ticket_id;
    
    RETURN TRUE;
END;
$$;

-- ================================================================
-- ✅ FONCTION CRÉÉE
-- ================================================================
-- Utilisez: SELECT delete_ticket_with_dependencies('ticket-uuid');
-- ================================================================
