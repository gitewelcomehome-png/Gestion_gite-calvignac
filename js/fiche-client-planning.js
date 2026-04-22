/**
 * MODULE PLANNING SÉJOUR
 * Logique planning client : activités partenaires, trajets Haversine, CRUD Supabase
 * LOT 3 — version 1.0.0
 */

(function () {
    'use strict';

    // ==================== CONSTANTES ====================

    const VITESSES = { voiture: 50, velo: 15, pied: 4.5 }; // km/h
    const FACTEUR_SINUOSITE = { voiture: 1.3, velo: 1.2, pied: 1.15 };
    const MARGE_SECURITE_MIN = 10;
    const TIMELINE_START = 7;  // 7h
    const TIMELINE_END = 23;   // 23h
    const TIMELINE_PX_PAR_MIN = 1.5; // 90px par heure

    // ==================== ÉTAT GLOBAL ====================

    let planningItems = [];
    let planningJourActif = null;
    let activitesMergeesCache = []; // toutes activités (gite + partenaires)

    // ==================== HELPERS COMMUNS ====================

    function getSb() {
        return window.ficheClientSupabase || window.supabaseClient;
    }

    function getToken() {
        return window.token || new URLSearchParams(window.location.search).get('token') || null;
    }

    function tSafe(key) {
        return typeof window.t === 'function' ? window.t(key) : key;
    }

    // ==================== CALCULS DISTANCE & TRAJET ====================

    function distanceHaversine(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a));
    }

    function estimerTrajet(distanceVol, mode) {
        const m = VITESSES[mode] ? mode : 'voiture';
        const distRoute = distanceVol * FACTEUR_SINUOSITE[m];
        const dureeMin = Math.round((distRoute / VITESSES[m]) * 60);
        return { distance_km: Math.round(distRoute * 10) / 10, duree_min: dureeMin };
    }

    function formatDureeMin(minutes) {
        if (!minutes) return '';
        if (minutes < 60) return minutes + ' min';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
    }

    function heureEnMinutes(heureStr) {
        if (!heureStr) return 0;
        const [h, m] = heureStr.split(':');
        return parseInt(h) * 60 + parseInt(m || 0);
    }

    function minutesEnHeure(min) {
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    function calculerHeureDepart(heureDebutStr, dureeTrajetMin) {
        const debutMin = heureEnMinutes(heureDebutStr);
        const departMin = debutMin - dureeTrajetMin - MARGE_SECURITE_MIN;
        if (departMin < 0) return null;
        return minutesEnHeure(departMin);
    }

    // ==================== JOURS SÉJOUR ====================

    function dateToLocalISO(d) {
        // Utiliser les méthodes locales pour éviter le décalage UTC (timezone)
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const j = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${j}`;
    }

    function genererJoursSejour() {
        if (!window.reservationData) return [];
        // Support double format : check_in/check_out (Supabase) et date_arrivee/date_depart (legacy)
        const arriveeStr = window.reservationData.check_in || window.reservationData.date_arrivee;
        const departStr  = window.reservationData.check_out || window.reservationData.date_depart;
        if (!arriveeStr || !departStr) return [];
        const arrivee = new Date(arriveeStr.slice(0, 10) + 'T00:00:00');
        const depart  = new Date(departStr.slice(0, 10) + 'T00:00:00');
        const jours = [];
        const courant = new Date(arrivee);
        while (courant < depart) {
            jours.push(dateToLocalISO(courant)); // getFullYear/Month/Date = heure locale, pas UTC
            courant.setDate(courant.getDate() + 1);
        }
        return jours;
    }

    // ==================== SUPABASE CRUD ====================

    async function chargerPlanning() {
        const tok = getToken();
        if (!tok) return [];
        try {
            const { data, error } = await getSb()
                .rpc('get_planning_sejour', { p_token: tok });
            if (error) {
                console.error('planning_sejour load error:', error);
                return [];
            }
            return data || [];
        } catch (e) {
            console.error('chargerPlanning exception:', e);
            return [];
        }
    }

    async function ajouterActiviteAuPlanning(activite, jour, heureDebut, heureFin, mode) {
        const giteLat = parseFloat(window.giteInfo?.gps_lat || window.giteInfo?.latitude);
        const giteLon = parseFloat(window.giteInfo?.gps_lon || window.giteInfo?.longitude);
        const actLat = parseFloat(activite.latitude);
        const actLon = parseFloat(activite.longitude);

        const distVol = distanceHaversine(giteLat, giteLon, actLat, actLon);
        const trajet = estimerTrajet(distVol, mode);
        const heureDepart = calculerHeureDepart(heureDebut, trajet.duree_min);

        // Calculer heure_fin auto si absente (durée estimée ou 1h)
        let heureFinCalc = heureFin || null;
        if (!heureFinCalc) {
            const dureeActivite = activite.duree_estimee_min || 60;
            heureFinCalc = minutesEnHeure(heureEnMinutes(heureDebut) + dureeActivite);
        }

        const { data, error } = await getSb()
            .rpc('insert_planning_sejour', {
                p_token:            getToken(),
                p_reservation_id:   window.reservationData.id,
                p_jour:             jour,
                p_heure_debut:      heureDebut,
                p_heure_fin:        heureFinCalc,
                p_source:           activite.source || 'gite',
                p_activite_gite_id: activite.source === 'gite' ? activite.id : null,
                p_activite_part_id: activite.source === 'partenaire' ? activite.id : null,
                p_titre_libre:      null,
                p_mode_transport:   mode,
                p_distance_km:      trajet.distance_km,
                p_duree_trajet_min: trajet.duree_min,
                p_heure_depart:     heureDepart,
                p_latitude_dest:    actLat,
                p_longitude_dest:   actLon
            });
        if (error) throw error;
        const data0 = Array.isArray(data) ? data[0] : data;
        if (!data0) throw new Error('Aucune donnée retournée par insert_planning_sejour');

        // Enrichir le retour avec le nom de l'activité pour l'affichage
        data0._nom = activite.nom;
        data0._source = activite.source;
        return data0;
    }

    async function supprimerDuPlanning(planningId) {
        const { error } = await getSb()
            .from('planning_sejour')
            .delete()
            .eq('id', planningId);
        if (error) throw error;
    }

    // ==================== ACTIVITÉS PARTENAIRES ====================

    function isPreprod() {
        const h = window.location.hostname;
        return h === 'localhost' || h === '127.0.0.1' || h.includes('preprod') || h.includes('vercel.app');
    }

    async function chargerActivitesPartenaires(giteLat, giteLon, rayonKm = 50) {
        try {
            let query = getSb()
                .from('activites_partenaires')
                .select('*, partenaires_activites(nom)')
                .eq('actif', true);
            // En production : exclure les données de test
            if (!isPreprod()) {
                query = query.eq('is_test_data', false);
            }
            const { data, error } = await query;
            if (error) {
                console.error('activites_partenaires load error:', error);
                return [];
            }
            return (data || [])
                .filter(a => a.latitude && a.longitude)
                .map(a => ({
                    ...a,
                    source: 'partenaire',
                    partenaire_nom: a.partenaires_activites?.nom || 'Partenaire'
                }))
                .filter(a => {
                    // En preprod : les données de test ignorent le filtre distance (gîte peut être n'importe où)
                    if (isPreprod() && a.is_test_data) return true;
                    const d = distanceHaversine(giteLat, giteLon, parseFloat(a.latitude), parseFloat(a.longitude));
                    return d <= rayonKm;
                });
        } catch (e) {
            console.error('chargerActivitesPartenaires exception:', e);
            return [];
        }
    }

    // ==================== HOOK FUSION ACTIVITÉS (exposé pour fiche-client-app.js) ====================

    window.fusionnerActivites = async function (activitesGite, giteLat, giteLon) {
        const tagged = activitesGite.map(a => ({ ...a, source: 'gite' }));
        const partenaires = await chargerActivitesPartenaires(giteLat, giteLon);
        activitesMergeesCache = [...tagged, ...partenaires];
        return activitesMergeesCache;
    };

    // ==================== ENRICHISSEMENT CARTES (post-rendu) ====================

    window.enrichirCartesActivites = function (activites) {
        document.querySelectorAll('.activite-card').forEach(card => {
            const activiteId = card.dataset.activiteId;
            if (!activiteId) return;
            const activite = activites.find(a => a.id === activiteId);
            if (!activite) return;

            // Source badge
            const info = card.querySelector('.activite-info');
            if (info && !card.querySelector('.planning-source-badge')) {
                const badge = document.createElement('span');
                badge.className = 'planning-source-badge planning-source-' + (activite.source || 'gite');
                badge.textContent = activite.source === 'partenaire'
                    ? tSafe('planning_source_partenaire') + (activite.partenaire_nom ? ` · ${activite.partenaire_nom}` : '')
                    : tSafe('planning_source_gite');
                info.appendChild(badge);
            }

            // Cache pour prix (partenaire)
            if (activite.source === 'partenaire' && activite.prix_unitaire) {
                if (!card.querySelector('.planning-prix')) {
                    const prix = document.createElement('div');
                    prix.className = 'planning-prix';
                    prix.textContent = `${activite.prix_unitaire} € / ${activite.unite_prix || 'pers.'}`;
                    card.querySelector('.activite-info')?.appendChild(prix);
                }
            }

            // Bouton "+ Ajouter à mon séjour"
            if (!card.querySelector('.btn-ajouter-planning')) {
                const enPlanning = planningItems.some(p =>
                    (activite.source === 'gite' && p.activite_gite_id === activite.id) ||
                    (activite.source === 'partenaire' && p.activite_partenaire_id === activite.id)
                );

                const btn = document.createElement('button');
                btn.className = 'btn-ajouter-planning' + (enPlanning ? ' already-added' : '');
                btn.dataset.activiteId = activite.id;

                if (enPlanning) {
                    btn.innerHTML = '✓ ' + tSafe('planning_deja_ajoutee');
                    btn.disabled = true;
                } else {
                    btn.innerHTML = '+ ' + tSafe('planning_ajouter_au_sejour');
                    btn.addEventListener('click', () => window.ouvrirModalAjoutPlanning(activite));
                }
                card.appendChild(btn);
            }
        });
    };

    // ==================== MODAL AJOUT PLANNING ====================

    window.ouvrirModalAjoutPlanning = function (activite) {
        // Supprimer modal existant
        const existing = document.getElementById('planningModal');
        if (existing) existing.remove();

        const jours = genererJoursSejour();
        if (jours.length === 0) return;

        // Construire les options jours
        const joursOptions = jours.map(j => {
            const d = new Date(j + 'T00:00:00');
            const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
            return `<option value="${j}">${label}</option>`;
        }).join('');

        const nom = (activite.nom || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const dureeDefaut = activite.duree_estimee_min || 60;
        const heureDefaut = '10:00';
        const heureFinDefaut = minutesEnHeure(heureEnMinutes(heureDefaut) + dureeDefaut);

        const modal = document.createElement('div');
        modal.id = 'planningModal';
        modal.className = 'planning-modal-overlay';
        modal.innerHTML = `
            <div class="planning-modal-box" role="dialog" aria-modal="true" aria-label="Ajouter au planning">
                <div class="planning-modal-header">
                    <h3>📅 ${nom}</h3>
                    <button class="planning-modal-close" aria-label="Fermer" onclick="document.getElementById('planningModal').remove()">×</button>
                </div>
                <div class="planning-modal-body">
                    <div class="planning-modal-field">
                        <label for="pm-jour">Jour</label>
                        <select id="pm-jour">${joursOptions}</select>
                    </div>
                    <div class="planning-modal-field planning-modal-row">
                        <div>
                            <label for="pm-debut">Heure de début</label>
                            <input type="time" id="pm-debut" value="${heureDefaut}" min="07:00" max="23:00" step="1800">
                        </div>
                        <div>
                            <label for="pm-fin">Heure de fin</label>
                            <input type="time" id="pm-fin" value="${heureFinDefaut}" min="07:00" max="23:30" step="1800">
                        </div>
                    </div>
                    <div class="planning-modal-field">
                        <label for="pm-mode">Mode de transport</label>
                        <select id="pm-mode">
                            <option value="voiture">🚗 ${tSafe('planning_mode_voiture')}</option>
                            <option value="velo">🚴 ${tSafe('planning_mode_velo')}</option>
                            <option value="pied">🚶 ${tSafe('planning_mode_pied')}</option>
                        </select>
                    </div>
                    <div id="pm-trajet-info" class="planning-modal-trajet"></div>
                </div>
                <div class="planning-modal-footer">
                    <button class="btn-secondary" onclick="document.getElementById('planningModal').remove()">Annuler</button>
                    <button class="btn-primary" id="pm-confirmer">Ajouter à mon séjour</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Fermeture au clic overlay
        modal.addEventListener('click', e => {
            if (e.target === modal) modal.remove();
        });

        // Calcul trajet en temps réel
        function calculerEtAfficherTrajet() {
            const mode = document.getElementById('pm-mode')?.value || 'voiture';
            const heureDebut = document.getElementById('pm-debut')?.value;
            const giteLat = parseFloat(window.giteInfo?.gps_lat || window.giteInfo?.latitude);
            const giteLon = parseFloat(window.giteInfo?.gps_lon || window.giteInfo?.longitude);

            if (!activite.latitude || !activite.longitude || isNaN(giteLat) || isNaN(giteLon)) return;

            const dist = distanceHaversine(giteLat, giteLon, parseFloat(activite.latitude), parseFloat(activite.longitude));
            const trajet = estimerTrajet(dist, mode);
            const depart = calculerHeureDepart(heureDebut, trajet.duree_min);
            const info = document.getElementById('pm-trajet-info');
            if (info) {
                info.innerHTML = `🗺️ ${trajet.distance_km} km · ${formatDureeMin(trajet.duree_min)} de trajet`
                    + (depart ? ` · <strong>Partir à ${depart}</strong>` : '');
            }
        }

        document.getElementById('pm-mode')?.addEventListener('change', calculerEtAfficherTrajet);
        document.getElementById('pm-debut')?.addEventListener('change', calculerEtAfficherTrajet);
        calculerEtAfficherTrajet();

        // Confirmer
        document.getElementById('pm-confirmer').addEventListener('click', async () => {
            const jour = document.getElementById('pm-jour')?.value;
            const heureDebut = document.getElementById('pm-debut')?.value;
            const heureFin = document.getElementById('pm-fin')?.value || null;
            const mode = document.getElementById('pm-mode')?.value || 'voiture';

            if (!jour || !heureDebut) return;

            const btn = document.getElementById('pm-confirmer');
            btn.disabled = true;
            btn.textContent = '⏳ Enregistrement...';

            try {
                const item = await ajouterActiviteAuPlanning(activite, jour, heureDebut, heureFin, mode);
                planningItems.push(item);
                modal.remove();
                mettreAJourBadgeCount();
                // Rafraîchir les boutons des cartes
                if (typeof window.enrichirCartesActivites === 'function') {
                    window.enrichirCartesActivites(activitesMergeesCache);
                }
                // Si planning affiché sur le même jour
                if (planningJourActif === jour) {
                    afficherPlanning(jour);
                }
                afficherJoursSejour(genererJoursSejour(), planningJourActif);
                // Demande permission notifications si 1er ajout
                demanderPermissionNotifications();
            } catch (e) {
                console.error('Erreur ajout planning:', e);
                btn.disabled = false;
                btn.textContent = 'Ajouter à mon séjour';
                const info = document.getElementById('pm-trajet-info');
                if (info) info.innerHTML = '<span style="color:var(--danger)">❌ Erreur lors de l\'enregistrement</span>';
            }
        });
    };

    // ==================== AFFICHAGE LISTE JOURS ====================

    function afficherJoursSejour(jours, jourActif) {
        const list = document.getElementById('planningJoursList');
        if (!list) return;
        list.innerHTML = jours.map(j => {
            const d = new Date(j + 'T00:00:00');
            const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
            const count = planningItems.filter(p => p.jour === j).length;
            const isActif = j === jourActif;
            return `
                <button class="planning-jour-btn${isActif ? ' actif' : ''}"
                        data-jour="${j}"
                        onclick="window.planningSelectionnerJour('${j}')">
                    <span class="jour-label">${label}</span>
                    ${count > 0 ? `<span class="jour-badge">${count}</span>` : ''}
                </button>
            `;
        }).join('');
    }

    // ==================== AFFICHAGE TIMELINE ====================

    function afficherPlanning(jour) {
        const container = document.getElementById('timelineContainer');
        const emptyState = document.getElementById('planningEmptyState');
        if (!container) return;

        const items = planningItems.filter(p => p.jour === jour);

        if (items.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'flex';
            mettreAJourResume([]);
            return;
        }
        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = buildTimelineHTML(items);
        mettreAJourResume(items);
    }

    function buildTimelineHTML(items) {
        const totalMin = (TIMELINE_END - TIMELINE_START) * 60;
        const totalPx = totalMin * TIMELINE_PX_PAR_MIN;

        // Colonne heures
        let heuresHTML = '';
        for (let h = TIMELINE_START; h <= TIMELINE_END; h++) {
            const top = (h - TIMELINE_START) * 60 * TIMELINE_PX_PAR_MIN;
            heuresHTML += `<div class="tl-heure-label" style="top:${top}px">${String(h).padStart(2, '0')}:00</div>`;
        }

        // Lignes de séparation par heure
        let lignesHTML = '';
        for (let h = TIMELINE_START; h <= TIMELINE_END; h++) {
            const top = (h - TIMELINE_START) * 60 * TIMELINE_PX_PAR_MIN;
            lignesHTML += `<div class="tl-ligne" style="top:${top}px"></div>`;
        }

        // Blocs activités
        let blocsHTML = '';
        items
            .slice()
            .sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''))
            .forEach(item => {
                const heureMin = heureEnMinutes(item.heure_debut || '09:00');
                if (heureMin < TIMELINE_START * 60 || heureMin >= TIMELINE_END * 60) return;

                const top = (heureMin - TIMELINE_START * 60) * TIMELINE_PX_PAR_MIN;

                let dureeMin = 60;
                if (item.heure_fin) {
                    dureeMin = heureEnMinutes(item.heure_fin) - heureMin;
                }
                const height = Math.max(dureeMin * TIMELINE_PX_PAR_MIN, 45);

                const nom = (item._nom || activitesMergeesCache.find(a =>
                    a.id === item.activite_gite_id || a.id === item.activite_partenaire_id
                )?.nom || item.titre_libre || 'Activité').replace(/</g, '&lt;').replace(/>/g, '&gt;');

                const sourceClass = item.source === 'partenaire' ? 'bloc-partenaire' : (item.source === 'libre' ? 'bloc-libre' : 'bloc-gite');

                blocsHTML += `
                    <div class="tl-bloc ${sourceClass}"
                         style="top:${top}px; height:${height}px"
                         data-planning-id="${item.id}"
                         draggable="true"
                         ondragstart="window.planningDragStart(event, '${item.id}')">
                        <div class="tl-bloc-header">
                            <span class="tl-bloc-nom">${nom}</span>
                            <button class="tl-bloc-suppr" onclick="window.planningSupprimer('${item.id}')" aria-label="Retirer">×</button>
                        </div>
                        <div class="tl-bloc-meta">
                            ${item.heure_debut ? item.heure_debut.slice(0, 5) : ''}
                            ${item.heure_fin ? '→ ' + item.heure_fin.slice(0, 5) : ''}
                        </div>
                        ${item.heure_depart_suggeree ? `
                            <div class="tl-bloc-depart">
                                🚗 ${tSafe('planning_depart_a')} ${item.heure_depart_suggeree.slice(0, 5)}
                            </div>
                        ` : ''}
                        ${item.distance_km ? `
                            <div class="tl-bloc-dist">${item.distance_km} km · ${formatDureeMin(item.duree_trajet_min)}</div>
                        ` : ''}
                    </div>
                `;
            });

        return `
            <div class="tl-wrapper" style="height:${totalPx}px">
                <div class="tl-heures">${heuresHTML}</div>
                <div class="tl-zone">
                    ${lignesHTML}
                    ${blocsHTML}
                </div>
            </div>
        `;
    }

    // ==================== BADGE COUNT ====================

    function mettreAJourBadgeCount() {
        const badge = document.getElementById('planningCount');
        const n = planningItems.length;
        if (badge) {
            badge.textContent = n;
            badge.style.display = n > 0 ? 'inline-flex' : 'none';
        }
    }

    // ==================== RÉSUMÉ DU JOUR ====================

    function mettreAJourResume(items) {
        const totalKm = items.reduce((acc, p) => acc + (parseFloat(p.distance_km) || 0), 0);
        const totalMin = items.reduce((acc, p) => acc + (parseInt(p.duree_trajet_min) || 0), 0);

        const kmEl = document.getElementById('resumeTotalKm');
        const tempsEl = document.getElementById('resumeTempsTotal');
        const resumeEl = document.getElementById('planningResume');

        if (kmEl) kmEl.textContent = totalKm.toFixed(1) + ' km';
        if (tempsEl) tempsEl.textContent = formatDureeMin(totalMin);
        if (resumeEl) resumeEl.style.display = items.length > 0 ? 'flex' : 'none';
    }

    // ==================== DRAG & DROP ====================

    window.planningDragStart = function (e, planningId) {
        e.dataTransfer.setData('text/plain', planningId);
        e.dataTransfer.effectAllowed = 'move';
    };

    // ==================== ACTIONS EXPOSÉES ====================

    window.planningSelectionnerJour = function (jour) {
        planningJourActif = jour;
        afficherJoursSejour(genererJoursSejour(), jour);
        afficherPlanning(jour);
    };

    window.planningSupprimer = async function (planningId) {
        try {
            await supprimerDuPlanning(planningId);
            planningItems = planningItems.filter(p => p.id !== planningId);
            mettreAJourBadgeCount();
            afficherPlanning(planningJourActif);
            afficherJoursSejour(genererJoursSejour(), planningJourActif);
            // Rafraîchir les boutons cartes
            if (activitesMergeesCache.length > 0 && typeof window.enrichirCartesActivites === 'function') {
                // Retirer le bouton existant et recréer
                document.querySelectorAll('.btn-ajouter-planning').forEach(btn => btn.remove());
                document.querySelectorAll('.planning-source-badge').forEach(b => b.remove());
                window.enrichirCartesActivites(activitesMergeesCache);
            }
        } catch (e) {
            console.error('Erreur suppression planning:', e);
        }
    };

    // ==================== NOTIFICATIONS ====================

    function demanderPermissionNotifications() {
        if (!('Notification' in window) || Notification.permission !== 'default') return;
        // Modal pédagogique minimal (LOT 4 l'enrichira)
        try {
            Notification.requestPermission().catch(() => {});
        } catch (e) { /* safari legacy */ }
    }

    // ==================== INIT ====================

    async function initPlanning() {
        if (!window.reservationData) return;
        planningItems = await chargerPlanning();
        mettreAJourBadgeCount();

        const jours = genererJoursSejour();
        if (jours.length > 0) {
            planningJourActif = planningJourActif || jours[0];
            afficherJoursSejour(jours, planningJourActif);
            afficherPlanning(planningJourActif);
        }
    }

    // Exposer pour le toggle de vue (fiche-client.html)
    window.onVuePlanningShow = function () {
        initPlanning();
    };

    // Exposer initPlanning pour appel externe si besoin
    window.initPlanning = initPlanning;

})();
