// Générateur de base de données PROPRE avec lieux vérifiés
const https = require('https');
const fs = require('fs');

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function geocode(query) {
    return new Promise((resolve, reject) => {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
        https.get(url, { headers: { 'User-Agent': 'GestionGites/1.0' }}, (res) => {
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

// LIEUX RÉELS VÉRIFIÉS
const lieuxAVerifier = {
    // SITES TOURISTIQUES MAJEURS
    touristiques: [
        { nom: "Pérouges", query: "Pérouges, Ain, France", categorie: "🏛️ Site Touristique", gite: "Trévoux" },
        { nom: "Château de Trévoux", query: "Château de Trévoux, 01600, France", categorie: "🏛️ Site Touristique", gite: "Trévoux" },
        { nom: "Parc de la Tête d'Or", query: "Parc de la Tête d'Or, Lyon, France", categorie: "🌳 Nature & Randonnée", gite: "Couzon" },
        { nom: "Vieux Lyon", query: "Vieux Lyon, Lyon 5, France", categorie: "🏛️ Site Touristique", gite: "Couzon" },
        { nom: "Basilique Notre-Dame de Fourvière", query: "Basilique Fourvière, Lyon, France", categorie: "🏛️ Site Touristique", gite: "Couzon" },
        { nom: "Place Bellecour", query: "Place Bellecour, Lyon, France", categorie: "🏛️ Site Touristique", gite: "Couzon" },
        { nom: "Basilique d'Ars-sur-Formans", query: "Basilique Ars-sur-Formans, 01480, France", categorie: "🏛️ Site Touristique", gite: "Trévoux" },
    ],
    
    // MUSÉES
    musees: [
        { nom: "Musée des Confluences", query: "Musée des Confluences, Lyon, France", categorie: "🎭 Culture", gite: "Couzon" },
        { nom: "Musée des Beaux-Arts de Lyon", query: "Musée Beaux-Arts, Place Terreaux, Lyon, France", categorie: "🎭 Culture", gite: "Couzon" },
        { nom: "Institut Lumière", query: "Institut Lumière, Lyon 8, France", categorie: "🎭 Culture", gite: "Couzon" },
        { nom: "Musée Gadagne", query: "Musée Gadagne, Vieux Lyon, France", categorie: "🎭 Culture", gite: "Couzon" },
        { nom: "Musée Gallo-Romain Fourvière", query: "Musée Gallo-Romain, Lyon 5, France", categorie: "🎭 Culture", gite: "Couzon" },
        { nom: "Musée Paul Dini", query: "Musée Paul Dini, Villefranche-sur-Saône, France", categorie: "🎭 Culture", gite: "Couzon" },
    ],
    
    // PARCS & LOISIRS
    parcs: [
        { nom: "Parc des Oiseaux", query: "Parc des Oiseaux, Villars-les-Dombes, France", categorie: "⚽ Sport & Loisirs", gite: "Trévoux" },
        { nom: "Touroparc Zoo", query: "Touroparc Zoo, Romanèche-Thorins, France", categorie: "⚽ Sport & Loisirs", gite: "Trévoux" },
        { nom: "Walibi Rhône-Alpes", query: "Walibi, Les Avenières, France", categorie: "⚽ Sport & Loisirs", gite: "Trévoux" },
        { nom: "Zoo de Lyon", query: "Zoo, Parc Tête d'Or, Lyon, France", categorie: "⚽ Sport & Loisirs", gite: "Couzon" },
        { nom: "Aquarium de Lyon", query: "Aquarium Lyon, La Mulatière, France", categorie: "⚽ Sport & Loisirs", gite: "Couzon" },
    ],
    
    // RESTAURANTS RÉPUTÉS
    restaurants: [
        { nom: "Paul Bocuse", query: "Auberge du Pont de Collonges, Collonges-au-Mont-d'Or, France", categorie: "🍽️ Restaurant", gite: "Couzon" },
        { nom: "Les Bouchons Lyonnais", query: "Bouchon Lyonnais, Vieux Lyon, France", categorie: "🍽️ Restaurant", gite: "Couzon" },
    ],
    
    // COMMERCES ESSENTIELS
    commerces: [
        { nom: "Carrefour Villefranche", query: "Carrefour, Villefranche-sur-Saône, France", categorie: "🛒 Commerces", gite: "Trévoux" },
        { nom: "Intermarché Trévoux", query: "Intermarché, Trévoux, France", categorie: "🛒 Commerces", gite: "Trévoux" },
        { nom: "Carrefour Market Neuville", query: "Carrefour Market, Neuville-sur-Saône, France", categorie: "🛒 Commerces", gite: "Couzon" },
    ]
};

async function genererBase() {
    console.log('\n🔨 GÉNÉRATION BASE DE DONNÉES PROPRE\n');
    console.log('='.repeat(80) + '\n');
    
    const activites = [];
    let compteur = 0;
    
    for (const [categorie, lieux] of Object.entries(lieuxAVerifier)) {
        console.log(`\n📍 ${categorie.toUpperCase()}\n`);
        
        for (const lieu of lieux) {
            compteur++;
            console.log(`[${compteur}] Recherche: ${lieu.nom}`);
            
            try {
                await wait(1500); // Respect strict de la limite
                const result = await geocode(lieu.query);
                
                if (result) {
                    activites.push({
                        gite: lieu.gite,
                        nom: lieu.nom,
                        categorie: lieu.categorie,
                        adresse: result.display_name.split(',').slice(0, 3).join(','),
                        latitude: parseFloat(result.lat),
                        longitude: parseFloat(result.lon)
                    });
                    console.log(`   ✅ Trouvé: ${result.lat}, ${result.lon}`);
                } else {
                    console.log(`   ⚠️  Non trouvé`);
                }
            } catch (err) {
                console.log(`   ❌ Erreur: ${err.message}`);
            }
        }
    }
    
    console.log(`\n\n✅ ${activites.length} lieux vérifiés`);
    
    // Sauvegarder en JSON
    fs.writeFileSync('base_propre.json', JSON.stringify(activites, null, 2));
    console.log('💾 Sauvegardé: base_propre.json\n');
}

genererBase().catch(console.error);
