// Script de correction automatique des coordonnées avec Nominatim (OpenStreetMap - GRATUIT)
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabaseUrl = 'https://ivqiisnudabxemcxxyru.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cWlpc251ZGFieGVtY3h4eXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTk0NjMsImV4cCI6MjA4MDk3NTQ2M30.9FwJPgR8bbaP7bAemuaVbAN019EO5ql7uciQO9FeHK4';
const supabase = createClient(supabaseUrl, supabaseKey);

// Statistiques
let stats = {
    total: 0,
    corriges: 0,
    erreurs: 0,
    non_trouves: 0,
    ignores: 0
};

// Fonction pour géocoder avec Nominatim (gratuit, OpenStreetMap)
async function geocodeNominatim(adresse, nom) {
    return new Promise((resolve, reject) => {
        // Construire la requête de recherche
        let query = '';
        
        if (adresse && adresse.trim() !== '') {
            query = `${nom}, ${adresse}`;
        } else {
            query = nom;
        }
        
        // Ajouter ", France" pour améliorer la précision
        query += ', France';
        
        const encodedQuery = encodeURIComponent(query);
        const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&addressdetails=1`;
        
        const options = {
            headers: {
                'User-Agent': 'GestionGites-Calvignac/1.0 (correction coordonnées)'
            }
        };
        
        https.get(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const results = JSON.parse(data);
                    
                    if (results && results.length > 0) {
                        const result = results[0];
                        resolve({
                            latitude: parseFloat(result.lat),
                            longitude: parseFloat(result.lon),
                            display_name: result.display_name
                        });
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// Fonction pour attendre (respecter la limite de 1 req/sec de Nominatim)
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Fonction principale
async function corrigerToutesLesCoordonnees() {
    console.log('🚀 DÉMARRAGE DE LA CORRECTION AUTOMATIQUE DES COORDONNÉES\n');
    console.log('📡 Utilisation de Nominatim (OpenStreetMap - Gratuit)');
    console.log('⏱️  Limite: 1 requête/seconde (respectée automatiquement)\n');
    
    // Récupérer toutes les activités avec coordonnées dupliquées
    const { data: activites, error } = await supabase
        .from('activites_gites')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
    
    if (error) {
        console.error('❌ Erreur récupération données:', error);
        return;
    }
    
    // Identifier les doublons
    const coordsMap = new Map();
    activites.forEach(act => {
        const key = `${parseFloat(act.latitude).toFixed(4)},${parseFloat(act.longitude).toFixed(4)}`;
        if (!coordsMap.has(key)) {
            coordsMap.set(key, []);
        }
        coordsMap.get(key).push(act);
    });
    
    // Filtrer pour avoir seulement les doublons (>3 activités au même endroit)
    const doublons = [];
    coordsMap.forEach((acts, key) => {
        if (acts.length > 3) {
            acts.forEach(act => doublons.push(act));
        }
    });
    
    stats.total = doublons.length;
    console.log(`📊 ${stats.total} activités à corriger\n`);
    console.log(`⏰ Temps estimé: ${Math.ceil(stats.total * 1.2 / 60)} minutes\n`);
    console.log(`${'='.repeat(80)}\n`);
    
    // Corriger chaque activité
    for (let i = 0; i < doublons.length; i++) {
        const act = doublons[i];
        const progress = Math.round((i / stats.total) * 100);
        
        console.log(`[${i + 1}/${stats.total}] (${progress}%) ${act.nom} (${act.gite})`);
        
        try {
            // Géocoder l'adresse
            const coords = await geocodeNominatim(act.adresse, act.nom);
            
            if (coords) {
                console.log(`   ✅ Trouvé: ${coords.latitude}, ${coords.longitude}`);
                console.log(`   📍 ${coords.display_name.substring(0, 80)}...`);
                
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
                    console.log(`   ❌ Erreur mise à jour: ${updateError.message}`);
                    stats.erreurs++;
                } else {
                    console.log(`   💾 Sauvegardé dans Supabase`);
                    stats.corriges++;
                }
            } else {
                console.log(`   ⚠️  Adresse non trouvée`);
                console.log(`   📝 Adresse: ${act.adresse || 'N/A'}`);
                stats.non_trouves++;
            }
        } catch (error) {
            console.log(`   ❌ Erreur: ${error.message}`);
            stats.erreurs++;
        }
        
        console.log('');
        
        // Attendre 1.2 secondes (respect de la limite Nominatim + marge)
        await wait(1200);
    }
    
    // Afficher les statistiques finales
    console.log(`${'='.repeat(80)}`);
    console.log('\n🎉 CORRECTION TERMINÉE !\n');
    console.log('📊 STATISTIQUES:');
    console.log(`   Total traité:      ${stats.total}`);
    console.log(`   ✅ Corrigés:       ${stats.corriges} (${Math.round(stats.corriges / stats.total * 100)}%)`);
    console.log(`   ⚠️  Non trouvés:   ${stats.non_trouves} (${Math.round(stats.non_trouves / stats.total * 100)}%)`);
    console.log(`   ❌ Erreurs:        ${stats.erreurs} (${Math.round(stats.erreurs / stats.total * 100)}%)`);
    console.log('');
    
    // Vérifier les doublons restants
    const { data: verification } = await supabase
        .from('activites_gites')
        .select('latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
    
    const verificationMap = new Map();
    verification.forEach(act => {
        const key = `${parseFloat(act.latitude).toFixed(4)},${parseFloat(act.longitude).toFixed(4)}`;
        verificationMap.set(key, (verificationMap.get(key) || 0) + 1);
    });
    
    const doublonsRestants = Array.from(verificationMap.values()).filter(count => count > 3);
    console.log(`📍 Doublons restants (>3): ${doublonsRestants.length}`);
    
    if (doublonsRestants.length === 0) {
        console.log('\n🌟 SUCCÈS COMPLET ! Toutes les coordonnées ont été corrigées.');
    } else {
        console.log(`\n⚠️  ${doublonsRestants.length} positions ont encore des doublons.`);
        console.log('   💡 Conseil: Exécuter à nouveau le script ou corriger manuellement.');
    }
}

// Lancer la correction
console.log('\n⚠️  ATTENTION: Ce script va modifier 772 activités dans Supabase.\n');
console.log('Appuyez sur Ctrl+C dans les 5 secondes pour annuler...\n');

setTimeout(() => {
    corrigerToutesLesCoordonnees().catch(error => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });
}, 5000);
