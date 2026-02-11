/**
 * Système de remplissage automatique des tarifs - v2.0
 * Avec détection automatique des jours fériés et vacances scolaires
 * Optimisations performances : logs console minimisés
 */

(function() {
    'use strict';

    // ============================================================================
    // DONNÉES JOURS FÉRIÉS ET VACANCES 2026
    // ============================================================================

    /**
     * Jours fériés français 2026
     */
    const JOURS_FERIES_2026 = [
        { date: '2026-01-01', nom: 'Jour de l\'an' },
        { date: '2026-04-06', nom: 'Lundi de Pâques' },
        { date: '2026-05-01', nom: 'Fête du Travail' },
        { date: '2026-05-08', nom: 'Victoire 1945' },
        { date: '2026-05-14', nom: 'Ascension' },
        { date: '2026-05-25', nom: 'Lundi de Pentecôte' },
        { date: '2026-07-14', nom: 'Fête Nationale' },
        { date: '2026-08-15', nom: 'Assomption' },
        { date: '2026-11-01', nom: 'Toussaint' },
        { date: '2026-11-11', nom: 'Armistice 1918' },
        { date: '2026-12-25', nom: 'Noël' }
    ];

    /**
     * Vacances scolaires Zone C (Toulouse) 2025-2026
     */
    const VACANCES_SCOLAIRES_2026 = [
        { debut: '2025-12-20', fin: '2026-01-05', nom: 'Vacances de Noël' },
        { debut: '2026-02-14', fin: '2026-03-02', nom: 'Vacances d\'Hiver' },
        { debut: '2026-04-11', fin: '2026-04-27', nom: 'Vacances de Printemps' },
        { debut: '2026-07-04', fin: '2026-09-01', nom: 'Vacances d\'Été' },
        { debut: '2026-10-24', fin: '2026-11-02', nom: 'Vacances de Toussaint' },
        { debut: '2026-12-19', fin: '2027-01-04', nom: 'Vacances de Noël' }
    ];

    // Cache des réservations
    let reservationsForGite = [];

    // État de la modal
    let modalState = {
        periode: {
            type: 'mois', // 'mois', 'annee', 'trimestre', 'personnalise'
            annee: 2026,
            mois: 1,
            dateDebut: null,
            dateFin: null
        },
        joursSelectionnes: {
            lundi: true,
            mardi: true,
            mercredi: true,
            jeudi: true,
            vendredi: true,
            samedi: true,
            dimanche: true
        },
        tarif: 100,
        currentGiteId: null
    };

    // ============================================================================
    // UTILITAIRES
    // ============================================================================

    function isJourFerie(dateStr) {
        return JOURS_FERIES_2026.find(jf => jf.date === dateStr);
    }

    function isVacancesScolaires(dateStr) {
        return VACANCES_SCOLAIRES_2026.find(v => dateStr >= v.debut && dateStr <= v.fin);
    }

    function getJourSemaine(dateStr) {
        const date = new Date(dateStr + 'T12:00:00');
        const jour = date.getDay();
        const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        return jours[jour];
    }

    function isDateReservee(dateStr) {
        if (!reservationsForGite || reservationsForGite.length === 0) {
            return false;
        }
        
        const date = new Date(dateStr + 'T12:00:00');
        
        for (const resa of reservationsForGite) {
            const checkIn = new Date(resa.date_arrivee || resa.check_in);
            const checkOut = new Date(resa.date_depart || resa.check_out);
            
            // La date est réservée si elle est entre check-in (inclus) et check-out (exclus)
            if (date >= checkIn && date < checkOut) {
                return true;
            }
        }
        
        return false;
    }

    function getDatesInPeriode() {
        const dates = [];
        let debut, fin;

        switch (modalState.periode.type) {
            case 'annee':
                debut = new Date(modalState.periode.annee, 0, 1);
                fin = new Date(modalState.periode.annee, 11, 31);
                break;
            
            case 'mois':
                debut = new Date(modalState.periode.annee, modalState.periode.mois, 1);
                fin = new Date(modalState.periode.annee, modalState.periode.mois + 1, 0);
                break;
            
            case 'trimestre':
                const trimestre = modalState.periode.trimestre || 1;
                const moisDebut = (trimestre - 1) * 3;
                debut = new Date(modalState.periode.annee, moisDebut, 1);
                fin = new Date(modalState.periode.annee, moisDebut + 3, 0);
                break;
            
            case 'personnalise':
                debut = new Date(modalState.periode.dateDebut);
                fin = new Date(modalState.periode.dateFin);
                break;
        }

        // Générer toutes les dates de la période
        const current = new Date(debut);
        
        while (current <= fin) {
            const dateStr = current.toISOString().split('T')[0];
            const jourSemaine = getJourSemaine(dateStr);
            
            if (modalState.joursSelectionnes[jourSemaine] && !isDateReservee(dateStr)) {
                dates.push(dateStr);
            }
            
            current.setDate(current.getDate() + 1);
        }

        return dates;
    }

    // ============================================================================
    // INTERFACE MODAL
    // ============================================================================

    function createModal() {
        const modal = document.createElement('div');
        modal.id = 'modal-remplissage-auto';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container-large">
                <div class="modal-header">
                    <h2>🎯 Remplissage Automatique des Tarifs</h2>
                    <button class="btn-close" onclick="window.closeModalRemplissageAuto()">×</button>
                </div>
                
                <div class="modal-body-remplissage">
                    <!-- Section 1: Période -->
                    <div class="section-remplissage">
                        <h3>📅 1. Choisir la période</h3>
                        <div class="periode-selector">
                            <button class="btn-periode active" data-type="mois">Mois</button>
                            <button class="btn-periode" data-type="trimestre">Trimestre</button>
                            <button class="btn-periode" data-type="annee">Année</button>
                            <button class="btn-periode" data-type="personnalise">Personnalisé</button>
                        </div>
                        
                        <div id="periode-details" class="periode-details">
                            <!-- Contenu dynamique selon le type -->
                        </div>
                    </div>

                    <!-- Section 2: Jours de la semaine -->
                    <div class="section-remplissage">
                        <h3>📆 2. Sélectionner les jours</h3>
                        <div class="jours-semaine-selector">
                            <label class="jour-checkbox active">
                                <input type="checkbox" name="jour" value="lundi" checked>
                                <span class="jour-label">L</span>
                                <span class="jour-nom">Lundi</span>
                            </label>
                            <label class="jour-checkbox active">
                                <input type="checkbox" name="jour" value="mardi" checked>
                                <span class="jour-label">M</span>
                                <span class="jour-nom">Mardi</span>
                            </label>
                            <label class="jour-checkbox active">
                                <input type="checkbox" name="jour" value="mercredi" checked>
                                <span class="jour-label">M</span>
                                <span class="jour-nom">Mercredi</span>
                            </label>
                            <label class="jour-checkbox active">
                                <input type="checkbox" name="jour" value="jeudi" checked>
                                <span class="jour-label">J</span>
                                <span class="jour-nom">Jeudi</span>
                            </label>
                            <label class="jour-checkbox active">
                                <input type="checkbox" name="jour" value="vendredi" checked>
                                <span class="jour-label">V</span>
                                <span class="jour-nom">Vendredi</span>
                            </label>
                            <label class="jour-checkbox active">
                                <input type="checkbox" name="jour" value="samedi" checked>
                                <span class="jour-label">S</span>
                                <span class="jour-nom">Samedi</span>
                            </label>
                            <label class="jour-checkbox active">
                                <input type="checkbox" name="jour" value="dimanche" checked>
                                <span class="jour-label">D</span>
                                <span class="jour-nom">Dimanche</span>
                            </label>
                        </div>
                    </div>

                    <!-- Section 3: Tarif -->
                    <div class="section-remplissage">
                        <h3>💰 3. Définir le tarif</h3>
                        <div class="tarif-input-group">
                            <input type="number" id="tarif-auto" value="100" min="0" step="1">
                            <span class="currency">€ / nuit</span>
                        </div>
                        <p style="font-size: 0.9rem; color: #6c757d; font-style: italic; margin-top: 10px;">
                            ⚠️ Les tarifs existants seront écrasés automatiquement
                        </p>
                    </div>

                    <!-- Section 4: Preview -->
                    <div class="section-remplissage preview-section">
                        <h3>👁️ 4. Aperçu</h3>
                        <div id="preview-calendar" class="preview-calendar">
                            <!-- Calendrier généré dynamiquement -->
                        </div>
                        <div class="preview-stats">
                            <div class="stat-item">
                                <span class="stat-label">Jours impactés:</span>
                                <span class="stat-value" id="count-total">0</span>
                            </div>
                            <div class="stat-item ferie">
                                <span class="stat-label">🎉 Jours fériés:</span>
                                <span class="stat-value" id="count-feries">0</span>
                            </div>
                            <div class="stat-item vacances">
                                <span class="stat-label">🏖️ Vacances scolaires:</span>
                                <span class="stat-value" id="count-vacances">0</span>
                            </div>
                            <div class="stat-item" style="background: #fff3cd; border-left-color: #ffc107;">
                                <span class="stat-label">⛔ Dates réservées (ignorées):</span>
                                <span class="stat-value" id="count-reservees">0</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-secondary" onclick="window.closeModalRemplissageAuto()">Annuler</button>
                    <button class="btn-primary" onclick="window.appliquerRemplissageAuto()">
                        ✅ Appliquer les tarifs
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        initModalListeners();
        updatePeriodeDetails();
        updatePreview();
    }

    function initModalListeners() {
        // Sélection du type de période
        document.querySelectorAll('.btn-periode').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.btn-periode').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                modalState.periode.type = this.dataset.type;
                updatePeriodeDetails();
                updatePreview();
            });
        });

        // Sélection des jours
        document.querySelectorAll('.jour-checkbox input').forEach(input => {
            input.addEventListener('change', function() {
                modalState.joursSelectionnes[this.value] = this.checked;
                this.parentElement.classList.toggle('active', this.checked);
                updatePreview();
            });
        });

        // Modification du tarif
        document.getElementById('tarif-auto').addEventListener('input', function() {
            modalState.tarif = parseFloat(this.value) || 0;
        });
    }

    function updatePeriodeDetails() {
        const container = document.getElementById('periode-details');
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        switch (modalState.periode.type) {
            case 'mois':
                container.innerHTML = `
                    <div class="periode-inputs">
                        <select id="select-mois">
                            ${Array.from({ length: 12 }, (_, i) => {
                                const date = new Date(2026, i, 1);
                                const nom = date.toLocaleDateString('fr-FR', { month: 'long' });
                                return `<option value="${i}" ${i === currentMonth ? 'selected' : ''}>${nom}</option>`;
                            }).join('')}
                        </select>
                        <select id="select-annee">
                            ${[2026, 2027, 2028].map(y => 
                                `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`
                            ).join('')}
                        </select>
                    </div>
                `;
                
                document.getElementById('select-mois').addEventListener('change', function() {
                    modalState.periode.mois = parseInt(this.value);
                    updatePreview();
                });
                document.getElementById('select-annee').addEventListener('change', function() {
                    modalState.periode.annee = parseInt(this.value);
                    updatePreview();
                });
                break;

            case 'trimestre':
                container.innerHTML = `
                    <div class="periode-inputs">
                        <select id="select-trimestre">
                            <option value="1">T1 (Jan-Mar)</option>
                            <option value="2">T2 (Avr-Juin)</option>
                            <option value="3">T3 (Juil-Sept)</option>
                            <option value="4">T4 (Oct-Déc)</option>
                        </select>
                        <select id="select-annee">
                            ${[2026, 2027, 2028].map(y => 
                                `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`
                            ).join('')}
                        </select>
                    </div>
                `;
                
                document.getElementById('select-trimestre').addEventListener('change', function() {
                    modalState.periode.trimestre = parseInt(this.value);
                    updatePreview();
                });
                document.getElementById('select-annee').addEventListener('change', function() {
                    modalState.periode.annee = parseInt(this.value);
                    updatePreview();
                });
                modalState.periode.trimestre = 1;
                break;

            case 'annee':
                container.innerHTML = `
                    <div class="periode-inputs">
                        <select id="select-annee">
                            ${[2026, 2027, 2028].map(y => 
                                `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`
                            ).join('')}
                        </select>
                    </div>
                `;
                
                document.getElementById('select-annee').addEventListener('change', function() {
                    modalState.periode.annee = parseInt(this.value);
                    updatePreview();
                });
                break;

            case 'personnalise':
                const today = new Date().toISOString().split('T')[0];
                container.innerHTML = `
                    <div class="periode-inputs">
                        <label>
                            <span>Du:</span>
                            <input type="date" id="date-debut" value="${today}">
                        </label>
                        <label>
                            <span>Au:</span>
                            <input type="date" id="date-fin" value="${today}">
                        </label>
                    </div>
                `;
                
                modalState.periode.dateDebut = today;
                modalState.periode.dateFin = today;
                
                document.getElementById('date-debut').addEventListener('change', function() {
                    modalState.periode.dateDebut = this.value;
                    updatePreview();
                });
                document.getElementById('date-fin').addEventListener('change', function() {
                    modalState.periode.dateFin = this.value;
                    updatePreview();
                });
                break;
        }
    }

    function updatePreview() {
        const dates = getDatesInPeriode();
        const container = document.getElementById('preview-calendar');
        
        let countFeries = 0;
        let countVacances = 0;
        let countReservees = 0;

        // Générer TOUTES les dates (y compris réservées) pour le preview
        const allDatesToShow = [];
        let debut, fin;
        
        switch (modalState.periode.type) {
            case 'annee':
                debut = new Date(modalState.periode.annee, 0, 1);
                fin = new Date(modalState.periode.annee, 11, 31);
                break;
            case 'mois':
                debut = new Date(modalState.periode.annee, modalState.periode.mois, 1);
                fin = new Date(modalState.periode.annee, modalState.periode.mois + 1, 0);
                break;
            case 'trimestre':
                const trimestre = modalState.periode.trimestre || 1;
                const moisDebut = (trimestre - 1) * 3;
                debut = new Date(modalState.periode.annee, moisDebut, 1);
                fin = new Date(modalState.periode.annee, moisDebut + 3, 0);
                break;
            case 'personnalise':
                debut = new Date(modalState.periode.dateDebut);
                fin = new Date(modalState.periode.dateFin);
                break;
        }
        
        const current = new Date(debut);
        while (current <= fin) {
            const dateStr = current.toISOString().split('T')[0];
            const jourSemaine = getJourSemaine(dateStr);
            if (modalState.joursSelectionnes[jourSemaine]) {
                const estReservee = isDateReservee(dateStr);
                allDatesToShow.push({ date: dateStr, reservee: estReservee });
                if (estReservee) {
                    countReservees++;
                }
            }
            current.setDate(current.getDate() + 1);
        }

        if (allDatesToShow.length === 0) {
            container.innerHTML = '<p class="no-dates">Aucun jour sélectionné</p>';
            document.getElementById('count-total').textContent = '0';
            document.getElementById('count-feries').textContent = '0';
            document.getElementById('count-vacances').textContent = '0';
            document.getElementById('count-reservees').textContent = '0';
            return;
        }

        // Grouper par mois
        const datesByMonth = {};
        allDatesToShow.forEach(({ date: dateStr, reservee }) => {
            const date = new Date(dateStr + 'T12:00:00');
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!datesByMonth[monthKey]) datesByMonth[monthKey] = [];
            datesByMonth[monthKey].push({ date: dateStr, reservee });
        });

        // Afficher les mois
        let html = '';
        Object.keys(datesByMonth).sort().forEach(monthKey => {
            const [year, month] = monthKey.split('-');
            const monthName = new Date(year, parseInt(month) - 1, 1).toLocaleDateString('fr-FR', { 
                month: 'long', 
                year: 'numeric' 
            });
            
            html += `<div class="preview-month">
                <h4>${monthName}</h4>
                <div class="preview-days">`;
            
            datesByMonth[monthKey].forEach(({ date: dateStr, reservee }) => {
                const date = new Date(dateStr + 'T12:00:00');
                const day = date.getDate();
                const jourFerie = isJourFerie(dateStr);
                const vacances = isVacancesScolaires(dateStr);
                
                if (!reservee && jourFerie) countFeries++;
                if (!reservee && vacances) countVacances++;
                
                let classes = ['preview-day'];
                let title = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
                
                if (reservee) {
                    classes.push('reservee');
                    title += ' - RÉSERVÉ (ignoré)';
                } else {
                    if (jourFerie) {
                        classes.push('ferie');
                        title += ` - ${jourFerie.nom}`;
                    }
                    if (vacances) {
                        classes.push('vacances');
                        title += ` - ${vacances.nom}`;
                    }
                }
                
                html += `<div class="${classes.join(' ')}" title="${title}">${day}</div>`;
            });
            
            html += `</div></div>`;
        });

        container.innerHTML = html;
        document.getElementById('count-total').textContent = dates.length;
        document.getElementById('count-feries').textContent = countFeries;
        document.getElementById('count-vacances').textContent = countVacances;
        document.getElementById('count-reservees').textContent = countReservees;
    }

    // ============================================================================
    // APPLICATION DES TARIFS
    // ============================================================================

    async function appliquerRemplissageAuto() {
        if (!modalState.currentGiteId) {
            alert('❌ Aucun gîte sélectionné');
            return;
        }

        if (modalState.tarif <= 0) {
            alert('❌ Le tarif doit être supérieur à 0');
            return;
        }

        const dates = getDatesInPeriode();
        if (dates.length === 0) {
            alert('❌ Aucun jour sélectionné');
            return;
        }

        try {
            // Bloquer le bouton pendant le traitement
            const btnAppliquer = document.getElementById('btn-appliquer-remplissage');
            if (btnAppliquer) {
                btnAppliquer.disabled = true;
                btnAppliquer.textContent = '⏳ Application en cours...';
            }

            // Récupérer les tarifs existants depuis gites.tarifs_calendrier
            const { data: giteData, error: fetchError } = await window.supabaseClient
                .from('gites')
                .select('tarifs_calendrier')
                .eq('id', modalState.currentGiteId)
                .single();

            if (fetchError) {
                console.error('❌ Erreur fetch tarifs:', fetchError);
                throw fetchError;
            }

            // Convertir le format tableau en objet si nécessaire
            let tarifsExistants = {};
            const rawData = giteData?.tarifs_calendrier;
            
            if (Array.isArray(rawData)) {
                // Format tableau [{date: '2026-01-21', prix_nuit: 300}]
                rawData.forEach(item => {
                    if (item.date && item.prix_nuit) {
                        tarifsExistants[item.date] = item.prix_nuit;
                    }
                });
            } else if (rawData && typeof rawData === 'object') {
                // Format objet {"2026-01-21": 300}
                tarifsExistants = rawData;
            }

            // Appliquer les tarifs aux dates sélectionnées
            dates.forEach(date => {
                tarifsExistants[date] = modalState.tarif;
            });

            // ✅ NOUVEAU : Sauvegarder en format OBJECT (pas array)
            // Format attendu : {"2026-02-16": 170, "2026-02-17": 180}
            // (Compatible avec le code mobile et les promos)

            // Sauvegarder dans la base
            const { error: updateError } = await window.supabaseClient
                .from('gites')
                .update({ 
                    tarifs_calendrier: tarifsExistants,  // ✅ Object direct, pas array
                    updated_at: new Date().toISOString()
                })
                .eq('id', modalState.currentGiteId);

            if (updateError) {
                console.error('❌ Erreur update tarifs:', updateError);
                throw updateError;
            }

            // Recharger les tarifs AVANT de fermer
            if (typeof window.loadTarifsBase === 'function') {
                await window.loadTarifsBase();
            }
            if (typeof window.loadAllData === 'function') {
                await window.loadAllData();
            }
            if (typeof window.renderCalendrierTarifs === 'function') {
                window.renderCalendrierTarifs();
            }

            // Fermer le modal après rechargement
            window.closeModalRemplissageAuto();

        } catch (error) {
            console.error('Erreur application tarifs:', error);
            alert('❌ Erreur lors de l\'application des tarifs: ' + error.message);
        } finally {
            // Réactiver le bouton
            const btnAppliquer = document.getElementById('btn-appliquer-remplissage');
            if (btnAppliquer) {
                btnAppliquer.disabled = false;
                btnAppliquer.textContent = '✅ Appliquer les tarifs';
            }
        }
    }

    // ============================================================================
    // EXPORTS
    // ============================================================================

    window.openModalRemplissageAuto = async function(giteId) {
        modalState.currentGiteId = giteId;
        
        // Charger les réservations pour ce gîte
        try {
            const { data, error } = await window.supabaseClient
                .from('reservations')
                .select('*')
                .eq('gite_id', giteId);
            
            if (error) throw error;
            reservationsForGite = data || [];
            
        } catch (error) {
            console.error('❌ Erreur chargement réservations:', error);
            reservationsForGite = [];
        }
        
        createModal();
    };

    window.closeModalRemplissageAuto = function() {
        const modal = document.getElementById('modal-remplissage-auto');
        if (modal) modal.remove();
    };

    window.appliquerRemplissageAuto = appliquerRemplissageAuto;

})();
