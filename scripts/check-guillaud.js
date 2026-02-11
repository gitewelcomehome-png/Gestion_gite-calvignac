// Script pour vérifier l'état de la réservation Marie-Pierre Guillaud
const SUPABASE_URL = 'https://uxmhfbxurzoczmxgvqgb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4bWhmanh1cnpvY3pteGd2cWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDM0OTYwNzIsImV4cCI6MjAxOTA3MjA3Mn0.4xKf_fHZgUwFQH-CnEu6J4tRzqQDu4d9x9TLBLkDVmM';

import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(({ createClient }) => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    return checkGuillaud(supabase);
});

async function checkGuillaud(supabase) {

async function checkGuillaud() {
    console.log('🔍 Recherche de Marie-Pierre Guillaud...\n');
    
    // Rechercher toutes les réservations Guillaud
    const { data: reservations, error } = await supabase
        .from('reservations')
        .select(`
            id,
            client_name,
            check_in,
            check_out,
            status,
            ical_uid,
            synced_from,
            manual_override,
            last_seen_in_ical,
            gite_id,
            gites(name)
        `)
        .ilike('client_name', '%guillaud%')
        .gte('check_out', new Date().toISOString().split('T')[0])
        .order('check_in', { ascending: true });
    
    if (error) {
        console.error('❌ Erreur:', error);
        return;
    }
    
    console.log(`📊 ${reservations.length} réservation(s) Guillaud trouvée(s):\n`);
    
    reservations.forEach((r, i) => {
        console.log(`[${i+1}] ${r.client_name}`);
        console.log(`    Gîte: ${r.gites?.name || 'N/A'}`);
        console.log(`    Dates: ${r.check_in} → ${r.check_out}`);
        console.log(`    Status: ${r.status}`);
        console.log(`    Synced from: ${r.synced_from || 'N/A'}`);
        console.log(`    Manual override: ${r.manual_override}`);
        console.log(`    UID: ${r.ical_uid || 'N/A'}`);
        console.log(`    Last seen: ${r.last_seen_in_ical || 'JAMAIS VU'}`);
        console.log('');
    });
    
    // Vérifier toutes les réservations futures avec leur statut sync
    console.log('\n📋 Toutes les réservations futures (avec ical_uid):\n');
    
    const { data: allReservations, error: error2 } = await supabase
        .from('reservations')
        .select(`
            id,
            client_name,
            check_in,
            check_out,
            status,
            synced_from,
            last_seen_in_ical,
            gites(name)
        `)
        .not('ical_uid', 'is', null)
        .gte('check_out', new Date().toISOString().split('T')[0])
        .order('check_in', { ascending: true });
    
    if (error2) {
        console.error('❌ Erreur:', error2);
        return;
    }
    
    allReservations.forEach(r => {
        const now = new Date();
        const lastSeen = r.last_seen_in_ical ? new Date(r.last_seen_in_ical) : null;
        let syncStatus = '⚠️ JAMAIS VU';
        
        if (lastSeen) {
            const diffMs = now - lastSeen;
            const diffHours = diffMs / (1000 * 60 * 60);
            const diffDays = diffHours / 24;
            
            if (diffHours < 1) syncStatus = '✅ Récent (<1h)';
            else if (diffDays < 1) syncStatus = '🟡 < 1 jour';
            else if (diffDays < 7) syncStatus = '🟠 < 7 jours';
            else syncStatus = '🔴 > 7 jours (PROBABLEMENT ANNULÉE)';
        }
        
        console.log(`${r.gites?.name || 'N/A'} | ${r.client_name} | ${r.check_in} → ${r.check_out} | ${r.status} | ${r.synced_from || 'N/A'} | ${syncStatus}`);
    });
}

checkGuillaud();
