# Guide: Correction des Coordonnées Dupliquées

## Problème
38 activités partagent les mêmes coordonnées (45.9394, 4.7728) alors qu'elles correspondent à des lieux différents.

## Solution Manuelle (via Supabase Dashboard)

1. **Se connecter à Supabase**: https://supabase.com/dashboard
2. **Aller dans Table Editor** → `activites_gites`
3. **Filtrer les doublons**:
   ```sql
   SELECT * FROM activites_gites 
   WHERE latitude = 45.9394 
   AND longitude = 4.7728;
   ```

4. **Pour chaque activité**, rechercher les vraies coordonnées:
   - Aller sur Google Maps
   - Chercher le nom exact (ex: "Parc des Oiseaux Villars-les-Dombes")
   - Clic droit sur le marqueur → "Plus d'infos"
   - Copier les coordonnées (format: 45.9979°, 5.0296°)
   - Mettre à jour dans Supabase

## Solution Automatique (Script Node.js)

### Option 1: Utiliser l'API Google Maps Geocoding

**Prérequis**: Clé API Google Maps avec Geocoding API activé

```javascript
// geocode_fix.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ivqiisnudabxemcxxyru.supabase.co';
const supabaseKey = 'VOTRE_CLE_ICI';
const supabase = createClient(supabaseUrl, supabaseKey);

const GOOGLE_API_KEY = 'VOTRE_CLE_GOOGLE_ICI';

async function geocodeAddress(nom, adresse) {
    const query = encodeURIComponent(`${nom} ${adresse}`);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
            latitude: location.lat,
            longitude: location.lng
        };
    }
    return null;
}

async function fixDuplicateCoordinates() {
    // Récupérer toutes les activités avec coordonnées dupliquées
    const { data: activites, error } = await supabase
        .from('activites_gites')
        .select('*')
        .eq('latitude', 45.9394)
        .eq('longitude', 4.7728);
    
    if (error) {
        console.error('Erreur:', error);
        return;
    }
    
    console.log(`🔍 ${activites.length} activités à corriger\n`);
    
    for (const act of activites) {
        // Ne pas modifier si c'est vraiment le Zoo du Parc de la Tête d'Or
        if (act.nom.toLowerCase().includes('tête d\'or')) {
            console.log(`✅ ${act.nom} - Coordonnées correctes`);
            continue;
        }
        
        console.log(`🔄 Géocodage: ${act.nom}...`);
        
        const coords = await geocodeAddress(act.nom, act.adresse || '');
        
        if (coords) {
            // Mettre à jour dans Supabase
            const { error: updateError } = await supabase
                .from('activites_gites')
                .update({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    updated_at: new Date().toISOString()
                })
                .eq('id', act.id);
            
            if (updateError) {
                console.error(`❌ ${act.nom} - Erreur:`, updateError);
            } else {
                console.log(`✅ ${act.nom} - Coordonnées mises à jour: ${coords.latitude}, ${coords.longitude}`);
            }
        } else {
            console.log(`⚠️  ${act.nom} - Impossible de géocoder`);
        }
        
        // Pause pour respecter les limites de l'API
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n✅ Traitement terminé!');
}

fixDuplicateCoordinates();
```

**Exécution**:
```bash
node geocode_fix.js
```

### Option 2: Liste de Corrections Manuelles

Si vous préférez corriger manuellement, voici un template SQL:

```sql
-- Template pour correction manuelle
UPDATE activites_gites 
SET latitude = XX.XXXX, longitude = X.XXXX
WHERE id = XXX;

-- Exemples (à vérifier sur Google Maps):

-- Parc des Oiseaux - Villars-les-Dombes
UPDATE activites_gites 
SET latitude = 45.9979, longitude = 5.0296
WHERE nom LIKE '%Parc des Oiseaux%';

-- Touroparc Zoo
UPDATE activites_gites 
SET latitude = 46.4234, longitude = 4.9167
WHERE nom LIKE '%Touroparc%';

-- Parc Animalier Château de Moidière
UPDATE activites_gites 
SET latitude = 45.6789, longitude = 5.1234  -- À VÉRIFIER
WHERE nom LIKE '%Moidière%';
```

## Option 3: Export/Import avec Excel

1. **Exporter les données problématiques**:
   ```sql
   SELECT id, nom, adresse, latitude, longitude 
   FROM activites_gites 
   WHERE latitude = 45.9394 AND longitude = 4.7728
   ORDER BY nom;
   ```

2. **Copier dans Excel/Google Sheets**

3. **Pour chaque ligne**:
   - Rechercher sur Google Maps
   - Ajouter colonnes `new_latitude` et `new_longitude`
   - Remplir les nouvelles coordonnées

4. **Générer les UPDATE SQL**:
   ```
   =CONCATENATE("UPDATE activites_gites SET latitude = ", D2, ", longitude = ", E2, " WHERE id = ", A2, ";")
   ```

5. **Exécuter les UPDATE dans Supabase SQL Editor**

## Vérification Post-Correction

```sql
-- Vérifier qu'il n'y a plus de doublons massifs
SELECT latitude, longitude, COUNT(*) as count
FROM activites_gites
GROUP BY latitude, longitude
HAVING COUNT(*) > 5
ORDER BY count DESC;

-- Vérifier les activités modifiées
SELECT nom, latitude, longitude, updated_at
FROM activites_gites
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;
```

## Prévention Future

```sql
-- Ajouter un trigger pour éviter les coordonnées par défaut
CREATE OR REPLACE FUNCTION check_default_coordinates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude = 45.9394 AND NEW.longitude = 4.7728 
       AND NEW.nom NOT ILIKE '%tête d''or%' THEN
        RAISE WARNING 'Coordonnées par défaut détectées pour: %', NEW.nom;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_default_coords
BEFORE INSERT OR UPDATE ON activites_gites
FOR EACH ROW
EXECUTE FUNCTION check_default_coordinates();
```

## Support

En cas de problème:
1. Vérifier la structure de la table avec `\d activites_gites` dans psql
2. Tester avec une seule activité d'abord
3. Faire un backup avant modifications massives
4. Documenter les changements effectués

---

**Priorité**: 🔴 CRITIQUE
**Temps estimé**: 2-3 heures (manuel) ou 30 min (script automatique)
**Impact**: Amélioration majeure de l'UX de la carte
