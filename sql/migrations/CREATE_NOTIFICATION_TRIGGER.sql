-- ================================================================
-- 🔔 SYSTÈME DE NOTIFICATION POUR NOUVEAUX COMMENTAIRES
-- ================================================================
-- Ce fichier crée un système qui notifie les clients quand 
-- une réponse est ajoutée à leur ticket
-- ================================================================

-- ----------------------------------------------------------------
-- 1. TABLE DES NOTIFICATIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cm_support_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES cm_clients(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES cm_support_tickets(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES cm_support_comments(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'nouvelle_reponse', -- nouvelle_reponse, ticket_resolu, etc.
    lu BOOLEAN DEFAULT FALSE,
    envoyé_par_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_notifications_client ON cm_support_notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_ticket ON cm_support_notifications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notifications_non_lu ON cm_support_notifications(client_id, lu) WHERE lu = FALSE;

-- ----------------------------------------------------------------
-- 2. FONCTION DE NOTIFICATION
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_client_new_response()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_ticket_client_id UUID;
    v_ticket_client_email TEXT;
    v_ticket_sujet TEXT;
BEGIN
    -- Ignorer les messages internes ou créés par le client lui-même
    IF NEW.is_internal = TRUE THEN
        RETURN NEW;
    END IF;

    -- Récupérer les infos du ticket et du client
    SELECT 
        t.client_id,
        c.email_principal,
        t.sujet
    INTO 
        v_ticket_client_id,
        v_ticket_client_email,
        v_ticket_sujet
    FROM cm_support_tickets t
    JOIN cm_clients c ON c.id = t.client_id
    WHERE t.id = NEW.ticket_id;

    -- Si le commentaire n'est pas du client, créer une notification
    IF NEW.user_id != v_ticket_client_id THEN
        -- Créer la notification dans la base
        INSERT INTO cm_support_notifications (
            client_id,
            ticket_id,
            comment_id,
            type
        ) VALUES (
            v_ticket_client_id,
            NEW.ticket_id,
            NEW.id,
            'nouvelle_reponse'
        );

        -- TODO: Ici vous pouvez ajouter l'envoi d'email via Supabase Edge Function
        -- ou via un service externe (SendGrid, Mailgun, etc.)
        -- Exemple avec pg_net (si installé) :
        -- PERFORM net.http_post(
        --     url := 'https://votre-domaine.com/api/send-notification',
        --     body := json_build_object(
        --         'email', v_ticket_client_email,
        --         'sujet', v_ticket_sujet,
        --         'ticket_id', NEW.ticket_id
        --     )::text
        -- );
    END IF;

    RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------
-- 3. TRIGGER SUR NOUVEAUX COMMENTAIRES
-- ----------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_notify_client ON cm_support_comments;
CREATE TRIGGER trigger_notify_client
    AFTER INSERT ON cm_support_comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_new_response();

-- ----------------------------------------------------------------
-- 4. FONCTION POUR MARQUER NOTIFICATIONS COMME LUES
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION mark_notifications_as_read(p_client_id UUID, p_ticket_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_ticket_id IS NOT NULL THEN
        -- Marquer lues pour un ticket spécifique
        UPDATE cm_support_notifications
        SET lu = TRUE
        WHERE client_id = p_client_id
          AND ticket_id = p_ticket_id
          AND lu = FALSE;
    ELSE
        -- Marquer toutes les notifications du client comme lues
        UPDATE cm_support_notifications
        SET lu = TRUE
        WHERE client_id = p_client_id
          AND lu = FALSE;
    END IF;
END;
$$;

-- ----------------------------------------------------------------
-- 5. RLS POLICIES
-- ----------------------------------------------------------------
ALTER TABLE cm_support_notifications ENABLE ROW LEVEL SECURITY;

-- Admin voit tout
DROP POLICY IF EXISTS "Admin accès complet notifications" ON cm_support_notifications;
CREATE POLICY "Admin accès complet notifications"
    ON cm_support_notifications
    FOR ALL
    USING (is_admin());

-- Client voit uniquement ses notifications
DROP POLICY IF EXISTS "Client voit ses notifications" ON cm_support_notifications;
CREATE POLICY "Client voit ses notifications"
    ON cm_support_notifications
    FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM cm_clients
            WHERE email_principal = auth.jwt()->>'email'
        )
    );

-- Client peut marquer ses notifications comme lues
DROP POLICY IF EXISTS "Client update ses notifications" ON cm_support_notifications;
CREATE POLICY "Client update ses notifications"
    ON cm_support_notifications
    FOR UPDATE
    USING (
        client_id IN (
            SELECT id FROM cm_clients
            WHERE email_principal = auth.jwt()->>'email'
        )
    );

-- ----------------------------------------------------------------
-- 6. COMMENTAIRES
-- ----------------------------------------------------------------
COMMENT ON TABLE cm_support_notifications IS 'Notifications pour nouveaux commentaires sur tickets de support';
COMMENT ON COLUMN cm_support_notifications.type IS 'Type de notification: nouvelle_reponse, ticket_resolu, etc.';
COMMENT ON COLUMN cm_support_notifications.lu IS 'Indique si la notification a été vue par le client';
COMMENT ON COLUMN cm_support_notifications.envoyé_par_email IS 'Indique si un email a été envoyé (pour éviter les doublons)';
COMMENT ON FUNCTION notify_client_new_response() IS 'Créé une notification quand un commentaire non-interne est ajouté à un ticket';
COMMENT ON FUNCTION mark_notifications_as_read(UUID, UUID) IS 'Marque les notifications comme lues pour un client (optionnel: pour un ticket spécifique)';

-- ================================================================
-- ✅ FIN DU SCRIPT
-- ================================================================
