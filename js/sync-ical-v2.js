// ================================================================
// SYNCHRONISATION iCAL - VERSION 2.0 PROPRE
// ================================================================
// Logique de synchronisation intelligente :
// - Détection des nouvelles réservations (ajout)
// - Détection des modifications (mise à jour SI manual_override = false)
// - Détection des annulations (disparition du flux iCal)
// - Protection des réservations modifiées manuellement
// ================================================================

let syncInProgress = false;

/**
 * Synchroniser tous les calendriers iCal
 */
async function syncAllCalendars() {
    if (syncInProgress) {
        console.log('⏳ Synchronisation déjà en cours, ignorée');
        return;
    }

    try {
        syncInProgress = true;
        console.log('🔒 Verrou de synchronisation activé');

        const gites = await window.gitesManager.getAll();
        
        let totalAdded = 0;
        let totalUpdated = 0;
        let totalCancelled = 0;
        let totalSkipped = 0;
        let totalErrors = 0;

        for (const gite of gites) {
            addMessage(`Synchronisation ${gite.name}...`, 'info');
            
            // Récupérer les sources iCal (format unifié objet)
            const icalSources = gite.ical_sources || {};
            
            // Vérifier que c'est bien un objet
            if (typeof icalSources !== 'object' || Array.isArray(icalSources)) {
                addMessage(`  ❌ Format ical_sources invalide (utilisez l'interface pour corriger)`, 'error');
                continue;
            }

            const platforms = Object.entries(icalSources).filter(([platform, url]) => url && typeof url === 'string');

            if (platforms.length === 0) {
                addMessage(`  ℹ️ Aucune source iCal configurée`, 'info');
                continue;
            }

            for (const [platform, url] of platforms) {
                try {
                    addMessage(`  • ${platform}...`, 'info');
                    const result = await syncCalendar(gite.id, platform, url);
                    totalAdded += result.added;
                    totalUpdated += result.updated;
                    totalCancelled += result.cancelled;
                    totalSkipped += result.skipped;
                    
                    const msg = [
                        `${result.added} ajoutées`,
                        result.updated > 0 ? `${result.updated} mises à jour` : null,
                        result.cancelled > 0 ? `${result.cancelled} annulées` : null,
                        `${result.skipped} ignorées`
                    ].filter(Boolean).join(', ');
                    
                    addMessage(`  ✓ ${platform}: ${msg}`, 'success');
                } catch (error) {
                    totalErrors++;
                    addMessage(`  ✗ ${platform}: ${error.message || 'Erreur'}`, 'error');
                }
            }
        }

        addMessage('', 'info');
        addMessage(`✓ Synchronisation terminée !`, 'success');
        
        const summary = [
            `${totalAdded} ajoutées`,
            totalUpdated > 0 ? `${totalUpdated} mises à jour` : null,
            totalCancelled > 0 ? `${totalCancelled} annulées` : null,
            `${totalSkipped} ignorées`,
            totalErrors > 0 ? `${totalErrors} erreurs` : null
        ].filter(Boolean).join(', ');
        
        addMessage(`📊 Total: ${summary}`, 'success');

        if (totalAdded > 0 || totalUpdated > 0) {
            addMessage('', 'info');
            addMessage(`⚠️ RAPPEL: Les iCal publics ne contiennent PAS les noms des clients (RGPD)`, 'info');
            addMessage(`💡 Allez dans "Réservations" → "⚠️ Compléter" pour ajouter les noms`, 'info');
        }

        return {
            added: totalAdded,
            updated: totalUpdated,
            cancelled: totalCancelled,
            skipped: totalSkipped,
            errors: totalErrors
        };

    } catch (error) {
        console.error('Erreur sync globale:', error);
        addMessage('❌ Erreur de synchronisation', 'error');
        throw error;
    } finally {
        syncInProgress = false;
        console.log('🔓 Verrou de synchronisation libéré');
    }
}

/**
 * Synchroniser un calendrier iCal spécifique
 * @param {string} giteId - ID du gîte
 * @param {string} platform - Nom de la plateforme
 * @param {string} url - URL du flux iCal
 * @returns {Promise<{added: number, updated: number, cancelled: number, skipped: number}>}
 */
async function syncCalendar(giteId, platform, url) {
    const gite = await window.gitesManager.getById(giteId);
    const giteName = gite ? gite.name : 'Inconnu';

    if (typeof url !== 'string' || !url.startsWith('http')) {
        throw new Error(`URL invalide`);
    }

    // Essayer plusieurs proxies CORS
    const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy/?quest=${url}`
    ];

    let text;
    let lastError;

    for (const proxyUrl of proxies) {
        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            text = await response.text();

            if (!text.includes('BEGIN:VCALENDAR')) {
                throw new Error('Réponse invalide');
            }

            break;
        } catch (err) {
            lastError = err;
            continue;
        }
    }

    if (!text) {
        throw new Error(`Tous les proxies ont échoué. Dernière erreur: ${lastError?.message}`);
    }

    try {
        const jcalData = ICAL.parse(text);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');

        let added = 0;
        let updated = 0;
        let cancelled = 0;
        let skipped = 0;

        // Map pour tracker les ical_uid présents dans le flux
        const presentUids = new Set();

        // 1. RÉCUPÉRER TOUTES LES RÉSERVATIONS EXISTANTES de ce gîte + plateforme
        const { data: existingReservations } = await window.supabaseClient
            .from('reservations')
            .select('*')
            .eq('gite_id', giteId)
            .eq('synced_from', platform);

        const existingByUid = {};
        if (existingReservations) {
            existingReservations.forEach(r => {
                if (r.ical_uid) {
                    existingByUid[r.ical_uid] = r;
                }
            });
        }

        // 2. TRAITER CHAQUE ÉVÉNEMENT DU FLUX iCal
        for (const vevent of vevents) {
            const event = new ICAL.Event(vevent);

            const uid = event.uid;
            const summary = event.summary || '⚠️ Client Airbnb';
            const dtstart = event.startDate;
            const dtend = event.endDate;

            if (!dtstart || !dtend) continue;

            const dateDebut = formatDateForIcal(dtstart);
            const dateFin = formatDateForIcal(dtend);

            // Marquer ce UID comme présent
            presentUids.add(uid);

            // Déterminer le site (nom affiché de la plateforme)
            let site;
            if (platform.toLowerCase().includes('airbnb')) site = 'Airbnb';
            else if (platform.toLowerCase().includes('abritel')) site = 'Abritel';
            else if (platform.toLowerCase().includes('gites')) site = 'Gîtes de France (centrale)';
            else site = platform;

            const reservation = {
                gite: giteId,
                giteId: giteId,
                nom: summary,
                nomClient: summary,
                telephone: '',
                provenance: '',
                dateDebut: dateDebut,
                dateFin: dateFin,
                nuits: calculateNights(dateDebut, dateFin),
                nbPersonnes: 0,
                montant: 0,
                acompte: 0,
                restant: 0,
                paiement: 'En attente',
                site: site,
                timestamp: new Date().toISOString(),
                syncedFrom: platform,
                icalUid: uid
            };

            // Vérifier si la réservation existe déjà
            const existing = existingByUid[uid];

            if (!existing) {
                // NOUVELLE RÉSERVATION → AJOUTER
                try {
                    await addReservationFromIcal(reservation);
                    added++;
                } catch (error) {
                    console.error(`❌ Erreur insertion ${summary}:`, error);
                }
            } else {
                // RÉSERVATION EXISTANTE
                if (existing.manual_override) {
                    // Si modifiée manuellement → NE PAS TOUCHER
                    skipped++;
                } else {
                    // Sinon → METTRE À JOUR (dates, prix...)
                    try {
                        await updateReservationFromIcal(existing.id, reservation);
                        updated++;
                    } catch (error) {
                        console.error(`❌ Erreur mise à jour ${summary}:`, error);
                    }
                }
            }
        }

        // 3. DÉTECTER LES ANNULATIONS (réservations absentes du flux)
        for (const [uid, existing] of Object.entries(existingByUid)) {
            if (!presentUids.has(uid) && !existing.manual_override) {
                // Réservation disparue du flux iCal → ANNULÉE
                try {
                    await cancelReservation(existing.id);
                    cancelled++;
                } catch (error) {
                    console.error(`❌ Erreur annulation ${existing.client_name}:`, error);
                }
            }
        }

        return { added, updated, cancelled, skipped };

    } catch (error) {
        console.error(`Erreur parsing iCal ${giteName}/${platform}:`, error);
        throw error;
    }
}

/**
 * Ajouter une réservation depuis iCal
 */
async function addReservationFromIcal(reservation) {
    const { data: userData } = await window.supabaseClient.auth.getUser();
    
    const { error } = await window.supabaseClient
        .from('reservations')
        .insert({
            owner_user_id: userData.user.id,
            gite_id: reservation.giteId,
            check_in: reservation.dateDebut,
            check_out: reservation.dateFin,
            platform: reservation.site,
            total_price: reservation.montant,
            client_name: reservation.nom,
            client_phone: reservation.telephone || null,
            client_email: null,
            client_address: reservation.provenance || null,
            guest_count: reservation.nbPersonnes,
            paid_amount: reservation.acompte,
            notes: null,
            status: 'confirmed',
            source: 'ical',
            synced_from: reservation.syncedFrom,
            ical_uid: reservation.icalUid,
            last_seen_in_ical: new Date().toISOString(),
            manual_override: false
        });

    if (error) throw error;
    window.invalidateCache('reservations');
}

/**
 * Mettre à jour une réservation depuis iCal
 */
async function updateReservationFromIcal(reservationId, newData) {
    const { error } = await window.supabaseClient
        .from('reservations')
        .update({
            check_in: newData.dateDebut,
            check_out: newData.dateFin,
            client_name: newData.nom,
            last_seen_in_ical: new Date().toISOString()
        })
        .eq('id', reservationId);

    if (error) throw error;
    window.invalidateCache('reservations');
}

/**
 * Annuler une réservation (disparue du flux iCal)
 */
async function cancelReservation(reservationId) {
    const { error } = await window.supabaseClient
        .from('reservations')
        .update({
            status: 'cancelled',
            notes: 'Annulée automatiquement (disparue du flux iCal)'
        })
        .eq('id', reservationId);

    if (error) throw error;
    window.invalidateCache('reservations');
}

/**
 * Formater une date ICAL en YYYY-MM-DD
 */
function formatDateForIcal(icalTime) {
    const year = icalTime.year;
    const month = String(icalTime.month).padStart(2, '0');
    const day = String(icalTime.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Calculer le nombre de nuits
 */
function calculateNights(dateDebut, dateFin) {
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    const diff = end - start;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Ajouter un message dans l'UI
 */
function addMessage(message, type = 'info') {
    const messagesDiv = document.getElementById('sync-messages');
    if (!messagesDiv) return;

    const p = document.createElement('p');
    p.textContent = message;
    p.className = type;
    messagesDiv.appendChild(p);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Rendre la fonction globale
window.syncAllCalendars = syncAllCalendars;
