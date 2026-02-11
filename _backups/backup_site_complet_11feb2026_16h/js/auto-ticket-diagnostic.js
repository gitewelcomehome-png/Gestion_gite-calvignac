// ================================================================
// 🔍 DIAGNOSTIC AUTO-TICKET SYSTEM
// ================================================================
// Script pour diagnostiquer et tester le système de ticketing
// ================================================================

window.diagAutoTicket = {
    /**
     * Vérifier l'état complet du système
     */
    async checkStatus() {
        console.log('🔍 === DIAGNOSTIC AUTO-TICKET SYSTEM ===\n');
        
        const checks = {
            supabase: false,
            autoTicketSystem: false,
            realtimeEnabled: false,
            tablesExist: false,
            emailConfigured: false,
            errorsInDB: 0,
            ticketsInDB: 0
        };
        
        // 1. Vérifier Supabase
        console.log('1️⃣ Supabase Client...');
        if (window.supabaseClient) {
            checks.supabase = true;
            console.log('   ✅ Supabase disponible');
        } else {
            console.log('   ❌ Supabase NON disponible');
            return checks;
        }
        
        // 2. Vérifier Auto-Ticket System
        console.log('\n2️⃣ Auto-Ticket System...');
        if (window.autoTicketSystemInstance) {
            checks.autoTicketSystem = true;
            console.log('   ✅ Instance active');
            console.log('   📊 Seuil:', window.autoTicketSystemInstance.config.autoCreateTicketThreshold, 'occurrences');
            console.log('   🎫 Tickets actifs:', window.autoTicketSystemInstance.activeTickets.size);
        } else {
            console.log('   ❌ Instance NON créée');
            console.log('   💡 Essayez: window.autoTicketSystemInstance = new AutoTicketSystem(); await window.autoTicketSystemInstance.init();');
        }
        
        // 3. Vérifier les tables
        console.log('\n3️⃣ Tables BDD...');
        try {
            const { data: tickets, error: ticketError } = await window.supabaseClient
                .from('cm_support_tickets')
                .select('*')
                .limit(1);
            
            if (!ticketError) {
                checks.tablesExist = true;
                console.log('   ✅ cm_support_tickets existe');
            } else {
                console.log('   ❌ cm_support_tickets:', ticketError.message);
            }
            
            const { data: history } = await window.supabaseClient
                .from('cm_support_ticket_history')
                .select('*')
                .limit(1);
            
            console.log('   ✅ cm_support_ticket_history existe');
            
            const { data: corrections } = await window.supabaseClient
                .from('cm_error_corrections')
                .select('*')
                .limit(1);
            
            console.log('   ✅ cm_error_corrections existe');
            
        } catch (err) {
            console.log('   ❌ Erreur tables:', err.message);
        }
        
        // 4. Compter les erreurs non résolues
        console.log('\n4️⃣ Erreurs dans BDD...');
        const { data: errors, error: errorQuery } = await window.supabaseClient
            .from('cm_error_logs')
            .select('*')
            .eq('resolved', false);
        
        if (errors) {
            checks.errorsInDB = errors.length;
            console.log('   📊', errors.length, 'erreur(s) non résolue(s)');
            
            // Grouper par signature
            const grouped = {};
            errors.forEach(err => {
                const sig = `${err.source}|${err.message}`;
                grouped[sig] = (grouped[sig] || 0) + 1;
            });
            
            Object.entries(grouped).forEach(([sig, count]) => {
                const [source, msg] = sig.split('|');
                console.log(`   ${count >= 3 ? '🎫' : '  '} ${count}x - ${source}: ${msg.substring(0, 50)}...`);
            });
        }
        
        // 5. Compter les tickets
        console.log('\n5️⃣ Tickets support...');
        const { data: allTickets } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('*');
        
        if (allTickets) {
            checks.ticketsInDB = allTickets.length;
            console.log('   📊', allTickets.length, 'ticket(s) total');
            
            const autoTickets = allTickets.filter(t => t.source === 'auto_detection');
            console.log('   🤖', autoTickets.length, 'ticket(s) auto-créé(s)');
            
            const openTickets = allTickets.filter(t => t.status !== 'closed');
            console.log('   🟢', openTickets.length, 'ticket(s) ouvert(s)');
        }
        
        // 6. Vérifier Realtime
        console.log('\n6️⃣ Supabase Realtime...');
        console.log('   ℹ️  Pour activer Realtime:');
        console.log('   1. Supabase Dashboard > Settings > API');
        console.log('   2. Realtime > Enable');
        console.log('   3. Ajouter table: cm_error_logs');
        
        // 7. Vérifier email
        console.log('\n7️⃣ Configuration Email...');
        if (typeof process !== 'undefined' && process.env?.SMTP_HOST) {
            checks.emailConfigured = true;
            console.log('   ✅ Variables SMTP configurées');
        } else {
            console.log('   ⚠️  Variables SMTP non visibles (backend only)');
            console.log('   💡 Vérifier fichier .env à la racine');
        }
        
        // Résumé
        console.log('\n📊 === RÉSUMÉ ===');
        console.log('Supabase:', checks.supabase ? '✅' : '❌');
        console.log('Auto-Ticket:', checks.autoTicketSystem ? '✅' : '❌');
        console.log('Tables:', checks.tablesExist ? '✅' : '❌');
        console.log('Erreurs non résolues:', checks.errorsInDB);
        console.log('Tickets créés:', checks.ticketsInDB);
        
        return checks;
    },
    
    /**
     * Forcer la création d'un ticket pour une erreur
     */
    async forceCreateTicket(errorId) {
        console.log('🎫 Création forcée d\'un ticket pour erreur #' + errorId);
        
        if (!window.autoTicketSystemInstance) {
            console.error('❌ Auto-Ticket System non initialisé');
            return;
        }
        
        // Récupérer l'erreur
        const { data: error, error: fetchError } = await window.supabaseClient
            .from('cm_error_logs')
            .select('*')
            .eq('id', errorId)
            .single();
        
        if (fetchError || !error) {
            console.error('❌ Erreur non trouvée:', fetchError);
            return;
        }
        
        console.log('📝 Erreur:', error.message);
        
        // Créer le ticket
        const ticket = await window.autoTicketSystemInstance.createAutoTicket(error);
        
        if (ticket) {
            console.log('✅ Ticket créé :', ticket.id);
            console.log('📧 Email envoyé à:', ticket.client_email);
            return ticket;
        } else {
            console.log('❌ Échec création ticket');
        }
    },
    
    /**
     * Tester le système avec une erreur de test
     */
    async testSystem() {
        console.log('🧪 === TEST AUTO-TICKET SYSTEM ===\n');
        
        console.log('1️⃣ Création de 3 erreurs similaires...');
        
        // Créer 3 erreurs de test
        const testError = {
            error_type: 'test',
            source: 'auto-ticket-test.js',
            message: 'Erreur de test pour système de ticketing automatique',
            stack_trace: 'Test stack trace',
            resolved: false,
            metadata: {
                test: true,
                timestamp: new Date().toISOString()
            }
        };
        
        const errorIds = [];
        
        for (let i = 0; i < 3; i++) {
            const { data, error } = await window.supabaseClient
                .from('cm_error_logs')
                .insert({
                    ...testError,
                    timestamp: new Date().toISOString()
                })
                .select()
                .single();
            
            if (data) {
                errorIds.push(data.id);
                console.log(`   ✅ Erreur ${i+1}/3 créée: ${data.id}`);
            }
        }
        
        console.log('\n2️⃣ Attente du déclenchement automatique...');
        console.log('   ⏳ Le système Realtime devrait détecter les INSERTs');
        console.log('   ⏳ Si seuil atteint (3+) → Ticket auto-créé');
        console.log('\n   💡 Vérifiez la console dans 2-3 secondes');
        console.log('   💡 Vérifiez aussi cm_support_tickets dans Supabase');
        
        // Attendre un peu
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('\n3️⃣ Vérification...');
        
        // Chercher ticket créé
        const signature = 'auto-ticket-test.js|Erreur de test pour système de ticketing automatique|N/A';
        const { data: ticket } = await window.supabaseClient
            .from('cm_support_tickets')
            .select('*')
            .eq('error_signature', signature)
            .single();
        
        if (ticket) {
            console.log('✅ SUCCÈS ! Ticket créé automatiquement');
            console.log('   ID:', ticket.id);
            console.log('   Status:', ticket.status);
            console.log('   Email:', ticket.client_email);
        } else {
            console.log('⚠️  Pas de ticket créé automatiquement');
            console.log('   💡 Causes possibles:');
            console.log('   - Realtime non activé dans Supabase');
            console.log('   - Auto-Ticket System non initialisé');
            console.log('   - Seuil non atteint');
            console.log('\n   🔧 Test manuel:');
            console.log('   await diagAutoTicket.forceCreateTicket("' + errorIds[0] + '")');
        }
        
        // Nettoyer
        console.log('\n4️⃣ Nettoyage...');
        await window.supabaseClient
            .from('cm_error_logs')
            .delete()
            .in('id', errorIds);
        console.log('   ✅ Erreurs de test supprimées');
        
        if (ticket) {
            await window.supabaseClient
                .from('cm_support_tickets')
                .delete()
                .eq('id', ticket.id);
            console.log('   ✅ Ticket de test supprimé');
        }
        
        console.log('\n✅ Test terminé !');
    },
    
    /**
     * Réinitialiser le système
     */
    async reinit() {
        console.log('🔄 Réinitialisation Auto-Ticket System...');
        
        if (window.autoTicketSystemInstance) {
            console.log('   ℹ️  Instance existante supprimée');
            delete window.autoTicketSystemInstance;
        }
        
        if (window.AutoTicketSystem) {
            window.autoTicketSystemInstance = new AutoTicketSystem();
            await window.autoTicketSystemInstance.init();
            console.log('   ✅ Nouvelle instance créée et initialisée');
        } else {
            console.log('   ❌ Classe AutoTicketSystem non chargée');
            console.log('   💡 Vérifiez que auto-ticket-system.js est bien chargé');
        }
    },
    
    /**
     * Guide de dépannage
     */
    troubleshoot() {
        console.log('🔧 === GUIDE DE DÉPANNAGE ===\n');
        
        console.log('❌ PROBLÈME: Pas de ticket créé automatiquement');
        console.log('\n📝 SOLUTIONS:');
        console.log('\n1️⃣ Vérifier que les tables existent:');
        console.log('   Exécuter: sql/create_auto_ticket_tables.sql dans Supabase');
        
        console.log('\n2️⃣ Vérifier Realtime Supabase:');
        console.log('   - Dashboard Supabase > Settings > API > Realtime');
        console.log('   - Enable Realtime');
        console.log('   - Ajouter table: cm_error_logs');
        
        console.log('\n3️⃣ Vérifier initialisation:');
        console.log('   await diagAutoTicket.checkStatus()');
        
        console.log('\n4️⃣ Réinitialiser:');
        console.log('   await diagAutoTicket.reinit()');
        
        console.log('\n5️⃣ Test complet:');
        console.log('   await diagAutoTicket.testSystem()');
        
        console.log('\n6️⃣ Création manuelle:');
        console.log('   await diagAutoTicket.forceCreateTicket("error-id-here")');
        
        console.log('\n❌ PROBLÈME: Pas d\'email reçu');
        console.log('\n📝 SOLUTIONS:');
        console.log('   - Vérifier fichier .env à la racine');
        console.log('   - Variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
        console.log('   - Tester: curl -X POST http://localhost:3000/api/send-email ...');
        console.log('   - Vérifier dossier spam');
    }
};

// Diagnostic disponible silencieusement
// Tapez diagAutoTicket dans la console pour voir les commandes
