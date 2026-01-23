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
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: #999; padding: 40px; font-size: 1.1rem;">Aucun résultat</p>');
        return;
    }
    
    let html = '<div class="planning-weeks"><h3 style="margin-bottom: 25px; font-size: 1.4rem; color: #2D3436; font-weight: 700; text-transform: uppercase;">🔍 Résultats de recherche (' + reservations.length + ')</h3>';
    
    reservations.forEach(r => {
        const platformLogo = getPlatformLogo(r.site);
        const messageEnvoye = r.messageEnvoye ? ' <span style="color: #27ae60; font-weight: 700; font-size: 1.1rem;">✓</span>' : '';
        const telephoneDisplay = r.telephone ? `<br><span style="font-size: 0.95rem; color: #64748b;">📱 ${r.telephone}</span>` : '';
        
        const isIncomplete = !r.nom || r.nom.includes('⚠️') || r.nom.includes('À COMPLÉTER') || r.nom.includes('Client');
        const incompleteBadge = isIncomplete ? 
            '<span style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 700; margin-left: 10px; box-shadow: 2px 2px 0 #2D3436; border: 2px solid #2D3436;">⚠️ À COMPLÉTER</span>' : 
            '';
        
        html += `
            <div class="week-reservation" style="margin-bottom: 20px; padding: 20px; border-radius: 12px; background: white; box-shadow: 4px 4px 0 #2D3436; border: 3px solid #2D3436; ${isIncomplete ? 'border-left: 6px solid #ff6b6b;' : ''}">
                <div style="position: relative;">
                    <div style="position: absolute; top: 0; right: 0; display: flex; gap: 8px;">
                        <button onclick="openEditModal('${r.id}')" style="background: white; border: 2px solid #667eea; color: #667eea; border-radius: 8px; padding: 8px 10px; cursor: pointer; font-size: 1.1rem; box-shadow: 2px 2px 0 #667eea; font-weight: 600; transition: all 0.2s; min-width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='3px 3px 0 #667eea'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='2px 2px 0 #667eea'" title="Modifier">✏️</button>
                        <button onclick="aperçuFicheClient('${r.id}')" style="background: white; border: 2px solid #27ae60; color: #27ae60; border-radius: 8px; padding: 8px 10px; cursor: pointer; font-size: 1.1rem; box-shadow: 2px 2px 0 #27ae60; font-weight: 600; transition: all 0.2s; min-width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='3px 3px 0 #27ae60'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='2px 2px 0 #27ae60'" title="Page Client">✓</button>
                        <button onclick="deleteReservationById('${r.id}')" style="background: white; border: 2px solid #e74c3c; color: #e74c3c; border-radius: 8px; padding: 8px 10px; cursor: pointer; font-size: 1.1rem; box-shadow: 2px 2px 0 #e74c3c; font-weight: 600; transition: all 0.2s; min-width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='3px 3px 0 #e74c3c'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='2px 2px 0 #e74c3c'" title="Supprimer">🗑️</button>
                    </div>
                    
                    <div style="font-weight: 700; font-size: 1.3rem; color: #2D3436; margin-bottom: 12px; padding-right: 140px;">
                        ${escapeHtml(r.nom)}${messageEnvoye}${incompleteBadge}
                    </div>
                    
                    <div style="font-size: 1.1rem; color: #334155; margin-bottom: 10px; font-weight: 600;">
                        📅 <strong style="color: #667eea;">${formatDate(r.dateDebut)} → ${formatDate(r.dateFin)}</strong>${telephoneDisplay}<br>
                        💰 <strong style="color: #27ae60; font-size: 1.2rem;">${r.montant.toFixed(2)} €</strong> • ${platformLogo}
                    </div>
                    
                    <div style="font-size: 1rem; color: #64748b; font-weight: 600;">
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
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: #999; padding: 40px;">⚠️ Aucun gîte configuré. <a href="#" onclick="showGitesManager(); return false;" style="color: #667eea; text-decoration: underline;">Créer un gîte</a></p>');
        return;
    }
    
    if (active.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: #999; padding: 40px;">Aucune réservation</p>');
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
            <div style="background: white; border: 3px solid #2D3436; padding: 0; margin-bottom: 25px; box-shadow: 4px 4px 0 #2D3436; border-radius: 16px; overflow: hidden;">
                <div style="${gridStyle} padding: 20px; box-sizing: border-box;">
        `;
        
        // Générer colonnes pour chaque gîte
        const colors = [
            '#667eea', '#f5576c', '#27AE60', '#3498DB', '#E67E22', '#9B59B6'
        ];
        
        gites.forEach((g, giteIndex) => {
            const columnStyle = gites.length === 1 ? 'width: 100%; max-width: 800px;' : '';
            const giteColor = colors[giteIndex % colors.length];
            
            html += `
            <div style="display: flex; flex-direction: column; min-width: 0; ${columnStyle}; flex: 1;">
                <div style="padding: 12px 20px; background: ${giteColor}; border-radius: 12px 12px 0 0; margin-bottom: 0; border: 3px solid #2D3436; border-bottom: none; box-shadow: 4px 4px 0 #2D3436;">
                    <div style="font-size: 0.8rem; margin-bottom: 2px; color: white; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${g.name}</div>
                    <div style="font-size: 1rem; margin-bottom: 2px; color: white; font-weight: 700; text-transform: uppercase;">Semaine ${weekNum}</div>
                    <div style="font-size: 0.8rem; opacity: 0.95; color: white;">${formatDateShort(weekDates.start)} - ${formatDateShort(weekDates.end)}</div>
                </div>
                <div style="background: white; border: 3px solid #2D3436; border-top: none; border-radius: 0 0 12px 12px; padding: 20px; min-height: 120px; box-shadow: 4px 4px 0 #2D3436;">
                    ${generateWeekReservations(byGite[g.id], weekNum, g.slug, active, validationMap, today)}
                </div>
            </div>
            `;
        });
        
        html += `
                </div>
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
        return '<div class="week-empty" style="padding: 30px 20px; text-align: center; color: #95a5a6; font-size: 1rem; font-weight: 600; font-style: italic;">✨ Disponible</div>';
    }
    
    let html = '';
    weekReservations.forEach(r => {
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
        const ficheClientButton = isExpired ? '' : `<button onclick="aperçuFicheClient('${r.id}')" style="background: white; border: 2px solid #27ae60; color: #27ae60; border-radius: 8px; padding: 8px 10px; cursor: pointer; font-size: 1.1rem; font-weight: 600; box-shadow: 2px 2px 0 #27ae60; transition: all 0.2s; min-width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='3px 3px 0 #27ae60'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='2px 2px 0 #27ae60'" title="Page Client">✓</button>`;
        
        html += `
            <div class="week-reservation ${cssClass}" style="padding: 20px; border-bottom: 2px solid #e5e7eb; background: white; margin-bottom: 8px; border-radius: 8px;">
                <!-- Boutons en haut -->
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 12px;">
                    <button onclick="openEditModal('${r.id}')" style="background: white; border: 2px solid #667eea; color: #667eea; border-radius: 8px; padding: 8px 10px; cursor: pointer; font-size: 1.1rem; font-weight: 600; box-shadow: 2px 2px 0 #667eea; transition: all 0.2s; min-width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='3px 3px 0 #667eea'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='2px 2px 0 #667eea'" title="Modifier">✏️</button>
                    ${ficheClientButton}
                    <button onclick="deleteReservationById('${r.id}')" style="background: white; border: 2px solid #e74c3c; color: #e74c3c; border-radius: 8px; padding: 8px 10px; cursor: pointer; font-size: 1.1rem; font-weight: 600; box-shadow: 2px 2px 0 #e74c3c; transition: all 0.2s; min-width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='3px 3px 0 #e74c3c'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='2px 2px 0 #e74c3c'" title="Supprimer">🗑️</button>
                </div>
                
                <!-- Nom en dessous des boutons -->
                <div style="font-weight: 700; font-size: 1.25rem; color: #2D3436; margin-bottom: 14px; line-height: 1.3;">
                    ${escapeHtml(r.nom)}${messageEnvoye}
                </div>
                
                <!-- Dates et tarif avec horaires -->
                <div style="font-size: 1.05rem; color: #334155; margin-bottom: 18px; line-height: 1.8; font-weight: 500;">
                    📅 <strong style="color: #667eea;">${formatDate(r.dateDebut)} <span style="color: #27AE60; font-size: 0.95rem;">⏰ ${horaireArrivee}</span> → ${formatDate(r.dateFin)} <span style="color: #E74C3C; font-size: 0.95rem;">⏰ ${horaireDepart}</span></strong>${telephoneDisplay}<br>
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                        <span>💰 <strong style="color: #27ae60; font-size: 1.2rem;">${r.montant.toFixed(2)} €</strong></span>
                        ${platformLogo}
                    </div>
                </div>
                
                <!-- Pied : Ménage seul -->
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 18px; padding-top: 16px; border-top: 2px solid #e5e7eb; font-size: 0.95rem; color: #64748b; font-weight: 600;">
                    <span style="font-size: 1.1rem;">🧹</span>
                    <span style="color: #2D3436; font-weight: 600;">${dateMenage}${timeLabel}</span>
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
        return '<span style="display: inline-flex; align-items: center; padding: 5px 12px; background: #FF5A5F; color: white; border-radius: 8px; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.5px; border: 2px solid #2D3436; box-shadow: 2px 2px 0 #2D3436;">AIRBNB</span>';
    } else if (normalizedPlatform.includes('abritel') || normalizedPlatform.includes('homeaway') || normalizedPlatform.includes('homelidays')) {
        return '<span style="display: inline-flex; align-items: center; padding: 5px 12px; background: #0D4F8B; color: white; border-radius: 8px; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.5px; border: 2px solid #2D3436; box-shadow: 2px 2px 0 #2D3436;">ABRITEL</span>';
    } else if (normalizedPlatform.includes('gîtes') || normalizedPlatform.includes('gites') || normalizedPlatform.includes('france')) {
        return '<span style="display: inline-flex; align-items: center; padding: 5px 12px; background: #27AE60; color: white; border-radius: 8px; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.5px; border: 2px solid #2D3436; box-shadow: 2px 2px 0 #2D3436;">GDF</span>';
    } else if (normalizedPlatform === 'autre' || normalizedPlatform === 'other' || normalizedPlatform === '') {
        // "Autre" = par défaut Gîtes de France
        return '<span style="display: inline-flex; align-items: center; padding: 5px 12px; background: #27AE60; color: white; border-radius: 8px; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.5px; border: 2px solid #2D3436; box-shadow: 2px 2px 0 #2D3436;">GDF</span>';
    } else {
        // Afficher la plateforme inconnue telle quelle
        return `<span style="display: inline-flex; align-items: center; padding: 5px 12px; background: #95a5a6; color: white; border-radius: 8px; font-weight: 700; font-size: 0.8rem; border: 2px solid #2D3436; box-shadow: 2px 2px 0 #2D3436;">${platform.toUpperCase()}</span>`;
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
