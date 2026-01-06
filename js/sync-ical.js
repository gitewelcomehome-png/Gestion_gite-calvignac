/**
 * 📅 MODULE SYNCHRONISATION iCAL
 * Gestion de la synchronisation des calendriers iCal externes
 * (Airbnb, Abritel, Gîtes de France, etc.)
 */

// ==========================================
// 🔄 SYNCHRONISATION CALENDRIERS
// ==========================================

/**
 * Synchronise tous les calendriers iCal configurés
 * Met à jour les réservations depuis Airbnb, Abritel, etc.
 */
async function syncAllCalendars() {
    // Recharger les configs depuis localStorage
    window.ICAL_CONFIGS = getIcalConfigs();
    
    // Réinitialiser les erreurs
    window.SYNC_ERRORS = [];
    
    const syncBtn = document.getElementById('syncBtn');
    const syncProgress = document.getElementById('syncProgress');
    const syncMessages = document.getElementById('syncMessages');
    const syncStatus = document.getElementById('syncStatus');
    const syncStatusIcon = document.getElementById('syncStatusIcon');
    const syncStatusText = document.getElementById('syncStatusText');
    
    // Réinitialiser les erreurs
    window.SYNC_ERRORS = [];
    
    // Afficher le statut
    if (syncStatus) {
        syncStatus.style.display = 'block';
        syncStatus.style.background = '#fff3cd';
        syncStatusIcon.textContent = '🔄';
        syncStatusText.textContent = 'Synchronisation en cours...';
    }
    
    if (syncBtn) syncBtn.disabled = true;
    if (syncProgress) {
        syncProgress.style.display = 'block';
        window.SecurityUtils.setInnerHTML(syncMessages, '');
    }
    
    let totalAdded = 0;
    let totalSkipped = 0;
    let totalDeleted = 0;
    let totalErrors = 0;
    
    function addMessage(text, type = 'info') {
        if (!syncMessages) return;
        const msg = document.createElement('div');
        msg.className = `progress-item ${type}`;
        window.SecurityUtils.setInnerHTML(msg, type === 'info' ? `<span class="spinner"></span> ${text}` : `✓ ${text}`);
        syncMessages.appendChild(msg);
    }
    
    try {
        addMessage('Synchronisation Couzon...', 'info');
        for (const [platform, url] of Object.entries(window.ICAL_CONFIGS.couzon)) {
            if (!url) continue;
            try {
                addMessage(`  • ${platform}...`, 'info');
                const result = await syncCalendar('Couzon', platform, url);
                totalAdded += result.added;
                totalSkipped += result.skipped;
                totalDeleted += result.deleted;
                const deletedMsg = result.deleted > 0 ? `, ${result.deleted} supprimées` : '';
                addMessage(`  ✓ ${platform}: ${result.added} ajoutées, ${result.skipped} ignorées${deletedMsg}`, 'success');
            } catch (error) {
                totalErrors++;
                if (!window.SYNC_ERRORS) window.SYNC_ERRORS = [];
                window.SYNC_ERRORS.push({ gite: 'Couzon', platform, error: error.message || 'Erreur inconnue' });
                addMessage(`  ✗ ${platform}: ${error.message || 'Erreur'}`, 'error');
            }
        }
        
        addMessage('Synchronisation Trévoux...', 'info');
        for (const [platform, url] of Object.entries(window.ICAL_CONFIGS.trevoux)) {
            if (!url) continue;
            try {
                addMessage(`  • ${platform}...`, 'info');
                const result = await syncCalendar('Trévoux', platform, url);
                totalAdded += result.added;
                totalSkipped += result.skipped;
                totalDeleted += result.deleted;
                const deletedMsg = result.deleted > 0 ? `, ${result.deleted} supprimées` : '';
                addMessage(`  ✓ ${platform}: ${result.added} ajoutées, ${result.skipped} ignorées${deletedMsg}`, 'success');
            } catch (error) {
                totalErrors++;
                if (!window.SYNC_ERRORS) window.SYNC_ERRORS = [];
                window.SYNC_ERRORS.push({ gite: 'Trévoux', platform, error: error.message || 'Erreur inconnue' });
                addMessage(`  ✗ ${platform}: ${error.message || 'Erreur'}`, 'error');
            }
        }
        
        addMessage('', 'info');
        addMessage(`✓ Synchronisation terminée !`, 'success');
        const deletedMsg = totalDeleted > 0 ? `, ${totalDeleted} supprimées` : '';
        addMessage(`📊 Total: ${totalAdded} ajoutées, ${totalSkipped} ignorées${deletedMsg}, ${totalErrors} erreurs`, 'success');
        
        if (totalDeleted > 0) {
            addMessage('', 'info');
            addMessage(`🗑️ ${totalDeleted} réservation(s) annulée(s) ont été supprimées automatiquement`, 'info');
        }
        
        if (totalAdded > 0) {
            addMessage('', 'info');
            addMessage(`⚠️ IMPORTANT: Les iCal publics ne contiennent PAS les noms des clients (RGPD)`, 'info');
            addMessage(`💡 Allez dans "Réservations" et cliquez "⚠️ Compléter" pour ajouter les noms`, 'info');
        }
        
        // 🚨 Afficher une alerte détaillée si des flux iCal sont en échec
        if (totalErrors > 0 && window.SYNC_ERRORS.length > 0) {
            addMessage('', 'info');
            addMessage('🚨 FLUX iCAL EN ÉCHEC:', 'error');
            window.SYNC_ERRORS.forEach(err => {
                addMessage(`  • ${err.gite} - ${err.platform}: ${err.error}`, 'error');
            });
            addMessage('', 'info');
            addMessage('🔧 SOLUTION: Les URLs iCal ne fonctionnent plus.', 'error');
            addMessage('   Allez dans ⚙️ Paramètres iCal pour les mettre à jour avec les nouvelles URLs de vos comptes Airbnb/Abritel.', 'error');
        }
        
        await updateReservationsList();
        await updateStats();
        
        // Mettre à jour le statut en haut
        if (syncStatus) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            
            if (totalErrors > 0) {
                syncStatus.style.background = '#f8d7da';
                syncStatusIcon.textContent = '🚨';
                const errorDetails = window.SYNC_ERRORS.map(e => `${e.gite} ${e.platform}`).join(', ');
                window.SecurityUtils.setInnerHTML(syncStatusText, `<strong>⚠️ ${totalErrors} flux iCal en échec</strong><br><small>${errorDetails}</small><br><small style="color: #721c24;">🔧 Allez dans ⚙️ Paramètres iCal pour mettre à jour les URLs</small>`);
            } else {
                syncStatus.style.background = '#d4edda';
                syncStatusIcon.textContent = '✓';
                syncStatusText.textContent = `Dernière synchronisation réussie : ${dateStr} à ${timeStr} (${totalAdded} réservations ajoutées)`;
            }
            
            // Sauvegarder le statut
            localStorage.setItem('lastSyncStatus', JSON.stringify({
                date: now.toISOString(),
                added: totalAdded,
                errors: totalErrors
            }));
        }
        
        showToast(`✓ Sync terminée : ${totalAdded} réservations ajoutées`);
        
    } catch (error) {
        addMessage('✗ Erreur générale', 'error');
        if (syncStatus) {
            syncStatus.style.background = '#f8d7da';
            syncStatusIcon.textContent = '❌';
            syncStatusText.textContent = 'Erreur lors de la synchronisation';
        }
        showToast('❌ Erreur sync', 'error');
        console.error(error);
    }
    
    if (syncBtn) syncBtn.disabled = false;
}

/**
 * Synchronise un calendrier iCal spécifique
 * @param {string} gite - Nom du gîte ('Couzon' ou 'Trévoux')
 * @param {string} platform - Nom de la plateforme (ex: 'Airbnb', 'Abritel')
 * @param {string} url - URL du flux iCal
 * @returns {Promise<{added: number, skipped: number}>} - Résultat de la synchronisation
 */
async function syncCalendar(gite, platform, url) {
    // Essayer plusieurs proxies CORS en cascade
    const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ];
    
    let text;
    let lastError;
    
    // Essayer chaque proxy jusqu'à ce qu'un fonctionne
    for (const proxyUrl of proxies) {
        try {
            console.log(`🔄 Tentative avec proxy: ${proxyUrl.split('?')[0]}`);
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            text = await response.text();
            
            // Vérifier que c'est bien du iCal, pas une page d'erreur HTML
            if (!text.includes('BEGIN:VCALENDAR')) {
                throw new Error('Réponse invalide (pas de VCALENDAR)');
            }
            
            console.log(`✅ Proxy réussi: ${proxyUrl.split('?')[0]}`);
            break; // Proxy fonctionne, sortir de la boucle
        } catch (err) {
            lastError = err;
            console.warn(`⚠️ Proxy échoué: ${proxyUrl.split('?')[0]} - ${err.message}`);
            continue; // Essayer le prochain proxy
        }
    }
    
    // Si aucun proxy n'a fonctionné
    if (!text) {
        throw new Error(`Tous les proxies ont échoué. Dernière erreur: ${lastError?.message}`);
    }
    
    try {
        const jcalData = ICAL.parse(text);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');
        
        console.log(`🔍 ========== DÉBUT ANALYSE iCal ${gite} / ${platform} ==========`);
        console.log(`📊 Nombre total d'événements dans le flux: ${vevents.length}`);
        
        let added = 0;
        let skipped = 0;
        let deleted = 0;
        
        // 🗑️ ÉTAPE 1 : Récupérer les réservations existantes de cette plateforme pour ce gîte
        const existingReservations = await getAllReservations();
        
        // Filtrer par gîte et plateforme (si le champ syncedFrom existe)
        // Sinon, utiliser plateforme pour identifier les réservations de cette source
        const platformReservations = existingReservations.filter(r => {
            if (r.gite !== gite) return false;
            
            // Vérifier si syncedFrom existe et correspond
            if (r.syncedFrom) {
                return r.syncedFrom === platform;
            }
            
            // Fallback : utiliser le champ 'plateforme' pour identifier la source
            const plateforme = (r.plateforme || '').toLowerCase();
            const platformLower = platform.toLowerCase();
            
            if (platformLower.includes('airbnb')) {
                return plateforme.includes('airbnb');
            } else if (platformLower.includes('abritel') || platformLower.includes('homelidays')) {
                return plateforme.includes('abritel') || plateforme.includes('homelidays');
            } else if (platformLower.includes('gites')) {
                return plateforme.includes('gîtes de france') || plateforme.includes('gites de france');
            }
            
            return false;
        });
        
        console.log(`📋 Réservations existantes pour ${gite} / ${platform}: ${platformReservations.length}`);
        console.log(`🔍 DEBUG - Total réservations ${gite}: ${existingReservations.filter(r => r.gite === gite).length}`);
        platformReservations.forEach(r => {
            console.log(`   • ${r.dateDebut} → ${r.dateFin} | ${r.nomClient || r.nom} | Plateforme: "${r.plateforme}" | SyncedFrom: "${r.syncedFrom || 'NON DÉFINI'}"`);
        });
        
        // Créer un Set des IDs de réservations trouvées dans le flux iCal
        const foundReservationIds = new Set();
        
        // 🔍 AFFICHER TOUS LES ÉVÉNEMENTS BRUTS AVANT FILTRAGE
        console.log(`\n📋 LISTE COMPLÈTE DES ÉVÉNEMENTS (avant filtrage):`);
        vevents.forEach((vevent, index) => {
            const event = new ICAL.Event(vevent);
            const summary = event.summary || '';
            const dateDebut = dateToLocalString(event.startDate.toJSDate());
            const dateFin = dateToLocalString(event.endDate.toJSDate());
            console.log(`   ${index + 1}. "${summary}" | ${dateDebut} → ${dateFin}`);
        });
        console.log(`\n🔄 DÉBUT DU TRAITEMENT:\n`);
        
        for (const vevent of vevents) {
            const event = new ICAL.Event(vevent);
            
            const summary = event.summary || '';
            const description = event.description || '';
            
            // 🇫🇷 CORRECTION TIMEZONE : Ne pas utiliser toISOString() qui convertit en UTC !
            // Utiliser dateToLocalString pour garder l'heure locale française
            const dateDebut = dateToLocalString(event.startDate.toJSDate());
            const dateFin = dateToLocalString(event.endDate.toJSDate());
            
            // � LOG DÉTAILLÉ pour déboguer
            console.log(`📅 Événement iCal: "${summary}" | ${gite} | ${dateDebut} → ${dateFin}`);
            
            // 🚫 IGNORER LES BLOCAGES MANUELS (pas des vraies réservations)
            // Airbnb, Abritel etc. envoient des événements "Blocked" ou "Not available" pour les dates bloquées
            // Aussi ignorer les événements très courts (< 2 jours) qui sont souvent des blocages techniques
            const blockTerms = [
                'blocked', 'bloqué', 'bloque',
                'not available', 'indisponible', 'unavailable',
                'airbnb (not available)', 'airbnb blocked',
                'préparation', 'preparation', 'cleaning', 'ménage',
                'maintenance', 'travaux'
            ];
            const isBlocked = blockTerms.some(term => 
                summary.toLowerCase().includes(term) || 
                description.toLowerCase().includes(term)
            );
            
            // Ignorer aussi les réservations de moins de 2 nuits (souvent des blocages techniques)
            const nuits = calculateNights(dateDebut, dateFin);
            
            if (isBlocked) {
                console.log(`   🚫 → BLOCAGE IGNORÉ: "${summary}"`);
                skipped++;
                continue;
            }
            
            if (nuits < 2) {
                console.log(`   🚫 → DURÉE TROP COURTE IGNORÉE: ${nuits} nuit(s)`);
                skipped++;
                continue;
            }
            
            // Nom du client (rarement disponible dans les iCal publics pour confidentialité)
            let nom = 'À COMPLÉTER';
            
            // Vérifier si le summary contient un vrai nom (pas juste "Réservé", "Busy", etc.)
            const genericTerms = ['réservé', 'reserved', 'busy', 'occupé'];
            const isGeneric = genericTerms.some(term => summary.toLowerCase().includes(term));
            
            if (summary && !isGeneric && summary.length > 3) {
                // Semble être un vrai nom
                nom = summary;
            } else {
                // Nom générique selon plateforme
                if (platform.toLowerCase().includes('airbnb')) {
                    nom = '⚠️ Client Airbnb';
                } else if (platform.toLowerCase().includes('abritel') || platform.toLowerCase().includes('homelidays')) {
                    nom = '⚠️ Client Abritel';
                } else if (platform.toLowerCase().includes('gites')) {
                    nom = '⚠️ Client Gîtes de France';
                }
            }
            
            // Extraction du tarif depuis la description
            let montant = 0;
            
            // Patterns de recherche de prix
            const pricePatterns = [
                /(?:total|montant|price|amount)[:\s]*(\d+[,.]?\d*)\s*€/i,
                /€\s*(\d+[,.]?\d*)/,
                /(\d+[,.]?\d*)\s*€/,
                /(\d{2,4}[,.]?\d{0,2})\s*EUR/i
            ];
            
            for (const pattern of pricePatterns) {
                const match = description.match(pattern);
                if (match) {
                    const price = match[1].replace(',', '.');
                    montant = parseFloat(price);
                    if (montant > 0 && montant < 10000) break; // Prix raisonnable trouvé
                }
            }
            
            // Si toujours pas de tarif, chercher dans le summary aussi
            if (montant === 0) {
                const summaryMatch = summary.match(/(\d{2,4}[,.]?\d{0,2})\s*€/);
                if (summaryMatch) {
                    montant = parseFloat(summaryMatch[1].replace(',', '.'));
                }
            }
            
            // Vérifier doublon ou mise à jour d'une réservation existante
            const existingResa = platformReservations.find(r => 
                r.dateDebut === dateDebut && r.dateFin === dateFin
            );
            
            if (existingResa) {
                // Marquer cette réservation comme toujours présente
                foundReservationIds.add(existingResa.id);
                
                // 🔒 PROTECTION ABSOLUE : Ne JAMAIS écraser une réservation avec nom personnalisé
                const hasCustomName = existingResa.nom && 
                    !existingResa.nom.includes('Client') && 
                    !existingResa.nom.includes('BOOKED') && 
                    !existingResa.nom.includes('Reserved');
                
                if (hasCustomName) {
                    console.log(`🔒 Réservation protégée (nom personnalisé): ${gite} du ${dateDebut} au ${dateFin} - ${existingResa.nom}`);
                } else {
                    console.log(`♻️ Réservation existante confirmée: ${gite} du ${dateDebut} au ${dateFin} - ${nom}`);
                }
                skipped++;
                continue;
            }
            
            // Vérifier chevauchement avec d'autres réservations (pas de cette plateforme)
            const hasOverlap = await checkDateOverlap(gite, dateDebut, dateFin, null, platform);
            if (hasOverlap) {
                console.log(`⏭️ Réservation ignorée (chevauchement avec autre source): ${gite} du ${dateDebut} au ${dateFin} - ${nom}`);
                skipped++;
                continue;
            }
            
            console.log(`✅ Nouvelle réservation détectée: ${gite} du ${dateDebut} au ${dateFin} - ${nom}`);
            
            // Déterminer site
            let site;
            if (platform.toLowerCase().includes('airbnb')) site = 'Airbnb';
            else if (platform.toLowerCase().includes('abritel') || platform.toLowerCase().includes('homelidays')) site = 'Abritel';
            else if (platform.toLowerCase().includes('gites')) site = 'Gîtes de France (centrale)';
            else site = platform;
            
            const reservation = {
                gite: gite,
                nom: nom,
                telephone: '', // Téléphone vide, à remplir manuellement
                provenance: '',
                dateDebut: dateDebut,
                dateFin: dateFin,
                nuits: calculateNights(dateDebut, dateFin),
                nbPersonnes: 0,
                montant: montant,
                acompte: 0,
                restant: montant,
                paiement: 'En attente',
                site: site,
                timestamp: new Date().toISOString(),
                syncedFrom: platform
            };
            
            await addReservation(reservation);
            added++;
        }
        
        // 🗑️ ÉTAPE 2 : Détecter les réservations annulées (plus dans le flux iCal)
        // ⚠️ PROTECTION : Ne jamais supprimer automatiquement - demander confirmation
        // ⚠️ PROTECTION : Ne jamais supprimer les réservations enrichies
        // ⚠️ PROTECTION : Ne jamais supprimer les réservations d'une AUTRE plateforme
        
        const canceledReservations = [];
        
        for (const oldResa of platformReservations) {
            if (!foundReservationIds.has(oldResa.id)) {
                // 🛡️ SÉCURITÉ : Vérifier que cette réservation appartient VRAIMENT à cette plateforme
                const resaPlatform = (oldResa.syncedFrom || oldResa.plateforme || '').toLowerCase();
                const currentPlatform = platform.toLowerCase();
                
                let belongsToThisPlatform = false;
                if (currentPlatform.includes('airbnb')) {
                    belongsToThisPlatform = resaPlatform.includes('airbnb');
                } else if (currentPlatform.includes('abritel') || currentPlatform.includes('homelidays')) {
                    belongsToThisPlatform = resaPlatform.includes('abritel') || resaPlatform.includes('homelidays');
                } else if (currentPlatform.includes('gites')) {
                    belongsToThisPlatform = resaPlatform.includes('gites') || resaPlatform.includes('gîtes');
                } else {
                    belongsToThisPlatform = resaPlatform === currentPlatform;
                }
                
                if (!belongsToThisPlatform) {
                    console.log(`🛡️ PROTECTION: Réservation d'une autre plateforme (${resaPlatform}) - NON supprimée: ${gite} du ${oldResa.dateDebut} au ${oldResa.dateFin} - ${oldResa.nom}`);
                    continue;
                }
                
                // 🔒 Vérifier si la réservation a un nom personnalisé (= protégée)
                const hasCustomName = oldResa.nom && 
                    !oldResa.nom.includes('Client') && 
                    !oldResa.nom.includes('BOOKED') && 
                    !oldResa.nom.includes('Reserved');
                
                console.log(`🔍 ANALYSE PROTECTION: ${oldResa.nom}`);
                console.log(`   - Nom personnalisé: ${hasCustomName}`);
                console.log(`   => PROTÉGÉE: ${hasCustomName}`);
                
                if (hasCustomName) {
                    console.log(`🔒 Conservation réservation avec nom personnalisé: ${gite} du ${oldResa.dateDebut} au ${oldResa.dateFin} - ${oldResa.nom}`);
                    continue;
                }
                
                // ⚠️ Cette réservation a été annulée (plus dans le flux iCal)
                console.log(`⚠️ Réservation annulée détectée: ${gite} du ${oldResa.dateDebut} au ${oldResa.dateFin} - ${oldResa.nom}`);
                canceledReservations.push(oldResa);
            }
        }
        
        // 🚨 Si des annulations détectées, demander confirmation avant suppression
        if (canceledReservations.length > 0) {
            console.log(`\n🚨 ${canceledReservations.length} réservation(s) annulée(s) détectée(s) pour ${gite} / ${platform}`);
            
            const confirmMsg = canceledReservations.map(r => 
                `• ${r.dateDebut} → ${r.dateFin} : ${r.nom}`
            ).join('\n');
            
            const userConfirm = confirm(
                `🚨 RÉSERVATIONS ANNULÉES DÉTECTÉES\n\n` +
                `${canceledReservations.length} réservation(s) ne sont plus dans le flux iCal ${platform}:\n\n` +
                `${confirmMsg}\n\n` +
                `Voulez-vous les SUPPRIMER de la base de données?\n\n` +
                `⚠️ Cette action est irréversible!`
            );
            
            if (userConfirm) {
                for (const oldResa of canceledReservations) {
                    await window.supabase
                        .from('reservations')
                        .delete()
                        .eq('id', oldResa.id);
                    
                    console.log(`✅ Supprimée: ${gite} du ${oldResa.dateDebut} au ${oldResa.dateFin} - ${oldResa.nom}`);
                    deleted++;
                }
            } else {
                console.log(`❌ Suppression annulée par l'utilisateur - ${canceledReservations.length} réservation(s) conservée(s)`);
            }
        }

        
        return { added, skipped, deleted };
        
    } catch (error) {
        console.error(`Erreur sync ${gite} ${platform}:`, error);
        throw error;
    }
}

/**
 * Vérifie les chevauchements de dates pour un gîte donné
 * @param {string} gite - Nom du gîte
 * @param {string} dateDebut - Date de début (format YYYY-MM-DD)
 * @param {string} dateFin - Date de fin (format YYYY-MM-DD)
 * @param {number|null} excludeId - ID de réservation à exclure de la vérification
 * @returns {Promise<boolean>} - true si chevauchement détecté
 */
async function checkDateOverlap(gite, dateDebut, dateFin, excludeId = null, excludePlatform = null) {
    const reservations = await getAllReservations();
    const debut = parseLocalDate(dateDebut);
    const fin = parseLocalDate(dateFin);
    
    for (const r of reservations) {
        if (r.id === excludeId) continue;
        if (r.gite !== gite) continue;
        
        // Ignorer les réservations de la même plateforme (permet back-to-back)
        if (excludePlatform && r.syncedFrom === excludePlatform) continue;
        
        const rDebut = parseLocalDate(r.dateDebut);
        const rFin = parseLocalDate(r.dateFin);
        
        // Vérifier chevauchement RÉEL (pas juste date de début = date de fin précédente)
        // Une réservation peut commencer le jour où une autre se termine (check-out 10h, check-in 16h)
        // Chevauchement seulement si :
        // - Le début de la nouvelle résa est strictement avant la fin de l'existante
        // - ET la fin de la nouvelle résa est strictement après le début de l'existante
        if ((debut < rFin && fin > rDebut)) {
            console.log(`🔍 Chevauchement détecté: Nouvelle [${dateDebut} → ${dateFin}] vs Existante [${r.dateDebut} → ${r.dateFin}]`);
            return true;
        }
    }
    
    return false;
}

/**
 * Met à jour l'affichage des dates bloquées pour un gîte
 * Utilisé dans le formulaire de réservation
 */
async function updateBlockedDates() {
    const gite = document.getElementById('gite').value;
    if (!gite) return;
    
    const reservations = await getAllReservations();
    const blockedDates = reservations
        .filter(r => r.gite === gite && new Date(r.dateFin) >= new Date())
        .map(r => `${formatDate(r.dateDebut)} - ${formatDate(r.dateFin)}`)
        .join(', ');
    
    if (blockedDates) {
        document.getElementById('blockedDatesList').textContent = blockedDates;
        document.getElementById('blockedDatesInfo').style.display = 'block';
    } else {
        document.getElementById('blockedDatesInfo').style.display = 'none';
    }
}

// ==========================================
// 🧹 NETTOYAGE DES BLOCAGES EXISTANTS
// ==========================================

/**
 * Supprime les réservations qui sont en fait des blocages Airbnb
 * À utiliser une fois pour nettoyer les données déjà importées
 */
async function cleanupBlockedReservations() {
    try {
        const reservations = await getAllReservations();
        
        const blockTerms = [
            'blocked', 'bloqué', 'bloque',
            'not available', 'indisponible',
            'airbnb (not available)', 'airbnb blocked',
            'préparation', 'preparation', 'cleaning',
            '⚠️ client airbnb', '⚠️ client abritel'
        ];
        
        const toDelete = [];
        
        for (const r of reservations) {
            const nom = (r.nom || '').toLowerCase();
            const isBlock = blockTerms.some(term => nom.includes(term));
            
            // Aussi vérifier les réservations très courtes (< 2 nuits) avec noms génériques
            const nuits = calculateNights(r.dateDebut, r.dateFin);
            const isShortGeneric = nuits < 2 && nom.includes('⚠️');
            
            if (isBlock || isShortGeneric) {
                toDelete.push(r);
            }
        }
        
        if (toDelete.length === 0) {
            console.log('✅ Aucun blocage à nettoyer');
            return { deleted: 0 };
        }
        
        console.log(`🧹 Nettoyage de ${toDelete.length} blocage(s)...`);
        
        for (const r of toDelete) {
            await window.supabase
                .from('reservations')
                .delete()
                .eq('id', r.id);
            
            console.log(`   ✓ Supprimé: ${r.gite} ${r.dateDebut} → ${r.dateFin} (${r.nom})`);
        }
        
        return { deleted: toDelete.length };
    } catch (error) {
        console.error('Erreur nettoyage:', error);
        throw error;
    }
}

// Exporter les fonctions dans le scope global
window.syncAllCalendars = syncAllCalendars;
window.syncCalendar = syncCalendar;
window.checkDateOverlap = checkDateOverlap;
window.updateBlockedDates = updateBlockedDates;
window.cleanupBlockedReservations = cleanupBlockedReservations;
