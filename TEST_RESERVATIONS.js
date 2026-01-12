// ================================================================
// TEST RAPIDE - VÉRIFIER RÉSERVATIONS EN BASE
// ================================================================
// Coller dans la console pour vérifier si les réservations existent
// ================================================================

console.log('🔍 === TEST RÉSERVATIONS ===\n');

// 1. Compter les réservations en BDD
const { data: allReservations, error } = await window.supabaseClient
    .from('reservations')
    .select('*')
    .order('check_in', { ascending: true });

if (error) {
    console.error('❌ Erreur:', error);
} else {
    console.log(`✅ ${allReservations.length} réservations en base de données\n`);
    
    // 2. Grouper par gîte
    const byGite = {};
    allReservations.forEach(r => {
        const giteName = r.gite_id;
        if (!byGite[giteName]) byGite[giteName] = [];
        byGite[giteName].push(r);
    });
    
    console.log('📊 Répartition par gîte:');
    for (const [giteId, reservations] of Object.entries(byGite)) {
        console.log(`   ${giteId}: ${reservations.length} réservations`);
    }
    
    // 3. Compter les doublons
    const duplicates = {};
    allReservations.forEach(r => {
        const key = `${r.gite_id}_${r.check_in}_${r.check_out}_${r.platform}`;
        if (!duplicates[key]) duplicates[key] = [];
        duplicates[key].push(r);
    });
    
    const doublonCount = Object.values(duplicates).filter(arr => arr.length > 1).length;
    console.log(`\n⚠️ ${doublonCount} combinaisons en doublon`);
    
    if (doublonCount > 0) {
        console.log('\nExemples de doublons:');
        Object.entries(duplicates)
            .filter(([key, arr]) => arr.length > 1)
            .slice(0, 3)
            .forEach(([key, arr]) => {
                console.log(`   • ${arr[0].client_name} (${arr[0].check_in} → ${arr[0].check_out}): ${arr.length}× en base`);
            });
    }
    
    // 4. Afficher les 5 dernières réservations
    console.log('\n📅 5 dernières réservations créées:');
    const recent = [...allReservations]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
    
    recent.forEach(r => {
        console.log(`   • ${r.client_name} (${r.platform}): ${r.check_in} → ${r.check_out}`);
    });
    
    // 5. Tester le cache
    console.log('\n💾 Test du cache:');
    console.log('   Cache actuel:', window.CACHE.reservations?.length || 0, 'réservations');
    
    // 6. Forcer rechargement
    console.log('\n🔄 Rechargement avec forceRefresh=true...');
    const freshData = await getAllReservations(true);
    console.log(`   ✅ ${freshData.length} réservations rechargées`);
    
    // 7. Vérifier l'affichage
    console.log('\n🖥️ Mise à jour de l\'affichage...');
    if (typeof updateReservationsList === 'function') {
        await updateReservationsList(true);
        console.log('   ✅ Interface mise à jour');
    } else {
        console.warn('   ⚠️ updateReservationsList non disponible');
    }
}

console.log('\n✅ === TEST TERMINÉ ===');
