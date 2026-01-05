-- Ajouter la colonne 'traite' à la table problemes_signales
-- Pour gérer le statut de traitement des demandes clients

ALTER TABLE problemes_signales 
ADD COLUMN IF NOT EXISTS traite BOOLEAN DEFAULT false;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_problemes_traite ON problemes_signales(traite);

-- Vérifier le résultat
SELECT 
    id,
    type,
    titre,
    urgence,
    traite,
    created_at
FROM problemes_signales
ORDER BY created_at DESC
LIMIT 10;
