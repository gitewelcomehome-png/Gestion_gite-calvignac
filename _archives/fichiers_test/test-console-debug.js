// =====================================================
// TEST MANUEL DANS LA CONSOLE NAVIGATEUR
// Copier/coller dans la console (F12) pour tester
// =====================================================

// 1. Vérifier que la fonction existe
console.log('✅ loadActiveCampaigns existe ?', typeof loadActiveCampaigns);

// 2. Vérifier que Supabase est connecté
console.log('✅ Supabase existe ?', typeof supabase);

// 3. Tester le chargement manuel des campagnes
async function testCampagnes() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('👤 User ID:', user?.id);
        
        const { data: campaigns, error } = await supabase
            .from('referral_campaigns')
            .select('*')
            .eq('is_active', true)
            .gte('end_date', new Date().toISOString());
        
        if (error) {
            console.error('❌ Erreur Supabase:', error);
        } else {
            console.log('✅ Campagnes trouvées:', campaigns.length);
            console.table(campaigns);
        }
        
        // 4. Vérifier les conteneurs HTML
        const section = document.getElementById('activeCampaignsSection');
        const container = document.getElementById('campaignsList');
        
        console.log('📦 Section existe ?', !!section);
        console.log('📦 Container existe ?', !!container);
        console.log('👁️ Section visible ?', section?.style.display);
        
    } catch (err) {
        console.error('❌ Erreur test:', err);
    }
}

// Lancer le test
testCampagnes();
