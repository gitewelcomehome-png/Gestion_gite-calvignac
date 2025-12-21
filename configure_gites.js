#!/usr/bin/env node
/**
 * Configuration Interactive des Gîtes et Coordonnées
 * 
 * Ce script va:
 * 1. Récupérer les coordonnées depuis Supabase
 * 2. Afficher la configuration actuelle
 * 3. Permettre de modifier si nécessaire
 * 4. Mettre à jour search_pois.js avec les bonnes coordonnées
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

const LOG_FILE = path.join(__dirname, 'config_gites_log.txt');

function log(message) {
    const timestamp = new Date().toLocaleString('fr-FR');
    const logLine = `[${timestamp}] ${message}`;
    console.log(logLine);
    fs.appendFileSync(LOG_FILE, logLine + '\n');
}

function httpsRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {...options, timeout: 10000}, (res) => {
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

// Supabase config
const SUPABASE_URL = 'https://aorjoghgsyaaqkodxrpo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcmpvZ2hnc3lhYXFrb2R4cnBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4MTEwNjgsImV4cCI6MjA0OTM4NzA2OH0.4VqJJ7nKHrACsY5RoLeDp9d39dN5xzXjsvO6Qh5PUn0';

async function supabaseQuery(endpoint, method = 'GET', body = null) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const options = {
        method,
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    };
    if (body) options.body = JSON.stringify(body);
    return httpsRequest(url, options);
}

async function fetchGitesCoordinates() {
    log('🔗 Connexion Supabase...');
    
    try {
        const data = await supabaseQuery('infos_gites?select=gite,gps_lat,gps_lon,adresse');
        
        if (!Array.isArray(data)) {
            log('❌ Erreur lors de la récupération');
            return null;
        }
        
        log(`✅ ${data.length} gîtes récupérés\n`);
        return data;
        
    } catch (error) {
        log(`❌ Erreur Supabase: ${error.message}`);
        return null;
    }
}

async function fetchActivitiesStats() {
    log('\n📊 Récupération des statistiques activités...');
    
    try {
        const data = await supabaseQuery('activites_gites?select=gite,latitude,longitude,nom&limit=1000');
        
        if (!Array.isArray(data)) return null;
        
        log(`✅ ${data.length} activités trouvées\n`);
        
        // Compter par gîte
        const byGite = {};
        const withCoords = {};
        
        for (const activity of data) {
            if (!byGite[activity.gite]) {
                byGite[activity.gite] = 0;
                withCoords[activity.gite] = 0;
            }
            byGite[activity.gite]++;
            if (activity.latitude && activity.longitude) {
                withCoords[activity.gite]++;
            }
        }
        
        log('📈 Activités par gîte:');
        for (const [gite, count] of Object.entries(byGite)) {
            const withCoordsCount = withCoords[gite];
            const percentage = Math.round((withCoordsCount / count) * 100);
            log(`   • ${gite}: ${count} total, ${withCoordsCount} avec coordonnées (${percentage}%)`);
        }
        
        return byGite;
        
    } catch (error) {
        log(`⚠️ Erreur stats: ${error.message}`);
        return null;
    }
}

function updateSearchPoisScript(gites) {
    log('\n✏️  Mise à jour de search_pois.js...');
    
    if (!gites || gites.length === 0) {
        log('⚠️ Pas de gîtes à configurer');
        return false;
    }
    
    // Construire l'objet GITES
    let gitesObject = '{\n';
    for (const gite of gites) {
        if (gite.gps_lat && gite.gps_lon) {
            const lat = parseFloat(gite.gps_lat);
            const lon = parseFloat(gite.gps_lon);
            gitesObject += `    '${gite.gite}': {\n`;
            gitesObject += `        lat: ${lat},\n`;
            gitesObject += `        lon: ${lon},\n`;
            gitesObject += `        radius: 25\n`;
            gitesObject += `    },\n`;
        }
    }
    gitesObject += '}';
    
    try {
        let scriptContent = fs.readFileSync(path.join(__dirname, 'search_pois.js'), 'utf-8');
        
        // Remplacer l'objet GITES
        const regex = /const GITES = \{[^}]*?\n\};/s;
        scriptContent = scriptContent.replace(regex, `const GITES = ${gitesObject};`);
        
        fs.writeFileSync(path.join(__dirname, 'search_pois.js'), scriptContent);
        
        log('✅ search_pois.js mis à jour\n');
        
        // Afficher les coordonnées
        log('🗺️  Gîtes configurés:');
        for (const gite of gites) {
            if (gite.gps_lat && gite.gps_lon) {
                log(`   • ${gite.gite}: (${gite.gps_lat}, ${gite.gps_lon})`);
                if (gite.adresse) {
                    log(`     📍 ${gite.adresse}`);
                }
            } else {
                log(`   ⚠️ ${gite.gite}: Pas de coordonnées`);
            }
        }
        
        return true;
        
    } catch (error) {
        log(`❌ Erreur mise à jour: ${error.message}`);
        return false;
    }
}

async function main() {
    // Initialiser le log
    fs.writeFileSync(LOG_FILE, `🏠 CONFIGURATION GÎTES - ${new Date().toLocaleString('fr-FR')}\n${'='.repeat(70)}\n\n`);
    
    log('🏠 CONFIGURATION DES GÎTES');
    log('='.repeat(70));
    
    // Étape 1: Récupérer les gîtes
    const gites = await fetchGitesCoordinates();
    if (!gites) {
        log('\n❌ Impossible de récupérer les coordonnées.');
        log('💡 Conseil: Vérifiez votre connexion internet');
        log('📝 Vous pouvez configurer manuellement en éditant search_pois.js');
        process.exit(1);
    }
    
    // Étape 2: Récupérer les stats
    await fetchActivitiesStats();
    
    // Étape 3: Mettre à jour search_pois.js
    const updated = updateSearchPoisScript(gites);
    
    if (updated) {
        log('\n✅ CONFIGURATION PRÊTE');
        log('\n📋 Prochaines étapes:');
        log('   1. Exécutez: node search_pois.js');
        log('   2. Attendez la fin (quelques minutes)');
        log('   3. Vérifiez: cat poi_search_log.txt');
        log('   4. Exécutez le SQL généré dans Supabase');
    } else {
        log('\n⚠️ Configuration incomplète');
        process.exit(1);
    }
}

main().catch(error => {
    log(`❌ Erreur: ${error.message}`);
    console.error(error);
    process.exit(1);
});
