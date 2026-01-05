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
    
    const syncBtn = document.getElementById('syncBtn');
    const syncProgress = document.getElementById('syncProgress');
    const syncMessages = document.getElementById('syncMessages');
    const syncStatus = document.getElementById('syncStatus');
    const syncStatusIcon = document.getElementById('syncStatusIcon');
    const syncStatusText = document.getElementById('syncStatusText');
    
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
        syncMessages.innerHTML = '';
    }
    
    let totalAdded = 0;
    let totalSkipped = 0;
    let totalDeleted = 0;
    let totalErrors = 0;
    
    function addMessage(text, type = 'info') {
        if (!syncMessages) return;
        const msg = document.createElement('div');
        msg.className = `progress-item ${type}`;
        msg.innerHTML = type === 'info' ? `<span class="spinner"></span> ${text}` : `✓ ${text}`;
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
        
        await updateReservationsList();
        await updateStats();
        
        // Mettre à jour le statut en haut
        if (syncStatus) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            
            if (totalErrors > 0) {
                syncStatus.style.background = '#fff3cd';
                syncStatusIcon.textContent = '⚠️';
                syncStatusText.textContent = `Synchronisation effectuée avec ${totalErrors} erreur(s) - ${dateStr} à ${timeStr}`;
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
    // Utiliser corsproxy.io au lieu de allorigins (plus fiable)
    const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
    
    try {
        const response = await fetch(proxyUrl);
        const text = await response.text();
        const jcalData = ICAL.parse(text);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');
        
        let added = 0;
        let skipped = 0;
        let deleted = 0;
        
        // 🗑️ ÉTAPE 1 : Récupérer les réservations existantes de cette plateforme pour ce gîte
        const existingReservations = await getAllReservations();
        const platformReservations = existingReservations.filter(r => 
            r.gite === gite && r.syncedFrom === platform
        );
        
        // Créer un Set des IDs de réservations trouvées dans le flux iCal
        const foundReservationIds = new Set();
        
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
                console.log(`♻️ Réservation existante confirmée: ${gite} du ${dateDebut} au ${dateFin} - ${nom}`);
                skipped++;
                continue;
            }
            
            // Vérifier chevauchement avec d'autres réservations (pas de cette plateforme)
            const hasOverlap = await checkDateOverlap(gite, dateDebut, dateFin);
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
        
        // 🗑️ ÉTAPE 2 : Supprimer les réservations qui ne sont plus dans le flux iCal (annulées)
        for (const oldResa of platformReservations) {
            if (!foundReservationIds.has(oldResa.id)) {
                // Cette réservation n'existe plus dans le flux iCal → elle a été annulée
                console.log(`🗑️ Suppression réservation annulée: ${gite} du ${oldResa.dateDebut} au ${oldResa.dateFin} - ${oldResa.nom}`);
                
                await window.supabase
                    .from('reservations')
                    .delete()
                    .eq('id', oldResa.id);
                
                deleted++;
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
async function checkDateOverlap(gite, dateDebut, dateFin, excludeId = null) {
    const reservations = await getAllReservations();
    const debut = parseLocalDate(dateDebut);
    const fin = parseLocalDate(dateFin);
    
    for (const r of reservations) {
        if (r.id === excludeId) continue;
        if (r.gite !== gite) continue;
        
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
