// ==========================================
// 📅 MODULE GESTION DES RÉSERVATIONS - v2.0
// ==========================================
// Fonctions de recherche, affichage, modification et suppression des réservations
// Design modernisé Vision Globale - 19 janvier 2026
//
// ✨ NOUVEAUTÉS v2.0:
// - Design Vision Globale cohérent avec le dashboard
// - Cartes blanches avec bordures 3px et ombres
// - Boutons colorés avec hover effects
// - Headers de semaine modernisés (fond noir)
// - Badges de plateforme avec bordures et ombres
// - Typographie améliorée et espacements optimisés

// ==========================================// UTILITAIRES
// ==========================================

/**
 * Échapper les caractères HTML pour éviter les erreurs de syntaxe
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================// � ACTUALISATION FORCÉE
// ==========================================

async function forceRefreshReservations() {
    // Afficher un indicateur de chargement
    const btn = event?.target || document.querySelector('button[onclick*="forceRefreshReservations"]');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Actualisation...';
    }
    
    try {
        // Lancer synchronisation iCal en arrière-plan
        if (typeof syncAllCalendars === 'function') {
            syncAllCalendars().catch(err => console.error('Erreur sync iCal:', err));
        }
        
        invalidateCache('all');
        await updateReservationsList();
        showToast('Données actualisées + Sync iCal lancée', 'success');
    } catch (error) {
        console.error('❌ Erreur actualisation:', error);
        showToast('Erreur lors de l\'actualisation', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

// ==========================================
// �🔍 RECHERCHE RÉSERVATIONS
// ==========================================

// ==========================================
// 📆 FILTRAGE PAR MOIS
// ==========================================

let currentMonthFilter = 'all';
// Exposer la variable globalement pour vérification
window.currentMonthFilter = currentMonthFilter;

function filterReservationsByMonth(monthValue) {
    currentMonthFilter = monthValue;
    window.currentMonthFilter = monthValue;
    
    // Appeler la bonne fonction selon le mode (mobile ou desktop)
    if (typeof window.updateReservationsListMobile === 'function') {
        window.updateReservationsListMobile();
    } else {
        updateReservationsList(true);
    }
}

function populateMonthSelector(reservations) {
    const selector = document.getElementById('monthSelector');
    if (!selector) return;
    
    // Récupérer tous les mois des réservations
    const months = new Set();
    
    reservations.forEach(r => {
        const dateDebut = parseLocalDate(r.dateDebut);
        const monthKey = `${dateDebut.getFullYear()}-${String(dateDebut.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthKey);
    });
    
    // Trier les mois
    const sortedMonths = Array.from(months).sort();
    
    // Générer les options
    let html = '<option value="all">🗓️ Tous les mois</option>';
    
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    sortedMonths.forEach(monthKey => {
        const [year, month] = monthKey.split('-');
        const monthName = monthNames[parseInt(month) - 1];
        const selected = currentMonthFilter === monthKey ? ' selected' : '';
        html += `<option value="${monthKey}"${selected}>${monthName} ${year}</option>`;
    });
    
    if (window.SecurityUtils && window.SecurityUtils.setInnerHTML) {
        window.SecurityUtils.setInnerHTML(selector, html);
    } else {
        selector.innerHTML = html;
    }
}

function filterReservationsBySelectedMonth(reservations) {
    if (currentMonthFilter === 'all') {
        return reservations;
    }
    
    const [filterYear, filterMonth] = currentMonthFilter.split('-').map(Number);
    
    return reservations.filter(r => {
        const dateDebut = parseLocalDate(r.dateDebut);
        const resYear = dateDebut.getFullYear();
        const resMonth = dateDebut.getMonth() + 1;
        
        return resYear === filterYear && resMonth === filterMonth;
    });
}

async function filterReservations(searchTerm) {
    // forceRefresh=true pour toujours avoir les dernières données
    const reservations = await getAllReservations(true);
    
    if (!searchTerm || searchTerm.trim() === '') {
        // Pas de recherche, afficher tout
        updateReservationsList();
        return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    const filtered = reservations.filter(r => {
        return (
            (r.nom && r.nom.toLowerCase().includes(term)) ||
            (r.telephone && r.telephone.includes(term)) ||
            (r.gite && r.gite.toLowerCase().includes(term)) ||
            (r.site && r.site.toLowerCase().includes(term)) ||
            (r.provenance && r.provenance.toLowerCase().includes(term))
        );
    });
    
    // Afficher résultats
    displayFilteredReservations(filtered);
}

function displayFilteredReservations(reservations) {
    const container = document.getElementById('planning-container');
    
    if (reservations.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: var(--text-secondary); padding: 40px; font-size: 1.1rem;">Aucun résultat</p>');
        return;
    }
    
    let html = '<div class="planning-weeks"><h3 class="vision-action-title" style="margin-bottom: 25px;">🔍 Résultats de recherche (' + reservations.length + ')</h3>';
    
    reservations.forEach((r, index) => {
        const borderColors = ['#3b82f6', '#ef4444', '#10b981', '#06b6d4'];
        const borderColor = borderColors[index % 4];
        const platformLogo = getPlatformLogo(r.site);
        const messageEnvoye = r.messageEnvoye ? ' <span style="color: #27ae60; font-weight: 700; font-size: 1.1rem;">✓</span>' : '';
        const telephoneDisplay = r.telephone ? `<br><span style="font-size: 0.95rem; color: var(--text-secondary);">📱 ${r.telephone}</span>` : '';
        
        const isIncomplete = !r.nom || r.nom.includes('⚠️') || r.nom.includes('À COMPLÉTER') || r.nom.includes('Client');
        const incompleteBadge = isIncomplete ? 
            '<span class="incomplete-badge">⚠️ À COMPLÉTER</span>' : 
            '';
        
        html += `
            <div class="week-reservation ${isIncomplete ? 'week-reservation-incomplete' : ''}">
                <div style="position: relative;">
                    <div class="reservation-buttons">
                        <button class="btn-reservation btn-reservation-edit" onclick="openEditModal('${r.id}')" title="Modifier"><svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <button class="btn-reservation btn-reservation-view" onclick="aperçuFicheClient('${r.id}')" title="Page Client"><svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></button>
                        <button class="btn-reservation btn-reservation-delete" onclick="deleteReservationById('${r.id}')" title="Supprimer"><svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                    </div>
                    
                    <div class="reservation-name">
                        ${escapeHtml(r.nom)}${messageEnvoye}${incompleteBadge}
                    </div>
                    
                    <div class="reservation-details">
                        📅 <strong class="reservation-dates-text">${formatDate(r.dateDebut)} → ${formatDate(r.dateFin)}</strong>${telephoneDisplay}<br>
                        💰 <strong class="reservation-price">${r.montant.toFixed(2)} €</strong> • ${platformLogo}
                    </div>
                    
                    <div style="font-size: 1rem; color: var(--text-secondary); font-weight: 600;">
                        🏠 ${r.gite}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    window.SecurityUtils.setInnerHTML(container, html);
}

// ==========================================
// ✏️ ÉDITION RÉSERVATIONS
// ==========================================

function openEditModal(id) {
    getAllReservations(true).then(reservations => {
        const reservation = reservations.find(r => r.id === id);
        if (!reservation) return;
        
        document.getElementById('editId').value = reservation.id;
        document.getElementById('editNom').value = reservation.nom;
        document.getElementById('editTelephone').value = reservation.telephone || '';
        document.getElementById('editProvenance').value = reservation.provenance || '';
        document.getElementById('editNbPersonnes').value = reservation.nbPersonnes || '';
        document.getElementById('editMontant').value = reservation.montant;
        document.getElementById('editAcompte').value = reservation.acompte || 0;
        document.getElementById('editPaiement').value = reservation.paiement;
        
        document.getElementById('editModal').classList.add('show');
    });
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
}

async function saveEditReservation(event) {
    event.preventDefault();
    
    const id = document.getElementById('editId').value; // UUID est une string, pas parseInt
    const nom = document.getElementById('editNom').value.trim();
    const telephone = document.getElementById('editTelephone').value.trim();
    const provenance = document.getElementById('editProvenance').value.trim();
    const nbPersonnes = document.getElementById('editNbPersonnes').value;
    const montant = parseFloat(document.getElementById('editMontant').value);
    const acompte = parseFloat(document.getElementById('editAcompte').value) || 0;
    const paiement = document.getElementById('editPaiement').value;
    
    if (!nom) {
        showToast('Le nom est obligatoire', 'error');
        return;
    }
    
    if (isNaN(montant)) {
        showToast('Le montant est obligatoire', 'error');
        return;
    }
    
    try {
        const updates = {
            nom: nom,
            telephone: telephone,
            provenance: provenance,
            nbPersonnes: nbPersonnes ? parseInt(nbPersonnes) : null,
            montant: montant,
            acompte: acompte,
            restant: montant - acompte,
            paiement: paiement
        };
        
        await updateReservation(id, updates);
        await updateReservationsList(true); // Garder la position du scroll
        await updateStats();
        
        closeEditModal();
        showToast('✓ Réservation modifiée', 'success');
    } catch (error) {
        console.error('❌ Erreur lors de la modification:', error);
        showToast('Erreur lors de la modification', 'error');
    }
}

async function updatePaiementStatus(id, newStatus) {
    await updateReservation(id, { paiement: newStatus });
    await updateReservationsList(true); // Garder la position du scroll
    showToast('✓ Statut mis à jour');
}

async function deleteReservationById(id) {
    if (confirm('Supprimer cette réservation ?')) {
        await deleteReservation(id);
        await updateReservationsList(true); // Garder la position du scroll
        await updateStats();
        await updateArchivesDisplay();
        showToast('✓ Réservation supprimée');
    }
}

// ==========================================
// 📅 AFFICHAGE PLANNING PAR SEMAINE
// ==========================================

async function updateReservationsList(keepScrollPosition = false) {
    // Mémoriser la position du scroll si demandé
    const scrollY = keepScrollPosition ? window.scrollY : null;
    
    // Synchroniser les calendriers iCal UNIQUEMENT au premier chargement (pas lors des rafraîchissements)
    // et seulement si on a des gîtes configurés
    if (!keepScrollPosition && typeof syncAllCalendars === 'function') {
        const gites = await window.gitesManager?.getAll() || [];
        
        // Vérifier si au moins un gîte a des URLs iCal configurées
        const hasIcalConfigs = gites.some(g => {
            if (!g.ical_sources) return false;
            if (Array.isArray(g.ical_sources)) return g.ical_sources.length > 0;
            if (typeof g.ical_sources === 'object') return Object.keys(g.ical_sources).length > 0;
            return false;
        });
        
        if (hasIcalConfigs) {
            // Sync en arrière-plan, ne pas attendre
            syncAllCalendars().catch(err => console.warn('Sync iCal:', err.message));
        }
    }
    
    // ⚠️ IMPORTANT : forceRefresh=true pour recharger depuis BDD après sync
    const reservations = await getAllReservations(true);
    const gites = await window.gitesManager.getAll(); // Charger les gîtes
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Récupérer les validations de la société de ménage
    const { data: cleaningSchedules } = await window.supabaseClient
        .from('cleaning_schedule')
        .select('*');
    
    const validationMap = {};
    if (cleaningSchedules) {
        cleaningSchedules.forEach(cs => {
            validationMap[cs.reservation_id] = cs;
        });
    }
    
    // ============================================
    // AFFICHAGE : Réservations en cours ou à venir
    // ============================================
    // RÈGLE : Afficher si check_out >= aujourd'hui (en cours ou futures)
    let active = reservations.filter(r => {
        const dateFin = parseLocalDate(r.dateFin);
        dateFin.setHours(0, 0, 0, 0);
        return dateFin >= today;
    });
    
    // Populer le sélecteur de mois avec toutes les réservations (avant filtrage)
    populateMonthSelector(active);
    
    // Appliquer le filtre de mois
    active = filterReservationsBySelectedMonth(active);
    
    const container = document.getElementById('planning-container');
    if (!container) return;
    
    // gites déjà chargé plus haut dans la fonction
    
    if (gites.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">⚠️ Aucun gîte configuré. <a href="#" onclick="showGitesManager(); return false;" style="color: #667eea; text-decoration: underline;">Créer un gîte</a></p>');
        return;
    }
    
    if (active.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Aucune réservation</p>');
        return;
    }
    
    // Organiser par gîte (dynamique)
    const byGite = {};
    gites.forEach(g => {
        // Filtrer par gite_id (UUID) - utiliser r.giteId qui vient de supabase-operations
        byGite[g.id] = active.filter(r => r.giteId === g.id);
        // Trier par date
        byGite[g.id].sort((a, b) => parseLocalDate(a.dateDebut) - parseLocalDate(b.dateDebut));
    });
    
    // Obtenir toutes les semaines à afficher : ajouter semaine ACTUELLE + semaines des réservations
    const allWeeks = new Set();
    
    // TOUJOURS ajouter la semaine actuelle en premier
    const todayWeekNum = getWeekNumber(today);
    const todayYear = today.getFullYear();
    allWeeks.add(`${todayYear}-W${String(todayWeekNum).padStart(2, '0')}`);
    
    // Ajouter les semaines des réservations
    active.forEach(r => {
        const start = parseLocalDate(r.dateDebut);
        const year = start.getFullYear();
        const weekNum = getWeekNumber(start);
        allWeeks.add(`${year}-W${String(weekNum).padStart(2, '0')}`);
    });
    
    const sortedWeeks = Array.from(allWeeks).sort((a, b) => {
        // Tri numérique : extraire année et semaine
        const [yearA, weekA] = a.split('-W').map(x => parseInt(x));
        const [yearB, weekB] = b.split('-W').map(x => parseInt(x));
        if (yearA !== yearB) return yearA - yearB;
        return weekA - weekB;
    });
    
    // Générer le HTML avec en-tête fixe style barre (comme l'exemple HTML fourni)
    let html = '<div class="planning-weeks">';
    
    sortedWeeks.forEach(weekKey => {
        // Extraire l'année et le numéro de semaine
        const [year, weekPart] = weekKey.split('-W');
        const weekNum = parseInt(weekPart);
        const weekDates = getWeekDates(parseInt(year), weekNum);
        
        // En-tête de semaine
        // Adapter l'affichage selon le nombre de gîtes (1 à 4)
        let gridStyle;
        let gap = '20px';
        let padding = '20px';
        
        if (gites.length === 1) {
            gridStyle = 'display: flex; justify-content: center; max-width: 800px; margin: 0 auto;';
        } else if (gites.length === 2) {
            gridStyle = `display: grid; grid-template-columns: repeat(2, 1fr); gap: ${gap}; width: 100%; min-width: 0;`;
        } else if (gites.length === 3) {
            gridStyle = `display: grid; grid-template-columns: repeat(3, 1fr); gap: ${gap}; width: 100%; min-width: 0;`;
        } else if (gites.length >= 4) {
            gridStyle = `display: grid; grid-template-columns: repeat(4, 1fr); gap: ${gap}; width: 100%; min-width: 0;`;
        }
        
        html += `
            <div class="weeks-grid">
        `;
        
        // Générer colonnes pour chaque gîte
        const colors = [
            '#3b82f6', '#ef4444', '#10b981', '#06b6d4'
        ];
        const colorClasses = [
            'week-column-header-trevoux', 'week-column-header-couzon', 'week-column-header-3eme', 'week-column-header-4eme'
        ];
        const bodyColorClasses = [
            'week-column-body-trevoux', 'week-column-body-couzon', 'week-column-body-3eme', 'week-column-body-4eme'
        ];
        
        gites.forEach((g, giteIndex) => {
            const colorClass = colorClasses[giteIndex % colorClasses.length];
            const bodyColorClass = bodyColorClasses[giteIndex % bodyColorClasses.length];
            
            html += `
            <div class="week-column">
                <div class="week-column-header ${colorClass}">
                    <div class="week-column-header-gite">${g.name}</div>
                    <div class="week-column-header-week">Semaine ${weekNum}</div>
                    <div class="week-column-header-dates">${formatDateShort(weekDates.start)} - ${formatDateShort(weekDates.end)}</div>
                </div>
                <div class="week-column-body ${bodyColorClass}">
                    ${generateWeekReservations(byGite[g.id], weekNum, g.slug, active, validationMap, today)}
                </div>
            </div>
            `;
        });
        
        html += `
            </div>
        `;
    });
    
    html += '</div>';
    window.SecurityUtils.setInnerHTML(container, html);
    
    // Scroller automatiquement vers la première semaine SEULEMENT si on ne garde pas la position
    if (!keepScrollPosition) {
        setTimeout(() => {
            const firstWeek = container.querySelector('.week-block');
            if (firstWeek) {
                firstWeek.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    } else {
        // Restaurer la position du scroll
        setTimeout(() => {
            window.scrollTo(0, scrollY);
        }, 50);
    }
}

function generateWeekReservations(reservations, weekKey, cssClass, toutesReservations, validationMap = {}, today = null) {
    // Trouver les réservations dont la date de DÉBUT est dans cette semaine
    const weekReservations = reservations.filter(r => {
        const start = parseLocalDate(r.dateDebut);
        return getWeekNumber(start) === weekKey;
    });
    
    if (weekReservations.length === 0) {
        return '<div class="week-empty">✨ Disponible</div>';
    }
    
    let html = '';
    const borderColors = ['#3b82f6', '#ef4444', '#10b981', '#06b6d4'];
    
    weekReservations.forEach((r, index) => {
        const borderColor = borderColors[index % 4];
        const platformLogo = getPlatformLogo(r.site);
        
        // Horaires par défaut (les horaires validées seront chargées dynamiquement si nécessaire)
        let horaireArrivee = '17:00';
        let horaireDepart = '10:00';
        
        // Récupérer l'état de validation du ménage
        const validation = validationMap[r.id];
        
        // Utiliser la date de ménage depuis cleaning_schedule si elle existe, sinon calculer
        let dateMenage;
        if (validation?.scheduled_date) {
            // Utiliser la date enregistrée
            const [year, month, day] = validation.scheduled_date.split('-');
            const menageDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const joursComplets = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            const timeOfDay = validation.time_of_day === 'morning' ? '07h00' : '12h00';
            dateMenage = `${joursComplets[menageDate.getDay()]} ${formatDateShort(menageDate)} à ${timeOfDay}`;
        } else {
            // Calculer la date théorique
            dateMenage = calculerDateMenage(r, toutesReservations);
        }
        
        const messageEnvoye = r.messageEnvoye ? ' <span style="color: #27ae60; font-weight: 600;">✓</span>' : '';
        const telephoneDisplay = r.telephone ? `<br><span style="font-size: 0.9rem;">📱 ${r.telephone}</span>` : '';
        
        // Moment de la journée depuis cleaning_schedule
        let timeLabel = '';
        if (validation?.time_of_day) {
            timeLabel = validation.time_of_day === 'morning' ? ' 🌅' : ' 🌆';
        }
        let statusBadge = '';
        if (validation) {
            if (validation.status === 'validated') {
                // VERT = Validé
                statusBadge = '<span class="validation-status validated" title="Validé par société" style="margin-left: 8px;">✓</span>';
            } else if (validation.status === 'pending_validation') {
                // ORANGE = En attente de validation client
                statusBadge = '<span class="validation-status pending" title="En attente validation client" style="margin-left: 8px;">⏳</span>';
            } else if (validation.status === 'refused') {
                // ROUGE FONCE = Refusé
                statusBadge = '<span class="validation-status refused" title="Refusé par client" style="margin-left: 8px;">❌</span>';
            } else {
                // ROUGE = À valider (status = 'pending')
                statusBadge = '<span class="validation-status notvalidated" title="À valider" style="margin-left: 8px;">✗</span>';
            }
        } else {
            // Pas de validation enregistrée = ROUGE = À valider
            statusBadge = '<span class="validation-status notvalidated" title="À valider" style="margin-left: 8px;">✗</span>';
        }
        
        // Masquer bouton si réservation se termine aujourd'hui ou avant
        const dateFin = parseLocalDate(r.dateFin);
        dateFin.setHours(0, 0, 0, 0);
        const isExpired = today && dateFin.getTime() <= today.getTime();
        const ficheClientButton = isExpired ? '' : `<button class="btn-reservation btn-reservation-view" onclick="aperçuFicheClient('${r.id}')" title="Page Client"><svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></button>`;
        
        html += `
            <div class="week-reservation ${cssClass}">
                <!-- Boutons en haut -->
                <div class="reservation-buttons">
                    <button class="btn-reservation btn-reservation-edit" onclick="openEditModal('${r.id}')" title="Modifier"><svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    ${ficheClientButton}
                    <button class="btn-reservation btn-reservation-delete" onclick="deleteReservationById('${r.id}')" title="Supprimer"><svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                </div>
                
                <!-- Nom en dessous des boutons -->
                <div class="reservation-name">
                    ${escapeHtml(r.nom)}${messageEnvoye}
                </div>
                
                <!-- Dates et tarif avec horaires -->
                <div class="reservation-details">
                    📅 <strong class="reservation-dates-text">${formatDate(r.dateDebut)} <span class="reservation-time-arrival">⏰ ${horaireArrivee}</span> → ${formatDate(r.dateFin)} <span class="reservation-time-departure">⏰ ${horaireDepart}</span></strong>${telephoneDisplay}<br>
                    <div class="reservation-price-row">
                        <span>💰 <strong class="reservation-price">${r.montant.toFixed(2)} €</strong></span>
                        ${platformLogo}
                    </div>
                </div>
                
                <!-- Pied : Ménage seul -->
                <div class="reservation-cleaning">
                    <span class="reservation-cleaning-icon">🧹</span>
                    <span class="reservation-cleaning-date">${dateMenage}${timeLabel}</span>
                    ${statusBadge}
                </div>
            </div>
        `;
    });
    
    return html;
}

// ==========================================
// 🔧 UTILITAIRES
// ==========================================

function getPlatformLogo(platform) {
    if (!platform) return '';
    
    const normalizedPlatform = platform.toLowerCase().trim();
    
    if (normalizedPlatform.includes('airbnb')) {
        return '<span class="platform-badge platform-badge-airbnb">AIRBNB</span>';
    } else if (normalizedPlatform.includes('abritel') || normalizedPlatform.includes('homeaway') || normalizedPlatform.includes('homelidays')) {
        return '<span class="platform-badge platform-badge-abritel">ABRITEL</span>';
    } else if (normalizedPlatform.includes('gîtes') || normalizedPlatform.includes('gites') || normalizedPlatform.includes('france')) {
        return '<span class="platform-badge platform-badge-gdf">GDF</span>';
    } else if (normalizedPlatform === 'autre' || normalizedPlatform === 'other' || normalizedPlatform === '') {
        // "Autre" = par défaut Gîtes de France
        return '<span class="platform-badge platform-badge-gdf">GDF</span>';
    } else {
        // Afficher la plateforme inconnue telle quelle
        return `<span class="platform-badge platform-badge-other">${platform.toUpperCase()}</span>`;
    }
}


// ==========================================
// 🌐 EXPORTS GLOBAUX
// ==========================================

window.filterReservations = filterReservations;
window.displayFilteredReservations = displayFilteredReservations;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.saveEditReservation = saveEditReservation;
window.updatePaiementStatus = updatePaiementStatus;
window.deleteReservationById = deleteReservationById;
window.updateReservationsList = updateReservationsList;
window.generateWeekReservations = generateWeekReservations;
window.getPlatformLogo = getPlatformLogo;
window.filterReservationsByMonth = filterReservationsByMonth;

// ==========================================
// 🎯 INITIALISATION
// ==========================================

// Ajouter le gestionnaire d'événement pour le formulaire d'édition
document.addEventListener('DOMContentLoaded', function() {
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', saveEditReservation);
    }
});
