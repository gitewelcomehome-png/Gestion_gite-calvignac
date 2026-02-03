// Script pour extraire et afficher toutes les données de fiscal_history
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fgqimtpjjhdqeyyaptoj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncWltdHBqamhkcWV5eWFwdG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTU0MjQsImV4cCI6MjA4MzczMTQyNH0.fOuYg0COYts7XXWxgB7AM01Fg6P86f8oz8XVpGdIaNM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function extractFiscalData() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 EXTRACTION COMPLÈTE - TABLE fiscal_history');
    console.log('═══════════════════════════════════════════════════════\n');
    
    try {
        // Récupérer TOUTES les données
        const { data: records, error } = await supabase
            .from('fiscal_history')
            .select('*')
            .order('year', { ascending: false })
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Erreur lors de la récupération:', error.message);
            return;
        }
        
        if (!records || records.length === 0) {
            console.log('⚠️  AUCUNE DONNÉE TROUVÉE dans fiscal_history\n');
            console.log('Causes possibles:');
            console.log('  1. Vous n\'avez jamais cliqué sur "💾 Sauvegarder" dans l\'onglet Fiscalité');
            console.log('  2. Vous n\'étiez pas connecté lors de la tentative de sauvegarde');
            console.log('  3. Une erreur s\'est produite lors de la sauvegarde (vérifier la console)');
            console.log('  4. Les données sont dans une autre table ou dans localStorage uniquement\n');
            return;
        }
        
        console.log(`✅ ${records.length} ENREGISTREMENT(S) TROUVÉ(S)\n`);
        console.log('═══════════════════════════════════════════════════════\n');
        
        records.forEach((record, index) => {
            console.log(`\n┌─────────────────────────────────────────────────────────┐`);
            console.log(`│ ENREGISTREMENT #${index + 1}`);
            console.log(`└─────────────────────────────────────────────────────────┘`);
            
            // 📋 INFORMATIONS PRINCIPALES
            console.log('\n📋 INFORMATIONS PRINCIPALES:');
            console.log('─'.repeat(60));
            console.log(`  ID:              ${record.id}`);
            console.log(`  Propriétaire:    ${record.owner_user_id}`);
            console.log(`  Année:           ${record.year}`);
            console.log(`  Gîte:            ${record.gite}`);
            console.log(`  Revenus:         ${record.revenus} €`);
            console.log(`  Charges:         ${record.charges} €`);
            console.log(`  Résultat:        ${record.resultat} €`);
            console.log(`  Taux occupation: ${record.taux_occupation}%`);
            console.log(`  Nb réservations: ${record.nb_reservations}`);
            console.log(`  Créé le:         ${new Date(record.created_at).toLocaleString('fr-FR')}`);
            console.log(`  Mis à jour le:   ${new Date(record.updated_at).toLocaleString('fr-FR')}`);
            
            // 📦 DONNÉES DÉTAILLÉES (JSONB)
            if (record.donnees_detaillees && Object.keys(record.donnees_detaillees).length > 0) {
                console.log('\n📦 DONNÉES DÉTAILLÉES (JSONB):');
                console.log('─'.repeat(60));
                
                const details = record.donnees_detaillees;
                
                // Chiffre d'affaires
                if (details.chiffre_affaires !== undefined) {
                    console.log(`  💰 Chiffre d'affaires:  ${details.chiffre_affaires} €`);
                }
                
                // Résultats calculés
                if (details.benefice_imposable !== undefined) {
                    console.log(`  📊 Bénéfice imposable:  ${details.benefice_imposable} €`);
                }
                if (details.cotisations_urssaf !== undefined) {
                    console.log(`  🏢 Cotisations URSSAF:  ${details.cotisations_urssaf} €`);
                }
                if (details.reste_avant_ir !== undefined) {
                    console.log(`  💵 Reste avant IR:      ${details.reste_avant_ir} €`);
                }
                if (details.impot_revenu !== undefined) {
                    console.log(`  🧾 Impôt sur le revenu: ${details.impot_revenu} €`);
                }
                if (details.reste_apres_ir !== undefined) {
                    console.log(`  ✅ Reste après IR:      ${details.reste_apres_ir} €`);
                }
                if (details.trimestres_retraite !== undefined) {
                    console.log(`  👴 Trimestres retraite: ${details.trimestres_retraite}`);
                }
                
                // Charges par gîte
                if (details.charges_gites && Object.keys(details.charges_gites).length > 0) {
                    console.log('\n  🏠 CHARGES PAR GÎTE:');
                    Object.entries(details.charges_gites).forEach(([gite, charges]) => {
                        console.log(`\n    ▸ ${gite.toUpperCase()}:`);
                        Object.entries(charges).forEach(([charge, montant]) => {
                            if (montant > 0) {
                                console.log(`      - ${charge}: ${montant} €`);
                            }
                        });
                    });
                }
                
                // Travaux
                if (details.travaux_liste && details.travaux_liste.length > 0) {
                    console.log('\n  🔧 TRAVAUX:');
                    details.travaux_liste.forEach(t => {
                        console.log(`    - ${t.description}: ${t.montant} €`);
                    });
                }
                
                // Frais divers
                if (details.frais_divers_liste && details.frais_divers_liste.length > 0) {
                    console.log('\n  📝 FRAIS DIVERS:');
                    details.frais_divers_liste.forEach(f => {
                        console.log(`    - ${f.description}: ${f.montant} €`);
                    });
                }
                
                // Produits d'accueil
                if (details.produits_accueil_liste && details.produits_accueil_liste.length > 0) {
                    console.log('\n  🧺 PRODUITS D\'ACCUEIL:');
                    details.produits_accueil_liste.forEach(p => {
                        console.log(`    - ${p.description}: ${p.montant} €`);
                    });
                }
                
                // Résidence principale
                if (details.surface_bureau || details.surface_totale) {
                    console.log('\n  🏡 RÉSIDENCE PRINCIPALE:');
                    if (details.surface_bureau) console.log(`    - Surface bureau: ${details.surface_bureau} m²`);
                    if (details.surface_totale) console.log(`    - Surface totale: ${details.surface_totale} m²`);
                    if (details.interets_residence) console.log(`    - Intérêts emprunt: ${details.interets_residence} € (${details.interets_residence_type})`);
                    if (details.assurance_residence) console.log(`    - Assurance: ${details.assurance_residence} € (${details.assurance_residence_type})`);
                    if (details.electricite_residence) console.log(`    - Électricité: ${details.electricite_residence} € (${details.electricite_residence_type})`);
                    if (details.internet_residence) console.log(`    - Internet: ${details.internet_residence} € (${details.internet_residence_type})`);
                    if (details.eau_residence) console.log(`    - Eau: ${details.eau_residence} € (${details.eau_residence_type})`);
                    if (details.taxe_fonciere_residence) console.log(`    - Taxe foncière: ${details.taxe_fonciere_residence} €`);
                }
                
                // Frais professionnels
                console.log('\n  💼 FRAIS PROFESSIONNELS:');
                if (details.comptable) console.log(`    - Comptable: ${details.comptable} €`);
                if (details.frais_bancaires) console.log(`    - Frais bancaires: ${details.frais_bancaires} €`);
                if (details.telephone) console.log(`    - Téléphone: ${details.telephone} € (${details.telephone_type})`);
                if (details.materiel_info) console.log(`    - Matériel info: ${details.materiel_info} €`);
                if (details.rc_pro) console.log(`    - RC Pro: ${details.rc_pro} €`);
                if (details.formation) console.log(`    - Formation: ${details.formation} €`);
                if (details.fournitures) console.log(`    - Fournitures: ${details.fournitures} € (${details.fournitures_type})`);
                
                // Véhicule
                if (details.km_professionnels || details.montant_frais_km) {
                    console.log('\n  🚗 VÉHICULE:');
                    if (details.vehicule_type) console.log(`    - Type: ${details.vehicule_type}`);
                    if (details.puissance_fiscale) console.log(`    - Puissance fiscale: ${details.puissance_fiscale} CV`);
                    if (details.km_professionnels) console.log(`    - Km professionnels: ${details.km_professionnels} km`);
                    if (details.montant_frais_km) console.log(`    - Montant frais km: ${details.montant_frais_km} €`);
                }
                
                // Impôts sur le revenu
                if (details.salaire_madame || details.salaire_monsieur || details.nombre_enfants) {
                    console.log('\n  👨‍👩‍👧‍👦 FOYER FISCAL:');
                    if (details.salaire_madame) console.log(`    - Salaire Madame: ${details.salaire_madame} €`);
                    if (details.salaire_monsieur) console.log(`    - Salaire Monsieur: ${details.salaire_monsieur} €`);
                    if (details.nombre_enfants) console.log(`    - Nombre d'enfants: ${details.nombre_enfants}`);
                }
                
                // Crédits
                if (details.credits_liste && details.credits_liste.length > 0) {
                    console.log('\n  💳 CRÉDITS:');
                    details.credits_liste.forEach(c => {
                        console.log(`    - ${c.nom}: ${c.mensualite} €/mois (capital restant: ${c.capital} €)`);
                    });
                }
                
                // Crédits personnels (nouveau système)
                if (details.credits_personnels && details.credits_personnels.length > 0) {
                    console.log('\n  💳 CRÉDITS PERSONNELS:');
                    details.credits_personnels.forEach(c => {
                        console.log(`    - ${c.nom}: ${c.mensualite} €/mois`);
                        if (c.capital) console.log(`      Capital restant: ${c.capital} €`);
                    });
                }
                
                // Frais personnels
                if (details.frais_perso_internet || details.frais_perso_electricite) {
                    console.log('\n  🏠 FRAIS PERSONNELS MENSUELS:');
                    if (details.frais_perso_internet) console.log(`    - Internet: ${details.frais_perso_internet} €`);
                    if (details.frais_perso_electricite) console.log(`    - Électricité: ${details.frais_perso_electricite} €`);
                    if (details.frais_perso_eau) console.log(`    - Eau: ${details.frais_perso_eau} €`);
                    if (details.frais_perso_assurance) console.log(`    - Assurance: ${details.frais_perso_assurance} €`);
                    if (details.frais_perso_taxe) console.log(`    - Taxes: ${details.frais_perso_taxe} €`);
                    if (details.frais_perso_autres) console.log(`    - Autres: ${details.frais_perso_autres} €`);
                }
                
                // JSON complet (pour debug)
                console.log('\n  📄 JSON COMPLET:');
                console.log('  ' + JSON.stringify(details, null, 2).split('\n').join('\n  '));
                
            } else {
                console.log('\n⚠️  Aucune donnée détaillée (JSONB vide)');
            }
            
            console.log('\n' + '═'.repeat(60) + '\n');
        });
        
        // Résumé
        console.log('\n📊 RÉSUMÉ:');
        console.log('─'.repeat(60));
        console.log(`  Total enregistrements: ${records.length}`);
        
        const annees = [...new Set(records.map(r => r.year))].sort((a, b) => b - a);
        console.log(`  Années disponibles: ${annees.join(', ')}`);
        
        const gites = [...new Set(records.map(r => r.gite))];
        console.log(`  Gîtes: ${gites.join(', ')}`);
        
        console.log('\n═══════════════════════════════════════════════════════\n');
        
    } catch (error) {
        console.error('💥 ERREUR CRITIQUE:', error);
        console.error('Stack:', error.stack);
    }
}

// Export en fichier JSON
async function exportToJSON() {
    try {
        const { data: records, error } = await supabase
            .from('fiscal_history')
            .select('*')
            .order('year', { ascending: false });
        
        if (error) throw error;
        
        const fs = await import('fs');
        const filename = `fiscal_export_${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(filename, JSON.stringify(records, null, 2));
        console.log(`\n✅ Export JSON créé: ${filename}`);
    } catch (error) {
        console.error('❌ Erreur export JSON:', error.message);
    }
}

// Exécution
const args = process.argv.slice(2);
if (args.includes('--export') || args.includes('-e')) {
    exportToJSON();
} else {
    extractFiscalData();
}
