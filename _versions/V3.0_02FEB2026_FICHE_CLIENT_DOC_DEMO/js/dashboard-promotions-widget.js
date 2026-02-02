// ================================================================
// 📊 WIDGET PROMOTIONS DASHBOARD
// ================================================================
// Affiche les stats des promotions sur le dashboard admin
// ================================================================

console.log('🚀 DEBUG: Fichier dashboard-promotions-widget.js chargé');

async function loadPromotionsStats() {
    console.log('🔍 DEBUG: Chargement stats promotions...');
    
    try {
        if (!window.supabaseClient) {
            console.error('❌ DEBUG: window.supabaseClient non disponible');
            return;
        }
        
        const dateDebut30j = new Date();
        dateDebut30j.setDate(dateDebut30j.getDate() - 30);
        
        // Récupérer toutes les promotions
        const { data: promotions, error: errorPromos } = await window.supabaseClient
            .from('cm_promotions')
            .select('*');
        
        if (errorPromos) {
            console.error('❌ DEBUG: Erreur Supabase promotions:', errorPromos);
            throw errorPromos;
        }
        
        // Récupérer utilisations des 30 derniers jours
        const { data: usages, error: errorUsages } = await window.supabaseClient
            .from('cm_promo_usage')
            .select('montant_reduction, ca_genere')
            .gte('created_at', dateDebut30j.toISOString());
        
        if (errorUsages) {
            console.error('❌ DEBUG: Erreur Supabase usages:', errorUsages);
            throw errorUsages;
        }
        
        console.log('📊 DEBUG: Promotions reçues:', promotions ? promotions.length : 0);
        console.log('📊 DEBUG: Usages reçus:', usages ? usages.length : 0);
        
        // Calculer stats
        const now = new Date();
        const promosActives = promotions?.filter(p => {
            const isActive = p.actif;
            const isNotExpired = !p.date_fin || new Date(p.date_fin) > now;
            return isActive && isNotExpired;
        }).length || 0;
        
        const utilisations = usages?.length || 0;
        const coutTotal = usages?.reduce((sum, u) => sum + parseFloat(u.montant_reduction || 0), 0) || 0;
        const caGenere = usages?.reduce((sum, u) => sum + parseFloat(u.ca_genere || 0), 0) || 0;
        const roi = coutTotal > 0 ? ((caGenere - coutTotal) / coutTotal * 100) : 0;
        
        // Mettre à jour les KPI
        const updateKPI = (id, value) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
            } else {
                console.warn(`⚠️ Élément ${id} introuvable`);
            }
        };
        
        updateKPI('kpiPromosActives', promosActives);
        updateKPI('kpiPromosUtilisations', utilisations);
        updateKPI('kpiPromosROI', roi.toFixed(1) + '%');
        
        // Couleur ROI
        const kpiROIEl = document.getElementById('kpiPromosROI');
        if (kpiROIEl) {
            if (roi >= 100) {
                kpiROIEl.style.color = '#4caf50';
            } else if (roi >= 0) {
                kpiROIEl.style.color = '#ff9800';
            } else {
                kpiROIEl.style.color = '#f44336';
            }
        }
        
        console.log('✅ DEBUG: Stats promotions affichées', { promosActives, utilisations, roi });
        
    } catch (error) {
        console.error('❌ DEBUG: Erreur chargement stats promotions:', error);
    }
}

// Auto-export de la fonction
if (typeof window !== 'undefined') {
    window.loadPromotionsStats = loadPromotionsStats;
}
