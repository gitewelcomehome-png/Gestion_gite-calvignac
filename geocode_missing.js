// Script Node.js pour géocoder automatiquement les activités sans coordonnées
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const SUPABASE_URL = 'https://aorjoghgsyaaqkodxrpo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcmpvZ2hnc3lhYXFrb2R4cnBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4MTEwNjgsImV4cCI6MjA0OTM4NzA2OH0.4VqJJ7nKHrACsY5RoLeDp9d39dN5xzXjsvO6Qh5PUn0';

// Fichier de log
const LOG_FILE = path.join(__dirname, 'geocode_log.txt');

function log(message) {
    console.log(message);
    fs.appendFileSync(LOG_FILE, message + '\n');
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

async function testConnection() {
    log('🔗 Test de connexion Supabase...\n');
    try {
        const result = await supabaseQuery('activites_gites?select=id&limit=1');
        if (Array.isArray(result) || result.message) {
            log('✅ Connexion Supabase OK\n');
            return true;
        }
    } catch (error) {
        log(`❌ Erreur connexion: ${error.message}\n`);
        log('📝 Conseil: Vérifiez votre connexion internet\n');
        return false;
    }
}

async function geocodeAddress(adresse, gite) {
    const query = `${adresse}, ${gite}, France`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    
    try {
        const options = {
            headers: {
                'User-Agent': 'GiteWelcomeHomeApp/1.0'
            }
        };
        
        const data = await httpsRequest(url, options);
        
        if (data && Array.isArray(data) && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
    } catch (error) {
        log(`   ⚠️ Erreur géocodage: ${error.message}`);
    }
    
    return null;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    // Vider le log
    fs.writeFileSync(LOG_FILE, `🔧 GEOCODAGE ACTIVITES - ${new Date().toLocaleString()}\n${'='.repeat(60)}\n\n`);
    
    log('🔍 Récupération des activités...\n');
    
    // Test connexion
    const connected = await testConnection();
    if (!connected) {
        log('⚠️  Script arrêté - Pas de connexion Supabase');
        return;
    }
    
    // Récupérer toutes les activités
    let activites;
    try {
        activites = await supabaseQuery('activites_gites?select=*');
    } catch (error) {
        log(`❌ Erreur récupération données: ${error.message}`);
        return;
    }
    
    if (!Array.isArray(activites)) {
        log('❌ Erreur lors de la récupération des données');
        log(`Réponse reçue: ${JSON.stringify(activites)}`);
        return;
    }
    
    log(`📊 Total activités: ${activites.length}`);
    
    // Filtrer celles sans coordonnées
    const sansCoords = activites.filter(a => !a.latitude || !a.longitude);
    const avecCoords = activites.filter(a => a.latitude && a.longitude);
    
    log(`✅ Avec coordonnées: ${avecCoords.length} (${Math.round(avecCoords.length/activites.length*100)}%)`);
    log(`❌ Sans coordonnées: ${sansCoords.length} (${Math.round(sansCoords.length/activites.length*100)}%)\n`);
    
    if (sansCoords.length === 0) {
        log('✨ Toutes les activités ont leurs coordonnées !');
        return;
    }
    
    log('🌍 Début du géocodage...\n');
    
    let reussis = 0;
    let echecs = 0;
    
    for (let i = 0; i < sansCoords.length; i++) {
        const act = sansCoords[i];
        
        log(`⏳ (${i+1}/${sansCoords.length}) ${act.nom}...`);
        
        if (!act.adresse) {
            log(`   ⚠️  Pas d'adresse - ignoré\n`);
            echecs++;
            continue;
        }
        
        const coords = await geocodeAddress(act.adresse, act.gite);
        
        if (coords) {
            // Mettre à jour dans la BDD
            const updateUrl = `activites_gites?id=eq.${act.id}`;
            try {
                await supabaseQuery(updateUrl, 'PATCH', {
                    latitude: coords.lat,
                    longitude: coords.lng
                });
                
                log(`   ✅ ${coords.lat}, ${coords.lng}\n`);
                reussis++;
            } catch (error) {
                log(`   ❌ Erreur sauvegarde: ${error.message}\n`);
                echecs++;
            }
        } else {
            log(`   ❌ Géocodage impossible\n`);
            echecs++;
        }
        
        // Attendre 1.1s pour respecter la limite de l'API
        await sleep(1100);
    }
    
    log('\n' + '='.repeat(50));
    log('✅ GÉOCODAGE TERMINÉ !');
    log('='.repeat(50));
    log(`✅ Réussis: ${reussis}`);
    log(`❌ Échecs: ${echecs}`);
    log(`📊 Total traité: ${sansCoords.length}`);
    log('='.repeat(50));
    log(`\n📄 Log complet: ${LOG_FILE}`);
}

main().catch(console.error);
