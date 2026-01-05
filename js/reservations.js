// ==========================================
// 📅 MODULE GESTION DES RÉSERVATIONS
// ==========================================
// Fonctions de recherche, affichage, modification et suppression des réservations

// ==========================================
// � ACTUALISATION FORCÉE
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

async function filterReservations(searchTerm) {
    const reservations = await getAllReservations();
    
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
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Aucun résultat</p>';
        return;
    }
    
    let html = '<div class="planning-weeks"><h3 style="margin-bottom: 20px;">🔍 Résultats de recherche (' + reservations.length + ')</h3>';
    
    reservations.forEach(r => {
        const platformLogo = getPlatformLogo(r.site);
        const messageEnvoye = r.messageEnvoye ? ' <span style="color: #27ae60; font-weight: 600;">✓</span>' : '';
        const telephoneDisplay = r.telephone ? `<br><span style="font-size: 0.9rem;">📱 ${r.telephone}</span>` : '';
        
        const isIncomplete = !r.nom || r.nom.includes('⚠️') || r.nom.includes('À COMPLÉTER') || r.nom.includes('Client');
        const incompleteBadge = isIncomplete ? 
            '<span style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; margin-left: 8px;">⚠️ À COMPLÉTER</span>' : 
            '';
        
        html += `
            <div class="week-reservation" style="margin-bottom: 15px; padding: 12px; border-radius: 12px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); ${isIncomplete ? 'border-left: 4px solid #ff6b6b;' : ''}">
                <div style="position: relative;">
                    <div style="position: absolute; top: 0; right: 0; display: flex; gap: 4px;">
                        <button onclick="openEditModal(${r.id})" style="background: #e3f2fd; border: none; border-radius: 6px; padding: 6px 8px; cursor: pointer; font-size: 1rem;" title="Modifier">✏️</button>
                        <button onclick="aperçuFicheClient(${r.id})" style="background: #e8f5e9; border: none; border-radius: 6px; padding: 6px 8px; cursor: pointer; font-size: 1rem;" title="Page Client">📄</button>
                        <button onclick="deleteReservationById(${r.id})" style="background: #ffebee; border: none; border-radius: 6px; padding: 6px 8px; cursor: pointer; font-size: 1rem;" title="Supprimer">🗑️</button>
                    </div>
                    
                    <div style="font-weight: 700; font-size: 1.15rem; color: #0f172a; margin-bottom: 8px;">
                        ${r.nom}${messageEnvoye}${incompleteBadge}
                    </div>
                    
                    <div style="font-size: 1.05rem; color: #334155; margin-bottom: 8px;">
                        📅 <strong>${formatDate(r.dateDebut)} → ${formatDate(r.dateFin)}</strong>${telephoneDisplay}<br>
                        💰 <strong>${r.montant.toFixed(2)} €</strong> • ${platformLogo}
                    </div>
                    
                    <div style="font-size: 0.9rem; color: #64748b;">
                        🏠 ${r.gite}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// ==========================================
// ✏️ ÉDITION RÉSERVATIONS
// ==========================================

function openEditModal(id) {
    getAllReservations().then(reservations => {
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
    
    const id = parseInt(document.getElementById('editId').value);
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
        await updateReservationsList();
        await updateStats();
        await autoSaveJSON();
        
        closeEditModal();
        showToast('✓ Réservation modifiée', 'success');
    } catch (error) {
        console.error('❌ Erreur lors de la modification:', error);
        showToast('Erreur lors de la modification', 'error');
    }
}

async function updatePaiementStatus(id, newStatus) {
    await updateReservation(id, { paiement: newStatus });
    await updateReservationsList();
    await autoSaveJSON();
    showToast('✓ Statut mis à jour');
}

async function deleteReservationById(id) {
    if (confirm('Supprimer cette réservation ?')) {
        await deleteReservation(id);
        await updateReservationsList();
        await updateStats();
        await updateArchivesDisplay();
        await autoSaveJSON();
        showToast('✓ Réservation supprimée');
    }
}

// ==========================================
// 📅 AFFICHAGE PLANNING PAR SEMAINE
// ==========================================

async function updateReservationsList() {
    const reservations = await getAllReservations();
    console.log('📅 updateReservationsList - Total réservations:', reservations.length);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('📅 Date du jour (pour filtre):', today.toISOString().split('T')[0]);
    
    // Récupérer les validations de la société de ménage
    const { data: cleaningSchedules } = await supabase
        .from('cleaning_schedule')
        .select('*');
    
    const validationMap = {};
    if (cleaningSchedules) {
        cleaningSchedules.forEach(cs => {
            validationMap[cs.reservation_id] = cs;
        });
    }
    
    // Afficher TOUTES les réservations futures (date de fin après aujourd'hui)
    const active = reservations.filter(r => {
        const dateFin = parseLocalDate(r.dateFin);
        dateFin.setHours(0, 0, 0, 0);
        
        // Afficher si la réservation se termine après aujourd'hui
        return dateFin > today;
    });
    
    console.log('📅 Réservations futures (dateFin > aujourd\'hui):', active.length);
    
    const container = document.getElementById('planning-container');
    if (!container) {
        console.warn('⚠️ Container planning-container non trouvé');
        return;
    }
    
    if (active.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Aucune réservation</p>';
        return;
    }
    
    // Organiser par gîte
    const byGite = {
        'Trévoux': active.filter(r => r.gite === 'Trévoux'),
        'Couzon': active.filter(r => r.gite === 'Couzon')
    };
    
    // Trier par date
    byGite['Trévoux'].sort((a, b) => parseLocalDate(a.dateDebut) - parseLocalDate(b.dateDebut));
    byGite['Couzon'].sort((a, b) => parseLocalDate(a.dateDebut) - parseLocalDate(b.dateDebut));
    
    // Obtenir toutes les semaines à afficher (basé sur la date de DÉBUT uniquement)
    const allWeeks = new Set();
    active.forEach(r => {
        const start = parseLocalDate(r.dateDebut);
        allWeeks.add(getWeekNumber(start));
    });
    
    const sortedWeeks = Array.from(allWeeks).sort((a, b) => {
        // getWeekNumber retourne un nombre, pas une chaîne avec '-W'
        return a - b;
    });
    
    // Générer le HTML avec en-têtes sticky par gîte
    let html = '<div class="planning-weeks">';
    
    // En-têtes sticky
    html += `
        <div style="display: grid; grid-template-columns: 1fr 1fr; position: sticky; top: 0; z-index: 100; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div class="gite-label trevoux-label" style="margin: 0; border-radius: 0;">🏠 Trévoux</div>
            <div class="gite-label couzon-label" style="margin: 0; border-radius: 0;">🏠 Couzon</div>
        </div>
    `;
    
    sortedWeeks.forEach(weekNum => {
        // weekNum est déjà un nombre (résultat de getWeekNumber)
        const year = new Date().getFullYear(); // Année courante
        const weekDates = getWeekDates(year, weekNum);
        
        // En-tête de semaine
        html += `
            <div class="week-block">
                <div class="week-header-unique">
                    <div class="week-number-big">Semaine ${weekNum}</div>
                    <div class="week-dates-small">${formatDateShort(weekDates.start)} - ${formatDateShort(weekDates.end)}</div>
                </div>
                
                <div class="week-content-grid" style="border-top: none;">
                    <div class="gite-column-inline">
                        ${generateWeekReservations(byGite['Trévoux'], weekNum, 'trevoux', active, validationMap, today)}
                    </div>
                    
                    <div class="gite-column-inline">
                        ${generateWeekReservations(byGite['Couzon'], weekNum, 'couzon', active, validationMap, today)}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    console.log('📅 HTML généré, longueur:', html.length, 'caractères');
    console.log('📅 Container innerHTML avant:', container.innerHTML.length);
    container.innerHTML = html;
    console.log('📅 Container innerHTML après:', container.innerHTML.length);
    console.log('📅 Container visible?', container.offsetHeight, 'px');
    
    // Scroller automatiquement vers la première semaine (semaine actuelle)
    setTimeout(() => {
        const firstWeek = container.querySelector('.week-block');
        if (firstWeek) {
            firstWeek.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

function generateWeekReservations(reservations, weekKey, cssClass, toutesReservations, validationMap = {}, today = null) {
    // Trouver les réservations dont la date de DÉBUT est dans cette semaine
    const weekReservations = reservations.filter(r => {
        const start = parseLocalDate(r.dateDebut);
        return getWeekNumber(start) === weekKey;
    });
    
    if (weekReservations.length === 0) {
        return '<div class="week-empty">Disponible</div>';
    }
    
    let html = '';
    weekReservations.forEach(async r => {
        const platformLogo = getPlatformLogo(r.site);
        
        // Récupérer les horaires validées pour cette réservation
        let horaireArrivee = '17:00';
        let horaireDepart = '10:00';
        try {
            const { data: horaires } = await supabaseClient
                .from('demandes_horaires')
                .select('*')
                .eq('reservation_id', r.id)
                .eq('statut', 'validee');
            
            if (horaires && horaires.length > 0) {
                horaires.forEach(h => {
                    if (h.type === 'arrivee') horaireArrivee = h.heure_validee;
                    if (h.type === 'depart') horaireDepart = h.heure_validee;
                });
            }
        } catch (err) {
            // Ignorer silencieusement si la table n'existe pas encore
        }
        
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
        const ficheClientButton = isExpired ? '' : `<button onclick="aperçuFicheClient(${r.id})" style="background: #e8f5e9; border: none; border-radius: 6px; padding: 6px 8px; cursor: pointer; font-size: 1rem; transition: all 0.2s;" title="Page Client">📄</button>`;
        
        html += `
            <div class="week-reservation ${cssClass}" style="position: relative; padding: 12px; padding-top: 40px;">
                <div style="position: absolute; top: 8px; right: 8px; display: flex; gap: 4px;">
                    <button onclick="openEditModal(${r.id})" style="background: #e3f2fd; border: none; border-radius: 6px; padding: 6px 8px; cursor: pointer; font-size: 1rem; transition: all 0.2s;" title="Modifier">✏️</button>
                    ${ficheClientButton}
                    <button onclick="deleteReservationById(${r.id})" style="background: #ffebee; border: none; border-radius: 6px; padding: 6px 8px; cursor: pointer; font-size: 1rem; transition: all 0.2s;" title="Supprimer">🗑️</button>
                </div>
                
                <!-- Nom en haut -->
                <div style="font-weight: 700; font-size: 1.15rem; color: #0f172a; margin-bottom: 8px; line-height: 1.3;">
                    ${r.nom}${messageEnvoye}
                </div>
                
                <!-- Dates et tarif avec horaires -->
                <div style="font-size: 1.05rem; color: #334155; margin-bottom: 8px; line-height: 1.5;">
                    📅 <strong>${formatDate(r.dateDebut)} <span style="color: #27AE60;">⏰ ${horaireArrivee}</span> → ${formatDate(r.dateFin)} <span style="color: #E74C3C;">⏰ ${horaireDepart}</span></strong>${telephoneDisplay}<br>
                    💰 <strong>${r.montant.toFixed(2)} €</strong>
                </div>
                
                <!-- Pied : Ménage avec pastille à gauche, Plateforme à droite -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                    <div style="font-size: 0.85rem; color: #64748b; display: flex; align-items: center;">
                        🧹 ${dateMenage}${timeLabel}${statusBadge}
                    </div>
                    <div>
                        ${platformLogo}
                    </div>
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
    const normalizedPlatform = platform.toLowerCase();
    
    if (normalizedPlatform.includes('airbnb')) {
        return '<span style="display: inline-flex; align-items: center; padding: 3px 10px; background: #FF5A5F; color: white; border-radius: 6px; font-weight: 600; font-size: 0.75rem; letter-spacing: 0.5px;">airbnb</span>';
    } else if (normalizedPlatform.includes('abritel') || normalizedPlatform.includes('homeaway') || normalizedPlatform.includes('homelidays')) {
        return '<span style="display: inline-flex; align-items: center; padding: 3px 10px; background: #0D4F8B; color: white; border-radius: 6px; font-weight: 600; font-size: 0.75rem; letter-spacing: 0.5px;">abritel</span>';
    } else if (normalizedPlatform.includes('gîtes') || normalizedPlatform.includes('gites')) {
        return '<span style="display: inline-flex; align-items: center; padding: 3px 10px; background: #27AE60; color: white; border-radius: 6px; font-weight: 600; font-size: 0.75rem; letter-spacing: 0.5px;">gîtes de france</span>';
    } else {
        return `<span style="display: inline-flex; align-items: center; padding: 3px 10px; background: #95a5a6; color: white; border-radius: 6px; font-weight: 600; font-size: 0.75rem;">${platform}</span>`;
    }
}

async function autoSaveJSON() {
    const reservations = await getAllReservations();
    const backup = {
        version: '1.0',
        date: new Date().toISOString(),
        reservations: reservations
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AutoSave_Gites_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
window.autoSaveJSON = autoSaveJSON;

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
