-- ================================================================
-- 🔒 PERMISSIONS SUPPRESSION TICKETS
-- ================================================================
-- Autoriser les clients à supprimer leurs propres tickets
-- ================================================================

-- Fonction helper pour vérifier si un ticket appartient au client actuel
CREATE OR REPLACE FUNCTION is_ticket_owner(p_ticket_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM cm_support_tickets t
        JOIN cm_clients c ON c.id = t.client_id
        WHERE t.id = p_ticket_id
        AND c.user_id = auth.uid()
    );
END;
$$;

-- Politique DELETE pour cm_support_tickets
DROP POLICY IF EXISTS "allow_client_delete_own_tickets" ON cm_support_tickets;
CREATE POLICY "allow_client_delete_own_tickets"
ON cm_support_tickets
FOR DELETE
USING (
    client_id IN (
        SELECT id FROM cm_clients WHERE user_id = auth.uid()
    )
);

-- Politique DELETE pour cm_support_comments
DROP POLICY IF EXISTS "allow_delete_comments_on_own_tickets" ON cm_support_comments;
CREATE POLICY "allow_delete_comments_on_own_tickets"
ON cm_support_comments
FOR DELETE
USING (is_ticket_owner(ticket_id));

-- Politique DELETE pour cm_support_notifications
DROP POLICY IF EXISTS "allow_delete_notifications_on_own_tickets" ON cm_support_notifications;
CREATE POLICY "allow_delete_notifications_on_own_tickets"
ON cm_support_notifications
FOR DELETE
USING (
    client_id IN (
        SELECT id FROM cm_clients WHERE user_id = auth.uid()
    )
);

-- Politique DELETE pour cm_support_diagnostics
DROP POLICY IF EXISTS "allow_delete_diagnostics_on_own_tickets" ON cm_support_diagnostics;
CREATE POLICY "allow_delete_diagnostics_on_own_tickets"
ON cm_support_diagnostics
FOR DELETE
USING (is_ticket_owner(ticket_id));

-- ================================================================
-- ✅ PERMISSIONS SUPPRESSION CONFIGURÉES
-- ================================================================
-- Les clients peuvent maintenant supprimer leurs propres tickets
-- ainsi que toutes les données associées (commentaires, notifs, diagnostics)
-- Utilise is_ticket_owner() SECURITY DEFINER pour éviter les erreurs de permissions
-- ================================================================
