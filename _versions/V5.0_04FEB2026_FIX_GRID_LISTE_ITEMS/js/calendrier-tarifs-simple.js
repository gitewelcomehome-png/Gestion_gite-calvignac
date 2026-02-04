// ================================================================
// 💰 CALENDRIER TARIFS - VERSION SIMPLIFIÉE (STOCKAGE DANS GITES)
// ================================================================
// Utilise les colonnes JSONB de la table gites existante
// Plus besoin de tables séparées = pas de problème de cache
// ================================================================

// Structure pour stocker dans gites.tarifs_calendrier :
// {
//   "2026-01-15": 120.00,
//   "2026-07-20": 180.00
// }

let currentGiteData = null;

async function saveTarif(date, prix) {
    if (!currentGiteData) return;
    
    // Récupérer les tarifs actuels
    const tarifs = currentGiteData.tarifs_calendrier || {};
    
    // Mettre à jour
    tarifs[date] = parseFloat(prix);
    
    // Sauvegarder dans gites
    const { error } = await window.supabaseClient
        .from('gites')
        .update({ 
            tarifs_calendrier: tarifs,
            updated_at: new Date().toISOString()
        })
        .eq('id', currentGiteId);
    
    if (error) throw error;
    
    // Mettre à jour le cache local
    currentGiteData.tarifs_calendrier = tarifs;
    tarifsCache = Object.entries(tarifs).map(([date, prix]) => ({
        date,
        prix_nuit: prix
    }));
}

async function loadTarifsBase() {
    if (!currentGiteId) return;
    
    // Charger le gîte avec ses tarifs
    const { data, error } = await window.supabaseClient
        .from('gites')
        .select('id, nom, tarifs_calendrier, regles_tarifaires')
        .eq('id', currentGiteId)
        .single();
    
    if (error) throw error;
    
    currentGiteData = data;
    
    // Convertir les tarifs en format attendu
    const tarifs = data.tarifs_calendrier || {};
    tarifsCache = Object.entries(tarifs).map(([date, prix]) => ({
        date,
        prix_nuit: prix
    }));
    
    renderCalendrierTarifs();
}

async function loadRegles() {
    if (!currentGiteId || !currentGiteData) return;
    
    reglesCache = currentGiteData.regles_tarifaires || createDefaultRegles();
    renderReglesForm();
}

async function saveRegles() {
    if (!currentGiteId) return;
    
    // Récupérer les valeurs du formulaire
    const regles = {
        grille_duree: {
            type: document.getElementById('type-tarif-toggle').checked ? 'fixe' : 'pourcentage',
            nuit_1: parseFloat(document.getElementById('nuit-1').value) || 100,
            nuit_2: parseFloat(document.getElementById('nuit-2').value) || 95,
            nuit_3: parseFloat(document.getElementById('nuit-3').value) || 90,
            nuit_4: parseFloat(document.getElementById('nuit-4').value) || 90,
            nuit_5: parseFloat(document.getElementById('nuit-5').value) || 85,
            nuit_6: parseFloat(document.getElementById('nuit-6').value) || 85,
            nuit_7: parseFloat(document.getElementById('nuit-7').value) || 80,
            nuit_supp: parseFloat(document.getElementById('nuit-supp').value) || 80
        },
        promotions: {
            long_sejour: {
                actif: document.getElementById('promo-long-sejour').checked,
                pourcentage: parseFloat(document.getElementById('long-sejour-pct').value) || 10,
                a_partir_de: parseInt(document.getElementById('long-sejour-nuits').value) || 7
            },
            last_minute: {
                actif: document.getElementById('promo-last-minute').checked,
                pourcentage: parseFloat(document.getElementById('last-minute-pct').value) || 15,
                jours_avant: parseInt(document.getElementById('last-minute-jours').value) || 7
            },
            early_booking: {
                actif: document.getElementById('promo-early-booking').checked,
                pourcentage: parseFloat(document.getElementById('early-booking-pct').value) || 10,
                jours_avant: parseInt(document.getElementById('early-booking-jours').value) || 60
            }
        },
        duree_min_defaut: 2,
        periodes_duree_min: []
    };
    
    // Sauvegarder dans gites
    const { error } = await window.supabaseClient
        .from('gites')
        .update({ 
            regles_tarifaires: regles,
            updated_at: new Date().toISOString()
        })
        .eq('id', currentGiteId);
    
    if (error) throw error;
    
    currentGiteData.regles_tarifaires = regles;
    reglesCache = regles;
    
    showToast('✅ Règles enregistrées', 'success');
}

console.log('✅ Module calendrier-tarifs-simple chargé');
