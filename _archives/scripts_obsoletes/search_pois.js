#!/usr/bin/env node
// Script pour chercher les POIs (Points d'Intérêt) dans un rayon de 25km autour des gîtes
// Utilise l'API Overpass pour récupérer les données OpenStreetMap

const https = require('https');
const fs = require('fs');
const path = require('path');

// ====================================
// CONFIGURATION
// ====================================

// Coordonnées des gîtes (à obtenir de Supabase)
const GITES = {
    'Trévoux': {
        lat: 45.9731,      // À mettre à jour avec les vraies coordonnées
        lon: 4.8008,
        radius: 25         // km
    },
    'Couzon': {
        lat: 45.8245,      // À mettre à jour avec les vraies coordonnées
        lon: 4.8156,
        radius: 25         // km
    }
};

// Types de POIs à rechercher
const POI_TYPES = {
    'Restaurant': ['amenity=restaurant'],
    'Café/Bar': ['amenity=cafe', 'amenity=bar'],
    'Hôtel': ['tourism=hotel'],
    'Musée': ['tourism=museum'],
    'Parc': ['leisure=park'],
    'Piscine': ['leisure=swimming_pool'],
    'Sports': ['leisure=sports_centre', 'leisure=pitch'],
    'Randonnée': ['tourism=information', 'tourism=alpine_hut'],
    'Vélo': ['shop=bicycle', 'leisure=track'],
    'Ski': ['leisure=ski_slope'],
    'Attraction': ['tourism=attraction'],
    'Monument': ['historic=monument'],
    'Château': ['tourism=castle', 'historic=castle'],
    'Église': ['amenity=place_of_worship', 'historic=chapel'],
    'Marché': ['amenity=marketplace'],
    'Supermarché': ['shop=supermarket'],
    'Pharmacie': ['amenity=pharmacy'],
    'Hôpital': ['amenity=hospital'],
    'Gare': ['railway=station'],
    'Parking': ['amenity=parking'],
    'Pique-nique': ['leisure=picnic_table'],
    'Camping': ['tourism=camp_site'],
    'Aire de jeux': ['leisure=playground']
};

const LOG_FILE = path.join(__dirname, 'poi_search_log.txt');
const SQL_FILE = path.join(__dirname, 'sql', 'insert_activites.sql');

// ====================================
// FONCTIONS UTILITAIRES
// ====================================

function log(message) {
    const timestamp = new Date().toLocaleString('fr-FR');
    const logLine = `[${timestamp}] ${message}`;
    console.log(logLine);
    fs.appendFileSync(LOG_FILE, logLine + '\n');
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function httpsRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {...options, timeout: 15000}, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
        if (options.body) req.write(options.body);
        req.end();
    });
}

// ====================================
// REQUETE OVERPASS
// ====================================

async function searchPOIsOverpass(giteName, lat, lon, radius) {
    log(`\n🔍 Recherche POIs autour de ${giteName}...`);
    
    // Convertir le rayon en degrés (approximatif pour requête)
    const radiusDegrees = radius / 111; // 1 degré ≈ 111 km
    
    // Construire la requête Overpass pour TOUS les types de POIs
    const filters = Object.values(POI_TYPES).flat().map(tag => `[${tag}]`).join('|');
    
    const query = `
        [bbox:${lat - radiusDegrees},${lon - radiusDegrees},${lat + radiusDegrees},${lon + radiusDegrees}];
        (
            node[${filters}];
            way[${filters}];
            relation[${filters}];
        );
        out center;
    `;
    
    const url = 'https://overpass-api.de/api/interpreter';
    
    try {
        const response = await httpsRequest(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `data=${encodeURIComponent(query)}`
        });
        
        if (!response.elements) {
            log(`⚠️  Pas de réponse Overpass pour ${giteName}`);
            return [];
        }
        
        const pois = [];
        
        for (const element of response.elements) {
            const name = element.tags?.name || element.tags?.['name:fr'] || 'Sans nom';
            
            // Récupérer les coordonnées
            let elementLat, elementLon;
            if (element.lat && element.lon) {
                elementLat = element.lat;
                elementLon = element.lon;
            } else if (element.center) {
                elementLat = element.center.lat;
                elementLon = element.center.lon;
            } else {
                continue;
            }
            
            // Vérifier la distance
            const distance = haversineDistance(lat, lon, elementLat, elementLon);
            if (distance > radius) continue;
            
            // Déterminer le type
            let type = 'Autre';
            for (const [typeKey, filters] of Object.entries(POI_TYPES)) {
                for (const filter of filters) {
                    const [key, value] = filter.split('=');
                    if (element.tags?.[key] === value) {
                        type = typeKey;
                        break;
                    }
                }
                if (type !== 'Autre') break;
            }
            
            // Récupérer l'adresse
            const address = element.tags?.['addr:street'] ? 
                `${element.tags['addr:street']} ${element.tags['addr:housenumber'] || ''}`.trim() : 
                'Coordonnées GPS';
            
            pois.push({
                nom: name,
                type: type,
                adresse: address,
                latitude: parseFloat(elementLat.toFixed(8)),
                longitude: parseFloat(elementLon.toFixed(8)),
                distance: parseFloat(distance.toFixed(2)),
                gite: giteName,
                website: element.tags?.website || null,
                phone: element.tags?.phone || null,
                opening_hours: element.tags?.opening_hours || null
            });
        }
        
        log(`✅ Trouvé ${pois.length} POIs pour ${giteName}`);
        return pois;
        
    } catch (error) {
        log(`❌ Erreur Overpass: ${error.message}`);
        return [];
    }
}

// ====================================
// GÉNÉRATION SQL
// ====================================

function generateSQL(allPOIs) {
    let sql = `-- ====================================
-- Insertion des Points d'Intérêt (POIs)
-- Gîtes de Calvignac - Structure Supabase
-- ====================================
-- Généré: ${new Date().toLocaleString('fr-FR')}
-- Table: activites_gites

-- Champs mappés:
-- gite (Trévoux/Couzon)
-- nom (String)
-- categorie (Type du POI)
-- adresse (Adresse complète)
-- latitude/longitude (Coordonnées GPS)
-- distance (Distance depuis gîte en km)
-- website, telephone (Si disponibles)
-- note, avis, prix, google_maps_link (NULL ou valeurs)

\n`;

    // Grouper par gîte
    const byGite = {};
    for (const poi of allPOIs) {
        if (!byGite[poi.gite]) byGite[poi.gite] = [];
        byGite[poi.gite].push(poi);
    }

    // Générer les INSERT avec la bonne structure
    for (const [gite, pois] of Object.entries(byGite)) {
        sql += `-- ====================================\n`;
        sql += `-- ${gite}: ${pois.length} POIs\n`;
        sql += `-- ====================================\n\n`;
        
        sql += `INSERT INTO activites_gites (gite, nom, categorie, adresse, latitude, longitude, distance, website, telephone, note, avis, prix, google_maps_link, created_at)\nVALUES\n`;
        
        const values = pois.map((poi, idx) => {
            const escapedNom = poi.nom.replace(/'/g, "''");
            const escapedAdresse = poi.adresse.replace(/'/g, "''");
            const escapedCategorie = poi.type.replace(/'/g, "''");
            const website = poi.website ? `'${poi.website.replace(/'/g, "''")}'` : 'NULL';
            const phone = poi.phone ? `'${poi.phone.replace(/'/g, "''")}'` : 'NULL';
            
            // Distance arrondie à 1 décimale
            const distance = poi.distance ? poi.distance.toFixed(1) : 'NULL';
            
            // Note (NULL par défaut, à remplir manuellement ou via API)
            const note = 'NULL';
            
            // Avis (NULL par défaut)
            const avis = 'NULL';
            
            // Prix (NULL par défaut, possibilité d'estimer par type)
            let prix = 'NULL';
            if (['Restaurant', 'Café/Bar', 'Hôtel'].includes(poi.type)) {
                prix = "'€€'"; // Défaut modéré
            }
            
            // Google Maps Link (construit si on a les coords)
            let mapsLink = 'NULL';
            if (poi.latitude && poi.longitude) {
                const mapsUrl = `https://www.google.com/maps?q=${poi.latitude},${poi.longitude}`;
                mapsLink = `'${mapsUrl}'`;
            }
            
            return `('${gite}', '${escapedNom}', '${escapedCategorie}', '${escapedAdresse}', ${poi.latitude}, ${poi.longitude}, ${distance}, ${website}, ${phone}, ${note}, ${avis}, ${prix}, ${mapsLink})`;
        }).join(',\n');
        
        sql += values + ';\n\n';
    }

    // Résumé
    sql += `-- ====================================\n`;
    sql += `-- RÉSUMÉ DE L'INSERTION\n`;
    sql += `-- ====================================\n\n`;
    
    let totalCount = 0;
    for (const [gite, pois] of Object.entries(byGite)) {
        const byType = {};
        let totalDist = 0;
        
        for (const poi of pois) {
            if (!byType[poi.type]) byType[poi.type] = 0;
            byType[poi.type]++;
            totalDist += poi.distance || 0;
        }
        
        const avgDist = (totalDist / pois.length).toFixed(1);
        
        sql += `-- ${gite}: ${pois.length} POIs (distance moyenne: ${avgDist} km)\n`;
        const sortedTypes = Object.entries(byType)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        for (const [type, count] of sortedTypes) {
            sql += `--   • ${type}: ${count}\n`;
        }
        sql += `\n`;
        totalCount += pois.length;
    }
    
    sql += `-- TOTAL: ${totalCount} POIs\n`;
    sql += `-- Date: ${new Date().toLocaleString('fr-FR')}\n`;
    sql += `-- ====================================\n`;
    
    return sql;
}

// ====================================
// MAIN
// ====================================

async function main() {
    // Initialiser le log
    fs.writeFileSync(LOG_FILE, `🌍 RECHERCHE POIs - ${new Date().toLocaleString('fr-FR')}\n${'='.repeat(60)}\n\n`);
    
    log('🌍 Début de la recherche de Points d\'Intérêt...');
    log(`📍 Rayon de recherche: 25 km autour de chaque gîte\n`);
    
    // Créer le dossier sql s'il n'existe pas
    if (!fs.existsSync(path.join(__dirname, 'sql'))) {
        fs.mkdirSync(path.join(__dirname, 'sql'));
    }
    
    let allPOIs = [];
    
    // Recherche pour chaque gîte
    for (const [giteName, coords] of Object.entries(GITES)) {
        log(`\n📍 ${giteName}`);
        log(`   Latitude: ${coords.lat}`);
        log(`   Longitude: ${coords.lon}`);
        
        const pois = await searchPOIsOverpass(giteName, coords.lat, coords.lon, coords.radius);
        allPOIs = allPOIs.concat(pois);
        
        // Respecter les limites de l'API Overpass
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Générer le SQL
    log('\n\n📝 Génération du script SQL...');
    const sqlContent = generateSQL(allPOIs);
    
    // Sauvegarder
    fs.writeFileSync(SQL_FILE, sqlContent);
    log(`✅ Script SQL généré: ${SQL_FILE}`);
    
    // Afficher le résumé
    log('\n' + '='.repeat(60));
    log('✅ RECHERCHE TERMINÉE');
    log('='.repeat(60));
    log(`📊 Total POIs trouvés: ${allPOIs.length}`);
    
    // Compter par gîte
    const byGite = {};
    const byType = {};
    for (const poi of allPOIs) {
        if (!byGite[poi.gite]) byGite[poi.gite] = 0;
        if (!byType[poi.type]) byType[poi.type] = 0;
        byGite[poi.gite]++;
        byType[poi.type]++;
    }
    
    log('\n📍 Par gîte:');
    for (const [gite, count] of Object.entries(byGite)) {
        log(`   • ${gite}: ${count}`);
    }
    
    log('\n🏷️  Par type:');
    const sortedTypes = Object.entries(byType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
    for (const [type, count] of sortedTypes) {
        log(`   • ${type}: ${count}`);
    }
    
    log(`\n📄 Log complet: ${LOG_FILE}`);
    log(`📝 SQL généré: ${SQL_FILE}`);
    
    // Afficher un aperçu des premières lignes du SQL
    log('\n' + '='.repeat(60));
    log('📋 Aperçu du SQL généré (premières lignes):');
    log('='.repeat(60));
    const sqlLines = sqlContent.split('\n').slice(0, 30);
    sqlLines.forEach(line => log(line));
    log('...');
}

// Démarrer
main().catch(error => {
    log(`❌ Erreur: ${error.message}`);
    console.error(error);
    process.exit(1);
});
