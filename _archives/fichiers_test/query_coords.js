// Script pour interroger Supabase et voir les vraies coordonnées
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ivqiisnudabxemcxxyru.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cWlpc251ZGFieGVtY3h4eXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTk0NjMsImV4cCI6MjA4MDk3NTQ2M30.9FwJPgR8bbaP7bAemuaVbAN019EO5ql7uciQO9FeHK4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function queryCoords() {
    console.log('🔍 Interrogation de la base de données...\n');
    
    const { data, error } = await supabase
        .from('activites_gites')
        .select('*')
        .limit(100);

    if (error) {
        console.error('❌ Erreur:', error);
        return;
    }

    console.log(`✅ ${data.length} activités récupérées\n`);
    
    // Afficher toutes les colonnes de la première ligne
    if (data.length > 0) {
        console.log('📋 Structure de la première activité:');
        console.log(JSON.stringify(data[0], null, 2));
        console.log('\n');
    }
    
    // Analyser les coordonnées
    const coordsMap = new Map();
    
    data.forEach((act, i) => {
        const lat = act.latitude;
        const lng = act.longitude;
        const key = `${lat},${lng}`;
        
        if (!coordsMap.has(key)) {
            coordsMap.set(key, []);
        }
        coordsMap.get(key).push(act.nom);
        
        if (i < 10) {
            console.log(`📍 ${act.nom} (${act.gite})`);
            console.log(`   latitude: ${act.latitude}`);
            console.log(`   longitude: ${act.longitude}`);
            console.log(`   categorie: ${act.categorie || act.type || 'N/A'}`);
            console.log('');
        }
    });

    console.log('\n📊 Analyse des doublons de coordonnées:');
    const duplicates = Array.from(coordsMap.entries()).filter(([_, noms]) => noms.length > 5);
    
    if (duplicates.length > 0) {
        console.log(`⚠️ ${duplicates.length} positions avec plus de 5 activités:\n`);
        duplicates.forEach(([coords, noms]) => {
            console.log(`   ${coords}: ${noms.length} activités`);
            console.log(`      ${noms.slice(0, 3).join(', ')}...`);
        });
    } else {
        console.log('✅ Pas de doublons significatifs détectés');
    }
}

queryCoords();
