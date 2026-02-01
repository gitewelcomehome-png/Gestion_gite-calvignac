// Script pour vérifier les stratégies en base de données
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ivqiisnudabxemcxxyru.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cWlpc251ZGFieGVtY3h4eXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0ODQyMjUsImV4cCI6MjA1MTA2MDIyNX0.mL4r-9BScx0rvEjJTlNQyA6UdsgfFLXkBi_I1Kt9mVk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStrategies() {
    console.log('🔍 Vérification des données en base...\n');
    
    // 1. Stratégies
    const { data: strategies, error: stratErr } = await supabase
        .from('cm_ai_strategies')
        .select('*')
        .order('semaine', { ascending: true });
    
    console.log('📋 STRATÉGIES:');
    if (stratErr) {
        console.log('  ❌ Erreur:', stratErr.message);
    } else if (!strategies || strategies.length === 0) {
        console.log('  ⚠️ Aucune stratégie en base');
    } else {
        console.log(`  ✅ ${strategies.length} stratégie(s) trouvée(s):`);
        strategies.forEach(s => {
            console.log(`     - Semaine ${s.semaine}/${s.annee}: ${s.objectif} (${s.statut})`);
        });
    }
    
    console.log('\n📅 PUBLICATIONS PROGRAMMÉES:');
    const { data: queue, error: queueErr } = await supabase
        .from('cm_ai_content_queue')
        .select('*')
        .order('scheduled_date', { ascending: true });
    
    if (queueErr) {
        console.log('  ❌ Erreur:', queueErr.message);
    } else if (!queue || queue.length === 0) {
        console.log('  ⚠️ Aucune publication programmée');
    } else {
        console.log(`  ✅ ${queue.length} publication(s):`);
        queue.forEach(q => {
            console.log(`     - ${q.type} (${q.plateforme}): ${q.sujet.substring(0, 50)}... [${q.statut}]`);
        });
    }
    
    console.log('\n⚡ ACTIONS PROPOSÉES:');
    const { data: actions, error: actErr } = await supabase
        .from('cm_ai_actions')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (actErr) {
        console.log('  ❌ Erreur:', actErr.message);
    } else if (!actions || actions.length === 0) {
        console.log('  ⚠️ Aucune action proposée');
    } else {
        console.log(`  ✅ ${actions.length} action(s):`);
        actions.forEach(a => {
            console.log(`     - ${a.titre} [${a.statut}]`);
        });
    }
}

checkStrategies().then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
}).catch(err => {
    console.error('❌ Erreur:', err);
    process.exit(1);
});
