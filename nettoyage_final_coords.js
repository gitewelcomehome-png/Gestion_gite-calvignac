// Script de nettoyage final des coordonnées incorrectes
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabaseUrl = 'https://ivqiisnudabxemcxxyru.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cWlpc251ZGFieGVtY3h4eXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTk0NjMsImV4cCI6MjA4MDk3NTQ2M30.9FwJPgR8bbaP7bAemuaVbAN019EO5ql7uciQO9FeHK4';
const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour géocoder avec Nominatim
function geocodeNominatim(query) {
    return new Promise((resolve, reject) => {
        const encodedQuery = encodeURIComponent(query + ', France');
        const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&addressdetails=1`;
        
        const options = {
            headers: {
                'User-Agent': 'GestionGites-Calvignac/1.0'
            }
        };
        
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const results = JSON.parse(data);
                    if (results && results.length > 0) {
                        resolve({
                            lat: parseFloat(results[0].lat),
                            lon: parseFloat(results[0].lon),
                            display_name: results[0].display_name
                        });
                    } else {
                        resolve(null);
                    }
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Corrections manuelles spécifiques
const corrections = [
    // Musée fictif à remplacer par le vrai musée de Trévoux
    {
        ids: [446, 727],
        nom: 'Musée Trévoux et ses Trésors',
        adresse: 'Place de la Grande Argue, Trévoux',
        latitude: 45.9404820,
        longitude: 4.7727986,
        raison: 'Musée des Arts et Traditions n\'existe pas - remplacé par le vrai musée'
    },
    // Autres musées fictifs à supprimer
    {
        ids: [458, 739],
        action: 'DELETE',
        raison: 'Musée de la Reliure - Musée fictif inventé'
    },
    {
        ids: [479, 760],
        action: 'DELETE',
        raison: 'Musée de la Calligraphie - Musée fictif inventé'
    }
];

// Adresses réelles à géocoder
const aGeocoder = [
    {
        ids: [16],
        nom: 'Château de Trévoux',
        query: 'Château de Trévoux, Montée du Château, 01600 Trévoux'
    },
    {
        ids: [17],
        nom: 'Parlement de Dombes',
        query: 'Parlement de Dombes, Place de la Terrasse, 01600 Trévoux'
    },
    {
        ids: [18],
        nom: 'Église Saint-Symphorien',
        query: 'Église Saint-Symphorien, Trévoux, 01600'
    },
    {
        ids: [434, 715],
        nom: 'Basilique Notre-Dame',
        query: 'Place Pie, Trévoux, 01600'
    },
    {
        ids: [438, 719],
        nom: 'Cloître de Trévoux',
        query: 'Rue du Gouvernement, Trévoux, 01600'
    },
    {
        ids: [60],
        nom: 'Musée des Confluences',
        query: '86 Quai Perrache, 69002 Lyon'
    },
    {
        ids: [56],
        nom: 'Touroparc Zoo',
        query: 'Touroparc Zoo, 400 Boulevard du Parc, 71570 Romanèche-Thorins'
    }
];

async function nettoyer() {
    console.log('\n🧹 NETTOYAGE FINAL DES COORDONNÉES\n');
    console.log('='.repeat(80));
    
    let stats = {
        corriges: 0,
        supprimes: 0,
        erreurs: 0
    };
    
    // 1. Corrections manuelles
    console.log('\n📝 CORRECTIONS MANUELLES\n');
    for (const correction of corrections) {
        if (correction.action === 'DELETE') {
            console.log(`\n❌ Suppression: ${correction.raison}`);
            for (const id of correction.ids) {
                const { error } = await supabase
                    .from('activites_gites')
                    .delete()
                    .eq('id', id);
                
                if (error) {
                    console.log(`   ⚠️  Erreur ID ${id}: ${error.message}`);
                    stats.erreurs++;
                } else {
                    console.log(`   ✅ Supprimé ID ${id}`);
                    stats.supprimes++;
                }
            }
        } else {
            console.log(`\n✏️  ${correction.nom}`);
            console.log(`   📍 ${correction.latitude}, ${correction.longitude}`);
            console.log(`   💬 ${correction.raison}`);
            
            for (const id of correction.ids) {
                const { error } = await supabase
                    .from('activites_gites')
                    .update({
                        nom: correction.nom,
                        adresse: correction.adresse,
                        latitude: correction.latitude,
                        longitude: correction.longitude
                    })
                    .eq('id', id);
                
                if (error) {
                    console.log(`   ⚠️  Erreur ID ${id}: ${error.message}`);
                    stats.erreurs++;
                } else {
                    console.log(`   ✅ Corrigé ID ${id}`);
                    stats.corriges++;
                }
            }
        }
    }
    
    // 2. Géocodage automatique
    console.log('\n\n🌍 GÉOCODAGE AUTOMATIQUE\n');
    for (const item of aGeocoder) {
        console.log(`\n🔍 ${item.nom}`);
        console.log(`   🔎 Recherche: ${item.query}`);
        
        try {
            await wait(1200); // Respect de la limite Nominatim
            const result = await geocodeNominatim(item.query);
            
            if (result) {
                console.log(`   ✅ Trouvé: ${result.lat}, ${result.lon}`);
                console.log(`   📍 ${result.display_name.substring(0, 100)}...`);
                
                for (const id of item.ids) {
                    const { error } = await supabase
                        .from('activites_gites')
                        .update({
                            latitude: result.lat,
                            longitude: result.lon
                        })
                        .eq('id', id);
                    
                    if (error) {
                        console.log(`   ⚠️  Erreur ID ${id}: ${error.message}`);
                        stats.erreurs++;
                    } else {
                        console.log(`   💾 Sauvegardé ID ${id}`);
                        stats.corriges++;
                    }
                }
            } else {
                console.log(`   ⚠️  Non trouvé`);
            }
        } catch (err) {
            console.log(`   ❌ Erreur: ${err.message}`);
            stats.erreurs++;
        }
    }
    
    // 3. Statistiques finales
    console.log('\n\n' + '='.repeat(80));
    console.log('\n🎉 NETTOYAGE TERMINÉ !\n');
    console.log('📊 STATISTIQUES:');
    console.log(`   ✅ Corrigés:     ${stats.corriges}`);
    console.log(`   ❌ Supprimés:    ${stats.supprimes}`);
    console.log(`   ⚠️  Erreurs:     ${stats.erreurs}`);
    console.log('');
}

nettoyer().catch(console.error);
