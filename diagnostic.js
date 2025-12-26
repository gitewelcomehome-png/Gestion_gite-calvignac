// Script de diagnostic à exécuter dans la console
console.log('🔍 DIAGNOSTIC ACTIVITÉS');
console.log('='.repeat(50));

// 1. Vérifier window.activitesParGite
console.log('\n1️⃣ window.activitesParGite:');
console.log('Existe:', !!window.activitesParGite);
if (window.activitesParGite) {
    console.log('Trévoux:', window.activitesParGite['Trévoux']?.length || 0, 'activités');
    console.log('Couzon:', window.activitesParGite['Couzon']?.length || 0, 'activités');
}

// 2. Vérifier Supabase
console.log('\n2️⃣ Supabase:');
console.log('Client existe:', !!window.supabaseClient);

// 3. Tester chargement
console.log('\n3️⃣ Test chargement depuis Supabase...');
if (window.supabaseClient) {
    window.supabaseClient
        .from('activites_gites')
        .select('gite, categorie')
        .then(({ data, error }) => {
            if (error) {
                console.error('❌ Erreur:', error.message);
            } else {
                console.log('✅ Données chargées:', data.length, 'activités');
                
                // Compter par gîte
                const parGite = { 'Trévoux': 0, 'Couzon': 0 };
                data.forEach(act => {
                    if (parGite[act.gite] !== undefined) {
                        parGite[act.gite]++;
                    }
                });
                console.log('Par gîte:', parGite);
                
                // Compter par catégorie
                const parCat = {};
                data.forEach(act => {
                    parCat[act.categorie] = (parCat[act.categorie] || 0) + 1;
                });
                console.log('Par catégorie:', parCat);
            }
        });
} else {
    console.error('❌ Supabase non initialisé');
}

// 4. Vérifier les fonctions
console.log('\n4️⃣ Fonctions disponibles:');
console.log('chargerActivites:', typeof window.chargerActivites);
console.log('filtrerActivitesParCategorie:', typeof window.filtrerActivitesParCategorie);
console.log('afficherToutesActivites:', typeof window.afficherToutesActivites);

// 5. Vérifier l'élément DOM
console.log('\n5️⃣ Éléments DOM:');
console.log('decouvrir_gite:', document.getElementById('decouvrir_gite')?.tagName);
console.log('activitesParCategorie:', document.getElementById('activitesParCategorie')?.tagName);

console.log('\n' + '='.repeat(50));
console.log('✅ Diagnostic terminé');
console.log('Pour recharger les activités: await chargerActivites()');
console.log('Pour tester un filtre: await filtrerActivitesParCategorie("Café")');
