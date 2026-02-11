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

// 🗑️ Liste des annulations récentes (pour affichage notification)
window.recentCancellations = [];

/**
 * Synchroniser tous les calendriers iCal
 */
async function syncAllCalendars() {
    if (syncInProgress) {
        return;
    }

    try {
        syncInProgress = true;

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

        // 📅 Stocker la date de dernière synchronisation
        localStorage.setItem('lastIcalSync', new Date().toISOString());

        // Mettre à jour l'affichage
        if (typeof updateLastSyncDisplay === 'function') {
            updateLastSyncDisplay();
        }

        // 🚨 Notifier des annulations détectées
        if (totalCancelled > 0 && window.recentCancellations.length > 0) {
            showCancellationNotification(window.recentCancellations);
            window.recentCancellations = [];
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
    // 1. Notre proxy Vercel serverless (priorité)
    // 2. Proxies publics (fallback)
    const proxies = [
        `/api/cors-proxy?url=${encodeURIComponent(url)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy/?quest=${url}`
    ];

    let text;
    let lastError;

    for (const proxyUrl of proxies) {
        try {
            // Utiliser Promise.race avec timeout manuel pour éviter erreurs console
            const fetchPromise = fetch(proxyUrl);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 10000)
            );
            
            const response = await Promise.race([fetchPromise, timeoutPromise]);
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
            // Erreurs réseau silencieuses - continuer avec le proxy suivant
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

            // 🚫 IGNORER LES BLOCKED / NOT AVAILABLE / INDISPONIBLE
            const summaryLower = summary.toLowerCase();
            if (summaryLower.includes('blocked') || 
                summaryLower.includes('not available') || 
                summaryLower.includes('indisponible') ||
                summaryLower.includes('unavailable')) {
                skipped++;
                continue;
            }

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
                // Réservation disparue du flux iCal → Annuler immédiatement
                try {
                    await cancelReservation(existing.id);
                    
                    // Stocker pour notification
                    window.recentCancellations.push({
                        client_name: existing.client_name || 'Client Airbnb',
                        check_in: existing.check_in,
                        check_out: existing.check_out,
                        platform: existing.synced_from || existing.platform
                    });
                    
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
    
    const result = await window.supabaseClient
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
        })
        .select()
        .single();

    if (result.error) throw result.error;
    
    // 🚗 Automatisation des trajets kilométriques
    if (result.data && typeof window.KmManager?.creerTrajetsAutoReservation === 'function') {
        try {
            await window.KmManager.creerTrajetsAutoReservation(result.data);
        } catch (kmError) {
            console.error('⚠️ Erreur création trajets auto:', kmError);
            // Ne pas bloquer la création de réservation si les trajets échouent
        }
    }
    
    window.invalidateCache('reservations');
}

/**
 * Mettre à jour une réservation depuis iCal
 */
async function updateReservationFromIcal(reservationId, newData) {
    // Récupérer la réservation complète avant mise à jour
    const { data: oldResa } = await window.supabaseClient
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();
    
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
    
    // 🚗 Si les dates ont changé, recréer les trajets auto
    if (oldResa && (oldResa.check_in !== newData.dateDebut || oldResa.check_out !== newData.dateFin)) {
        if (typeof window.KmManager?.supprimerTrajetsAutoReservation === 'function' &&
            typeof window.KmManager?.creerTrajetsAutoReservation === 'function') {
            try {
                // Supprimer les anciens trajets auto
                await window.KmManager.supprimerTrajetsAutoReservation(reservationId);
                
                // Récupérer la réservation mise à jour
                const { data: updatedResa } = await window.supabaseClient
                    .from('reservations')
                    .select('*')
                    .eq('id', reservationId)
                    .single();
                
                if (updatedResa) {
                    // Recréer les trajets avec les nouvelles dates
                    await window.KmManager.creerTrajetsAutoReservation(updatedResa);
                }
            } catch (kmError) {
                console.error('⚠️ Erreur mise à jour trajets auto:', kmError);
            }
        }
    }
    
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
    
    // 🚗 Supprimer les trajets auto liés à cette réservation
    if (typeof window.KmManager?.supprimerTrajetsAutoReservation === 'function') {
        try {
            await window.KmManager.supprimerTrajetsAutoReservation(reservationId);
        } catch (kmError) {
            console.error('⚠️ Erreur suppression trajets auto:', kmError);
        }
    }
    
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

/**
 * 🚨 Afficher notification des annulations détectées
 */
function showCancellationNotification(cancellations) {
    if (!cancellations || cancellations.length === 0) return;

    // Créer le toast de notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(238, 90, 111, 0.4);
        z-index: 9999;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;

    let message = `⚠️ <strong>${cancellations.length} annulation(s) détectée(s)</strong><br>`;
    message += `<small style="opacity: 0.9; font-size: 0.9em;">`;
    
    if (cancellations.length <= 3) {
        cancellations.forEach(c => {
            const dateDebut = new Date(c.check_in).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
            message += `<br>• ${c.client_name} (${dateDebut})`;
        });
    } else {
        message += `Les réservations disparues des flux iCal ont été marquées comme annulées.`;
    }
    
    message += `</small>`;
    toast.innerHTML = message;

    // Ajouter styles pour l'animation
    if (!document.getElementById('toast-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-animation-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Supprimer après 8 secondes
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 8000);

    // Rafraîchir la liste si on est dans Réservations
    setTimeout(() => {
        if (typeof updateReservationsList === 'function') {
            updateReservationsList(false);
        }
    }, 1000);
}

/**
 * 📅 Afficher la dernière synchronisation iCal
 */
function updateLastSyncDisplay() {
    const lastSync = localStorage.getItem('lastIcalSync');
    if (!lastSync) return;

    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    let timeText;
    if (diffMins < 1) {
        timeText = "À l'instant";
    } else if (diffMins === 1) {
        timeText = "Il y a 1 min";
    } else if (diffMins < 60) {
        timeText = `Il y a ${diffMins} min`;
    } else {
        const hours = Math.floor(diffMins / 60);
        if (hours === 1) {
            timeText = "Il y a 1h";
        } else if (hours < 24) {
            timeText = `Il y a ${hours}h`;
        } else {
            timeText = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        }
    }

    // Mettre à jour les deux endroits
    const dashboardEl = document.getElementById('last-sync-dashboard');
    const reservationsEl = document.getElementById('last-sync-reservations');

    if (dashboardEl) {
        dashboardEl.textContent = `🔄 Dernière sync: ${timeText}`;
    }
    if (reservationsEl) {
        reservationsEl.textContent = `🔄 Dernière sync: ${timeText}`;
    }
}

// Rendre la fonction globale
window.syncAllCalendars = syncAllCalendars;
window.updateLastSyncDisplay = updateLastSyncDisplay;
