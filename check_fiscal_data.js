// Script pour vérifier les données fiscales en BDD
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fgqimtpjjhdqeyyaptoj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncWltdHBqamhkcWV5eWFwdG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTU0MjQsImV4cCI6MjA4MzczMTQyNH0.fOuYg0COYts7XXWxgB7AM01Fg6P86f8oz8XVpGdIaNM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFiscalData() {
    console.log('🔍 Recherche des données fiscales...\n');
    
    // 1. Table fiscal_history
    console.log('📊 Table: fiscal_history');
    const { data: fiscalHistory, error: e1 } = await supabase
        .from('fiscal_history')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (e1) {
        console.log('❌ Erreur:', e1.message);
    } else if (fiscalHistory && fiscalHistory.length > 0) {
        console.log(`✅ ${fiscalHistory.length} enregistrement(s) trouvé(s)`);
        fiscalHistory.forEach((record, i) => {
            console.log(`\n  [${i + 1}] Année: ${record.year}`);
            console.log(`      ID: ${record.id}`);
            console.log(`      Créé le: ${new Date(record.created_at).toLocaleString('fr-FR')}`);
            if (record.donnees_detaillees) {
                const details = record.donnees_detaillees;
                console.log(`      CA: ${details.ca || 'N/A'}`);
                console.log(`      Gîtes avec données: ${Object.keys(details.gites || {}).join(', ')}`);
            }
        });
    } else {
        console.log('⚠️  Aucune donnée trouvée');
    }
    
    // 2. Table fiscalite_amortissements
    console.log('\n\n📊 Table: fiscalite_amortissements');
    const { data: amortissements, error: e2 } = await supabase
        .from('fiscalite_amortissements')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (e2) {
        console.log('❌ Erreur:', e2.message);
    } else if (amortissements && amortissements.length > 0) {
        console.log(`✅ ${amortissements.length} amortissement(s) trouvé(s)`);
        amortissements.forEach((record, i) => {
            console.log(`\n  [${i + 1}] ${record.designation || 'Sans nom'}`);
            console.log(`      Montant: ${record.montant_ht || record.montant} €`);
            console.log(`      Durée: ${record.duree_annees} ans`);
            console.log(`      Gîte: ${record.gite_slug || 'Non spécifié'}`);
        });
    } else {
        console.log('⚠️  Aucune donnée trouvée');
    }
    
    // 3. Table suivi_soldes_bancaires
    console.log('\n\n📊 Table: suivi_soldes_bancaires');
    const { data: soldes, error: e3 } = await supabase
        .from('suivi_soldes_bancaires')
        .select('*')
        .order('date', { ascending: false })
        .limit(10);
    
    if (e3) {
        console.log('❌ Erreur:', e3.message);
    } else if (soldes && soldes.length > 0) {
        console.log(`✅ ${soldes.length} solde(s) trouvé(s) (10 derniers)`);
        soldes.forEach((record, i) => {
            console.log(`\n  [${i + 1}] ${record.date}`);
            console.log(`      Solde: ${record.solde} €`);
            console.log(`      Type: ${record.type_compte || 'N/A'}`);
        });
    } else {
        console.log('⚠️  Aucune donnée trouvée');
    }
    
    // 4. Informations fiscales dans table gites
    console.log('\n\n📊 Colonnes fiscales dans table: gites');
    const { data: gites, error: e4 } = await supabase
        .from('gites')
        .select('id, name, fiscal_data, metadata')
        .eq('is_active', true);
    
    if (e4) {
        console.log('❌ Erreur:', e4.message);
    } else if (gites && gites.length > 0) {
        console.log(`✅ ${gites.length} gîte(s) actif(s)`);
        gites.forEach((gite, i) => {
            console.log(`\n  [${i + 1}] ${gite.name}`);
            console.log(`      ID: ${gite.id}`);
            if (gite.fiscal_data) {
                console.log(`      Données fiscales: ✓`);
                console.log(`      ${JSON.stringify(gite.fiscal_data, null, 2)}`);
            } else {
                console.log(`      Données fiscales: ✗`);
            }
            if (gite.metadata) {
                console.log(`      Metadata: ${JSON.stringify(gite.metadata, null, 2)}`);
            }
        });
    } else {
        console.log('⚠️  Aucun gîte trouvé');
    }
}

checkFiscalData().catch(console.error);
