// Script pour identifier TOUS les doublons de coordonnées
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ivqiisnudabxemcxxyru.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cWlpc251ZGFieGVtY3h4eXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTk0NjMsImV4cCI6MjA4MDk3NTQ2M30.9FwJPgR8bbaP7bAemuaVbAN019EO5ql7uciQO9FeHK4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyserDoublons() {
    console.log('🔍 Analyse complète des coordonnées...\n');
    
    const { data, error } = await supabase
        .from('activites_gites')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

    if (error) {
        console.error('❌ Erreur:', error);
        return;
    }

    console.log(`✅ ${data.length} activités récupérées\n`);
    
    // Analyser les coordonnées
    const coordsMap = new Map();
    
    data.forEach(act => {
        const lat = parseFloat(act.latitude);
        const lng = parseFloat(act.longitude);
        const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
        
        if (!coordsMap.has(key)) {
            coordsMap.set(key, []);
        }
        coordsMap.get(key).push({
            id: act.id,
            nom: act.nom,
            gite: act.gite,
            adresse: act.adresse,
            lat: lat,
            lng: lng
        });
    });

    // Trouver les coordonnées dupliquées (plus de 3 activités au même endroit)
    const duplicates = Array.from(coordsMap.entries())
        .filter(([_, acts]) => acts.length > 3)
        .sort((a, b) => b[1].length - a[1].length);
    
    console.log(`\n📊 ANALYSE DES DOUBLONS (> 3 activités au même endroit)\n`);
    console.log(`⚠️ ${duplicates.length} positions problématiques détectées\n`);
    
    duplicates.forEach(([coords, activities], index) => {
        const [lat, lng] = coords.split(',').map(Number);
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🔴 DOUBLON ${index + 1}: ${activities.length} activités aux coordonnées ${coords}`);
        console.log(`📍 Google Maps: https://www.google.com/maps?q=${lat},${lng}`);
        console.log(`${'='.repeat(80)}`);
        
        // Afficher les 10 premières activités
        activities.slice(0, 10).forEach((act, i) => {
            console.log(`   ${i + 1}. ${act.nom} (${act.gite})`);
            console.log(`      Adresse: ${act.adresse || 'N/A'}`);
            console.log(`      ID: ${act.id}`);
        });
        
        if (activities.length > 10) {
            console.log(`   ... et ${activities.length - 10} autres activités`);
        }
        
        // Vérifier si c'est une vraie localisation
        const firstAddress = activities[0].adresse?.toLowerCase() || '';
        const allSamePlace = activities.every(act => {
            const addr = act.adresse?.toLowerCase() || '';
            return addr.includes(firstAddress.split(',')[0]) || firstAddress.includes(addr.split(',')[0]);
        });
        
        if (!allSamePlace) {
            console.log(`\n   ⚠️ PROBLÈME: Les adresses sont différentes mais partagent les mêmes coordonnées!`);
        }
    });
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`\n✅ Analyse terminée!`);
    console.log(`\nTotal: ${duplicates.reduce((sum, [_, acts]) => sum + acts.length, 0)} activités avec coordonnées dupliquées`);
}

analyserDoublons();
