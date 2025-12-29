// AUDIT COMPLET - Vérification de chaque lieu avec Nominatim
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');

const supabaseUrl = 'https://ivqiisnudabxemcxxyru.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cWlpc251ZGFieGVtY3h4eXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTk0NjMsImV4cCI6MjA4MDk3NTQ2M30.9FwJPgR8bbaP7bAemuaVbAN019EO5ql7uciQO9FeHK4';
const supabase = createClient(supabaseUrl, supabaseKey);

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function geocodeNominatim(query) {
    return new Promise((resolve, reject) => {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&addressdetails=1`;
        
        https.get(url, { headers: { 'User-Agent': 'GestionGites-Audit/1.0' }}, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const results = JSON.parse(data);
                    resolve(results.length > 0 ? results[0] : null);
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

// Calcul distance entre 2 points GPS
function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

async function audit() {
    console.log('\n🔍 AUDIT COMPLET DE LA BASE DE DONNÉES\n');
    console.log('='.repeat(80));
    
    const { data: activites } = await supabase
        .from('activites_gites')
        .select('*')
        .order('gite, nom');
    
    const problemes = {
        fictifs: [],        // Lieux qui n'existent pas
        mauvaisesCoords: [], // Coordonnées très éloignées de l'adresse
        adressesVagues: [], // Adresses trop imprécises
        doublons: [],       // Vrais doublons identiques
        ok: []              // Lieux vérifiés OK
    };
    
    console.log(`\n📊 ${activites.length} activités à vérifier\n`);
    console.log(`⏱️  Temps estimé: ${Math.ceil(activites.length * 1.3 / 60)} minutes\n`);
    console.log('='.repeat(80) + '\n');
    
    for (let i = 0; i < activites.length; i++) {
        const act = activites[i];
        const progress = Math.round((i / activites.length) * 100);
        
        console.log(`[${i+1}/${activites.length}] (${progress}%) ${act.nom} (${act.gite})`);
        
        // Construction de la requête de recherche
        let query = '';
        if (act.adresse && act.adresse.trim() !== '') {
            query = `${act.nom}, ${act.adresse}, France`;
        } else {
            query = `${act.nom}, ${act.gite}, France`;
        }
        
        try {
            await wait(1300); // Respect strict limite Nominatim
            const result = await geocodeNominatim(query);
            
            if (!result) {
                console.log(`   ❌ NON TROUVÉ - Lieu probablement fictif`);
                problemes.fictifs.push({
                    ...act,
                    raison: 'Non trouvé sur OpenStreetMap'
                });
            } else {
                const foundLat = parseFloat(result.lat);
                const foundLon = parseFloat(result.lon);
                const distance = distanceKm(act.latitude, act.longitude, foundLat, foundLon);
                
                if (distance > 5) {
                    console.log(`   ⚠️  COORDONNÉES INCORRECTES`);
                    console.log(`      Actuelles: ${act.latitude}, ${act.longitude}`);
                    console.log(`      Trouvées:  ${foundLat}, ${foundLon}`);
                    console.log(`      Distance:  ${distance.toFixed(1)} km`);
                    problemes.mauvaisesCoords.push({
                        ...act,
                        lat_correcte: foundLat,
                        lon_correcte: foundLon,
                        distance_km: distance.toFixed(1),
                        lieu_trouve: result.display_name
                    });
                } else if (distance > 1) {
                    console.log(`   ⚠️  Coordonnées imprécises (${distance.toFixed(1)} km)`);
                    problemes.mauvaisesCoords.push({
                        ...act,
                        lat_correcte: foundLat,
                        lon_correcte: foundLon,
                        distance_km: distance.toFixed(1),
                        lieu_trouve: result.display_name
                    });
                } else {
                    console.log(`   ✅ OK (écart: ${distance.toFixed(2)} km)`);
                    problemes.ok.push(act);
                }
            }
        } catch (err) {
            console.log(`   ❌ ERREUR: ${err.message}`);
        }
    }
    
    // Détection des doublons exacts
    console.log('\n\n🔍 Détection des doublons...\n');
    const vus = new Map();
    activites.forEach(act => {
        const key = `${act.nom}|${act.gite}|${act.latitude}|${act.longitude}`;
        if (vus.has(key)) {
            vus.get(key).push(act.id);
        } else {
            vus.set(key, [act.id]);
        }
    });
    
    vus.forEach((ids, key) => {
        if (ids.length > 1) {
            const [nom, gite] = key.split('|');
            problemes.doublons.push({ nom, gite, ids });
            console.log(`   🔴 Doublon: ${nom} (${gite}) - IDs: ${ids.join(', ')}`);
        }
    });
    
    // RAPPORT FINAL
    console.log('\n\n' + '='.repeat(80));
    console.log('\n📋 RAPPORT D\'AUDIT FINAL\n');
    console.log('='.repeat(80));
    
    console.log(`\n✅ Lieux vérifiés OK:           ${problemes.ok.length}`);
    console.log(`⚠️  Coordonnées incorrectes:     ${problemes.mauvaisesCoords.length}`);
    console.log(`❌ Lieux fictifs (non trouvés): ${problemes.fictifs.length}`);
    console.log(`🔴 Doublons à supprimer:        ${problemes.doublons.length}`);
    console.log(`\n📊 Total:                       ${activites.length}`);
    
    // Taux de problèmes
    const tauxProblemes = ((problemes.mauvaisesCoords.length + problemes.fictifs.length + problemes.doublons.length) / activites.length * 100);
    console.log(`\n🎯 Qualité de la base: ${(100 - tauxProblemes).toFixed(1)}%`);
    
    if (tauxProblemes > 30) {
        console.log('\n❌ RECOMMANDATION: RECONSTRUCTION COMPLÈTE NÉCESSAIRE');
        console.log('   La base contient trop d\'erreurs (>30%)');
    } else if (tauxProblemes > 10) {
        console.log('\n⚠️  RECOMMANDATION: NETTOYAGE MAJEUR NÉCESSAIRE');
        console.log('   Corrections importantes à apporter');
    } else {
        console.log('\n✅ RECOMMANDATION: Corrections mineures suffisantes');
    }
    
    // Sauvegarde du rapport détaillé
    const rapport = {
        date: new Date().toISOString(),
        total: activites.length,
        statistiques: {
            ok: problemes.ok.length,
            mauvaises_coords: problemes.mauvaisesCoords.length,
            fictifs: problemes.fictifs.length,
            doublons: problemes.doublons.length,
            taux_problemes: tauxProblemes.toFixed(1) + '%'
        },
        details: problemes
    };
    
    fs.writeFileSync('RAPPORT_AUDIT_COMPLET.json', JSON.stringify(rapport, null, 2));
    console.log('\n💾 Rapport détaillé sauvegardé: RAPPORT_AUDIT_COMPLET.json\n');
}

audit().catch(console.error);
