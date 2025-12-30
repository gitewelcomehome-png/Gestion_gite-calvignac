-- Table pour stocker les emails reçus et envoyés
CREATE TABLE IF NOT EXISTS emails (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- 'received' ou 'sent'
    from_email TEXT,
    from_name TEXT,
    to_email TEXT,
    to_name TEXT,
    subject TEXT,
    body TEXT,
    html_body TEXT,
    reservation_id BIGINT, -- Lien avec une réservation si applicable
    status VARCHAR(20) DEFAULT 'unread', -- 'unread', 'read', 'replied', 'archived'
    replied_to_id BIGINT REFERENCES emails(id), -- Si c'est une réponse
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    replied_at TIMESTAMP WITH TIME ZONE
);

-- Table pour les templates de réponses automatiques
CREATE TABLE IF NOT EXISTS email_templates (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'reservation', 'information', 'reclamation', etc.
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    variables JSONB, -- Liste des variables disponibles: {"client_name": "Nom du client", "gite": "Nom du gîte"}
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_emails_type ON emails(type);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_reservation ON emails(reservation_id);
CREATE INDEX IF NOT EXISTS idx_emails_created ON emails(created_at);
CREATE INDEX IF NOT EXISTS idx_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON email_templates(is_active);

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Exemples de templates
INSERT INTO email_templates (name, category, subject, body, variables) VALUES
('Bienvenue - Après réservation', 'reservation', 
 'Confirmation de votre réservation au {{gite}}',
 'Bonjour {{client_name}},

Nous vous confirmons votre réservation au gîte {{gite}} du {{date_debut}} au {{date_fin}}.

Nous restons à votre disposition pour toute question.

Cordialement,
L''équipe Welcome Home',
 '{"client_name": "Nom du client", "gite": "Nom du gîte", "date_debut": "Date d''arrivée", "date_fin": "Date de départ"}'::jsonb),

('Information J-3', 'reservation',
 'Votre arrivée dans 3 jours au {{gite}}',
 'Bonjour {{client_name}},

Votre arrivée est prévue dans 3 jours au gîte {{gite}}.

Voici quelques informations pratiques :
- Heure d''arrivée : à partir de 16h
- Adresse : {{adresse}}
- Code d''accès : {{code_acces}}

En pièce jointe, vous trouverez le livret d''accueil avec toutes les informations utiles.

À très bientôt !
L''équipe Welcome Home',
 '{"client_name": "Nom du client", "gite": "Nom du gîte", "adresse": "Adresse du gîte", "code_acces": "Code de la boîte à clés"}'::jsonb),

('Demande d''information', 'information',
 'Réponse à votre demande d''information',
 'Bonjour,

Merci pour votre message.

{{reponse_personnalisee}}

N''hésitez pas si vous avez d''autres questions.

Cordialement,
L''équipe Welcome Home',
 '{"reponse_personnalisee": "Votre réponse ici"}'::jsonb),

('Après séjour - Avis', 'post_sejour',
 'Merci pour votre séjour au {{gite}}',
 'Bonjour {{client_name}},

Nous espérons que vous avez passé un agréable séjour au gîte {{gite}}.

Votre avis nous est précieux ! Pourriez-vous prendre quelques minutes pour laisser un commentaire sur notre page Google ou Airbnb ?

Nous serions ravis de vous accueillir à nouveau.

Cordialement,
L''équipe Welcome Home',
 '{"client_name": "Nom du client", "gite": "Nom du gîte"}'::jsonb);
