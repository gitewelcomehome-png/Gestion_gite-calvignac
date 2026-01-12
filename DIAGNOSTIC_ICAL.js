// ================================================================
// DIAGNOSTIC COMPLET IMPORT ICAL
// ================================================================
// Coller ce code dans la console du navigateur
// ================================================================

async function diagnosticIcalImport() {
    console.log('🔍 === DIAGNOSTIC IMPORT ICAL ===\n');
    
    // 1. Vérifier l'authentification
    console.log('1️⃣ Vérification authentification...');
    const { data: userData } = await window.supabaseClient.auth.getUser();
    if (!userData?.user) {
        console.error('❌ PROBLÈME: Utilisateur non connecté');
        return;
    }
    console.log('✅ Utilisateur:', userData.user.email);
    console.log('   User ID:', userData.user.id);
    
    // 2. Vérifier les gîtes
    console.log('\n2️⃣ Vérification gîtes...');
    const gites = await window.gitesManager.getAll();
    console.log(`✅ ${gites.length} gîte(s) trouvé(s):`);
    for (const gite of gites) {
        console.log(`   • ${gite.name} (ID: ${gite.id})`);
        
        // 3. Vérifier les sources iCal
        const icalSources = await window.gitesManager.getIcalSources(gite.id);
        console.log('     Sources iCal:', icalSources);
        
        if (!icalSources || (Array.isArray(icalSources) && icalSources.length === 0) || 
            (typeof icalSources === 'object' && Object.keys(icalSources).length === 0)) {
            console.warn('     ⚠️ Aucune source iCal configurée');
            continue;
        }
        
        // 4. Tester chaque source
        let sources = [];
        if (Array.isArray(icalSources)) {
            sources = icalSources.filter(s => s && s.url);
        } else if (typeof icalSources === 'object') {
            sources = Object.entries(icalSources)
                .filter(([platform, url]) => url && typeof url === 'string')
                .map(([platform, url]) => ({ platform, url }));
        }
        
        for (const source of sources) {
            console.log(`\n     📡 Test ${source.platform}:`);
            console.log(`        URL: ${source.url.substring(0, 50)}...`);
            
            try {
                // Tester la récupération
                const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(source.url)}`);
                if (!response.ok) {
                    console.error(`        ❌ Erreur HTTP ${response.status}`);
                    continue;
                }
                
                const icalText = await response.text();
                console.log(`        ✅ Flux récupéré: ${icalText.length} caractères`);
                
                // Parser le flux
                const jcalData = ICAL.parse(icalText);
                const comp = new ICAL.Component(jcalData);
                const vevents = comp.getAllSubcomponents('vevent');
                
                console.log(`        📅 ${vevents.length} événements dans le flux`);
                
                // Analyser les événements
                let blocked = 0;
                let valid = 0;
                let tooShort = 0;
                
                for (const vevent of vevents) {
                    const event = new ICAL.Event(vevent);
                    const summary = event.summary || '';
                    
                    // Vérifier blocage
                    const blockTerms = ['blocked', 'bloqué', 'not available', 'indisponible'];
                    if (blockTerms.some(term => summary.toLowerCase().includes(term))) {
                        blocked++;
                        continue;
                    }
                    
                    // Vérifier durée
                    const start = event.startDate.toJSDate();
                    const end = event.endDate.toJSDate();
                    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                    
                    if (nights < 2) {
                        tooShort++;
                        continue;
                    }
                    
                    valid++;
                    if (valid <= 3) {
                        console.log(`           • ${summary} (${nights} nuits)`);
                    }
                }
                
                console.log(`        📊 Analyse:`);
                console.log(`           - ${valid} réservations valides`);
                console.log(`           - ${blocked} blocages ignorés`);
                console.log(`           - ${tooShort} trop courtes (< 2 nuits)`);
                
            } catch (error) {
                console.error(`        ❌ Erreur:`, error.message);
            }
        }
    }
    
    // 5. Vérifier les réservations existantes
    console.log('\n5️⃣ Vérification réservations BDD...');
    const { data: reservations, error } = await window.supabaseClient
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
    
    if (error) {
        console.error('❌ Erreur lecture réservations:', error);
    } else {
        console.log(`✅ ${reservations.length} réservation(s) récentes:`);
        reservations.forEach(r => {
            console.log(`   • ${r.client_name} : ${r.check_in} → ${r.check_out}`);
        });
    }
    
    console.log('\n✅ === DIAGNOSTIC TERMINÉ ===');
}

// Lancer le diagnostic
diagnosticIcalImport();
