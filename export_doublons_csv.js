// Script pour exporter les doublons en CSV
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ivqiisnudabxemcxxyru.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cWlpc251ZGFieGVtY3h4eXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTk0NjMsImV4cCI6MjA4MDk3NTQ2M30.9FwJPgR8bbaP7bAemuaVbAN019EO5ql7uciQO9FeHK4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function exporterDoublonsCSV() {
    const { data, error } = await supabase
        .from('activites_gites')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

    if (error) {
        console.error('❌ Erreur:', error);
        return;
    }

    // Analyser les coordonnées
    const coordsMap = new Map();
    
    data.forEach(act => {
        const lat = parseFloat(act.latitude);
        const lng = parseFloat(act.longitude);
        const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
        
        if (!coordsMap.has(key)) {
            coordsMap.set(key, []);
        }
        coordsMap.get(key).push(act);
    });

    // CSV pour les doublons (> 3 activités au même endroit)
    const duplicates = Array.from(coordsMap.entries())
        .filter(([_, acts]) => acts.length > 3);
    
    let csv = 'id,nom,gite,adresse,latitude_actuelle,longitude_actuelle,nombre_doublons,latitude_correcte,longitude_correcte,statut\n';
    
    duplicates.forEach(([coords, activities]) => {
        activities.forEach(act => {
            const row = [
                act.id,
                `"${(act.nom || '').replace(/"/g, '""')}"`,
                act.gite,
                `"${(act.adresse || '').replace(/"/g, '""')}"`,
                act.latitude,
                act.longitude,
                activities.length,
                '', // À remplir manuellement
                '', // À remplir manuellement
                'A_CORRIGER'
            ].join(',');
            csv += row + '\n';
        });
    });
    
    fs.writeFileSync('_archives/doublons_a_corriger.csv', csv);
    console.log('✅ CSV exporté: _archives/doublons_a_corriger.csv');
    console.log(`📊 ${duplicates.reduce((sum, [_, acts]) => sum + acts.length, 0)} activités à corriger`);
}

exporterDoublonsCSV();
