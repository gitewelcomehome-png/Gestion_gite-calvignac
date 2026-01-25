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
    
    // Sauvegarder les dates calculées dans cleaning_schedule (uniquement si inexistant ou pending)
    for (const p of planning) {
        const reservation = relevant.find(r => r.nom === p.clientName && r.gite_id === p.gite_id);
        if (!reservation) continue;
        
        try {
            // Vérifier si l'enregistrement existe déjà
            const { data: existing } = await window.supabaseClient
                .from('cleaning_schedule')
                .select('status, validated_by_company')
                .eq('reservation_id', reservation.id)
                .single();
            
            // Ne mettre à jour que si inexistant ou statut 'pending' (ne pas écraser les validations/propositions)
            if (!existing || existing.status === 'pending') {
                const timeOfDay = p.heure.startsWith('07') || p.heure.startsWith('08') ? 'morning' : 'afternoon';
                
                // Chercher la prochaine réservation
                const nextRes = relevant
                    .filter(r => r.gite === p.gite && parseLocalDate(r.dateDebut) >= p.departDate)
                    .sort((a, b) => parseLocalDate(a.dateDebut) - parseLocalDate(b.dateDebut))[0];
                
                await window.supabaseClient
                    .from('cleaning_schedule')
                    .upsert({
                        reservation_id: reservation.id,
                        owner_user_id: user.id,
                        gite: p.gite,
                        scheduled_date: p.date.toISOString().split('T')[0],
                        time_of_day: timeOfDay,
                        status: 'pending',
                        validated_by_company: false,
                        reservation_end: p.departDate.toISOString().split('T')[0],
                        reservation_start_after: nextRes ? parseLocalDate(nextRes.dateDebut).toISOString().split('T')[0] : null
                    }, { onConflict: 'reservation_id' });
            }
        } catch (error) {
            console.error('Erreur sauvegarde cleaning_schedule:', error);
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
    
    // Charger les gîtes dynamiquement
    const gites = await window.gitesManager.getAll();
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
        
        // Sauvegarder si pas encore fait ou si status pending
        if (!validation || validation.status === 'pending') {
            const nextRes = reservations
                .filter(next => next.gite === r.gite && parseLocalDate(next.dateFin) > dateFin)
                .sort((a, b) => parseLocalDate(a.dateDebut) - parseLocalDate(b.dateDebut))[0];
            
            try {
                // Formater les dates sans décalage UTC
                const scheduledDateStr = `${dateMenage.getFullYear()}-${String(dateMenage.getMonth() + 1).padStart(2, '0')}-${String(dateMenage.getDate()).padStart(2, '0')}`;
                const reservationEndStr = `${dateFin.getFullYear()}-${String(dateFin.getMonth() + 1).padStart(2, '0')}-${String(dateFin.getDate()).padStart(2, '0')}`;
                let nextResDateStr = null;
                if (nextRes) {
                    const nextResDate = parseLocalDate(nextRes.dateFin);
                    nextResDateStr = `${nextResDate.getFullYear()}-${String(nextResDate.getMonth() + 1).padStart(2, '0')}-${String(nextResDate.getDate()).padStart(2, '0')}`;
                }
                
                await window.supabaseClient.from('cleaning_schedule').upsert({
                    owner_user_id: user.id,
                    reservation_id: r.id,
                    gite: r.gite,
                    gite_id: r.gite_id,
                    scheduled_date: scheduledDateStr,
                    time_of_day: calculatedTimeOfDay,
                    status: 'pending',
                    validated_by_company: false,
                    reservation_end: reservationEndStr,
                    reservation_start_after: nextResDateStr
                }, { onConflict: 'reservation_id' });
            } catch (err) {
                console.error('Erreur upsert:', err);
            }
        }
        
        const menageInfo = {
            reservation: r,
            dateMenage: dateMenage,
            validated: validation ? validation.validated_by_company : false,
            proposedDate: validation ? validation.proposed_date : null,
            status: validation ? validation.status : 'pending',
            timeOfDay: validation ? validation.time_of_day : calculatedTimeOfDay,
            proposedBy: validation ? validation.proposed_by : null,
            reservationEndBefore: dateFin,
            reservationStartAfter: null // À calculer
        };
        
        // Debug log pour vérifier les données
        if (validation && validation.status === 'pending_validation') {
            console.log('🔍 menageInfo créé avec proposition:', {
                reservationId: r.id,
                status: validation.status,
                proposedBy: validation.proposed_by,
                hasValidation: !!validation
            });
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
        
        // Adapter l'affichage selon le nombre de gîtes (1 à 4) - COMME RÉSERVATIONS
        let gridStyle;
        let gap = '20px';
        
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
            <div style="background: white; border: 1px solid var(--icalou-border); padding: 0; margin-bottom: 25px; box-shadow: var(--icalou-shadow); border-radius: 16px; overflow: hidden;">
                <div style="${gridStyle} padding: 20px; box-sizing: border-box;">
        `;
        
        // Générer colonnes pour chaque gîte
        const colors = [
            '#667eea', '#f5576c', '#27AE60', '#3498DB', '#E67E22', '#9B59B6'
        ];
        
        gites.forEach((gite, giteIndex) => {
            const menages = week.gitesMenages[gite.id] || [];
            const columnStyle = gites.length === 1 ? 'width: 100%; max-width: 800px;' : '';
            const giteColor = colors[giteIndex % colors.length];
            
            html += `
            <div style="display: flex; flex-direction: column; min-width: 0; ${columnStyle}; flex: 1; overflow: hidden;" data-gite-color="${giteColor}">
                <div style="padding: 12px 20px; background: ${giteColor}; border-radius: 12px 12px 0 0; margin-bottom: 0; border: 1px solid var(--icalou-border); border-bottom: none; box-shadow: var(--icalou-shadow);">
                    <div style="font-size: 0.8rem; margin-bottom: 2px; color: white; font-weight: 600;">${gite.icon || '🏠'} ${gite.name}</div>
                    <div style="font-size: 1rem; margin-bottom: 2px; color: white; font-weight: 700; text-transform: uppercase;">Semaine ${weekNumber}</div>
                    <div style="font-size: 0.8rem; opacity: 0.95; color: white;">${dateFormatted}</div>
                </div>
                <div style="background: white; border: 1px solid var(--icalou-border); border-top: none; border-radius: 0 0 12px 12px; padding: 20px; min-height: 120px; box-shadow: var(--icalou-shadow);">
            `;
            
            if (menages.length === 0) {
                html += '<div style="text-align: center; color: #95a5a6; font-style: italic; padding: 20px;">Aucun ménage prévu</div>';
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
        html = '<p style="text-align: center; color: #999; padding: 40px;">Aucun ménage prévu dans les 12 prochains mois</p>';
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
}

/**
 * Génère le HTML pour une card de ménage - Style original du 10 janvier
 * @param {Object} menageInfo - Informations sur le ménage
 * @returns {string} - HTML de la card
 */
function generateMenageCardHTML(menageInfo) {
    const { reservation, dateMenage, validated, proposedDate, reservationEndBefore, reservationStartAfter, status, timeOfDay, proposedBy } = menageInfo;
    const displayDate = proposedDate ? new Date(proposedDate) : dateMenage;
    
    // Statut
    let statusClass = 'status-pending';
    let statusText = 'Non validé';
    let proposedByCompany = false;
    
    if (validated) {
        statusClass = 'status-validated';
        statusText = 'Validé';
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
    const timeDisplay = savedTime === 'morning' ? '🌅 Matin (avant 12h)' : '🌆 Après-midi (après 12h)';
    
    // Info départ/arrivée
    const departInfo = reservationEndBefore ? reservationEndBefore.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '';
    const arriveeInfo = reservationStartAfter ? reservationStartAfter.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '';
    
    const cardClass = validated ? 'menage-card validated' : (status === 'pending_validation' || status === 'proposed' ? 'menage-card pending-validation' : 'menage-card');
    
    return `
        <div style="background: white; margin-bottom: 15px; padding: 15px; border: 1px solid var(--icalou-border); border-radius: 12px; box-shadow: var(--icalou-shadow-hover); transition: all 0.2s; ${validated ? 'background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border-color: #27ae60; box-shadow: var(--icalou-shadow-hover);' : ''}" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--icalou-shadow-hover)'" onmouseout="this.style.transform=''; this.style.boxShadow='var(--icalou-shadow-hover)'">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-size: 0.95rem; font-weight: 700; color: #2D3436;">📅 ${dateStr}</div>
                <div style="width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 700; border: 1px solid var(--icalou-border); box-shadow: var(--icalou-shadow); background: ${validated ? '#55efc4' : '#ffeaa7'}; color: #2D3436;">
                    ${validated ? '✓' : '⏳'}
                </div>
            </div>
            <div style="font-size: 0.9rem; color: #636e72; margin-bottom: 5px;">
                ${timeDisplay}
            </div>
            ${departInfo ? `<div style="font-size: 0.85rem; color: #666; margin-bottom: 3px;">🚪 Départ: ${departInfo}</div>` : ''}
            ${arriveeInfo ? `<div style="font-size: 0.85rem; color: #666; margin-bottom: 8px;">🔑 Arrivée: ${arriveeInfo}</div>` : ''}
            
            ${proposedByCompany ? `
                <div style="background: #fff3cd; padding: 12px; margin: 10px 0; border: 1px solid #f39c12; border-radius: 8px; box-shadow: var(--icalou-shadow);">
                    <div style="font-weight: 700; color: #856404; margin-bottom: 5px;">📩 Proposition de la société de ménage</div>
                    <div style="font-size: 0.9rem; color: #856404;">Date proposée : <strong>${dateStr}</strong></div>
                    <div style="font-size: 0.9rem; color: #856404;">Horaire : <strong>${timeDisplay}</strong></div>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 10px;">
                    <button onclick="acceptCompanyProposal('${reservation.id}')" style="flex: 1; padding: 8px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; background: #27ae60; color: white; font-size: 0.9rem;">
                        ✓ Accepter
                    </button>
                    <button onclick="refuseCompanyProposal('${reservation.id}')" style="flex: 1; padding: 8px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; background: #e74c3c; color: white; font-size: 0.9rem;">
                        ✗ Refuser
                    </button>
                </div>
            ` : `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;">
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <input type="date" id="date-${reservation.id}" value="${displayDate.toISOString().split('T')[0]}" style="flex: 1; min-width: 120px; padding: 6px 8px; border: 2px solid #ddd; border-radius: 6px; font-size: 0.85rem;">
                        <select id="time-${reservation.id}" style="padding: 6px 8px; border: 2px solid #ddd; border-radius: 6px; font-size: 0.85rem;">
                            <option value="morning" ${savedTime === 'morning' ? 'selected' : ''}>🌅 Matin</option>
                            <option value="afternoon" ${savedTime === 'afternoon' ? 'selected' : ''}>🌆 AM</option>
                        </select>
                        <button onclick="modifierDateMenage('${reservation.id}')" style="padding: 6px 12px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.3s; background: #27ae60; color: white; font-size: 0.85rem;">💾</button>
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

/**
 * Accepter une proposition de la société de ménage
 */
async function acceptCompanyProposal(reservationId) {
    try {
        const { error } = await window.supabaseClient
            .from('cleaning_schedule')
            .update({
                status: 'validated',
                validated_by_company: true,
                proposed_by: null // Réinitialiser après acceptation
            })
            .eq('reservation_id', reservationId);
        
        if (error) throw error;
        
        showToast('✓ Proposition acceptée !', 'success');
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

// Exporter les fonctions dans le scope global
window.calculerDateMenage = calculerDateMenage;
window.isJourFerie = isJourFerie;
window.formatDateShort = formatDateShort;
window.genererPlanningMenage = genererPlanningMenage;
window.afficherPlanningParSemaine = afficherPlanningParSemaine;
window.generateCleaningItemHTML = generateCleaningItemHTML;
window.telechargerPlanningMenage = telechargerPlanningMenage;
window.ouvrirPageFemmeMenage = ouvrirPageFemmeMenage;
window.acceptCompanyProposal = acceptCompanyProposal;
window.refuseCompanyProposal = refuseCompanyProposal;
window.modifierDateMenage = modifierDateMenage;
