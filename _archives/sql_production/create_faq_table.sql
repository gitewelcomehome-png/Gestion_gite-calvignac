-- ================================================================
-- CRÉATION TABLE FAQ - QUESTIONS FRÉQUENTES
-- ================================================================

-- Supprimer la table emails si elle existe
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS emails CASCADE;

-- Créer la table FAQ
CREATE TABLE IF NOT EXISTS faq (
    id BIGSERIAL PRIMARY KEY,
    categorie VARCHAR(50) NOT NULL CHECK (categorie IN ('arrivee', 'depart', 'equipements', 'localisation', 'tarifs', 'reglement', 'autre')),
    gite VARCHAR(20) DEFAULT 'tous' CHECK (gite IN ('tous', 'trevoux', 'calvignac')),
    question TEXT NOT NULL,
    reponse TEXT NOT NULL,
    visible BOOLEAN DEFAULT true,
    ordre INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_faq_categorie ON faq(categorie);
CREATE INDEX IF NOT EXISTS idx_faq_gite ON faq(gite);
CREATE INDEX IF NOT EXISTS idx_faq_visible ON faq(visible);
CREATE INDEX IF NOT EXISTS idx_faq_ordre ON faq(ordre);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_faq_updated_at ON faq;
CREATE TRIGGER update_faq_updated_at
    BEFORE UPDATE ON faq
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "FAQ are viewable by everyone" ON faq;
DROP POLICY IF EXISTS "FAQ are insertable by everyone" ON faq;
DROP POLICY IF EXISTS "FAQ are updatable by everyone" ON faq;
DROP POLICY IF EXISTS "FAQ are deletable by everyone" ON faq;

-- Politique : tout le monde peut lire
CREATE POLICY "FAQ are viewable by everyone"
    ON faq FOR SELECT
    USING (true);

-- Politique : tout le monde peut insérer
CREATE POLICY "FAQ are insertable by everyone"
    ON faq FOR INSERT
    WITH CHECK (true);

-- Politique : tout le monde peut mettre à jour
CREATE POLICY "FAQ are updatable by everyone"
    ON faq FOR UPDATE
    USING (true);

-- Politique : tout le monde peut supprimer
CREATE POLICY "FAQ are deletable by everyone"
    ON faq FOR DELETE
    USING (true);

-- ================================================================
-- DONNÉES INITIALES - EXEMPLES DE FAQ
-- ================================================================

INSERT INTO faq (categorie, gite, question, reponse, visible, ordre) VALUES
-- Arrivée
('arrivee', 'tous', 'Quelle est l''heure d''arrivée ?', 
 'L''arrivée se fait à partir de <strong>16h00</strong>. Si vous souhaitez arriver plus tôt, merci de nous contacter au préalable pour vérifier la disponibilité.', 
 true, 1),

('arrivee', 'tous', 'Comment récupérer les clés ?', 
 'Les instructions détaillées pour récupérer les clés vous seront envoyées <strong>48h avant votre arrivée</strong> par email. Un code d''accès sécurisé vous permettra de récupérer les clés à votre convenance.', 
 true, 2),

('arrivee', 'tous', 'Y a-t-il un parking ?', 
 'Oui, un <strong>parking gratuit</strong> est disponible directement devant le gîte. Vous pouvez stationner votre véhicule en toute sécurité pendant toute la durée de votre séjour.', 
 true, 3),

-- Départ
('depart', 'tous', 'Quelle est l''heure de départ ?', 
 'Le départ doit se faire <strong>avant 10h00</strong>. Si vous souhaitez partir plus tard, merci de nous prévenir au préalable (sous réserve de disponibilité).', 
 true, 4),

('depart', 'tous', 'Dois-je faire le ménage avant de partir ?', 
 'Le ménage de fin de séjour est <strong>inclus dans le tarif</strong>. Nous vous demandons simplement de laisser le gîte en bon état : vaisselle lavée et rangée, poubelles sorties.', 
 true, 5),

('depart', 'tous', 'Comment restituer les clés ?', 
 'Vous pouvez simplement <strong>laisser les clés à l''intérieur</strong> du gîte en partant. La porte se verrouille automatiquement.', 
 true, 6),

-- Équipements
('equipements', 'tous', 'Le Wi-Fi est-il disponible ?', 
 'Oui, une connexion <strong>Wi-Fi haut débit gratuite</strong> est disponible dans tout le gîte. Le mot de passe vous sera communiqué lors de votre arrivée.', 
 true, 7),

('equipements', 'tous', 'Le gîte est-il équipé pour les bébés ?', 
 'Sur demande, nous pouvons mettre à disposition un <strong>lit parapluie et une chaise haute</strong> gratuitement. Merci de nous le signaler lors de votre réservation.', 
 true, 8),

('equipements', 'tous', 'Y a-t-il une machine à laver ?', 
 'Oui, une <strong>machine à laver</strong> est à votre disposition. Vous trouverez également un étendoir à linge.', 
 true, 9),

('equipements', 'tous', 'Peut-on utiliser le barbecue ?', 
 'Oui, un <strong>barbecue</strong> est mis à disposition dans le jardin. Le charbon n''est pas fourni.', 
 true, 10),

-- Localisation
('localisation', 'tous', 'Y a-t-il des commerces à proximité ?', 
 'Oui, vous trouverez tous les commerces de proximité (boulangerie, supérette, pharmacie) à <strong>moins de 5 minutes en voiture</strong>.', 
 true, 11),

('localisation', 'tous', 'Le gîte est-il accessible aux personnes à mobilité réduite ?', 
 'Le gîte est de <strong>plain-pied</strong> ce qui facilite l''accès. Cependant, certains aménagements spécifiques PMR ne sont pas présents. N''hésitez pas à nous contacter pour plus de détails.', 
 true, 12),

-- Tarifs
('tarifs', 'tous', 'Quelles sont les modalités de paiement ?', 
 'Nous acceptons les paiements par <strong>virement bancaire, chèque ou espèces</strong>. Un <strong>acompte de 30%</strong> est demandé à la réservation, le solde étant à régler au plus tard 30 jours avant l''arrivée.', 
 true, 13),

('tarifs', 'tous', 'Y a-t-il une caution ?', 
 'Oui, une <strong>caution de 300€</strong> vous sera demandée à l''arrivée (chèque non encaissé ou empreinte bancaire). Elle vous sera restituée après vérification de l''état du gîte.', 
 true, 14),

('tarifs', 'tous', 'Peut-on annuler la réservation ?', 
 'En cas d''annulation plus de 30 jours avant l''arrivée, l''acompte est remboursé à <strong>50%</strong>. En deçà de 30 jours, l''acompte est conservé sauf en cas de force majeure justifiée.', 
 true, 15),

-- Règlement
('reglement', 'tous', 'Les animaux sont-ils acceptés ?', 
 'Les animaux ne sont <strong>pas acceptés</strong> dans le gîte afin de préserver le confort de tous nos clients, notamment ceux souffrant d''allergies.', 
 true, 16),

('reglement', 'tous', 'Peut-on fumer dans le gîte ?', 
 'Le gîte est <strong>non-fumeur</strong>. Vous pouvez fumer à l''extérieur (jardin, terrasse).', 
 true, 17),

('reglement', 'tous', 'Combien de personnes maximum ?', 
 'Le gîte peut accueillir <strong>jusqu''à 6 personnes</strong> maximum. Toute personne supplémentaire doit être signalée et approuvée au préalable.', 
 true, 18);

-- ================================================================
-- VÉRIFICATION
-- ================================================================

-- Afficher toutes les questions
SELECT 
    categorie,
    gite,
    question,
    LEFT(reponse, 50) as reponse_apercu,
    visible,
    ordre
FROM faq
ORDER BY ordre, categorie;

-- Compter par catégorie
SELECT 
    categorie,
    COUNT(*) as nb_questions
FROM faq
GROUP BY categorie
ORDER BY categorie;
