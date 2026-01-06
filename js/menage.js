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
function calculerDateMenage(reservation, toutesReservations) {
    const departDate = parseLocalDate(reservation.dateFin || reservation.date_fin);
    const departDay = departDate.getDay(); // 0=dimanche, 6=samedi
    
    let menageDate = new Date(departDate);
    let heure = '12h00'; // Par défaut après-midi
    
    // Vérifier s'il y a une arrivée le jour du départ
    const arriveeMemejour = toutesReservations.find(r => 
        r.gite === reservation.gite && 
        r.id !== reservation.id &&
        parseLocalDate(r.dateDebut || r.date_debut).toDateString() === departDate.toDateString()
    );
    
    // RÈGLE 1: Dimanche - Reporter au lundi (sauf enchainement)
    if (departDay === 0) {
        if (arriveeMemejour) {
            // Exception: enchainement dimanche
            heure = '13h00';
        } else {
            // Reporter au lundi
            menageDate.setDate(menageDate.getDate() + 1);
            
            const arriveeLundi = toutesReservations.find(r => 
                r.gite === reservation.gite && 
                r.id !== reservation.id &&
                parseLocalDate(r.dateDebut || r.date_debut).toDateString() === menageDate.toDateString()
            );
            
            heure = arriveeLundi ? '07h00' : '12h00';
        }
    }
    // RÈGLE 2: Samedi - Vérifier réservation samedi/dimanche avant de décider
    else if (departDay === 6) {
        if (arriveeMemejour) {
            heure = '12h00'; // Après-midi même si enchainement
        } else {
            // Vérifier s'il y a une réservation samedi soir ou dimanche soir
            const samediDate = new Date(departDate);
            const dimancheDate = new Date(departDate);
            dimancheDate.setDate(dimancheDate.getDate() + 1);
            
            const resaSamediOuDimanche = toutesReservations.find(r =>
                r.gite === reservation.gite &&
                r.id !== reservation.id &&
                (parseLocalDate(r.dateDebut || r.date_debut).toDateString() === samediDate.toDateString() ||
                 parseLocalDate(r.dateDebut || r.date_debut).toDateString() === dimancheDate.toDateString())
            );
            
            if (resaSamediOuDimanche) {
                // Il y a une réservation samedi ou dimanche → ménage le samedi
                heure = '12h00';
            } else {
                // Pas de réservation samedi/dimanche → reporter au lundi
                menageDate.setDate(menageDate.getDate() + 2);
                
                const arriveeLundi = toutesReservations.find(r => 
                    r.gite === reservation.gite && 
                    r.id !== reservation.id &&
                    parseLocalDate(r.dateDebut || r.date_debut).toDateString() === menageDate.toDateString()
                );
                
                heure = arriveeLundi ? '07h00' : '12h00';
            }
        }
    }
    // RÈGLE 3: Mercredi ou Jeudi - Vérifier réservation avant vendredi
    else if (departDay === 3 || departDay === 4) { // 3=mercredi, 4=jeudi
        if (arriveeMemejour) {
            // Il y a un enchainement → ménage le jour même
            heure = '12h00';
        } else {
            // Vérifier s'il y a une réservation jeudi ou vendredi (avant le vendredi)
            const jeudiDate = new Date(departDate);
            if (departDay === 3) {
                jeudiDate.setDate(jeudiDate.getDate() + 1); // Si départ mercredi, vérifier jeudi
            }
            const vendrediDate = new Date(departDate);
            const joursAajouter = departDay === 3 ? 2 : 1; // Mercredi +2 = vendredi, Jeudi +1 = vendredi
            vendrediDate.setDate(vendrediDate.getDate() + joursAajouter);
            
            const resaAvantVendredi = toutesReservations.find(r =>
                r.gite === reservation.gite &&
                r.id !== reservation.id &&
                (parseLocalDate(r.dateDebut || r.date_debut) < vendrediDate)
            );
            
            if (resaAvantVendredi) {
                // Il y a une réservation avant vendredi → ménage le jour du départ
                heure = '12h00';
            } else {
                // Pas de réservation avant vendredi → reporter au vendredi
                menageDate.setDate(menageDate.getDate() + joursAajouter);
                
                const arriveeVendredi = toutesReservations.find(r =>
                    r.gite === reservation.gite &&
                    r.id !== reservation.id &&
                    parseLocalDate(r.dateDebut || r.date_debut).toDateString() === menageDate.toDateString()
                );
                
                heure = arriveeVendredi ? '07h00' : '12h00';
            }
        }
    }
    // RÈGLE 4: Autres jours semaine (Lun, Mar, Ven) - Après-midi TOUJOURS
    else {
        heure = '12h00'; // TOUJOURS après-midi en semaine
    }
    
    // Vérifier jour férié (sauf enchainement même jour)
    if (!arriveeMemejour && isJourFerie(menageDate)) {
        do {
            menageDate.setDate(menageDate.getDate() + 1);
        } while (isJourFerie(menageDate) || menageDate.getDay() === 0);
    }
    
    const joursComplets = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return `${joursComplets[menageDate.getDay()]} ${formatDateShort(menageDate)} à ${heure}`;
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
    // Charger d'abord les propositions en attente
    await chargerPropositionsEnAttente();
    
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
        const dateMenageFormatted = calculerDateMenage(r, relevant);
        
        // Parser le résultat pour extraire la date et l'heure
        // Format: "Lundi 23 déc. à 12h00"
        const match = dateMenageFormatted.match(/(\w+) (\d+) (\w+)\. à (\d+h\d+)/);
        if (!match) return;
        
        const [_, jourNom, jour, mois, heure] = match;
        
        // Reconstruire la date du ménage
        const moisMap = {
            'janv': 0, 'févr': 1, 'mars': 2, 'avr': 3, 'mai': 4, 'juin': 5,
            'juil': 6, 'août': 7, 'sept': 8, 'oct': 9, 'nov': 10, 'déc': 11
        };
        
        const menageDate = new Date(departDate);
        menageDate.setMonth(moisMap[mois]);
        menageDate.setDate(parseInt(jour));
        
        // Si le mois du ménage est < mois du départ, c'est l'année suivante
        if (menageDate < departDate) {
            menageDate.setFullYear(menageDate.getFullYear() + 1);
        }
        
        // Vérifier enchainement
        const arriveeMemejour = relevant.find(resa => 
            resa.gite === r.gite && 
            resa.id !== r.id &&
            parseLocalDate(resa.dateDebut).toDateString() === departDate.toDateString()
        );
        
        planning.push({
            date: menageDate,
            heure: heure,
            gite: r.gite,
            clientName: r.nom,
            departDate: departDate,
            enchainement: arriveeMemejour ? true : false
        });
    });
    
    if (planning.length === 0) {
        showToast('Aucun ménage à planifier', 'error');
        return;
    }
    
    // Sauvegarder les dates calculées dans cleaning_schedule (uniquement si inexistant ou pending)
    for (const p of planning) {
        const reservation = relevant.find(r => r.nom === p.clientName && r.gite === p.gite);
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
    menageDiv.innerHTML = html;
    
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
 * Affiche le planning de ménage organisé par semaines avec colonnes Trévoux/Couzon
 */
async function afficherPlanningParSemaine() {
    const reservations = await getAllReservations();
    
    // Récupérer les validations de la société de ménage
    const { data: cleaningSchedules } = await window.supabaseClient
        .from('cleaning_schedule')
        .select('*');
    
    const validationMap = {};
    let pendingModifications = 0;
    if (cleaningSchedules) {
        cleaningSchedules.forEach(cs => {
            validationMap[cs.reservation_id] = cs;
            if (cs.status === 'proposed') {
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
        const dateMenageFormatted = calculerDateMenage(r, relevant);
        
        // Parser le résultat "Lundi 23 déc. à 12h00"
        const match = dateMenageFormatted.match(/(\w+) (\d+) (\w+)\. à (\d+h\d+)/);
        let dateMenage;
        let calculatedTimeOfDay;
        
        if (match) {
            const [_, jourNom, jour, mois, heure] = match;
            const moisMap = {
                'janv': 0, 'févr': 1, 'mars': 2, 'avr': 3, 'mai': 4, 'juin': 5,
                'juil': 6, 'août': 7, 'sept': 8, 'oct': 9, 'nov': 10, 'déc': 11
            };
            
            dateMenage = new Date(dateFin);
            dateMenage.setMonth(moisMap[mois]);
            dateMenage.setDate(parseInt(jour));
            
            if (dateMenage < dateFin) {
                dateMenage.setFullYear(dateMenage.getFullYear() + 1);
            }
            
            calculatedTimeOfDay = (heure.startsWith('07') || heure.startsWith('08')) ? 'morning' : 'afternoon';
        } else {
            dateMenage = new Date(dateFin);
            calculatedTimeOfDay = 'afternoon';
        }
        
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
                trevoux: [],
                couzon: []
            };
        }
        
        // Sauvegarder si pas encore fait ou si status pending
        if (!validation || validation.status === 'pending') {
            const nextRes = reservations
                .filter(next => next.gite === r.gite && parseLocalDate(next.dateFin) > dateFin)
                .sort((a, b) => parseLocalDate(a.dateDebut) - parseLocalDate(b.dateDebut))[0];
            
            try {
                await window.supabaseClient.from('cleaning_schedule').upsert({
                    reservation_id: r.id,
                    gite: r.gite,
                    scheduled_date: dateMenage.toISOString().split('T')[0],
                    time_of_day: calculatedTimeOfDay,
                    status: 'pending',
                    validated_by_company: false,
                    reservation_end: dateFin.toISOString().split('T')[0],
                    reservation_start_after: nextRes ? parseLocalDate(nextRes.dateFin).toISOString().split('T')[0] : null
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
            reservationEndBefore: dateFin,
            reservationStartAfter: null // À calculer
        };
        
        // Chercher la réservation suivante pour ce gîte
        const nextReservation = reservations
            .filter(next => next.gite === r.gite && parseLocalDate(next.dateDebut) > dateFin)
            .sort((a, b) => parseLocalDate(a.dateDebut) - parseLocalDate(b.dateDebut))[0];
        
        if (nextReservation) {
            menageInfo.reservationStartAfter = parseLocalDate(nextReservation.dateDebut);
        }
        
        // Ajouter dans la bonne colonne
        if (r.gite.toLowerCase().includes('trévoux') || r.gite.toLowerCase().includes('trevoux')) {
            weeks[weekKey].trevoux.push(menageInfo);
        } else {
            weeks[weekKey].couzon.push(menageInfo);
        }
    }
    
    // Trier les semaines
    const sortedWeeks = Array.from(weekStarts).sort();
    
    // Générer le HTML
    let html = '<div style="margin-top: 20px;">';
    
    console.log('🧹 GÉNÉRATION PLANNING MÉNAGE');
    console.log('📊 Nombre de semaines:', sortedWeeks.length);
    
    sortedWeeks.forEach((weekKey, index) => {
        const week = weeks[weekKey];
        const monday = week.monday;
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        console.log(`\n📅 Semaine ${index + 1}:`, weekKey);
        console.log('  🏡 Trévoux:', week.trevoux.length, 'ménages');
        console.log('  ⛰️ Couzon:', week.couzon.length, 'ménages');
        
        // Calculer le vrai numéro de semaine de l'année
        const weekNumber = `S${getWeekNumber(monday)}`;
        const weekDisplay = `${monday.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} - ${sunday.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`;
        
        html += `
            <div class="cleaning-week-table">
                <div class="cleaning-week-header">
                    <div class="week-number-big">${weekNumber}</div>
                    <div class="week-dates-small">${weekDisplay}</div>
                </div>
                <div class="cleaning-week-body">
                    <div class="cleaning-column">
                        <div class="cleaning-column-header">🏡 Trévoux</div>
                        ${week.trevoux.length > 0 ? 
                            week.trevoux.map(m => generateCleaningItemHTML(m)).join('') :
                            '<div class="cleaning-item empty">Aucun ménage prévu</div>'
                        }
                    </div>
                    <div class="cleaning-column">
                        <div class="cleaning-column-header couzon">⛰️ Couzon</div>
                        ${week.couzon.length > 0 ? 
                            week.couzon.map(m => generateCleaningItemHTML(m)).join('') :
                            '<div class="cleaning-item empty">Aucun ménage prévu</div>'
                        }
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    console.log('\n📝 HTML généré, longueur:', html.length, 'caractères');
    
    const menagePlanning = document.getElementById('menagePlanningWeeks');
    if (menagePlanning) {
        console.log('✅ Conteneur trouvé, insertion HTML...');
        // Utilisation directe de innerHTML car HTML généré par le code, pas par utilisateur
        menagePlanning.innerHTML = html;
        console.log('✅ HTML inséré !');
        
        // Vérifier le résultat
        setTimeout(() => {
            const weekBodies = document.querySelectorAll('.cleaning-week-body');
            console.log('🔍 Vérification: nombre de .cleaning-week-body trouvés:', weekBodies.length);
            weekBodies.forEach((body, i) => {
                const style = window.getComputedStyle(body);
                console.log(`  Semaine ${i + 1}: grid-template-columns =`, style.gridTemplateColumns);
                console.log(`  Semaine ${i + 1}: display =`, style.display);
            });
        }, 100);
    } else {
        console.error('❌ ERREUR: Conteneur #menagePlanningWeeks non trouvé !');
    }
}

/**
 * Génère le HTML pour un élément de ménage
 * @param {Object} menageInfo - Informations sur le ménage
 * @returns {string} - HTML de l'élément
 */
function generateCleaningItemHTML(menageInfo) {
    const { reservation, dateMenage, validated, proposedDate, reservationEndBefore, reservationStartAfter, status, timeOfDay } = menageInfo;
    const displayDate = proposedDate ? new Date(proposedDate) : dateMenage;
    
    // Icône et badge de statut
    let statusIcon = '';
    if (validated) {
        statusIcon = '<span class="validation-status validated" title="Validé par société">✓</span>';
    } else if (status === 'proposed') {
        statusIcon = '<span class="validation-status pending" title="En attente validation">⏳</span>';
    } else {
        statusIcon = '<span class="validation-status notvalidated" title="À valider">✗</span>';
    }
    
    const dateStr = displayDate.toLocaleDateString('fr-FR', { 
        weekday: 'short', 
        day: '2-digit', 
        month: 'short' 
    });
    
    const savedTime = timeOfDay || localStorage.getItem(`cleaning_time_${reservation.id}`) || 'afternoon';
    const timeDisplay = savedTime === 'morning' ? '🌅 Matin' : '🌇 Après-midi';
    
    return `
        <div class="cleaning-item ${validated ? 'validated' : ''}">
            ${statusIcon}
            <div class="cleaning-date-time">
                📅 ${dateStr} ${timeDisplay}
            </div>
            <div class="cleaning-client">${reservation.nom}</div>
            <div class="cleaning-actions">
                <button onclick="toggleCleaningTime(${reservation.id})" class="btn-icon" title="Changer l'horaire">
                    ⏰
                </button>
            </div>
        </div>
    `;
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
    window.open('femme-menage.html', '_blank');
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
