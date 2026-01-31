// ==========================================
// TAB ADMIN - JAVASCRIPT
// ==========================================

(function() {
    'use strict';

    class AdminManager {
        constructor() {
            this.currentUser = null;
            this.config = this.loadConfig();
        }

        async init() {
            console.log('⚙️ Initialisation Admin Manager...');
            
            // Attendre que Supabase soit prêt
            if (!window.supabaseClient) {
                console.log('⏳ Attente Supabase...');
                setTimeout(() => this.init(), 200);
                return;
            }

            // Charger l'utilisateur
            await this.loadCurrentUser();
            
            // Charger les stats
            await this.loadDashboardStats();
            
            // Charger les gîtes
            await this.loadGites();
            
            // Charger les logs
            await this.loadLogs();
            
            // Charger les dernières synchros
            this.loadSyncInfo();
            
            // Initialiser les événements
            this.initEvents();
            
            console.log('✅ Admin Manager prêt');
        }

        async loadCurrentUser() {
            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (user) {
                    this.currentUser = user;
                    document.getElementById('currentUserEmail').textContent = user.email;
                    document.getElementById('currentUserId').textContent = user.id;
                    
                    // Date de création
                    const memberSince = new Date(user.created_at);
                    document.getElementById('memberSince').textContent = memberSince.toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                }
            } catch (error) {
                console.error('Erreur chargement utilisateur:', error);
            }
        }

        async loadDashboardStats() {
            try {
                const userId = this.currentUser?.id;
                if (!userId) return;

                // Nombre de gîtes
                const { data: gites, error: gitesError } = await window.supabaseClient
                    .from('gites')
                    .select('id', { count: 'exact' })
                    .eq('owner_user_id', userId);
                
                if (!gitesError) {
                    document.getElementById('totalGites').textContent = gites?.length || 0;
                }

                // Nombre de réservations actives
                const today = new Date().toISOString().split('T')[0];
                const { data: reservations, error: resError } = await window.supabaseClient
                    .from('reservations')
                    .select('id', { count: 'exact' })
                    .eq('owner_user_id', userId)
                    .gte('check_out', today);
                
                if (!resError) {
                    document.getElementById('totalReservations').textContent = reservations?.length || 0;
                }

                // Nombre de ménages planifiés
                const { data: cleanings, error: cleanError } = await window.supabaseClient
                    .from('cleaning_schedule')
                    .select('id', { count: 'exact' })
                    .eq('owner_user_id', userId)
                    .eq('statut', 'en_attente');
                
                if (!cleanError) {
                    document.getElementById('totalNettoyages').textContent = cleanings?.length || 0;
                }

                // Chiffre d'affaires du mois
                const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
                
                const { data: monthlyRes, error: monthlyError } = await window.supabaseClient
                    .from('reservations')
                    .select('total_price')
                    .eq('owner_user_id', userId)
                    .gte('check_in', firstDayOfMonth)
                    .lte('check_in', lastDayOfMonth);
                
                if (!monthlyError && monthlyRes) {
                    const total = monthlyRes.reduce((sum, res) => sum + (parseFloat(res.total_price) || 0), 0);
                    document.getElementById('totalRevenue').textContent = new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'EUR'
                    }).format(total);
                }

            } catch (error) {
                console.error('Erreur chargement stats:', error);
            }
        }

        async loadGites() {
            try {
                const userId = this.currentUser?.id;
                if (!userId) return;

                const { data: gites, error } = await window.supabaseClient
                    .from('gites')
                    .select('*')
                    .eq('owner_user_id', userId)
                    .order('nom', { ascending: true });

                if (error) throw error;

                const tbody = document.getElementById('gitesTableBody');
                
                if (!gites || gites.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                                Aucun gîte configuré
                            </td>
                        </tr>
                    `;
                    return;
                }

                tbody.innerHTML = gites.map(gite => `
                    <tr>
                        <td><strong>${gite.nom}</strong></td>
                        <td>${gite.capacite || '-'} pers.</td>
                        <td>${gite.adresse || '-'}</td>
                        <td>
                            <div style="width: 30px; height: 30px; background: ${gite.couleur || '#667eea'}; border-radius: 4px;"></div>
                        </td>
                        <td>
                            <button class="btn-secondary" style="padding: 6px 12px; font-size: 0.9rem;" onclick="window.adminManager.editGite('${gite.id}')">
                                <i data-lucide="edit"></i> Modifier
                            </button>
                        </td>
                    </tr>
                `).join('');

                // Réinitialiser les icônes Lucide
                if (window.lucide) {
                    window.lucide.createIcons();
                }

            } catch (error) {
                console.error('Erreur chargement gîtes:', error);
            }
        }

        async loadLogs() {
            const logsContainer = document.getElementById('logsContainer');
            
            // Logs simulés pour l'exemple
            const logs = [
                { type: 'success', time: new Date(), message: 'Synchronisation iCal réussie - Trévoux' },
                { type: 'info', time: new Date(Date.now() - 3600000), message: 'Nouvelle réservation ajoutée' },
                { type: 'warning', time: new Date(Date.now() - 7200000), message: 'Ménage en retard - Couzon' },
                { type: 'error', time: new Date(Date.now() - 10800000), message: 'Échec synchronisation Booking' }
            ];

            logsContainer.innerHTML = logs.map(log => `
                <div class="log-entry ${log.type}">
                    <strong>[${log.time.toLocaleTimeString('fr-FR')}]</strong> ${log.message}
                </div>
            `).join('');
        }

        loadSyncInfo() {
            const now = new Date();
            const nextSync = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // +3h
            
            document.getElementById('lastSyncDate').textContent = now.toLocaleString('fr-FR');
            document.getElementById('nextSyncDate').textContent = nextSync.toLocaleString('fr-FR');
        }

        initEvents() {
            // Form ajout gîte
            const addGiteForm = document.getElementById('addGiteForm');
            if (addGiteForm) {
                addGiteForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addNewGite();
                });
            }

            // Sauvegarde auto de la config
            ['enableNotifications', 'enableAutoSync', 'enableCleaningReminders'].forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox) {
                    checkbox.addEventListener('change', () => {
                        this.config[id] = checkbox.checked;
                        this.saveConfigToStorage();
                    });
                }
            });

            const syncFrequency = document.getElementById('syncFrequency');
            if (syncFrequency) {
                syncFrequency.addEventListener('change', () => {
                    this.config.syncFrequency = syncFrequency.value;
                    this.saveConfigToStorage();
                });
            }
        }

        showAddGiteModal() {
            document.getElementById('addGiteModal').style.display = 'flex';
        }

        closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        async addNewGite() {
            try {
                const name = document.getElementById('newGiteName').value.trim();
                const capacity = parseInt(document.getElementById('newGiteCapacity').value);
                const address = document.getElementById('newGiteAddress').value.trim();
                const color = document.getElementById('newGiteColor').value;

                if (!name) {
                    alert('Le nom du gîte est obligatoire');
                    return;
                }

                const userId = this.currentUser?.id;
                if (!userId) {
                    alert('Utilisateur non authentifié');
                    return;
                }

                const { data, error } = await window.supabaseClient
                    .from('gites')
                    .insert({
                        nom: name,
                        owner_user_id: userId,
                        capacite: capacity,
                        adresse: address,
                        couleur: color
                    })
                    .select();

                if (error) throw error;

                alert('✅ Gîte ajouté avec succès !');
                this.closeModal('addGiteModal');
                
                // Recharger la liste
                await this.loadGites();
                await this.loadDashboardStats();

                // Réinitialiser le formulaire
                document.getElementById('addGiteForm').reset();

            } catch (error) {
                console.error('Erreur ajout gîte:', error);
                alert('❌ Erreur lors de l\'ajout du gîte');
            }
        }

        async syncAllICal() {
            if (confirm('Lancer la synchronisation de tous les calendriers iCal ?')) {
                alert('🔄 Synchronisation en cours...\n\nCette fonctionnalité sera disponible prochainement.');
                // TODO: Implémenter la synchro iCal
            }
        }

        saveConfig() {
            this.saveConfigToStorage();
            alert('✅ Configuration enregistrée avec succès !');
        }

        loadConfig() {
            const savedConfig = localStorage.getItem('adminConfig');
            return savedConfig ? JSON.parse(savedConfig) : {
                enableNotifications: true,
                enableAutoSync: true,
                enableCleaningReminders: true,
                syncFrequency: '3'
            };
        }

        saveConfigToStorage() {
            localStorage.setItem('adminConfig', JSON.stringify(this.config));
        }

        async cleanOldReservations() {
            if (confirm('Supprimer les réservations de plus de 1 an ?')) {
                try {
                    const oneYearAgo = new Date();
                    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                    const dateLimit = oneYearAgo.toISOString().split('T')[0];

                    const { error } = await window.supabaseClient
                        .from('reservations')
                        .delete()
                        .eq('owner_user_id', this.currentUser?.id)
                        .lt('check_out', dateLimit);

                    if (error) throw error;

                    alert('✅ Anciennes réservations supprimées');
                    await this.loadDashboardStats();
                } catch (error) {
                    console.error('Erreur nettoyage:', error);
                    alert('❌ Erreur lors du nettoyage');
                }
            }
        }

        optimizeDatabase() {
            alert('🚀 Optimisation de la base de données...\n\nCette fonctionnalité sera disponible prochainement.');
        }

        async exportData() {
            if (confirm('Exporter toutes vos données ?')) {
                alert('📦 Export en cours...\n\nCette fonctionnalité sera disponible prochainement.');
                // TODO: Implémenter l'export des données
            }
        }

        async resetAllData() {
            const confirmation = prompt('⚠️ ATTENTION : Cette action est IRRÉVERSIBLE !\n\nToutes vos données seront supprimées.\n\nPour confirmer, tapez "SUPPRIMER"');
            
            if (confirmation === 'SUPPRIMER') {
                alert('❌ Fonctionnalité désactivée pour la sécurité.\n\nContactez le support pour une réinitialisation complète.');
            }
        }

        editGite(giteId) {
            alert(`Édition du gîte ${giteId}\n\nCette fonctionnalité sera disponible prochainement.`);
            // TODO: Implémenter l'édition de gîte
        }
    }

    // Initialiser au chargement
    window.adminManager = new AdminManager();

    // Init quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.currentTab === 'admin') {
                window.adminManager.init();
            }
        });
    } else {
        if (window.currentTab === 'admin') {
            window.adminManager.init();
        }
    }

    // Init quand on arrive sur l'onglet
    document.addEventListener('tabSwitched', (e) => {
        if (e.detail === 'admin') {
            window.adminManager.init();
        }
    });

})();
