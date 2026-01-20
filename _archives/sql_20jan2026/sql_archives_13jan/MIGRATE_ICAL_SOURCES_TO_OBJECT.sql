-- ================================================================
-- MIGRATION AUTOMATIQUE - TABLEAU → OBJET
-- ================================================================
-- Convertit automatiquement les ical_sources de format tableau vers objet
-- ================================================================

-- Fonction pour convertir tableau → objet
CREATE OR REPLACE FUNCTION migrate_ical_sources()
RETURNS void AS $$
DECLARE
    gite_record RECORD;
    new_sources JSONB;
    item JSONB;
    platform_name TEXT;
BEGIN
    FOR gite_record IN 
        SELECT id, name, ical_sources 
        FROM gites 
        WHERE jsonb_typeof(ical_sources) = 'array'
    LOOP
        -- Initialiser l'objet vide
        new_sources := '{}'::jsonb;
        
        -- Pour chaque élément du tableau
        FOR item IN SELECT * FROM jsonb_array_elements(gite_record.ical_sources)
        LOOP
            -- Récupérer le nom de la plateforme
            platform_name := item->>'platform';
            
            -- Si platform vide, déduire de l'URL
            IF platform_name IS NULL OR platform_name = '' THEN
                IF (item->>'url') LIKE '%airbnb%' THEN
                    platform_name := 'airbnb';
                ELSIF (item->>'url') LIKE '%abritel%' THEN
                    platform_name := 'abritel';
                ELSIF (item->>'url') LIKE '%itea.fr%' OR (item->>'url') LIKE '%gites%' THEN
                    platform_name := 'gites-de-france';
                ELSE
                    platform_name := 'autre';
                END IF;
            END IF;
            
            -- Ajouter à l'objet
            new_sources := new_sources || jsonb_build_object(platform_name, item->>'url');
        END LOOP;
        
        -- Mettre à jour le gîte
        UPDATE gites 
        SET ical_sources = new_sources 
        WHERE id = gite_record.id;
        
        RAISE NOTICE 'Migré: % → %', gite_record.name, new_sources;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Exécuter la migration
SELECT migrate_ical_sources();

-- Supprimer la fonction (nettoyage)
DROP FUNCTION migrate_ical_sources();

-- Vérifier le résultat
SELECT 
    name,
    jsonb_typeof(ical_sources) AS type,
    ical_sources
FROM gites
ORDER BY name;
