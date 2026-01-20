// ================================================================
// 🚀 SCRIPT AUTO-SETUP ORGANISATION
// ================================================================
// INSTRUCTIONS:
// 1. Connectez-vous à votre application (index.html)
// 2. Ouvrez la Console (F12)
// 3. Copiez-collez tout ce script et appuyez sur Entrée
// ================================================================

(async function() {
    console.log('🚀 Début du setup...');
    
    // 1. Récupérer l'utilisateur connecté
    const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
    
    if (userError || !user) {
        console.error('❌ Erreur: vous devez être connecté');
        console.error('Connectez-vous d\'abord, puis relancez ce script');
        return;
    }
    
    console.log('✅ Utilisateur connecté:', user.email);
    console.log('📝 User ID:', user.id);
    
    // 2. Vérifier si le membership existe déjà
    const { data: existing } = await window.supabaseClient
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', '21f0b540-1298-4b45-ba46-2fc55ce7dbb0')
        .single();
    
    if (existing) {
        console.log('✅ Membership déjà existant');
        console.log('Organization ID:', existing.organization_id);
        console.log('🎉 Tout est prêt ! Vous pouvez créer vos gîtes');
        return;
    }
    
    // 3. Créer le membership
    console.log('📝 Création du membership...');
    const { data: newMember, error: memberError } = await window.supabaseClient
        .from('organization_members')
        .insert({
            user_id: user.id,
            organization_id: '21f0b540-1298-4b45-ba46-2fc55ce7dbb0',
            role: 'owner'
        })
        .select()
        .single();
    
    if (memberError) {
        console.error('❌ Erreur création membership:', memberError);
        return;
    }
    
    console.log('✅ Membership créé avec succès !');
    console.log('Organization ID:', newMember.organization_id);
    console.log('🎉 SETUP TERMINÉ ! Rechargez la page et créez vos gîtes');
    
    // 4. Recharger la page automatiquement
    setTimeout(() => {
        console.log('🔄 Rechargement de la page...');
        window.location.reload();
    }, 2000);
})();
