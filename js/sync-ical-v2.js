// ================================================================
// SYNCHRONISATION iCAL - VERSION 2.0 PROPRE
// ================================================================
// Logique de synchronisation intelligente :
// - Détection des nouvelles réservations (ajout)
// - Détection des modifications (mise à jour SI manual_override = false)
// - Détection des annulations (UID absent du flux iCal même si manual_override = true)
// - Protection contre écrasement des données modifiées manuellement (manual_override)
// ================================================================

let syncInProgress = false;
let cachedSyncUserId = null;
let cachedSyncUserIdAt = 0;
let lastSyncAttemptAt = 0;

const PERF_SLOW_THRESHOLD_MS = 1200;
const SYNC_GLOBAL_COOLDOWN_MS = 15000;
const SYNC_RATE_LIMIT_KEY = 'sync-ical-global';

function isInternalPerfEnabled() {
    try {
        return localStorage.getItem('internal_perf_enabled') !== '0';
    } catch (_) {
        return true;
    }
}

function recordInternalPerf(metric, payload = {}) {
    if (!isInternalPerfEnabled()) return;

    try {
        if (!Array.isArray(window.__louInternalPerfMetrics)) {
            window.__louInternalPerfMetrics = [];
        }

        const entry = {
            metric,
            ts: new Date().toISOString(),
            ...payload
        };

        window.__louInternalPerfMetrics.push(entry);

        if (window.__louInternalPerfMetrics.length > 500) {
            window.__louInternalPerfMetrics = window.__louInternalPerfMetrics.slice(-500);
        }

        if (Number.isFinite(entry.durationMs) && entry.durationMs >= PERF_SLOW_THRESHOLD_MS) {
            // Métrique lente enregistrée silencieusement (sync iCal externe = normal > 1200ms)
        }
    } catch (_) {
        // no-op
    }
}

window.getInternalPerfMetrics = function() {
    return Array.isArray(window.__louInternalPerfMetrics)
        ? [...window.__louInternalPerfMetrics]
        : [];
};

function canStartSyncNow() {
    const now = Date.now();

    if ((now - lastSyncAttemptAt) < SYNC_GLOBAL_COOLDOWN_MS) {
        const retryAfter = Math.ceil((SYNC_GLOBAL_COOLDOWN_MS - (now - lastSyncAttemptAt)) / 1000);
        return {
            allowed: false,
            reason: 'cooldown',
            retryAfter,
            message: `Synchronisation iCal temporisée (${retryAfter}s).`
        };
    }

    if (window.apiLimiter && typeof window.apiLimiter.canAttempt === 'function') {
        const limiterResult = window.apiLimiter.canAttempt(SYNC_RATE_LIMIT_KEY);
        if (!limiterResult.allowed) {
            return {
                allowed: false,
                reason: 'rate_limited',
                retryAfter: limiterResult.retryAfter || 30,
                message: limiterResult.message || 'Trop de synchronisations iCal rapprochées.'
            };
        }
    }

    lastSyncAttemptAt = now;
    return { allowed: true };
}

async function getSyncUserId() {
    const now = Date.now();
    if (cachedSyncUserId && (now - cachedSyncUserIdAt) < 5 * 60 * 1000) {
        return cachedSyncUserId;
    }

    const userStartedAt = performance.now();
    const { data: userData, error } = await window.supabaseClient.auth.getUser();

    recordInternalPerf('sync_auth_get_user', {
        durationMs: Math.round(performance.now() - userStartedAt),
        ok: !error && !!userData?.user?.id
    });

    if (error || !userData?.user?.id) {
        throw error || new Error('Utilisateur non authentifié');
    }

    cachedSyncUserId = userData.user.id;
    cachedSyncUserIdAt = now;
    return cachedSyncUserId;
}

// 🗑️ Liste des annulations détectées en attente de confirmation
window.pendingCancellations = [];

/**
 * Synchroniser tous les calendriers iCal
 */
async function syncAllCalendars() {
    // console.log('🔄 DÉBUT SYNCHRONISATION iCal');
    const syncStartedAt = performance.now();
    let syncFailed = false;
    
    if (syncInProgress) {
        // console.log('⏸️ Sync déjà en cours, annulation');
        return;
    }

    const syncGate = canStartSyncNow();
    if (!syncGate.allowed) {
        addMessage(`⏸️ ${syncGate.message}`, 'info');
        recordInternalPerf('sync_all_calendars', {
            ok: false,
            blocked: true,
            reason: syncGate.reason,
            retryAfter: syncGate.retryAfter,
            durationMs: 0
        });
        return {
            added: 0,
            updated: 0,
            cancelled: 0,
            skipped: 0,
            errors: 0,
            blocked: true,
            reason: syncGate.reason,
            retryAfter: syncGate.retryAfter
        };
    }

    try {
        syncInProgress = true;
        
        // ✅ RÉINITIALISER la liste des annulations à chaque sync
        window.pendingCancellations = [];

        const gites = await window.gitesManager.getAll();
        // console.log(`📋 ${gites.length} gîte(s) à synchroniser`);
        
        let totalAdded = 0;
        let totalUpdated = 0;
        let totalCancelled = 0;
        let totalSkipped = 0;
        let totalErrors = 0;

        for (const gite of gites) {
            // console.log(`🏠 Synchronisation gîte: ${gite.name} (ID: ${gite.id})`);
            addMessage(`Synchronisation ${gite.name}...`, 'info');
            
            // Récupérer les sources iCal (format unifié objet)
            let icalSources = gite.ical_sources || {};
            // console.log(`  📦 ical_sources pour ${gite.name}:`, typeof icalSources, icalSources);
            
            // NORMALISER : Si array, convertir en objet
            if (Array.isArray(icalSources)) {
                // console.log(`  🔧 Conversion array → objet pour ${gite.name}`);
                const normalized = {};
                icalSources.forEach((item, index) => {
                    if (typeof item === 'object' && item.platform && item.url) {
                        // Format: [{platform: 'airbnb', url: '...'}, ...]
                        normalized[item.platform] = item.url;
                    } else if (typeof item === 'string' && item.startsWith('http')) {
                        // Format: ['https://...', 'http://...'] → deviner plateforme
                        const platform = item.includes('airbnb') ? 'airbnb' 
                                      : item.includes('abritel') ? 'abritel' 
                                      : item.includes('vrbo') ? 'vrbo'
                                      : item.includes('itea') ? 'gites-de-france'
                                      : `plateforme_${index + 1}`;
                        normalized[platform] = item;
                    }
                });
                icalSources = normalized;
                // console.log(`  ✅ Normalisé en:`, icalSources);
            }
            
            // Vérifier que c'est bien un objet après normalisation
            if (typeof icalSources !== 'object' || Array.isArray(icalSources)) {
                console.error(`  ❌ Format ical_sources invalide après normalisation`);
                addMessage(`  ❌ Format ical_sources invalide`, 'error');
                continue;
            }

            const platforms = Object.entries(icalSources).filter(([platform, url]) => url && typeof url === 'string');
            // console.log(`  🔍 Entrées trouvées:`, Object.entries(icalSources));
            // console.log(`  ✅ Entrées valides (url string):`, platforms);

            if (platforms.length === 0) {
                // console.log(`  ℹ️ Aucune source iCal configurée pour ${gite.name}`);
                addMessage(`  ℹ️ Aucune source iCal configurée`, 'info');
                continue;
            }
            
            // console.log(`  📡 ${platforms.length} plateforme(s) configurée(s):`, platforms.map(p => p[0]));

            for (const [platform, url] of platforms) {
                const platformStartedAt = performance.now();
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
                    recordInternalPerf('sync_calendar_platform', {
                        giteId: gite.id,
                        platform,
                        added: result.added,
                        updated: result.updated,
                        cancelled: result.cancelled,
                        skipped: result.skipped,
                        durationMs: Math.round(performance.now() - platformStartedAt),
                        ok: true
                    });
                } catch (error) {
                    totalErrors++;
                    addMessage(`  ✗ ${platform}: ${error.message || 'Erreur'}`, 'error');
                    recordInternalPerf('sync_calendar_platform', {
                        giteId: gite.id,
                        platform,
                        error: error?.message || 'Erreur',
                        durationMs: Math.round(performance.now() - platformStartedAt),
                        ok: false
                    });
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

        // 🚨 Afficher le modal de confirmation des annulations si nécessaire
        if (window.pendingCancellations.length > 0) {
            // ✅ DÉDUPLIQUER par ID avant d'afficher le modal
            const uniqueCancellations = [];
            const seenIds = new Set();
            
            for (const cancel of window.pendingCancellations) {
                if (!seenIds.has(cancel.id)) {
                    seenIds.add(cancel.id);
                    uniqueCancellations.push(cancel);
                }
            }
            
            window.pendingCancellations = uniqueCancellations;
            
            // console.log(`⚠️ ${window.pendingCancellations.length} annulation(s) unique(s) détectée(s) - Affichage modal`);
            showCancellationConfirmationModal();
        } else {
            // console.log('✅ Aucune annulation détectée');
        }

        // console.log(`✅ FIN SYNCHRONISATION - Résumé:`, {
        //     ajoutées: totalAdded,
        //     mises_à_jour: totalUpdated,
        //     annulées: totalCancelled,
        //     ignorées: totalSkipped,
        //     erreurs: totalErrors
        // });

        return {
            added: totalAdded,
            updated: totalUpdated,
            cancelled: totalCancelled,
            skipped: totalSkipped,
            errors: totalErrors
        };

    } catch (error) {
        syncFailed = true;
        console.error('❌ ERREUR sync globale:', error);
        addMessage('❌ Erreur de synchronisation', 'error');
        recordInternalPerf('sync_all_calendars', {
            totalErrors: 1,
            durationMs: Math.round(performance.now() - syncStartedAt),
            ok: false,
            error: error?.message || 'Erreur sync globale'
        });
        return {
            added: 0,
            updated: 0,
            cancelled: 0,
            skipped: 0,
            errors: 1,
            blocked: false,
            reason: 'error'
        };
    } finally {
        if (!syncFailed) {
            recordInternalPerf('sync_all_calendars', {
                durationMs: Math.round(performance.now() - syncStartedAt),
                ok: true
            });
        }
        syncInProgress = false;
        // console.log('🔓 Sync terminée, verrou libéré');
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
    const calendarStartedAt = performance.now();
    const gite = await window.gitesManager.getById(giteId);
    const giteName = gite ? gite.name : 'Inconnu';

    if (typeof url !== 'string' || !url.startsWith('http')) {
        throw new Error(`URL invalide`);
    }

    // Essayer plusieurs proxies CORS
    // 1. Notre proxy Vercel serverless (toujours en premier, échoue silencieusement si absent)
    // 2. Proxies publics (fallback)
    const proxies = [
        { url: `/api/cors-proxy?url=${encodeURIComponent(url)}`, type: 'raw' },
        { url: `https://corsproxy.io/?${encodeURIComponent(url)}`, type: 'raw' },
        { url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, type: 'allorigins' },
        { url: `https://api.codetabs.com/v1/proxy/?quest=${url}`, type: 'raw' }
    ];

    let text;
    let lastError;

    for (const proxy of proxies) {
        try {
            // Utiliser Promise.race avec timeout manuel pour éviter erreurs console
            const fetchPromise = fetch(proxy.url);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 10000)
            );
            
            const response = await Promise.race([fetchPromise, timeoutPromise]);
            if (!response.ok) {
                // Erreur HTTP normale (404, 500, etc.) - continuer avec proxy suivant
                continue;
            }

            if (proxy.type === 'allorigins') {
                // allorigins /get retourne {"contents":"...","status":{...}}
                const json = await response.json();
                text = json && json.contents ? json.contents : null;
            } else {
                text = await response.text();
            }

            if (!text || !text.includes('BEGIN:VCALENDAR')) {
                // Réponse invalide - continuer avec proxy suivant
                text = null;
                continue;
            }

            // Succès !
            break;
        } catch (err) {
            lastError = err;
            // Erreurs réseau/timeout silencieuses - continuer avec le proxy suivant
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

        // console.log(`  📥 Parsing flux iCal: ${vevents.length} événement(s) trouvé(s)`);

        // ==========================================
        // ÉTAPE 1 : CHARGER LES RÉSERVATIONS BDD
        // ==========================================
        const today = new Date().toISOString().split('T')[0];
        // console.log(`  📊 Chargement BDD (gîte: ${giteName}, plateforme: ${platform}, date: ${today})`);
        
        const dbLoadStartedAt = performance.now();

        const { data: existingReservations, error: dbError } = await window.supabaseClient
            .from('reservations')
            .select('id, check_in, check_out, status, manual_override, ical_uid, last_seen_in_ical, client_name')
            .eq('gite_id', giteId)
            .eq('synced_from', platform)
            .gte('check_out', today); // Toutes les réservations futures (y compris cancelled pour éviter doublons)

        recordInternalPerf('sync_calendar_db_load', {
            giteId,
            platform,
            rows: Array.isArray(existingReservations) ? existingReservations.length : 0,
            durationMs: Math.round(performance.now() - dbLoadStartedAt),
            ok: !dbError
        });
        
        if (dbError) {
            console.error(`  ❌ Erreur lecture BDD: ${dbError?.message || 'Erreur inconnue'} (code: ${dbError?.code || 'n/a'})`);
            return { added: 0, updated: 0, cancelled: 0, skipped: 0 };
        }

        // console.log(`  💾 ${existingReservations?.length || 0} réservation(s) trouvée(s) en BDD`);
        
        // Indexer par DATES uniquement (logique simplifiée)
        const bddByDates = {}; // { "2026-03-06|2026-03-08": [...réservations...] }
        if (existingReservations) {
            existingReservations.forEach(r => {
                const dateKey = `${r.check_in}|${r.check_out}`;
                if (!bddByDates[dateKey]) {
                    bddByDates[dateKey] = [];
                }
                bddByDates[dateKey].push(r);
                // const statusEmoji = r.status === 'cancelled' ? '❌' : '✅';
                // console.log(`    ${statusEmoji} BDD: ${r.client_name} → ${r.check_in} au ${r.check_out} (${r.status})`);
            });
        }
        
        // ==========================================
        // ÉTAPE 2 : TRAITER CHAQUE ÉVÉNEMENT iCAL
        // ==========================================
        const icalDates = new Set(); // Tracker les dates présentes dans iCal
        
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
                continue;
            }

            const dateDebut = formatDateForIcal(dtstart);
            const dateFin = formatDateForIcal(dtend);
            const dateKey = `${dateDebut}|${dateFin}`;

            // ⏳ IGNORER LES ÉVÉNEMENTS PASSÉS (check_out < aujourd'hui)
            if (dateFin < today) {
                continue; // Silencieux - pas besoin de logguer chaque événement passé
            }

            // Marquer ces dates comme présentes dans iCal
            icalDates.add(dateKey);
            
            // console.log(`    📅 iCal: ${summary} → ${dateDebut} au ${dateFin}`);

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

            // ==========================================
            // LOGIQUE SIMPLE : DATES EN BDD ?
            // ==========================================
            const reservationsAvecCesDates = bddByDates[dateKey];
            
            if (reservationsAvecCesDates && reservationsAvecCesDates.length > 0) {
                // ✅ DATES DÉJÀ EN BDD
                const existing = reservationsAvecCesDates[0]; // Prendre la première
                
                if (existing.manual_override) {
                    // Protection : ne jamais toucher aux réservations manuelles
                    skipped++;
                    // console.log(`      ⏭️ Ignorée (manual_override)`);
                } else if (existing.status === 'cancelled') {
                    // Réservation annulée mais réapparue dans iCal → RÉACTIVER
                    skipped++;
                    // console.log(`      ⚠️ Ignorée (déjà cancelled, ne pas réactiver)`);
                } else {
                    // Mise à jour normale
                    try {
                        await updateReservationFromIcal(existing.id, reservation);
                        updated++;
                        // console.log(`      ✏️ Mise à jour`);
                    } catch (error) {
                        console.error(`❌ Erreur mise à jour ${summary}:`, error);
                    }
                }
            } else {
                // ⭕ DATES LIBRES → NOUVELLE RÉSERVATION
                try {
                    await addReservationFromIcal(reservation);
                    added++;
                    // console.log(`      ➕ Ajoutée`);
                } catch (error) {
                    console.error(`❌ Erreur insertion ${summary}:`, error);
                }
            }
        }

        // ==========================================
        // ÉTAPE 3 : DÉTECTER LES ANNULATIONS
        // ==========================================
        // console.log(`  🔎 Détection annulations:`);
        // console.log(`    - ${Object.keys(bddByDates).length} plage(s) de dates en BDD`);
        // console.log(`    - ${icalDates.size} plage(s) de dates dans iCal`);
        
        for (const [dateKey, reservations] of Object.entries(bddByDates)) {
            const [checkIn, checkOut] = dateKey.split('|');
            
            // ✅ DATES EN BDD mais PAS DANS iCAL → ANNULATION POTENTIELLE
            if (!icalDates.has(dateKey)) {
                // Filtrer : ne proposer l'annulation que pour les réservations actives
                const reservationsActives = reservations.filter(r => {
                    if (r.status === 'cancelled') return false;  // Déjà annulée
                    if (r.manual_override) return false;         // Protégée manuellement
                    if (!r.ical_uid) return false;               // Créée manuellement dans l'app (pas d'ical_uid)

                    // Délai de grâce 48h : les flux GdF peuvent être en cache
                    // Si la réservation était encore présente dans le flux il y a moins de 48h,
                    // ne pas la flagguer comme annulée (temporairement absente du flux)
                    if (r.last_seen_in_ical) {
                        const heuresDepuisDerniereSeen = (Date.now() - new Date(r.last_seen_in_ical).getTime()) / (1000 * 3600);
                        if (heuresDepuisDerniereSeen < 48) return false; // Grâce 48h
                    }

                    return true;
                });
                
                if (reservationsActives.length > 0) {
                    // console.log(`    🗑️ ANNULATION: ${checkIn} → ${checkOut} (${reservationsActives.length} réservation(s))`);
                    
                    // Ajouter au modal d'annulation
                    const idsToDelete = reservationsActives.map(r => r.id);
                    window.pendingCancellations.push({
                        id: reservationsActives[0].id,
                        allIds: idsToDelete,
                        client_name: reservationsActives[0].client_name || 'Client inconnu',
                        check_in: checkIn,
                        check_out: checkOut,
                        platform: platform,
                        gite_id: giteId,
                        hasDoublons: reservationsActives.length > 1
                    });
                    cancelled++;
                } else {
                    // console.log(`    ⏭️ Ignorée: ${checkIn} → ${checkOut} (déjà cancelled ou manual_override)`);
                }
            }
        }
        
        // console.log(`  📊 Résultat: ${added} ajoutées, ${updated} mises à jour, ${cancelled} annulées, ${skipped} ignorées`);

        const result = { added, updated, cancelled, skipped };

        recordInternalPerf('sync_calendar_total', {
            giteId,
            platform,
            ...result,
            durationMs: Math.round(performance.now() - calendarStartedAt),
            ok: true
        });

        return result;

    } catch (error) {
        console.error(`Erreur parsing iCal ${giteName}/${platform}:`, error);
        recordInternalPerf('sync_calendar_total', {
            giteId,
            platform,
            durationMs: Math.round(performance.now() - calendarStartedAt),
            ok: false,
            error: error?.message || 'Erreur parsing iCal'
        });
        throw error;
    }
}

/**
 * Ajouter une réservation depuis iCal
 */
async function addReservationFromIcal(reservation) {
    const ownerUserId = await getSyncUserId();
    
    const result = await window.supabaseClient
        .from('reservations')
        .insert({
            owner_user_id: ownerUserId,
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

    if (typeof window.autoResolveCleaningConflictForReservation === 'function') {
        await window.autoResolveCleaningConflictForReservation(result.data.id);
    }
    
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

    if (typeof window.autoResolveCleaningConflictForReservation === 'function') {
        await window.autoResolveCleaningConflictForReservation(reservationId);
    }
    
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
 * 🚨 Afficher le modal de confirmation des annulations détectées
 */
async function showCancellationConfirmationModal() {
    const cancellations = window.pendingCancellations;
    if (!cancellations || cancellations.length === 0) return;

    // console.log('📢 Affichage modal annulations:', cancellations);

    // Créer le modal
    const modal = document.createElement('div');
    modal.id = 'cancellation-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        animation: fadeIn 0.3s ease-out;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 650px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.3s ease-out;
        position: relative;
    `;

    // Ajouter styles d'animation
    if (!document.getElementById('modal-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-animation-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    // Grouper par gîte
    const gitesMap = {};
    cancellations.forEach(c => {
        if (!gitesMap[c.gite_id]) gitesMap[c.gite_id] = [];
        gitesMap[c.gite_id].push(c);
    });

    // Construire le contenu HTML
    let html = `
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
            <div style="
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
            ">⚠️</div>
            <div>
                <h2 style="margin: 0; color: #d32f2f; font-size: 24px;">Annulations détectées</h2>
                <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">
                    ${cancellations.length} réservation${cancellations.length > 1 ? 's ont' : ' a'} disparu des flux iCal
                </p>
            </div>
        </div>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 16px; margin-bottom: 24px; border-radius: 6px;">
            <strong style="color: #856404;">📋 Que s'est-il passé ?</strong><br>
            <span style="color: #856404; font-size: 14px;">
                Ces réservations ne sont plus présentes dans vos calendriers iCal Airbnb/Abritel.
                Cela signifie généralement qu'elles ont été annulées sur la plateforme.
            </span>
        </div>
    `;

    // Afficher les annulations par gîte
    html += `<div style="max-height: 300px; overflow-y: auto; margin-bottom: 24px;">`;
    
    for (const [giteId, resaList] of Object.entries(gitesMap)) {
        html += `<div style="margin-bottom: 20px; border: 2px solid #fef2f2; border-radius: 10px; padding: 16px; background: #fef2f2;">`;
        
        // Récupérer le nom du gîte
        let giteName = `Gîte ${giteId}`;
        if (window.gitesManager) {
            const gites = await window.gitesManager.getAll();
            const gite = gites.find(g => g.id === giteId);
            if (gite) giteName = gite.name;
        }
        
        html += `<strong style="display: block; margin-bottom: 12px; font-size: 16px; color: #333;">🏠 ${giteName}</strong>`;
        
        resaList.forEach(r => {
            const dateDebut = new Date(r.check_in).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
            const dateFin = new Date(r.check_out).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
            
            const doublonBadge = r.hasDoublons ? 
                '<span style="background: #ff9800; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">⚠️ DOUBLON</span>' 
                : '';
            
            html += `
                <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid #d32f2f;">
                    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${r.client_name} ${doublonBadge}</div>
                    <div style="font-size: 13px; color: #666; display: flex; gap: 16px; flex-wrap: wrap;">
                        <span>📅 ${dateDebut} → ${dateFin}</span>
                        ${r.platform ? `<span style="background: #e3f2fd; padding: 2px 8px; border-radius: 4px; color: #1976d2;">🔗 ${r.platform}</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    }
    
    html += `</div>`;

    html += `
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="btn-cancel-ignore" style="
                padding: 12px 24px;
                border: 2px solid #ddd;
                background: white;
                border-radius: 8px;
                cursor: pointer;
                font-size: 15px;
                font-weight: 500;
                color: #666;
                transition: all 0.2s;
            " onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='white'">
                ❌ Ignorer pour l'instant
            </button>
            <button id="btn-cancel-confirm" style="
                padding: 12px 24px;
                border: none;
                background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
                color: white;
                border-radius: 8px;
                cursor: pointer;
                font-size: 15px;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
                transition: all 0.2s;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(211, 47, 47, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(211, 47, 47, 0.3)'">
                ✅ Confirmer les annulations
            </button>
        </div>
    `;

    modalContent.innerHTML = html;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // console.log('✅ Modal ajoutée au DOM');

    // Événements
    document.getElementById('btn-cancel-ignore').addEventListener('click', () => {
        // console.log('🚫 Annulations ignorées par l\'utilisateur');
        window.pendingCancellations = [];
        document.body.removeChild(modal);
    });

    document.getElementById('btn-cancel-confirm').addEventListener('click', async () => {
        const btn = document.getElementById('btn-cancel-confirm');
        btn.disabled = true;
        btn.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⏳</span> Annulation en cours...';
        
        const style = document.createElement('style');
        style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
        document.head.appendChild(style);

        // console.log(`🔄 Confirmation: annulation de ${cancellations.length} réservation(s)`);

        let success = 0;
        let errors = 0;

        for (const cancellation of cancellations) {
            try {
                // ✅ Supprimer TOUS les IDs (y compris doublons)
                const idsToDelete = cancellation.allIds || [cancellation.id];
                
                for (const id of idsToDelete) {
                    await cancelReservation(id);
                    success++;
                }
            } catch (error) {
                console.error('❌ Erreur annulation:', error);
                errors++;
            }
        }

        window.pendingCancellations = [];
        window.invalidateCache('reservations');
        
        // Rafraîchir la liste si on est dans Réservations
        if (typeof updateReservationsList === 'function') {
            await updateReservationsList(false);
        }

        document.body.removeChild(modal);
        
        if (typeof showToast === 'function') {
            if (errors === 0) {
                showToast(`✅ ${success} réservation(s) annulée(s)`, 'success');
            } else {
                showToast(`⚠️ ${success} annulée(s), ${errors} erreur(s)`, 'warning');
            }
        }

        // console.log(`✅ Annulation terminée: ${success} succès, ${errors} erreurs`);
    });
}

/**
 * 📅 Afficher la dernière synchronisation iCal
 */
function updateLastSyncDisplay() {
    const lastSync = localStorage.getItem('lastIcalSync');
    if (!lastSync) {
        const dashboardEl = document.getElementById('last-sync-dashboard');
        const reservationsEl = document.getElementById('last-sync-reservations');
        if (dashboardEl) dashboardEl.textContent = '🔄 Aucune sync';
        if (reservationsEl) reservationsEl.textContent = '🔄 Aucune sync';
        return;
    }

    const date = new Date(lastSync);
    
    // Format: "11/02/2026 à 15:45"
    const timeText = date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    });

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
