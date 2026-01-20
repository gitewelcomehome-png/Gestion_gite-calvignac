-- Ajouter la colonne regles_tarifs à la table gites
-- Cette colonne stocke les règles tarifaires dynamiques (promotions, durées minimales)

ALTER TABLE gites 
ADD COLUMN IF NOT EXISTS regles_tarifs JSONB DEFAULT '{
  "promotions": {
    "long_sejour": {"actif": false, "pourcentage": 10, "a_partir_de": 7},
    "last_minute": {"actif": false, "pourcentage": 15, "jours_avant": 7},
    "early_booking": {"actif": false, "pourcentage": 10, "jours_avant": 60}
  },
  "duree_min_defaut": 2,
  "periodes_duree_min": []
}'::jsonb;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN gites.regles_tarifs IS 'Règles tarifaires dynamiques : promotions automatiques (Long Séjour, Last Minute, Early Booking) et durées minimales de séjour';

-- Initialiser les règles pour les gîtes existants qui n'en ont pas
UPDATE gites 
SET regles_tarifs = '{
  "promotions": {
    "long_sejour": {"actif": false, "pourcentage": 10, "a_partir_de": 7},
    "last_minute": {"actif": false, "pourcentage": 15, "jours_avant": 7},
    "early_booking": {"actif": false, "pourcentage": 10, "jours_avant": 60}
  },
  "duree_min_defaut": 2,
  "periodes_duree_min": []
}'::jsonb
WHERE regles_tarifs IS NULL;
