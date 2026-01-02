// Script pour vérifier les données IR dans Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your-key';

async function checkIR() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔍 Vérification des données IR dans la base...\n');
    
    // Récupérer 2025 et 2026
    const { data: sim2025 } = await supabase
        .from('simulations_fiscales')
        .select('*')
        .eq('annee', 2025)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    const { data: sim2026 } = await supabase
        .from('simulations_fiscales')
        .select('*')
        .eq('annee', 2026)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    
    console.log('📊 Simulation 2025:');
    if (sim2025) {
        console.log(`  - Bénéfice: ${sim2025.benefice_imposable}€`);
        console.log(`  - URSSAF: ${sim2025.cotisations_urssaf}€`);
        console.log(`  - IR: ${sim2025.impot_revenu}€`);
        console.log(`  - Salaire Madame: ${sim2025.salaire_madame}€`);
        console.log(`  - Salaire Monsieur: ${sim2025.salaire_monsieur}€`);
        console.log(`  - Enfants: ${sim2025.nombre_enfants}`);
    } else {
        console.log('  ❌ Aucune simulation trouvée');
    }
    
    console.log('\n📊 Simulation 2026:');
    if (sim2026) {
        console.log(`  - Bénéfice: ${sim2026.benefice_imposable}€`);
        console.log(`  - URSSAF: ${sim2026.cotisations_urssaf}€`);
        console.log(`  - IR: ${sim2026.impot_revenu}€`);
        console.log(`  - Salaire Madame: ${sim2026.salaire_madame}€`);
        console.log(`  - Salaire Monsieur: ${sim2026.salaire_monsieur}€`);
        console.log(`  - Enfants: ${sim2026.nombre_enfants}`);
    } else {
        console.log('  ❌ Aucune simulation trouvée');
    }
}

checkIR();
