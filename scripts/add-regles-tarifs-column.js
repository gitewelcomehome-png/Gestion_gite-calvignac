/**
 * Script pour ajouter la colonne regles_tarifs à la table gites
 * À exécuter dans la console du navigateur sur une page avec Supabase chargé
 */

(async function addReglesCol() {
    try {
        console.log('🔧 Ajout de la colonne regles_tarifs...');
        
        // SQL à exécuter via l'API Supabase
        const sql = `
            ALTER TABLE gites 
            ADD COLUMN IF NOT EXISTS regles_tarifs JSONB DEFAULT '{
              "promotions": {
                "long_sejour": {"actif": false, "pourcentage": 10, "a_partir_de": 7},
                "last_minute": {"actif": false, "pourcentage": 15, "jours_avant": 7},
                "early_booking": {"actif": false, "pourcentage": 10, "jours_avant": 60}
              },
              "duree_min_defaut": 2,
              "periodes_duree_min": []
            }'::jsonb;
        `;
        
        // Initialiser les règles pour tous les gîtes existants
        const defaultRegles = {
            promotions: {
                long_sejour: { actif: false, pourcentage: 10, a_partir_de: 7 },
                last_minute: { actif: false, pourcentage: 15, jours_avant: 7 },
                early_booking: { actif: false, pourcentage: 10, jours_avant: 60 }
            },
            duree_min_defaut: 2,
            periodes_duree_min: []
        };
        
        // Récupérer tous les gîtes
        const { data: gites, error: fetchError } = await window.supabaseClient
            .from('gites')
            .select('id, name');
        
        if (fetchError) {
            console.error('❌ Erreur lecture gîtes:', fetchError);
            return;
        }
        
        console.log(`📋 ${gites.length} gîtes trouvés`);
        
        // Mettre à jour chaque gîte avec les règles par défaut
        for (const gite of gites) {
            const { error: updateError } = await window.supabaseClient
                .from('gites')
                .update({ regles_tarifs: defaultRegles })
                .eq('id', gite.id);
            
            if (updateError) {
                console.error(`❌ Erreur MAJ ${gite.name}:`, updateError);
            } else {
                console.log(`✅ ${gite.name} : règles initialisées`);
            }
        }
        
        console.log('✅ Colonne regles_tarifs initialisée pour tous les gîtes !');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
})();
