/**
 * 🧹 MODULE MÉNAGE
 * Gestion du planning de ménage avec règles automatiques
 * et calcul des jours fériés
 */

// ==========================================
// 📅 CALCUL DATE MÉNAGE
// ==========================================

/**
 * Calcule la date et l'heure optimales pour le ménage selon les règles métier
 * @param {Object} reservation - Réservation concernée
 * @param {Array} toutesReservations - Liste de toutes les réservations pour détecter enchainements
 * @returns {string} - Date formatée "Lundi 23 déc. à 12h00"
 */
// Variable globale pour stocker les règles actives
let activeCleaningRules = [];

/**
 * Charge les règles de ménage actives depuis la base de données
 */
async function loadActiveCleaningRules() {
    try {
        if (typeof getActiveCleaningRules === 'function') {
            activeCleaningRules = await getActiveCleaningRules();
        } else {
        }
    } catch (error) {
        console.error('❌ Erreur chargement règles:', error);
    }
}

/**
 * Vérifie si une règle est active
 */
function isRuleActive(ruleCode) {
    if (!activeCleaningRules || activeCleaningRules.length === 0) {
        // Par défaut si pas de règles chargées, toutes les règles sont actives
        return true;
    }
    return activeCleaningRules.some(r => r.rule_code === ruleCode && r.is_enabled);
}

function calculerDateMenage(reservation, toutesReservations) {
    const departDate = parseLocalDate(reservation.dateFin || reservation.date_fin);
    const departDay = departDate.getDay(); // 0=dimanche, 6=samedi
    
    let menageDate = new Date(departDate);
    let heure = '12h00'; // Par défaut après-midi
    
    // Vérifier s'il y a une arrivée le jour du départ
    const arriveeMemejour = toutesReservations.find(r => 
        r.gite_id === reservation.gite_id && 
        r.id !== reservation.id &&
        parseLocalDate(r.dateDebut || r.date_debut).toDateString() === departDate.toDateString()
    );
    
    // RÈGLE 7: Enchainement le jour même (PRIORITÉ 1)
    if (arriveeMemejour && isRuleActive('same_day_checkin')) {
        heure = '13h00';
        // Pas de changement de date, ménage le jour même
    }
    // RÈGLE 1: Dimanche - Reporter au lundi (sauf enchainement)
    else if (departDay === 0 && isRuleActive('sunday_postpone')) {
        if (!arriveeMemejour) {
            // Reporter au lundi
            menageDate.setDate(menageDate.getDate() + 1);
            
            const arriveeLundi = toutesReservations.find(r => 
                r.gite_id === reservation.gite_id && 
                r.id !== reservation.id &&
                parseLocalDate(r.dateDebut || r.date_debut).toDateString() === menageDate.toDateString()
            );
            
            heure = arriveeLundi ? '07h00' : '12h00';
        }
    }
    // RÈGLE 2: Samedi - Vérifier réservation samedi/dimanche avant de décider
    else if (departDay === 6 && isRuleActive('saturday_conditional')) {
        if (!arriveeMemejour) {
            // Vérifier s'il y a une réservation samedi soir ou dimanche soir
            const samediDate = new Date(departDate);
            const dimancheDate = new Date(departDate);
            dimancheDate.setDate(dimancheDate.getDate() + 1);
            
            const resaSamediOuDimanche = toutesReservations.find(r =>
                r.gite_id === reservation.gite_id &&
                r.id !== reservation.id &&
                (parseLocalDate(r.dateDebut || r.date_debut).toDateString() === samediDate.toDateString() ||
                 parseLocalDate(r.dateDebut || r.date_debut).toDateString() === dimancheDate.toDateString())
            );
            
            if (!resaSamediOuDimanche) {
                // Pas de réservation samedi/dimanche → reporter au lundi
                menageDate.setDate(menageDate.getDate() + 2);
                
                const arriveeLundi = toutesReservations.find(r => 
                    r.gite_id === reservation.gite_id && 
                    r.id !== reservation.id &&
                    parseLocalDate(r.dateDebut || r.date_debut).toDateString() === menageDate.toDateString()
                );
                
                heure = arriveeLundi ? '07h00' : '12h00';
            }
        }
    }
    // RÈGLE 3: Mercredi ou Jeudi - Vérifier réservation avant vendredi
    else if ((departDay === 3 || departDay === 4) && isRuleActive('midweek_conditional')) {
        if (!arriveeMemejour) {
            // Vérifier s'il y a une réservation avant le vendredi
            const vendrediDate = new Date(departDate);
            const joursAajouter = departDay === 3 ? 2 : 1;
            vendrediDate.setDate(vendrediDate.getDate() + joursAajouter);
            
            const resaAvantVendredi = toutesReservations.find(r =>
                r.gite_id === reservation.gite_id &&
                r.id !== reservation.id &&
                parseLocalDate(r.dateDebut || r.date_debut) < vendrediDate &&
                parseLocalDate(r.dateDebut || r.date_debut) > departDate
            );
            
            if (!resaAvantVendredi) {
                // Pas de réservation avant vendredi → reporter au vendredi
                menageDate.setDate(menageDate.getDate() + joursAajouter);
                
                const arriveeVendredi = toutesReservations.find(r =>
                    r.gite_id === reservation.gite_id &&
                    r.id !== reservation.id &&
                    parseLocalDate(r.dateDebut || r.date_debut).toDateString() === menageDate.toDateString()
                );
                
                heure = arriveeVendredi ? '07h00' : '12h00';
            }
        }
    }
    
    // RÈGLE 8: Ménage du matin si arrivée le jour du ménage
    if (isRuleActive('morning_if_same_day')) {
        const arriveeCeJour = toutesReservations.find(r =>
            r.gite_id === reservation.gite_id &&
            r.id !== reservation.id &&
            parseLocalDate(r.dateDebut || r.date_debut).toDateString() === menageDate.toDateString()
        );
        if (arriveeCeJour && !arriveeMemejour) {
            heure = '07h00';
        }
    }
    
    // RÈGLE 2: Vérifier jour férié (sauf enchainement même jour)
    if (!arriveeMemejour && isRuleActive('avoid_holidays') && isJourFerie(menageDate)) {
        do {
            menageDate.setDate(menageDate.getDate() + 1);
        } while (isJourFerie(menageDate) || menageDate.getDay() === 0);
    }
    
    const joursComplets = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    // Retourner un objet avec la date et l'heure au lieu d'une chaîne
    return {
        date: menageDate,
        heure: heure,
        formatted: `${joursComplets[menageDate.getDay()]} ${formatDateShort(menageDate)} à ${heure}`
    };
}

function toYmdLocal(date) {
    if (!(date instanceof Date)) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getAllowedCleaningDates(reservation, reservations) {
    const departureDate = parseLocalDate(reservation.dateFin || reservation.date_fin);
    departureDate.setHours(0, 0, 0, 0);

    const nextReservation = reservations
        .filter(next => next.gite_id === reservation.gite_id && next.id !== reservation.id)
        .map(next => ({ ...next, _startDate: parseLocalDate(next.dateDebut || next.date_debut) }))
        .filter(next => next._startDate >= departureDate)
        .sort((a, b) => a._startDate - b._startDate)[0];

    const limitDate = nextReservation ? nextReservation._startDate : departureDate;
    const allowedDates = [];
    const morningOnlyDates = [];
    const cursor = new Date(departureDate);
    const departureDateYmd = toYmdLocal(departureDate);
    const nextArrivalDateYmd = nextReservation ? toYmdLocal(limitDate) : null;

    while (cursor <= limitDate) {
        const dateYmd = toYmdLocal(cursor);
        allowedDates.push(dateYmd);

        if (dateYmd === departureDateYmd || (nextArrivalDateYmd && dateYmd === nextArrivalDateYmd)) {
            morningOnlyDates.push(dateYmd);
        }

        if (!nextReservation) {
            break;
        }

        cursor.setDate(cursor.getDate() + 1);
    }

    return {
        departureDate: departureDateYmd,
        nextArrivalDate: nextArrivalDateYmd,
        allowedDates,
        morningOnlyDates
    };
}

/**
 * Vérifie si une date est un jour férié français
 * @param {Date} date - Date à vérifier
 * @returns {boolean} - true si jour férié
 */
function isJourFerie(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const feriesFixes = [
        `${year}-01-01`, `${year}-05-01`, `${year}-05-08`, `${year}-07-14`,
        `${year}-08-15`, `${year}-11-01`, `${year}-11-11`, `${year}-12-25`
    ];
    
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (feriesFixes.includes(dateKey)) return true;
    
    // Pâques mobiles (formule de Meeus/Jones/Butcher)
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const paquesMois = Math.floor((h + l - 7 * m + 114) / 31);
    const paquesJour = ((h + l - 7 * m + 114) % 31) + 1;
    
    const paques = new Date(year, paquesMois - 1, paquesJour);
    const lundiPaques = new Date(paques);
    lundiPaques.setDate(lundiPaques.getDate() + 1);
    const ascension = new Date(paques);
    ascension.setDate(ascension.getDate() + 39);
    const lundiPentecote = new Date(paques);
    lundiPentecote.setDate(lundiPentecote.getDate() + 50);
    
    const dateStr = date.toDateString();
    return dateStr === lundiPaques.toDateString() || 
           dateStr === ascension.toDateString() || 
           dateStr === lundiPentecote.toDateString();
}

/**
 * Formate une date en format court français
 * @param {Date} date
 * @returns {string} - Format "23 déc."
 */
function formatDateShort(date) {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ==========================================
// 📊 GÉNÉRATION PLANNING MÉNAGE
// ==========================================

/**
 * Génère le planning de ménage complet pour les 2 prochains mois
 */
async function genererPlanningMenage() {
    // Charger d'abord les propositions en attente (fonction désactivée temporairement)
    // await chargerPropositionsEnAttente();
    
    const reservations = await getAllReservations();
    
    // Filtrer mois en cours + prochain
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    const relevant = reservations.filter(r => {
        const date = parseLocalDate(r.dateFin);
        const month = date.getMonth();
        const year = date.getFullYear();
        return (year === currentYear && month === currentMonth) || 
               (year === nextYear && month === nextMonth);
    });
    
    relevant.sort((a, b) => parseLocalDate(a.dateFin) - parseLocalDate(b.dateFin));
    
    const planning = [];
    
    relevant.forEach(r => {
        const departDate = parseLocalDate(r.dateFin);
        
        // Utiliser la fonction calculerDateMenage pour garantir la cohérence
        const menageInfo = calculerDateMenage(r, relevant);
        const menageDate = menageInfo.date;
        const heure = menageInfo.heure;
        
        // Vérifier enchainement
        const arriveeMemejour = relevant.find(resa => 
            resa.gite_id === r.gite_id && 
            resa.id !== r.id &&
            parseLocalDate(resa.dateDebut).toDateString() === departDate.toDateString()
        );
        
        planning.push({
            date: menageDate,
            heure: heure,
            gite_id: r.gite_id,
            clientName: r.nom,
            departDate: departDate,
            enchainement: arriveeMemejour ? true : false
        });
    });
    
    if (planning.length === 0) {
        showToast('Aucun ménage à planifier', 'error');
        return;
    }
    
    // Récupérer le user ID pour owner_user_id
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) {
        console.error('❌ Utilisateur non authentifié');
        return;
    }
    
    // Mettre à jour uniquement les enregistrements existants en pending (évite les POST upsert bloqués par RLS)
    for (const p of planning) {
        const reservation = relevant.find(r => r.nom === p.clientName && r.gite_id === p.gite_id);
        if (!reservation) continue;
        
        try {
            // Vérifier si l'enregistrement existe déjà
            const { data: existing, error: existingError } = await window.supabaseClient
                .from('cleaning_schedule')
                .select('status, validated_by_company')
                .eq('reservation_id', reservation.id)
                .maybeSingle();

            if (existingError) {
                continue;
            }
            
            // Ne mettre à jour que si déjà existant et statut pending (ne pas écraser les validations/propositions)
            if (existing && existing.status === 'pending') {
                const timeOfDay = p.heure.startsWith('07') || p.heure.startsWith('08') ? 'morning' : 'afternoon';
                
                // Chercher la prochaine réservation
                const nextRes = relevant
                    .filter(r => r.gite === p.gite && parseLocalDate(r.dateDebut) >= p.departDate)
                    .sort((a, b) => parseLocalDate(a.dateDebut) - parseLocalDate(b.dateDebut))[0];
                
                const _toYMD = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                await window.supabaseClient
                    .from('cleaning_schedule')
                    .update({
                        owner_user_id: user.id,
                        gite: reservation.gite,
                        scheduled_date: _toYMD(p.date),
                        date: _toYMD(p.date),
                        time_of_day: timeOfDay,
                        status: 'pending',
                        validated_by_company: false,
                        reservation_end: _toYMD(p.departDate),
                        reservation_start_after: nextRes ? _toYMD(parseLocalDate(nextRes.dateDebut)) : null
                    })
                    .eq('reservation_id', reservation.id);
            }
        } catch (error) {
            // Échec silencieux: ne pas bloquer l'affichage du planning
        }
    }
    
    // Afficher
    const menageDiv = document.getElementById('menagePlanning');
    let html = '<div class="card" style="margin-top: 20px;"><h3 style="margin-bottom: 20px;">Planning généré (mois en cours + prochain)</h3>';
    
    planning.forEach(p => {
        const enchainementBadge = p.enchainement ? ' <span style="background: #f39c12; color: white; padding: 2px 8px; border-radius: 5px; font-size: 0.8rem;">⚡ Enchainement</span>' : '';
        html += `
            <div class="menage-item">
                <div class="menage-date">
                    📅 ${p.date.toLocaleDateString('fr-FR')} - ${['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][p.date.getDay()]}
                    à ${p.heure}${enchainementBadge}
                </div>
                <div class="menage-detail">
                    🏘️ <strong>${p.gite}</strong> - Client: ${p.clientName} (départ le ${p.departDate.toLocaleDateString('fr-FR')})
                </div>
            </div>
        `;
    });
    
    html += `
        <div style="margin-top: 20px; text-align: center;">
            <button class="btn btn-success" onclick="telechargerPlanningMenage()" style="max-width: 400px;">
                <span>📥</span> Télécharger le planning Excel
            </button>
        </div>
    </div>`;
    window.SecurityUtils.setInnerHTML(menageDiv, html);
    
    // Préparer les données Excel mais ne pas télécharger automatiquement
    window.planningMenageData = planning.map(p => ({
        '📅 Date': p.date.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
        '⏰ Heure': p.heure,
        '🏠 Gîte': p.gite,
        '👤 Client': p.clientName,
        '🚪 Départ': p.departDate.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }),
        '⚡ Enchainement': p.enchainement ? 'OUI' : 'Non'
    }));
    
    showToast(`✓ Planning généré ! ${planning.length} ménages planifiés`);
    
    // Afficher le planning par semaine avec colonnes
    await afficherPlanningParSemaine();
}

/**
 * Affiche le planning de ménage organisé par semaines - Multi-gîtes dynamique
 */
async function afficherPlanningParSemaine() {
    // Charger les règles de ménage actives
    await loadActiveCleaningRules();
    
    // Charger les gîtes dynamiquement selon l'abonnement
    const gites = await window.gitesManager.getVisibleGites();
    if (!gites || gites.length === 0) {
        console.error('❌ Aucun gîte trouvé');
        return;
    }
    
    // ✅ Charger les réservations depuis la BDD (pas iCal)
    const reservations = await getAllReservations(true);
    
    // Récupérer l'utilisateur connecté pour RLS
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) {
        console.error('❌ Utilisateur non connecté');
        return;
    }
    
    // Récupérer les validations de la société de ménage avec filtre RLS
    const { data: cleaningSchedules } = await window.supabaseClient
        .from('cleaning_schedule')
        .select('*')
        .eq('owner_user_id', user.id);
    
    const validationMap = {};
    let pendingModifications = 0;
    if (cleaningSchedules) {
        cleaningSchedules.forEach(cs => {
            validationMap[cs.reservation_id] = cs;
            if (cs.status === 'pending_validation') {
                pendingModifications++;
            }
        });
    }
    
    // Afficher le badge de notification si modifications en attente
    const notifBadge = document.getElementById('cleaning-notif-badge');
    if (notifBadge) {
        if (pendingModifications > 0) {
            notifBadge.textContent = pendingModifications;
            notifBadge.style.display = 'inline-block';
        } else {
            notifBadge.style.display = 'none';
        }
    }
    
    // Filtrer à partir de la date actuelle
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Début de journée
    const twoMonthsLater = new Date(now);
    twoMonthsLater.setMonth(now.getMonth() + 12);
    
    // Les réservations sont déjà en camelCase depuis getAllReservations()
    const reservationsAdapted = reservations;
    
    const relevant = reservationsAdapted.filter(r => {
        const dateFin = parseLocalDate(r.dateFin);
        return dateFin >= now && dateFin <= twoMonthsLater;
    });
    
    // Organiser par semaine
    const weeks = {};
    const weekStarts = new Set();
    // Map de vérité : reservation_id → { scheduled_date, time_of_day } calculés
    const wantedMap = {};
    
    // Transformer en for..of pour utiliser await
    for (const r of relevant) {
        const dateFin = parseLocalDate(r.dateFin);
        const validation = validationMap[r.id];
        
        // Calculer la date avec les règles métier
        const menageCalcul = calculerDateMenage(r, relevant);
        const dateMenage = menageCalcul.date;
        const calculatedTimeOfDay = menageCalcul.heure.startsWith('07') || menageCalcul.heure.startsWith('08') ? 'morning' : 'afternoon';
        
        // Trouver le lundi de cette semaine
        const dayOfWeek = dateMenage.getDay();
        const monday = new Date(dateMenage);
        monday.setDate(dateMenage.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);
        
        const weekKey = monday.toISOString().split('T')[0];
        weekStarts.add(weekKey);
        
        if (!weeks[weekKey]) {
            weeks[weekKey] = {
                monday: monday,
                gitesMenages: {} // Structure dynamique par gite_id
            };
        }
        
        // Stocker la vérité calculée pour la réconciliation finale
        wantedMap[r.id] = { scheduled_date: scheduledDateStr, time_of_day: calculatedTimeOfDay };

        // Mettre à jour cleaning_schedule si la date calculée diffère de la date stockée
        // (hors statuts finaux validated/confirmed)
        const isFinalStatus = validation?.status === 'validated' || validation?.status === 'confirmed';
        const scheduledDateStr = `${dateMenage.getFullYear()}-${String(dateMenage.getMonth() + 1).padStart(2, '0')}-${String(dateMenage.getDate()).padStart(2, '0')}`;
        const reservationEndStr = `${dateFin.getFullYear()}-${String(dateFin.getMonth() + 1).padStart(2, '0')}-${String(dateFin.getDate()).padStart(2, '0')}`;
        const dateHasChanged = validation && !isFinalStatus && validation.scheduled_date !== scheduledDateStr;

        if (validation && !isFinalStatus && (validation.status === 'pending' || dateHasChanged)) {
            const nextRes = reservations
                .filter(next => next.gite_id === r.gite_id && parseLocalDate(next.dateDebut) > dateFin)
                .sort((a, b) => parseLocalDate(a.dateDebut) - parseLocalDate(b.dateDebut))[0];
            
            try {
                let nextResDateStr = null;
                if (nextRes) {
                    const nextResDate = parseLocalDate(nextRes.dateDebut);
                    nextResDateStr = `${nextResDate.getFullYear()}-${String(nextResDate.getMonth() + 1).padStart(2, '0')}-${String(nextResDate.getDate()).padStart(2, '0')}`;
                }
                
                const updatePayload = {
                    gite_id: r.gite_id,
                    scheduled_date: scheduledDateStr,
                    date: scheduledDateStr,
                    time_of_day: calculatedTimeOfDay,
                    reservation_end: reservationEndStr,
                    reservation_start_after: nextResDateStr
                };
                // Ne reset le status que si déjà pending (ne pas écraser pending_validation)
                if (validation.status === 'pending') {
                    updatePayload.owner_user_id = user.id;
                    updatePayload.status = 'pending';
                    updatePayload.validated_by_company = false;
                }
                
                await window.supabaseClient
                    .from('cleaning_schedule')
                    .update(updatePayload)
                    .eq('reservation_id', r.id);
            } catch (err) {
                // Échec silencieux: ne pas bloquer l'affichage du planning
            }
        }
        
        const dateWindow = getAllowedCleaningDates(r, reservations);

        const menageInfo = {
            reservation: r,
            dateMenage: dateMenage,
            validated: validation ? ((validation.status === 'validated' || validation.status === 'confirmed') || validation.validated_by_company === true) : false,
            proposedDate: validation ? validation.proposed_date : null,
            status: validation ? validation.status : 'pending',
            timeOfDay: validation ? validation.time_of_day : calculatedTimeOfDay,
            proposedBy: validation ? validation.proposed_by : null,
            notes: validation ? validation.notes : null,
            reservationEndBefore: dateFin,
            reservationStartAfter: null, // À calculer
            allowedDates: dateWindow.allowedDates,
            morningOnlyDates: dateWindow.morningOnlyDates
        };
        
        // Debug log pour vérifier les données
        if (validation && validation.status === 'pending_validation') {
            // console.log('🔍 menageInfo créé avec proposition:', {
            //     reservationId: r.id,
            //     status: validation.status,
            //     proposedBy: validation.proposed_by,
            //     hasValidation: !!validation
            // });
        }
        
        // Chercher la réservation suivante pour ce gîte
        const nextReservation = reservations
            .filter(next => next.gite_id === r.gite_id && parseLocalDate(next.dateDebut) > dateFin)
            .sort((a, b) => parseLocalDate(a.dateDebut) - parseLocalDate(b.dateDebut))[0];
        
        if (nextReservation) {
            menageInfo.reservationStartAfter = parseLocalDate(nextReservation.dateDebut);
        }
        
        // Ajouter dans la bonne colonne (dynamique par gite_id)
        const giteId = r.gite_id;
        if (!weeks[weekKey].gitesMenages[giteId]) {
            weeks[weekKey].gitesMenages[giteId] = [];
        }
        weeks[weekKey].gitesMenages[giteId].push(menageInfo);
    }
    
    // Trier les semaines
    const sortedWeeks = Array.from(weekStarts).sort();
    
    // Générer le HTML - Style original du 10 janvier
    let html = '';
    
    sortedWeeks.forEach((weekKey, index) => {
        const week = weeks[weekKey];
        const monday = week.monday;
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        // Calculer le vrai numéro de semaine de l'année
        const weekNumber = getWeekNumber(monday);
        const dateFormatted = monday.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' - ' + 
                             sunday.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        
        // Déterminer la classe de grid selon le nombre de gîtes
        let gridClass;
        if (gites.length === 1) {
            gridClass = 'menage-grid-1';
        } else if (gites.length === 2) {
            gridClass = 'menage-grid-2';
        } else if (gites.length === 3) {
            gridClass = 'menage-grid-3';
        } else {
            gridClass = 'menage-grid-4';
        }
        
        html += `
            <div class="menage-week-container">
                <div class="${gridClass}">
        `;
        
        // Couleurs des gîtes
        const colors = [
            '#667eea', '#f5576c', '#27AE60', '#3498DB', '#E67E22', '#9B59B6'
        ];
        
        gites.forEach((gite, giteIndex) => {
            const menages = week.gitesMenages[gite.id] || [];
            const columnClass = gites.length === 1 ? 'gite-column gite-column-single' : 'gite-column';
            const giteColor = colors[giteIndex % colors.length];
            
            html += `
            <div class="${columnClass}" data-gite-color="${giteColor}">
                <div class="gite-column-header" data-gite-bg="${giteColor}">
                    <div class="gite-column-header-title">${gite.name}</div>
                    <div class="gite-column-header-week">Semaine ${weekNumber}</div>
                    <div class="gite-column-header-dates">${dateFormatted}</div>
                </div>
                <div class="gite-column-body">
            `;
            
            if (menages.length === 0) {
                html += '<div class="gite-column-body-empty">Aucun ménage prévu</div>';
            } else {
                menages.forEach(m => {
                    html += generateMenageCardHTML(m);
                });
            }
            
            html += `
                </div>
            </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    if (html === '') {
        html = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Aucun ménage prévu dans les 12 prochains mois</p>';
    }
    
    // console.log('\n📝 HTML généré, longueur:', html.length, 'caractères');
    
    const menagePlanning = document.getElementById('menagePlanningWeeks');
    if (menagePlanning) {
        // console.log('✅ Conteneur trouvé, insertion HTML...');
        window.SecurityUtils.setInnerHTML(menagePlanning, html);
        // console.log('✅ HTML inséré !');
        
        // Vérifier le résultat
        // setTimeout(() => {
        //     const weekBodies = document.querySelectorAll('.cleaning-week-body');
        //     console.log('🔍 Vérification: nombre de .cleaning-week-body trouvés:', weekBodies.length);
        //     weekBodies.forEach((body, i) => {
        //         const style = window.getComputedStyle(body);
        //         console.log(`  Semaine ${i + 1}: grid-template-columns =`, style.gridTemplateColumns);
        //         console.log(`  Semaine ${i + 1}: display =`, style.display);
        //     });
        // }, 100);
    } else {
        console.error('❌ ERREUR: Conteneur #menagePlanningWeeks non trouvé !');
    }

    // ─── RÉCONCILIATION ASYNC (sans bloquer l'affichage) ───────────────────
    // Lance en arrière-plan : corrige cleaning_schedule pour que la société
    // voit exactement les mêmes dates que l'owner, et cancelle les orphelines.
    const allReservationIds = new Set(reservations.map(r => r.id));
    reconcileCleaningWithOwner(wantedMap, allReservationIds, user.id).catch(() => {/* silencieux */});
}

/**
 * Réconcilie cleaning_schedule avec la réalité calculée par l'owner.
 * - Corrige les dates incohérentes (hors statuts finaux)
 * - Annule les entrées dont la réservation n'existe plus
 * @param {Object} wantedMap   - { [reservation_id]: { scheduled_date, time_of_day } }
 * @param {Set}    allResIds   - Tous les IDs de réservations actives en base
 * @param {string} ownerUserId
 */
async function reconcileCleaningWithOwner(wantedMap, allResIds, ownerUserId) {
    const todayFR = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const FINAL = new Set(['validated', 'confirmed', 'cancelled']);

    // Lire toutes les entries non-cancelled de cet owner
    const { data: entries, error } = await window.supabaseClient
        .from('cleaning_schedule')
        .select('id, reservation_id, scheduled_date, time_of_day, status')
        .eq('owner_user_id', ownerUserId)
        .neq('status', 'cancelled');

    if (error || !entries) return;

    const toCancel = [];
    const toUpdate = [];

    for (const entry of entries) {
        const rid = entry.reservation_id;

        if (!rid) continue; // orpheline sans FK → laisser

        if (!allResIds.has(rid)) {
            // Réservation n'existe plus → canceller
            toCancel.push(entry.id);
            continue;
        }

        const wanted = wantedMap[rid];
        if (!wanted) continue; // Réservation passée / hors plage → ne pas toucher

        if (FINAL.has(entry.status)) continue; // Jamais toucher aux validés

        const dateOk = entry.scheduled_date === wanted.scheduled_date;
        const timeOk = entry.time_of_day === wanted.time_of_day;
        if (!dateOk || !timeOk) {
            toUpdate.push({ id: entry.id, rid, ...wanted });
        }
    }

    // Batch UPDATE des dates incohérentes
    await Promise.all(toUpdate.map(u =>
        window.supabaseClient
            .from('cleaning_schedule')
            .update({ scheduled_date: u.scheduled_date, date: u.scheduled_date, time_of_day: u.time_of_day })
            .eq('id', u.id)
            .catch(() => {})
    ));

    // Batch CANCEL des orphelines
    if (toCancel.length > 0) {
        await window.supabaseClient
            .from('cleaning_schedule')
            .update({ status: 'cancelled', notes: `❌ Réservation supprimée le ${todayFR}` })
            .in('id', toCancel)
            .catch(() => {});
    }
}

/**
 * Génère le HTML pour une card de ménage - Style original du 10 janvier
 * @param {Object} menageInfo - Informations sur le ménage
 * @returns {string} - HTML de la card
 */
function generateMenageCardHTML(menageInfo) {
    const { reservation, dateMenage, validated, proposedDate, reservationEndBefore, reservationStartAfter, status, timeOfDay, proposedBy, allowedDates, morningOnlyDates, notes } = menageInfo;
    const displayDate = proposedDate ? new Date(proposedDate) : dateMenage;
    const clientValidatedModification = hasClientValidatedModification(notes);
    
    // Statut
    let statusClass = 'status-pending';
    let statusText = 'Non validé';
    let proposedByCompany = false;
    
    const ownerValidatedModification = clientValidatedModification || status === 'confirmed';

    if (validated) {
        statusClass = 'status-validated';
        statusText = ownerValidatedModification ? 'Modification validée par le propriétaire' : 'Validé';
    } else if (status === 'pending_validation') {
        statusClass = 'status-waiting';
        // Vérifier qui a proposé
        proposedByCompany = proposedBy === 'company';
        statusText = proposedByCompany ? 'Proposition société' : 'En attente';
    } else if (status === 'proposed') {
        statusClass = 'status-waiting';
        statusText = 'En attente';
    }
    
    const dateStr = displayDate.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
    });
    
    const savedTime = timeOfDay || localStorage.getItem(`cleaning_time_${reservation.id}`) || 'afternoon';
    const displayDateYmd = toYmdLocal(displayDate);
    const selectableDates = Array.isArray(allowedDates) ? allowedDates : [];
    const morningOnlyDateValues = Array.isArray(morningOnlyDates) ? morningOnlyDates : [];
    const selectedDateValue = selectableDates.includes(displayDateYmd)
        ? displayDateYmd
        : (selectableDates[0] || displayDateYmd);
    const minDateValue = selectableDates.length > 0 ? selectableDates[0] : selectedDateValue;
    const maxDateValue = selectableDates.length > 0 ? selectableDates[selectableDates.length - 1] : selectedDateValue;
    const initialMorningOnly = morningOnlyDateValues.includes(selectedDateValue);
    const timeOptionsHtml = initialMorningOnly
        ? '<option value="morning" selected>Matin</option>'
        : `
            <option value="morning" ${savedTime === 'morning' ? 'selected' : ''}>Matin</option>
            <option value="afternoon" ${savedTime === 'afternoon' ? 'selected' : ''}>AM</option>
        `;
    const timeDisplay = savedTime === 'morning' 
        ? '<svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> Matin (avant 12h)'
        : '<svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg> Après-midi (après 12h)';
    
    // Info départ/arrivée
    const departInfo = reservationEndBefore ? reservationEndBefore.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '';
    const arriveeInfo = reservationStartAfter ? reservationStartAfter.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '';
    
    const cardClass = validated ? 'menage-card menage-card-validated' : 'menage-card';
    const badgeIcon = validated 
        ? '<svg style="width:18px;height:18px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' 
        : '<svg style="width:18px;height:18px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
    const badgeClass = validated ? 'menage-status-badge menage-status-badge-validated' : 'menage-status-badge menage-status-badge-pending';
    const isAutoConflict = typeof notes === 'string' && notes.includes('[AUTO_CLEANING_CONFLICT]');
    const autoConflictHtml = isAutoConflict
        ? `<div class="menage-company-proposal" style="margin-bottom:10px;background:#fff3cd;border-color:#f39c12;"><div class="menage-company-proposal-title">⚠️ Replanification auto conflit</div><div class="menage-company-proposal-info">${notes.replace('[AUTO_CLEANING_CONFLICT] | ', '')}</div></div>`
        : '';
    
    return `
        <div class="${cardClass}">
            <div class="menage-card-main">
                <div class="menage-card-header">
                    <span>
                        <svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${dateStr}
                    </span>
                    <div class="${badgeClass}">
                        ${badgeIcon}
                    </div>
                </div>
                <div class="menage-card-time">
                    ${timeDisplay}
                </div>
                <div style="margin-top: 4px; font-size: 0.78rem; font-weight: 700; color: ${ownerValidatedModification ? '#1d4ed8' : (validated ? '#1e8449' : '#8a6d00')};">
                    ${statusText}
                </div>
                ${(departInfo || arriveeInfo) ? `
                <div class="menage-card-infos">
                    ${departInfo ? `<span><svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h6"/><path d="M9 16h6"/><path d="m14 20 1.5-1.5c1-.999 1.5-2 1.5-2.5m-5 4-1.5-1.5c-1-.999-1.5-2-1.5-2.5m0-3c0-.5.5-1.5 1.5-2.5L11 9m3 3c0-.5-.5-1.5-1.5-2.5L11 9m3 0-1.5 1.5M21 5v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/></svg> Départ: ${departInfo}</span>` : ''}
                    ${arriveeInfo ? `<span><svg style="width:14px;height:14px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg> Arrivée: ${arriveeInfo}</span>` : ''}
                </div>
                ` : ''}
            </div>

            ${autoConflictHtml}
            
            ${proposedByCompany ? `
                <div class="menage-company-proposal">
                    <div class="menage-company-proposal-title"><svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Proposition de la société de ménage</div>
                    <div class="menage-company-proposal-info">Date proposée : <strong>${dateStr}</strong></div>
                    <div class="menage-company-proposal-info">Horaire : <strong>${timeDisplay}</strong></div>
                </div>
                <div class="menage-company-buttons">
                    <button onclick="acceptCompanyProposal('${reservation.id}')" class="menage-btn-accept">
                        <svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Accepter
                    </button>
                    <button onclick="refuseCompanyProposal('${reservation.id}')" class="menage-btn-refuse">
                        <svg style="width:16px;height:16px;stroke:currentColor;display:inline;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Refuser
                    </button>
                </div>
            ` : `
                <div class="menage-edit-form">
                    <div class="menage-edit-inputs">
                        <input type="date" id="date-${reservation.id}" value="${selectedDateValue}" min="${minDateValue}" max="${maxDateValue}" class="menage-input-date" data-allowed-dates="${selectableDates.join(',')}" data-morning-only-dates="${morningOnlyDateValues.join(',')}" onchange="onMenageDateChanged('${reservation.id}')">
                        <select id="time-${reservation.id}" class="menage-input-time">
                            ${timeOptionsHtml}
                        </select>
                        <button onclick="modifierDateMenage('${reservation.id}')" class="menage-btn-save"><svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></button>
                    </div>
                </div>
            `}
        </div>
    `;
}

/**
 * Fonction héritée - conservée pour compatibilité
 */
function generateCleaningItemHTML(menageInfo) {
    return generateMenageCardHTML(menageInfo);
}

const CLIENT_MODIFICATION_VALIDATED_MARKER = '[MODIFICATION_VALIDEE_CLIENT]';

function hasClientValidatedModification(notes) {
    return typeof notes === 'string' && notes.includes(CLIENT_MODIFICATION_VALIDATED_MARKER);
}

function stripClientValidatedMarker(notes) {
    if (typeof notes !== 'string') return notes || null;
    const cleaned = notes
        .split(CLIENT_MODIFICATION_VALIDATED_MARKER)
        .join('')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    return cleaned || null;
}

function addClientValidatedMarker(notes) {
    const base = stripClientValidatedMarker(notes);
    return base ? `${base}\n${CLIENT_MODIFICATION_VALIDATED_MARKER}` : CLIENT_MODIFICATION_VALIDATED_MARKER;
}

function onMenageDateChanged(reservationId) {
    const dateInput = document.getElementById(`date-${reservationId}`);
    const timeSelect = document.getElementById(`time-${reservationId}`);
    if (!dateInput || !timeSelect) return;

    const allowedDates = (dateInput.dataset.allowedDates || '')
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);
    const morningOnlyDates = (dateInput.dataset.morningOnlyDates || '')
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);

    const selectedDate = dateInput.value;
    if (!allowedDates.includes(selectedDate)) {
        dateInput.value = allowedDates[0] || selectedDate;
    }

    const currentValue = timeSelect.value;
    const effectiveDate = dateInput.value;
    const isMorningOnly = morningOnlyDates.includes(effectiveDate);

    if (isMorningOnly) {
        timeSelect.innerHTML = '<option value="morning" selected>Matin</option>';
        return;
    }

    window.SecurityUtils.setInnerHTML(timeSelect, `
        <option value="morning">Matin</option>
        <option value="afternoon">AM</option>
    `);

    if (currentValue === 'afternoon') {
        timeSelect.value = 'afternoon';
    } else {
        timeSelect.value = 'morning';
    }
}

/**
 * Accepter une proposition de la société de ménage
 */
async function acceptCompanyProposal(reservationId) {
    try {
        const { data: existingSchedule } = await window.supabaseClient
            .from('cleaning_schedule')
            .select('notes')
            .eq('reservation_id', reservationId)
            .maybeSingle();

        const { error } = await window.supabaseClient
            .from('cleaning_schedule')
            .update({
                status: 'validated',
                validated_by_company: false,
                proposed_by: null,
                notes: addClientValidatedMarker(existingSchedule?.notes || null)
            })
            .eq('reservation_id', reservationId);
        
        if (error) throw error;
        
        showToast('✓ Modification validée par le propriétaire', 'info');
        afficherPlanningParSemaine();
    } catch (error) {
        console.error(error);
        showToast('Erreur: ' + error.message, 'error');
    }
}

/**
 * Refuser une proposition de la société de ménage
 */
async function refuseCompanyProposal(reservationId) {
    const raison = prompt('Raison du refus (optionnel):');
    
    try {
        const { error } = await window.supabaseClient
            .from('cleaning_schedule')
            .update({
                status: 'pending',
                validated_by_company: false,
                proposed_by: null,
                notes: raison || 'Proposition refusée par le site principal'
            })
            .eq('reservation_id', reservationId);
        
        if (error) throw error;
        
        showToast('✗ Proposition refusée', 'info');
        afficherPlanningParSemaine();
    } catch (error) {
        console.error(error);
        showToast('Erreur: ' + error.message, 'error');
    }
}

/**
 * Modifier la date de ménage (proposition du site principal)
 */
async function modifierDateMenage(reservationId) {
    const dateInput = document.getElementById(`date-${reservationId}`);
    const timeSelect = document.getElementById(`time-${reservationId}`);
    
    if (!dateInput || !timeSelect) {
        showToast('Erreur: formulaire introuvable', 'error');
        return;
    }
    
    const newDate = dateInput.value;
    const newTime = timeSelect.value;
    
    if (!newDate) {
        showToast('Veuillez sélectionner une date', 'error');
        return;
    }
    
    try {
        const { data: reservationData, error: reservationError } = await window.supabaseClient
            .from('reservations')
            .select('id, gite_id, date_debut, date_fin')
            .eq('id', reservationId)
            .single();

        if (reservationError || !reservationData) {
            throw new Error('Réservation introuvable');
        }

        const { data: giteReservations, error: giteReservationsError } = await window.supabaseClient
            .from('reservations')
            .select('id, gite_id, date_debut, date_fin')
            .eq('gite_id', reservationData.gite_id)
            .order('date_debut', { ascending: true });

        if (giteReservationsError || !giteReservations) {
            throw new Error('Impossible de vérifier les disponibilités du gîte');
        }

        const normalizedReservations = giteReservations.map(resa => ({
            id: resa.id,
            gite_id: resa.gite_id,
            dateDebut: resa.date_debut,
            dateFin: resa.date_fin
        }));

        const normalizedCurrentReservation = {
            id: reservationData.id,
            gite_id: reservationData.gite_id,
            dateDebut: reservationData.date_debut,
            dateFin: reservationData.date_fin
        };

        const dateWindow = getAllowedCleaningDates(normalizedCurrentReservation, normalizedReservations);
        if (!dateWindow.allowedDates.includes(newDate)) {
            showToast('Date non autorisée : choisissez une date libre entre départ et arrivée suivante', 'error');
            return;
        }

        if (dateWindow.morningOnlyDates.includes(newDate) && newTime !== 'morning') {
            showToast('Créneau non autorisé : cette date est disponible uniquement le matin', 'error');
            return;
        }

        // UPDATE au lieu d'UPSERT pour éviter les conflits RLS
        const { error } = await window.supabaseClient
            .from('cleaning_schedule')
            .update({
                scheduled_date: newDate,
                time_of_day: newTime,
                status: 'pending_validation',
                proposed_by: 'owner',
                validated_by_company: false
            })
            .eq('reservation_id', reservationId);
        
        if (error) throw error;
        
        // Sauvegarder le choix d'horaire
        localStorage.setItem(`cleaning_time_${reservationId}`, newTime);
        
        showToast('📝 Proposition envoyée à la société de ménage', 'success');
        afficherPlanningParSemaine();
    } catch (error) {
        console.error(error);
        showToast('Erreur: ' + error.message, 'error');
    }
}

/**
 * Télécharge le planning ménage en Excel
 */
function telechargerPlanningMenage() {
    if (!window.planningMenageData || window.planningMenageData.length === 0) {
        showToast('⚠️ Générez d\'abord le planning', 'error');
        return;
    }
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(window.planningMenageData);
    XLSX.utils.book_append_sheet(wb, ws, 'Planning Ménage');
    XLSX.writeFile(wb, `Planning_Menage_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('✓ Planning Excel téléchargé !');
}

/**
 * Ouvre la page espace femme de ménage
 */
function ouvrirPageFemmeMenage() {
    window.open('pages/femme-menage.html', '_blank');
}

/**
 * Génère (ou récupère) le lien partageable pour la femme/société de ménage
 * et le copie dans le presse-papier
 */
async function copierLienFemmeMenage() {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) { showToast('Non connecté', 'error'); return; }

        // Chercher un token existant
        let { data: existing, error: existingError } = await window.supabaseClient
            .from('cleaner_tokens')
            .select('token')
            .eq('owner_user_id', user.id)
            .eq('type', 'cleaner')
            .maybeSingle();

        if (existingError) {
            throw existingError;
        }

        if (!existing) {
            // Créer un nouveau token
            const { data: newToken, error } = await window.supabaseClient
                .from('cleaner_tokens')
                .insert({
                    owner_user_id: user.id,
                    label: 'Femme de ménage',
                    type: 'cleaner'
                })
                .select('token')
                .single();
            if (error) throw error;
            existing = newToken;
        }

        const url = `${window.location.origin}/pages/femme-menage.html?token=${existing.token}`;

        try {
            await navigator.clipboard.writeText(url);
            showToast('🔗 Lien copié ! Envoyez-le à votre femme de ménage.', 'success');
        } catch (e) {
            // Fallback si clipboard API non disponible
            prompt('Copiez ce lien et envoyez-le :', url);
        }
    } catch (error) {
        console.error('Erreur génération lien:', error);
        showToast('Erreur lors de la génération du lien', 'error');
    }
}
window.copierLienFemmeMenage = copierLienFemmeMenage;

/**
 * Charge et affiche les retours ménage envoyés par la femme de ménage
 */
async function loadRetoursMenuge() {
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Non connecté');

        // Charger les retours des 30 derniers jours
        const dateDebut = new Date();
        dateDebut.setDate(dateDebut.getDate() - 30);

        const { data: retours, error } = await window.supabaseClient
            .from('retours_menage')
            .select(`
                *,
                gites:gite_id(name)
            `)
            .eq('owner_user_id', user.id)
            .gte('date_menage', dateDebut.toISOString().split('T')[0])
            .order('date_menage', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erreur chargement retours ménage:', error);
            throw error;
        }

        const container = document.getElementById('retoursMenugeList');
        if (!container) return; // Container pas encore chargé

        const card = document.getElementById('card-retours-menage');

        if (!retours || retours.length === 0) {
            if (card) card.style.display = 'none';
            return;
        }

        if (card) {
            card.style.display = 'block';
            const badge = document.getElementById('badge-retours-menage-count');
            if (badge) badge.textContent = retours.length;
        }

        // Construire l'affichage des retours
        let html = '<div style="display: flex; flex-direction: column; gap: 20px;">';
        
        retours.forEach(retour => {
            const giteName = retour.gites?.name || 'Gîte inconnu';
            const dateFormatted = new Date(retour.date_menage).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            const createdAt = new Date(retour.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            html += `
                <div style="border: 2px solid var(--border-color); border-radius: 12px; padding: 25px; background: var(--bg-secondary); box-shadow: var(--shadow);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                        <div style="flex: 1; min-width: 250px;">
                            <div style="font-weight: 800; color: var(--text-primary); font-size: 1.2rem; margin-bottom: 5px;">
                                🏠 ${window.SecurityUtils ? window.SecurityUtils.sanitizeText(giteName) : giteName}
                            </div>
                            <div style="color: var(--text-secondary); font-weight: 600; margin-bottom: 3px;">
                                📅 ${dateFormatted}
                            </div>
                            <div style="color: var(--text-secondary); font-size: 0.85rem;">
                                🕒 Envoyé le ${createdAt}
                            </div>
                        </div>
                        <span class="menage-status-badge menage-status-badge-${retour.validated ? 'validated' : 'pending'}">
                            ${retour.validated ? '✅ Validé' : '⏳ En attente'}
                        </span>
                    </div>
                    ${retour.commentaires ? `
                        <div style="margin-top: 15px; padding: 15px; background: var(--bg-primary); border-radius: 8px; border-left: 3px solid var(--accent-color);">
                            <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                                📝 Observations :
                            </div>
                            <div style="white-space: pre-wrap; font-size: 0.95rem; color: var(--text-primary); line-height: 1.6;">${window.SecurityUtils ? window.SecurityUtils.sanitizeText(retour.commentaires) : retour.commentaires}</div>
                        </div>
                    ` : ''}
                    ${!retour.validated ? `
                        <div style="margin-top: 15px;">
                            <button onclick="validerRetourMenage('${retour.id}')" class="btn-neo btn-validation" style="padding: 10px 20px; font-size: 0.9rem;">
                                <i data-lucide="check"></i> Marquer comme validé
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
        
        window.SecurityUtils.setInnerHTML(container, html, { trusted: true });
        
        // Réinitialiser les icônes Lucide après l'injection HTML
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

    } catch (error) {
        console.error('Erreur chargement retours ménage:', error);
        const container = document.getElementById('retoursMenugeList');
        if (container) {
            const html = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 15px;">⚠️</div>
                    <p>Erreur lors du chargement des retours</p>
                </div>
            `;
            window.SecurityUtils.setInnerHTML(container, html, { trusted: true });
        }
    }
}

/**
 * Valide un retour ménage
 */
async function validerRetourMenage(retourId) {
    try {
        const { error } = await window.supabaseClient
            .from('retours_menage')
            .update({ validated: true })
            .eq('id', retourId);

        if (error) throw error;

        showToast('✅ Retour validé avec succès', 'success');
        
        // Recharger la liste
        await loadRetoursMenuge();
    } catch (error) {
        console.error('Erreur validation retour:', error);
        showToast('❌ Erreur lors de la validation', 'error');
    }
}

// Hook pour charger les retours après le planning
const originalAfficherPlanning = afficherPlanningParSemaine;
if (originalAfficherPlanning) {
    async function afficherPlanningParSemaineAvecRetours() {
        await originalAfficherPlanning();
        // Charger les retours après un court délai pour s'assurer que le DOM est prêt
        setTimeout(() => loadRetoursMenuge(), 500);
    }
    window.afficherPlanningParSemaine = afficherPlanningParSemaineAvecRetours;
}

// Exporter les fonctions dans le scope global
window.calculerDateMenage = calculerDateMenage;
window.isJourFerie = isJourFerie;
window.formatDateShort = formatDateShort;
window.genererPlanningMenage = genererPlanningMenage;
// window.afficherPlanningParSemaine est déjà défini dans le hook ci-dessus
window.generateCleaningItemHTML = generateCleaningItemHTML;
window.telechargerPlanningMenage = telechargerPlanningMenage;
window.ouvrirPageFemmeMenage = ouvrirPageFemmeMenage;
window.acceptCompanyProposal = acceptCompanyProposal;
window.refuseCompanyProposal = refuseCompanyProposal;
window.modifierDateMenage = modifierDateMenage;
window.onMenageDateChanged = onMenageDateChanged;
window.loadRetoursMenuge = loadRetoursMenuge;
window.validerRetourMenage = validerRetourMenage;
