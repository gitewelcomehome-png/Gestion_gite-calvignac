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

// Variable globale pour stocker les compteurs de commandes prestations
window.commandesPrestationsCountMap = {};
let commandesPrestationsCountCache = null;
let commandesPrestationsCountCacheAt = 0;
const COMMANDES_PRESTATIONS_COUNT_CACHE_TTL_MS = 60 * 1000;
const COMMANDES_PRESTATIONS_QUERY_TIMEOUT_MS = 8000;
const RESERVATIONS_REFRESH_LIMIT_KEY = 'reservations-list-refresh';
const RESERVATIONS_REFRESH_COOLDOWN_MS = 4000;
let lastReservationsRefreshAt = 0;
let isEditReservationSaving = false;
let lastEditSourceTabId = null;

// ==========================================
// UTILITAIRES
// ==========================================

/**
 * Récupérer le nombre de commandes prestations par réservation
 */
async function getCommandesPrestationsCount() {
    const now = Date.now();
    if (commandesPrestationsCountCache && (now - commandesPrestationsCountCacheAt) < COMMANDES_PRESTATIONS_COUNT_CACHE_TTL_MS) {
        return commandesPrestationsCountCache;
    }

    const fetchCountMap = async () => {
        const queryPromise = window.supabaseClient
            .from('commandes_prestations')
            .select('reservation_id, id')
            .neq('statut', 'cancelled');

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout récupération commandes prestations')), COMMANDES_PRESTATIONS_QUERY_TIMEOUT_MS);
        });

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
        if (error) throw error;

        const countMap = {};
        (data || []).forEach(cmd => {
            countMap[cmd.reservation_id] = (countMap[cmd.reservation_id] || 0) + 1;
        });

        return countMap;
    };

    try {
        const countMap = await fetchCountMap();
        commandesPrestationsCountCache = countMap;
        commandesPrestationsCountCacheAt = Date.now();
        return countMap;
    } catch (err) {
        try {
            await new Promise(resolve => setTimeout(resolve, 250));
            const countMapRetry = await fetchCountMap();
            commandesPrestationsCountCache = countMapRetry;
            commandesPrestationsCountCacheAt = Date.now();
            return countMapRetry;
        } catch (retryErr) {
            console.error('❌ Erreur récupération commandes prestations:', retryErr || err);
            return commandesPrestationsCountCache || {};
        }
    }
}

/**
 * Échapper les caractères HTML pour éviter les erreurs de syntaxe
 */

function applyInstantReservationUpdate(reservationId, updates) {
    if (!reservationId) return;

    let cards = Array.from(document.querySelectorAll(`.week-reservation[data-reservation-id="${reservationId}"]`));

    if (cards.length === 0) {
        const editButtons = document.querySelectorAll(`button[onclick*="${reservationId}"]`);
        editButtons.forEach(button => {
            const card = button.closest('.week-reservation')
                || button.closest('.reservation-item')
                || button.closest('[data-reservation-id]')
                || button.closest('div[style*="box-shadow: 2px 2px 0 #2D3436"]');
            if (card) cards.push(card);
        });
    }

    if (!cards || cards.length === 0) return;

    cards.forEach(card => {
        const nameElement = card.querySelector('.reservation-name-text');
        if (nameElement && typeof updates.nom === 'string') {
            nameElement.textContent = updates.nom;
        } else if (typeof updates.nom === 'string') {
            const nameFallback = card.querySelector('.reservation-name')
                || card.querySelector('.reservation-header .reservation-name')
                || card.querySelector('div[style*="font-size: 0.7rem"][style*="font-weight: 700"]');
            if (nameFallback) {
                nameFallback.textContent = updates.nom;
            }
        }

        const priceElement = card.querySelector('.reservation-price');
        if (priceElement && typeof updates.montant === 'number' && !isNaN(updates.montant)) {
            priceElement.textContent = `${updates.montant.toFixed(2)} €`;
        }

        const phoneElement = card.querySelector('.reservation-phone');
        if (phoneElement) {
            const phone = (updates.telephone || '').trim();
            if (phone) {
                phoneElement.textContent = `📱 ${phone}`;
                phoneElement.style.display = '';
            } else {
                phoneElement.textContent = '';
                phoneElement.style.display = 'none';
            }
        } else {
            const mobilePhoneFallback = card.querySelector('div[style*="font-size: 0.6rem"][style*="color: var(--text-secondary)"]');
            if (mobilePhoneFallback) {
                const phone = (updates.telephone || '').trim();
                if (phone) {
                    mobilePhoneFallback.textContent = `📱 ${phone}`;
                    mobilePhoneFallback.style.display = '';
                } else {
                    mobilePhoneFallback.textContent = '';
                    mobilePhoneFallback.style.display = 'none';
                }
            }
        }
    });
}

async function refreshEditedReservationSourceView() {
    const activeTabId = document.querySelector('.tab-content.active')?.id || lastEditSourceTabId;

    try {
        if (activeTabId === 'tab-archives' && typeof updateArchivesDisplay === 'function') {
            await updateArchivesDisplay();
            return;
        }

        if (activeTabId === 'tab-dashboard' && typeof window.refreshDashboard === 'function') {
            await window.refreshDashboard();
            return;
        }

        if (typeof updateReservationsList === 'function') {
            await updateReservationsList(true);
        }
    } catch (error) {
        console.error('❌ Erreur refresh source view après édition:', error);
    }
}

async function reloadEditedReservationCard(reservationId) {
    if (!reservationId) return;

    try {
        if (typeof invalidateCache === 'function') {
            invalidateCache('reservations');
        }

        const reservations = await getAllReservations(true);
        const reservation = reservations.find(r => r.id === reservationId);
        if (!reservation) return;

        applyInstantReservationUpdate(reservationId, {
            nom: reservation.nom || reservation.client_name || '',
            telephone: reservation.telephone || reservation.client_phone || '',
            montant: Number(reservation.montant || 0)
        });
    } catch (error) {
        console.error('❌ Erreur rechargement carte réservation:', error);
    }
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

        commandesPrestationsCountCache = null;
        commandesPrestationsCountCacheAt = 0;
        
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

function normalizeReservationPlatform(reservation) {
    const raw = String(
        reservation?.site
        || reservation?.plateforme
        || reservation?.platform
        || reservation?.provenance
        || 'direct'
    ).toLowerCase().trim();

    if (raw.includes('airbnb')) return 'airbnb';
    if (raw.includes('booking')) return 'booking';
    if (raw.includes('abritel') || raw.includes('vrbo') || raw.includes('homeaway')) return 'abritel';
    if (raw.includes('gite') || raw.includes('gdf')) return 'gdf';
    if (raw.includes('direct')) return 'direct';
    return raw || 'direct';
}

async function getTaxesSejourSettingsForGite(giteId) {
    if (!giteId) return { taxRate: 0, prelevePlatforms: ['airbnb'] };
    try {
        const { data, error } = await window.supabaseClient
            .from('gites')
            .select('taxe_sejour_tarif, taxe_sejour_plateformes')
            .eq('id', giteId)
            .single();
        if (error || !data) return { taxRate: 0, prelevePlatforms: ['airbnb'] };
        return {
            taxRate: Number.isFinite(Number(data.taxe_sejour_tarif)) ? Number(data.taxe_sejour_tarif) : 0,
            prelevePlatforms: Array.isArray(data.taxe_sejour_plateformes) ? data.taxe_sejour_plateformes : ['airbnb']
        };
    } catch (e) {
        return { taxRate: 0, prelevePlatforms: ['airbnb'] };
    }
}

async function saveTaxesSejourSettingsForGite(giteId, settings) {
    if (!giteId) return;
    try {
        await window.supabaseClient
            .from('gites')
            .update({
                taxe_sejour_tarif: Number.isFinite(Number(settings.taxRate)) ? Number(settings.taxRate) : 0,
                taxe_sejour_plateformes: Array.isArray(settings.prelevePlatforms) ? settings.prelevePlatforms : []
            })
            .eq('id', giteId);
    } catch (e) {
        // silencieux
    }
}

function getReservationGuestCount(reservation) {
    const value = Number(
        reservation?.nbPersonnes
        ?? reservation?.nb_personnes
        ?? reservation?.guest_count
        ?? reservation?.nb_guests
        ?? 1
    );
    return Number.isFinite(value) && value > 0 ? value : 1;
}

function buildTaxMonthRows(reservations, selectedGiteId, selectedMonth, taxRate, platformModes) {
    if (!selectedGiteId || !selectedMonth) return [];

    const [year, month] = selectedMonth.split('-').map(Number);
    if (!year || !month) return [];

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const rows = [];

    reservations
        .filter((reservation) => reservation?.giteId === selectedGiteId)
        .forEach((reservation) => {
            const checkIn = parseLocalDate(reservation.dateDebut);
            const checkOutRaw = parseLocalDate(reservation.dateFin);

            const checkOut = new Date(checkOutRaw);
            checkOut.setDate(checkOut.getDate() - 1);

            if (checkOut < monthStart || checkIn > monthEnd) return;

            const start = checkIn > monthStart ? checkIn : monthStart;
            const end = checkOut < monthEnd ? checkOut : monthEnd;
            const platform = normalizeReservationPlatform(reservation);
            const platformMode = platformModes[platform] || 'payer';
            const guestCount = getReservationGuestCount(reservation);

            const cursor = new Date(start);
            while (cursor <= end) {
                const taxeBruteJour = guestCount * taxRate;
                const montantAPayerJour = platformMode === 'preleve' ? 0 : taxeBruteJour;

                rows.push({
                    day: cursor.getDate(),
                    platform,
                    guestCount,
                    taxeBruteJour,
                    montantAPayerJour,
                    mode: platformMode
                });

                cursor.setDate(cursor.getDate() + 1);
            }
        });

    rows.sort((a, b) => a.day - b.day || a.platform.localeCompare(b.platform));
    return rows;
}

function renderTaxesSejourTable(rows) {
    if (!rows.length) {
        return {
            html: '<tr><td colspan="5" style="padding:12px;text-align:center;color:var(--text-secondary, #94a3b8);background:var(--bg-secondary, #111113);">Aucune donnée pour ce mois</td></tr>',
            total: 0
        };
    }

    const platformLabels = {
        airbnb: 'Airbnb',
        booking: 'Booking',
        abritel: 'Abritel',
        gdf: 'Gîtes de France',
        direct: 'Direct'
    };

    const html = rows.map((row) => {
        const modeText = row.mode === 'preleve' ? 'Prélevée par plateforme' : 'À payer';
        return `
            <tr>
                <td style="padding:10px;border:1px solid var(--border-color, rgba(255,255,255,0.1));background:var(--bg-secondary, #111113);color:var(--text-primary, #ffffff);">${String(row.day).padStart(2, '0')}</td>
                <td style="padding:10px;border:1px solid var(--border-color, rgba(255,255,255,0.1));background:var(--bg-secondary, #111113);color:var(--text-primary, #ffffff);">${platformLabels[row.platform] || row.platform}</td>
                <td style="padding:10px;border:1px solid var(--border-color, rgba(255,255,255,0.1));background:var(--bg-secondary, #111113);color:var(--text-primary, #ffffff);text-align:center;">${row.guestCount}</td>
                <td style="padding:10px;border:1px solid var(--border-color, rgba(255,255,255,0.1));background:var(--bg-secondary, #111113);color:var(--text-primary, #ffffff);text-align:right;">${row.montantAPayerJour.toFixed(2)} €</td>
                <td style="padding:10px;border:1px solid var(--border-color, rgba(255,255,255,0.1));background:var(--bg-secondary, #111113);color:var(--text-primary, #ffffff);">${modeText}</td>
            </tr>
        `;
    }).join('');

    const total = rows.reduce((sum, row) => sum + row.montantAPayerJour, 0);
    return { html, total };
}

function openTaxesPlatformOptionsModal(initialPrelevePlatforms, onSave) {
    const platforms = [
        { id: 'airbnb', label: 'Airbnb' },
        { id: 'booking', label: 'Booking' },
        { id: 'abritel', label: 'Abritel' },
        { id: 'gdf', label: 'Gîtes de France' },
        { id: 'direct', label: 'Direct' }
    ];

    const selected = new Set(initialPrelevePlatforms || []);

    const existingOverlay = document.getElementById('taxes-platform-options-modal');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'taxes-platform-options-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:12050;padding:20px;';
    overlay.innerHTML = `
        <div style="position:relative;isolation:isolate;background:var(--bg-secondary, #111113);color:var(--text-primary, #ffffff);border:2px solid var(--border-color, rgba(255,255,255,0.1));border-radius:12px;max-width:560px;width:100%;padding:18px;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
            <h4 style="margin:0 0 10px 0;">✅ Plateformes qui prélèvent la taxe de séjour</h4>
            <p style="margin:0 0 12px 0;color:var(--text-secondary, #94a3b8);font-size:0.9rem;">Coche les plateformes qui prélèvent la taxe directement.</p>
            <div id="platformCheckboxList" style="display:grid;grid-template-columns:repeat(2,minmax(160px,1fr));gap:10px 14px;margin-bottom:16px;">
                ${platforms.map(platform => `
                    <label style="display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid var(--border-color, rgba(255,255,255,0.1));border-radius:8px;background:var(--bg-primary, #050506);">
                        <input type="checkbox" data-platform-checkbox="${platform.id}" ${selected.has(platform.id) ? 'checked' : ''} style="accent-color: var(--upstay-cyan, #00C2CB);">
                        <span>${platform.label}</span>
                    </label>
                `).join('')}
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;">
                <button id="closePlatformOptions" class="btn-neo" style="padding:8px 12px;">Annuler</button>
                <button id="savePlatformOptions" class="btn-neo" style="padding:8px 12px;background:#27ae60;color:#fff;">Enregistrer</button>
            </div>
        </div>
    `;

    const closeModal = () => overlay.remove();
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeModal();
    });

    document.body.appendChild(overlay);

    document.getElementById('closePlatformOptions')?.addEventListener('click', closeModal);
    document.getElementById('savePlatformOptions')?.addEventListener('click', () => {
        const checkedPlatforms = Array.from(overlay.querySelectorAll('[data-platform-checkbox]:checked'))
            .map((input) => input.getAttribute('data-platform-checkbox'));
        onSave(checkedPlatforms);
        closeModal();
    });
}

async function openTaxesSejourModal() {
    try {
        const reservations = await getAllReservations(true);
        const gites = await window.gitesManager.getVisibleGites();

        const monthNameFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long' });
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-12

        const yearOptions = [];
        for (let y = currentYear - 3; y <= currentYear + 1; y++) {
            yearOptions.push(y);
        }

        const monthNames = [];
        for (let m = 1; m <= 12; m++) {
            const date = new Date(2000, m - 1, 1);
            monthNames.push({ value: String(m).padStart(2, '0'), label: monthNameFormatter.format(date) });
        }

        const overlay = document.createElement('div');
        overlay.id = 'taxes-sejour-modal';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px;';

        overlay.innerHTML = `
            <div style="background:var(--bg-secondary, #111113);color:var(--text-primary, #ffffff);border:2px solid var(--border-color, rgba(255,255,255,0.1));border-radius:12px;max-width:1100px;width:100%;max-height:90vh;overflow:auto;padding:18px;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;">
                    <h3 style="margin:0;font-size:1.2rem;">💰 Taxes de séjour mensuelles</h3>
                    <button id="closeTaxesSejourModal" class="btn-neo" style="padding:8px 12px;background:#e74c3c;color:#fff;">Fermer</button>
                </div>

                <div style="display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:10px;margin-bottom:14px;">
                    <div>
                        <label for="taxesGiteSelect" style="display:block;font-weight:700;margin-bottom:6px;">Gîte</label>
                        <select id="taxesGiteSelect" style="width:100%;padding:10px;border:1px solid var(--border-color, rgba(255,255,255,0.1));border-radius:8px;background:var(--bg-primary, #050506);color:var(--text-primary, #ffffff);">
                            <option value="">Sélectionner</option>
                            ${gites.map(g => `<option value="${g.id}">${escapeHtml(g.name || 'Sans nom')}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label for="taxesYearSelect" style="display:block;font-weight:700;margin-bottom:6px;">Année</label>
                        <select id="taxesYearSelect" style="width:100%;padding:10px;border:1px solid var(--border-color, rgba(255,255,255,0.1));border-radius:8px;background:var(--bg-primary, #050506);color:var(--text-primary, #ffffff);">
                            ${yearOptions.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label for="taxesMonthSelect" style="display:block;font-weight:700;margin-bottom:6px;">Mois</label>
                        <select id="taxesMonthSelect" style="width:100%;padding:10px;border:1px solid var(--border-color, rgba(255,255,255,0.1));border-radius:8px;background:var(--bg-primary, #050506);color:var(--text-primary, #ffffff);">
                            ${monthNames.map(m => `<option value="${m.value}" ${m.value === String(currentMonth).padStart(2, '0') ? 'selected' : ''}>${escapeHtml(m.label)}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label for="taxesRateInput" style="display:block;font-weight:700;margin-bottom:6px;">Tarif taxe séjour (€ / pers / nuit)</label>
                        <input id="taxesRateInput" type="number" min="0" step="0.01" value="2.00" style="width:100%;padding:10px;border:1px solid var(--border-color, rgba(255,255,255,0.1));border-radius:8px;background:var(--bg-primary, #050506);color:var(--text-primary, #ffffff);">
                    </div>
                </div>

                <div style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
                    <div>
                        <div style="font-weight:700;">Options plateformes</div>
                        <div id="platformOptionsSummary" style="font-size:0.9rem;color:var(--text-secondary, #94a3b8);">Airbnb prélève la taxe</div>
                    </div>
                    <button id="openPlatformOptionsBtn" class="btn-neo" style="padding:8px 12px;">⚙️ Choisir plateformes</button>
                </div>

                <div style="overflow:auto;">
                    <table style="width:100%;border-collapse:collapse;min-width:760px;background:var(--bg-secondary, #111113);color:var(--text-primary, #ffffff);">
                        <thead>
                            <tr style="background:var(--bg-primary, #050506);">
                                <th style="padding:10px;border:1px solid var(--border-color, rgba(255,255,255,0.1));text-align:left;color:var(--text-primary, #ffffff);">Jour du mois</th>
                                <th style="padding:10px;border:1px solid var(--border-color, rgba(255,255,255,0.1));text-align:left;color:var(--text-primary, #ffffff);">Plateforme</th>
                                <th style="padding:10px;border:1px solid var(--border-color, rgba(255,255,255,0.1));text-align:center;color:var(--text-primary, #ffffff);">Nb personnes</th>
                                <th style="padding:10px;border:1px solid var(--border-color, rgba(255,255,255,0.1));text-align:right;color:var(--text-primary, #ffffff);">Tarif à payer / jour</th>
                                <th style="padding:10px;border:1px solid var(--border-color, rgba(255,255,255,0.1));text-align:left;color:var(--text-primary, #ffffff);">Règle plateforme</th>
                            </tr>
                        </thead>
                        <tbody id="taxesSejourTableBody">
                            <tr><td colspan="5" style="padding:12px;text-align:center;color:var(--text-secondary, #94a3b8);background:var(--bg-secondary, #111113);">Sélectionner un gîte</td></tr>
                        </tbody>
                        <tfoot>
                            <tr style="background:var(--bg-primary, #050506);font-weight:700;">
                                <td colspan="3" style="padding:12px;border:1px solid var(--border-color, rgba(255,255,255,0.1));text-align:right;color:var(--text-primary, #ffffff);">Total mois à payer</td>
                                <td id="taxesSejourTotal" style="padding:12px;border:1px solid var(--border-color, rgba(255,255,255,0.1));text-align:right;color:var(--text-primary, #ffffff);">0.00 €</td>
                                <td style="padding:12px;border:1px solid var(--border-color, rgba(255,255,255,0.1));background:var(--bg-primary, #050506);"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;

        const closeModal = () => overlay.remove();
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) closeModal();
        });

        document.body.appendChild(overlay);
        document.getElementById('closeTaxesSejourModal')?.addEventListener('click', closeModal);

        const giteSelect = document.getElementById('taxesGiteSelect');
        const yearSelect = document.getElementById('taxesYearSelect');
        const monthSelect = document.getElementById('taxesMonthSelect');
        const rateInput = document.getElementById('taxesRateInput');
        const platformSummary = document.getElementById('platformOptionsSummary');
        const openPlatformOptionsBtn = document.getElementById('openPlatformOptionsBtn');
        const tableBody = document.getElementById('taxesSejourTableBody');
        const totalElement = document.getElementById('taxesSejourTotal');

        let prelevePlatforms = ['airbnb'];

        const updatePlatformSummary = () => {
            const labels = {
                airbnb: 'Airbnb',
                booking: 'Booking',
                abritel: 'Abritel',
                gdf: 'Gîtes de France',
                direct: 'Direct'
            };
            const text = prelevePlatforms.length
                ? prelevePlatforms.map((platform) => labels[platform] || platform).join(', ')
                : 'Aucune plateforme ne prélève';
            platformSummary.textContent = text;
        };

        const loadGiteSettings = async () => {
            const giteId = giteSelect?.value;
            if (!giteId) {
                rateInput.value = '2.00';
                prelevePlatforms = ['airbnb'];
                updatePlatformSummary();
                return;
            }

            const settings = await getTaxesSejourSettingsForGite(giteId);
            rateInput.value = settings.taxRate.toFixed(2);
            prelevePlatforms = settings.prelevePlatforms;
            updatePlatformSummary();
        };

        const refreshTable = () => {
            const selectedGiteId = giteSelect?.value || '';
            const selectedMonth = (yearSelect?.value && monthSelect?.value)
                ? `${yearSelect.value}-${monthSelect.value}`
                : '';
            const taxRate = Number(rateInput?.value || 0);

            const platformModes = {
                airbnb: prelevePlatforms.includes('airbnb') ? 'preleve' : 'payer',
                booking: prelevePlatforms.includes('booking') ? 'preleve' : 'payer',
                abritel: prelevePlatforms.includes('abritel') ? 'preleve' : 'payer',
                gdf: prelevePlatforms.includes('gdf') ? 'preleve' : 'payer',
                direct: prelevePlatforms.includes('direct') ? 'preleve' : 'payer'
            };

            const rows = buildTaxMonthRows(reservations, selectedGiteId, selectedMonth, taxRate, platformModes);
            const rendered = renderTaxesSejourTable(rows);
            tableBody.innerHTML = rendered.html;
            totalElement.textContent = `${rendered.total.toFixed(2)} €`;
        };

        const persistCurrentGiteSettings = async () => {
            const giteId = giteSelect?.value || '';
            if (!giteId) return;

            await saveTaxesSejourSettingsForGite(giteId, {
                taxRate: Number(rateInput?.value || 2),
                prelevePlatforms
            });
        };

        [giteSelect, yearSelect, monthSelect, rateInput].forEach((element) => {
            element?.addEventListener('change', refreshTable);
            element?.addEventListener('input', refreshTable);
        });

        giteSelect?.addEventListener('change', async () => {
            await loadGiteSettings();
            refreshTable();
        });

        rateInput?.addEventListener('change', async () => {
            await persistCurrentGiteSettings();
            refreshTable();
        });

        rateInput?.addEventListener('input', async () => {
            await persistCurrentGiteSettings();
            refreshTable();
        });

        openPlatformOptionsBtn?.addEventListener('click', () => {
            openTaxesPlatformOptionsModal(prelevePlatforms, async (newPrelevePlatforms) => {
                prelevePlatforms = newPrelevePlatforms;
                updatePlatformSummary();
                await persistCurrentGiteSettings();
                refreshTable();
            });
        });

        await loadGiteSettings();
        refreshTable();
    } catch (error) {
        console.error('❌ Erreur ouverture modal taxes séjour:', error);
        showToast('Erreur ouverture taxes séjour', 'error');
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
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: var(--text-secondary); padding: 40px; font-size: 1.1rem;">Aucun résultat</p>');
        return;
    }
    
    let html = '<div class="planning-weeks"><h3 class="vision-action-title" style="margin-bottom: 25px;">🔍 Résultats de recherche (' + reservations.length + ')</h3>';
    
    reservations.forEach((r, index) => {
        const borderColors = ['#3b82f6', '#ef4444', '#10b981', '#06b6d4'];
        const borderColor = borderColors[index % 4];
        const platformLogo = getPlatformLogo(r.site);
        const messageEnvoye = r.messageEnvoye ? ' <span style="color: #27ae60; font-weight: 700; font-size: 1.1rem;">✓</span>' : '';
        const phoneValue = (r.telephone || '').trim();
        const telephoneDisplay = `<br><span class="reservation-phone" style="font-size: 0.95rem; color: var(--text-secondary);${phoneValue ? '' : ' display:none;'}">${phoneValue ? `📱 ${escapeHtml(phoneValue)}` : ''}</span>`;
        
        const isIncomplete = !r.nom || r.nom.includes('⚠️') || r.nom.includes('À COMPLÉTER') || r.nom.includes('Client');
        const incompleteBadge = isIncomplete ? 
            '<span class="incomplete-badge">⚠️ À COMPLÉTER</span>' : 
            '';
        
        // Vérifier si des commandes prestations existent
        const commandesCount = window.commandesPrestationsCountMap[r.id] || 0;
        const hasPrestations = commandesCount > 0;
        
        html += `
            <div class="week-reservation ${isIncomplete ? 'week-reservation-incomplete' : ''}" data-reservation-id="${r.id}">
                <div style="position: relative;">
                    <div class="reservation-buttons">
                        ${hasPrestations ? `<button data-reservation-id="${r.id}" class="btn-reservation btn-voir-commande-prestations" style="background: #27AE60; border-color: #27AE60;" title="Voir commandes prestations"><svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> ${commandesCount}</button>` : ''}
                        <button class="btn-reservation btn-reservation-edit" onclick="openEditModal('${r.id}')" title="Modifier"><svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <button class="btn-reservation btn-reservation-view" onclick="aperçuFicheClient('${r.id}')" title="Page Client"><svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></button>
                        <button class="btn-reservation btn-reservation-delete" onclick="deleteReservationById('${r.id}')" title="Supprimer"><svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                    </div>
                    
                    <div class="reservation-name">
                        <span class="reservation-name-text">${escapeHtml(r.nom)}</span>${messageEnvoye}${incompleteBadge}
                    </div>
                    
                    <div class="reservation-details">
                        📅 <strong class="reservation-dates-text">${formatDate(r.dateDebut)} → ${formatDate(r.dateFin)}</strong>${telephoneDisplay}<br>
                        💰 <strong class="reservation-price">${r.montant.toFixed(2)} €</strong> • ${platformLogo}
                    </div>
                    
                    <div style="font-size: 1rem; color: var(--text-secondary); font-weight: 600;">
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
    lastEditSourceTabId = document.querySelector('.tab-content.active')?.id || null;

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

    if (isEditReservationSaving) {
        return;
    }

    if (window.ValidationUtils && typeof window.ValidationUtils.validateForm === 'function') {
        const rules = {
            editNom: { type: 'text', required: true },
            editTelephone: { type: 'text', required: false },
            editMontant: { type: 'amount', required: true },
            editAcompte: { type: 'amount', required: false },
            editNbPersonnes: { type: 'integer', required: false }
        };

        const validation = window.ValidationUtils.validateForm(document.getElementById('editForm'), rules);
        if (!validation.valid) {
            showToast('Formulaire invalide : corrigez les champs en rouge', 'error');
            return;
        }
    }
    
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

    const submitButton = document.querySelector('#editForm button[type="submit"]');
    const originalSubmitText = submitButton ? submitButton.innerHTML : '';
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span>⏳</span> Enregistrement...';
    }

    isEditReservationSaving = true;
    
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
        applyInstantReservationUpdate(id, {
            nom,
            telephone,
            montant
        });
        closeEditModal();
        await reloadEditedReservationCard(id); // Recharger la div concernée à la fermeture
        showToast('✓ Réservation modifiée', 'success');

        if (typeof invalidateCache === 'function') {
            invalidateCache('reservations');
        }

        await refreshEditedReservationSourceView();

        setTimeout(() => {
            updateReservationsList(true).catch(err => {
                console.error('❌ Erreur rechargement de sécurité après modification:', err);
            });
        }, 700);

        if (typeof updateStats === 'function') {
            updateStats().catch(err => {
                console.error('❌ Erreur mise à jour stats après modification:', err);
            });
        }
    } catch (error) {
        console.error('❌ Erreur lors de la modification:', error);
        showToast(`Erreur lors de la modification${error?.message ? ' : ' + error.message : ''}`, 'error');
    } finally {
        isEditReservationSaving = false;
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalSubmitText;
        }
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
    const now = Date.now();
    let degradedMode = false;

    if (!keepScrollPosition) {
        if ((now - lastReservationsRefreshAt) < RESERVATIONS_REFRESH_COOLDOWN_MS) {
            degradedMode = true;
        } else if (window.apiLimiter && typeof window.apiLimiter.canAttempt === 'function') {
            const refreshGate = window.apiLimiter.canAttempt(RESERVATIONS_REFRESH_LIMIT_KEY);
            if (!refreshGate.allowed) {
                degradedMode = true;
                console.warn('⚠️ Rate limit rafraîchissement réservations, bascule en mode dégradé:', refreshGate.message);
            }
        }
    }

    lastReservationsRefreshAt = now;
    
    // Synchroniser les calendriers iCal UNIQUEMENT au premier chargement (pas lors des rafraîchissements)
    // et seulement si on a des gîtes configurés
    if (!keepScrollPosition && !degradedMode && typeof syncAllCalendars === 'function') {
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
    
    const shouldForceRefreshReservations = !degradedMode;
    const reservations = await getAllReservations(shouldForceRefreshReservations);
    const gites = await window.gitesManager.getVisibleGites(); // Charger les gîtes visibles selon abonnement
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Récupérer les validations de la société de ménage
    let cleaningSchedules = null;
    try {
        const { data, error } = await window.supabaseClient
            .from('cleaning_schedule')
            .select('*');

        if (error) {
            throw error;
        }

        cleaningSchedules = data;
    } catch (cleaningError) {
        console.warn('⚠️ Impossible de charger cleaning_schedule (mode dégradé):', cleaningError?.message || cleaningError);
    }
    
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
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">⚠️ Aucun gîte configuré. <a href="#" onclick="showGitesManager(); return false;" style="color: #667eea; text-decoration: underline;">Créer un gîte</a></p>');
        return;
    }
    
    if (active.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Aucune réservation</p>');
        return;
    }

    // Récupérer les compteurs de commandes prestations uniquement si des réservations sont affichées
    window.commandesPrestationsCountMap = await getCommandesPrestationsCount();
    
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
        // Adapter l'affichage selon le nombre de gîtes visibles (1 à 4)
        let gridStyle;
        let gap = '20px';
        let padding = '20px';
        
        if (gites.length === 1) {
            gridStyle = 'display: flex; justify-content: center; max-width: 800px; margin: 0 auto;';
        } else if (gites.length === 2) {
            gridStyle = `display: grid; grid-template-columns: repeat(2, 1fr); gap: ${gap}; max-width: 1200px; margin: 0 auto;`;
        } else if (gites.length === 3) {
            gridStyle = `display: grid; grid-template-columns: repeat(3, 1fr); gap: ${gap}; width: 100%; min-width: 0;`;
        } else if (gites.length >= 4) {
            gridStyle = `display: grid; grid-template-columns: repeat(4, 1fr); gap: ${gap}; width: 100%; min-width: 0;`;
        }
        
        html += `
            <div class="weeks-grid" style="${gridStyle}">
        `;
        
        // Générer colonnes pour chaque gîte visible
        const colors = [
            '#3b82f6', '#ef4444', '#10b981', '#06b6d4'
        ];
        const colorClasses = [
            'week-column-header-trevoux', 'week-column-header-couzon', 'week-column-header-3eme', 'week-column-header-4eme'
        ];
        const bodyColorClasses = [
            'week-column-body-trevoux', 'week-column-body-couzon', 'week-column-body-3eme', 'week-column-body-4eme'
        ];
        
        gites.forEach((g, giteIndex) => {
            const colorClass = colorClasses[giteIndex % colorClasses.length];
            const bodyColorClass = bodyColorClasses[giteIndex % bodyColorClasses.length];
            
            html += `
            <div class="week-column">
                <div class="week-column-header ${colorClass}">
                    <div class="week-column-header-gite">${g.name}</div>
                    <div class="week-column-header-week">Semaine ${weekNum}</div>
                    <div class="week-column-header-dates">${formatDateShort(weekDates.start)} - ${formatDateShort(weekDates.end)}</div>
                </div>
                <div class="week-column-body ${bodyColorClass}">
                    ${generateWeekReservations(byGite[g.id], weekNum, g.slug, active, validationMap, today)}
                </div>
            </div>
            `;
        });
        
        html += `
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
    
    // ✅ Event delegation pour les boutons de commandes prestations
    const planningContainer = document.getElementById('planning-container');
    if (planningContainer) {
        // Supprimer l'ancien listener s'il existe
        if (window.reservationsCommandesPrestationsBtnClickHandler) {
            planningContainer.removeEventListener('click', window.reservationsCommandesPrestationsBtnClickHandler);
        }
        
        // Ajouter le nouveau listener
        window.reservationsCommandesPrestationsBtnClickHandler = async (e) => {
            const btn = e.target.closest('.btn-voir-commande-prestations');
            if (btn) {
                const reservationId = btn.getAttribute('data-reservation-id');
                await voirCommandePrestations(reservationId);
            }
        };
        planningContainer.addEventListener('click', window.reservationsCommandesPrestationsBtnClickHandler);
    }
    
    // Afficher la dernière synchronisation iCal
    if (typeof updateLastSyncDisplay === 'function') {
        updateLastSyncDisplay();
    }
}

function generateWeekReservations(reservations, weekKey, cssClass, toutesReservations, validationMap = {}, today = null) {
    // Trouver les réservations dont la date de DÉBUT est dans cette semaine
    const weekReservations = reservations.filter(r => {
        const start = parseLocalDate(r.dateDebut);
        return getWeekNumber(start) === weekKey;
    });
    
    if (weekReservations.length === 0) {
        return '<div class="week-empty">✨ Disponible</div>';
    }
    
    let html = '';
    const borderColors = ['#3b82f6', '#ef4444', '#10b981', '#06b6d4'];
    
    weekReservations.forEach((r, index) => {
        const borderColor = borderColors[index % 4];
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
            const menageResult = window.calculerDateMenage ? window.calculerDateMenage(r, toutesReservations) : null;
            dateMenage = menageResult?.formatted ?? menageResult;
        }
        
        const messageEnvoye = r.messageEnvoye ? ' <span style="color: #27ae60; font-weight: 600;">✓</span>' : '';
        const phoneValue = (r.telephone || '').trim();
        const telephoneDisplay = `<br><span class="reservation-phone" style="font-size: 0.9rem;${phoneValue ? '' : ' display:none;'}">${phoneValue ? `📱 ${escapeHtml(phoneValue)}` : ''}</span>`;
        
        // Moment de la journée depuis cleaning_schedule
        let timeLabel = '';
        if (validation?.time_of_day) {
            timeLabel = validation.time_of_day === 'morning' ? ' 🌅' : ' 🌆';
        }
        let statusBadge = '';
        if (validation) {
            if (validation.validated_by_company === true || validation.status === 'validated') {
                // VERT = Validé par la société de ménage
                statusBadge = '<span class="validation-status validated" title="Validé par société" style="margin-left: 8px;">✓</span>';
            } else if (validation.status === 'pending_validation') {
                // ORANGE = En attente de validation
                statusBadge = '<span class="validation-status pending" title="En attente validation" style="margin-left: 8px;">⏳</span>';
            } else if (validation.status === 'refused') {
                // ROUGE FONCE = Refusé
                statusBadge = '<span class="validation-status refused" title="Refusé" style="margin-left: 8px;">❌</span>';
            } else {
                // ROUGE = À planifier (status = 'pending')
                statusBadge = '<span class="validation-status notvalidated" title="À planifier" style="margin-left: 8px;">✗</span>';
            }
        } else {
            // Pas de planning = ROUGE = À planifier
            statusBadge = '<span class="validation-status notvalidated" title="À planifier" style="margin-left: 8px;">✗</span>';
        }
        
        // Masquer bouton si réservation se termine aujourd'hui ou avant
        const dateFin = parseLocalDate(r.dateFin);
        dateFin.setHours(0, 0, 0, 0);
        const isExpired = today && dateFin.getTime() <= today.getTime();
        const ficheClientButton = isExpired ? '' : `<button class="btn-reservation btn-reservation-view" onclick="aperçuFicheClient('${r.id}')" title="Page Client"><svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></button>`;
        
        // Vérifier si des commandes prestations existent
        const commandesCount = window.commandesPrestationsCountMap[r.id] || 0;
        const hasPrestations = commandesCount > 0;
        const prestationsButton = hasPrestations ? `<button data-reservation-id="${r.id}" class="btn-reservation btn-voir-commande-prestations" style="background: #27AE60; border-color: #27AE60;" title="Voir commandes prestations"><svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> ${commandesCount}</button>` : '';
        
        html += `
            <div class="week-reservation ${cssClass}" data-reservation-id="${r.id}">
                <!-- Boutons en haut -->
                <div class="reservation-buttons">
                    ${prestationsButton}
                    <button class="btn-reservation btn-reservation-edit" onclick="openEditModal('${r.id}')" title="Modifier"><svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    ${ficheClientButton}
                    <button class="btn-reservation btn-reservation-delete" onclick="deleteReservationById('${r.id}')" title="Supprimer"><svg style="width:16px;height:16px;stroke:currentColor;" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
                </div>
                
                <!-- Nom en dessous des boutons -->
                <div class="reservation-name">
                    <span class="reservation-name-text">${escapeHtml(r.nom)}</span>${messageEnvoye}
                </div>
                
                <!-- Dates et tarif avec horaires -->
                <div class="reservation-details">
                    📅 <strong class="reservation-dates-text">${formatDate(r.dateDebut)} <span class="reservation-time-arrival">⏰ ${horaireArrivee}</span> → ${formatDate(r.dateFin)} <span class="reservation-time-departure">⏰ ${horaireDepart}</span></strong>${telephoneDisplay}<br>
                    <div class="reservation-price-row">
                        <span>💰 <strong class="reservation-price">${r.montant.toFixed(2)} €</strong></span>
                        ${platformLogo}
                    </div>
                </div>
                
                <!-- Pied : Ménage seul -->
                <div class="reservation-cleaning">
                    <span class="reservation-cleaning-icon">🧹</span>
                    <span class="reservation-cleaning-date">${dateMenage}${timeLabel}</span>
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
        return '<span class="platform-badge platform-badge-airbnb">AIRBNB</span>';
    } else if (normalizedPlatform.includes('abritel') || normalizedPlatform.includes('homeaway') || normalizedPlatform.includes('homelidays')) {
        return '<span class="platform-badge platform-badge-abritel">ABRITEL</span>';
    } else if (normalizedPlatform.includes('gîtes') || normalizedPlatform.includes('gites') || normalizedPlatform.includes('france')) {
        return '<span class="platform-badge platform-badge-gdf">GDF</span>';
    } else if (normalizedPlatform === 'autre' || normalizedPlatform === 'other' || normalizedPlatform === '') {
        // "Autre" = par défaut Gîtes de France
        return '<span class="platform-badge platform-badge-gdf">GDF</span>';
    } else {
        // Afficher la plateforme inconnue telle quelle
        return `<span class="platform-badge platform-badge-other">${platform.toUpperCase()}</span>`;
    }
}


// ==========================================
// 🛒 MODAL DÉTAILS COMMANDES PRESTATIONS
// ==========================================

async function voirCommandePrestations(reservationId) {
    try {
        // Récupérer les commandes avec les lignes de commande
        const { data: commandes, error } = await window.supabaseClient
            .from('commandes_prestations')
            .select(`
                *,
                lignes_commande_prestations(*)
            `)
            .eq('reservation_id', reservationId)
            .neq('statut', 'cancelled')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!commandes || commandes.length === 0) {
            showNotification('Aucune commande trouvée', 'error');
            return;
        }
        
        // Récupérer les infos de la réservation
        const { data: reservation, error: resError } = await window.supabaseClient
            .from('reservations')
            .select('client_name, gite')
            .eq('id', reservationId)
            .single();
        
        if (resError) console.warn('⚠️ Erreur récupération réservation:', resError);
        
        // Construire le HTML du modal
        let commandesHtml = '';
        
        commandes.forEach(commande => {
            const dateCommande = new Date(commande.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const statutBadge = commande.statut === 'paid' 
                ? '<span style="background: #27AE60; color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700;">Payé</span>'
                : '<span style="background: #F39C12; color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700;">En attente</span>';
            
            let lignesHtml = '';
            (commande.lignes_commande_prestations || []).forEach(ligne => {
                lignesHtml += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                        <div>
                            <div style="font-weight: 600; color: var(--text);">${ligne.nom_prestation}</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">Quantité: ${ligne.quantite} × ${parseFloat(ligne.prix_unitaire).toFixed(2)}€</div>
                        </div>
                        <div style="font-weight: 700; color: var(--text); font-size: 1.1rem;">${parseFloat(ligne.prix_total).toFixed(2)}€</div>
                    </div>
                `;
            });
            
            commandesHtml += `
                <div style="background: #f8f9fa; border: 2px solid var(--stroke); border-radius: 10px; padding: 15px; margin-bottom: 15px; box-shadow: 2px 2px 0 var(--stroke);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div>
                            <div style="font-weight: 700; color: var(--text); font-size: 1rem;">Commande #${commande.numero_commande || commande.id.slice(0, 8)}</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">${dateCommande}</div>
                        </div>
                        ${statutBadge}
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        ${lignesHtml}
                    </div>
                    
                    <div style="border-top: 2px solid var(--stroke); padding-top: 10px; margin-top: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="color: var(--text-secondary);">Sous-total prestations</span>
                            <span style="font-weight: 600;">${parseFloat(commande.montant_prestations).toFixed(2)}€</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="color: var(--text-secondary);">Commission (5%)</span>
                            <span style="font-weight: 600;">${parseFloat(commande.montant_commission).toFixed(2)}€</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--stroke);">
                            <span style="font-weight: 700; font-size: 1.1rem;">Vous recevez</span>
                            <span style="font-weight: 700; font-size: 1.1rem; color: #27AE60;">${parseFloat(commande.montant_net_owner).toFixed(2)}€</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Créer et afficher le modal
        const modal = document.createElement('div');
        modal.id = 'modal-commande-prestations';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px;';
        
        modal.innerHTML = `
            <div style="background: white; border-radius: 15px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; border: 2px solid var(--stroke); box-shadow: 4px 4px 0 var(--stroke);">
                <div style="position: sticky; top: 0; background: white; border-bottom: 2px solid var(--stroke); padding: 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 15px 15px 0 0; z-index: 1;">
                    <div>
                        <h3 style="margin: 0; color: var(--text); font-size: 1.3rem;">🛒 Commandes Prestations</h3>
                        ${reservation ? `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px;">${reservation.client_name} - ${reservation.gite}</div>` : ''}
                    </div>
                    <button id="btn-close-modal-commande" style="background: #E74C3C; color: white; border: 2px solid var(--stroke); width: 40px; height: 40px; border-radius: 10px; cursor: pointer; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 2px 2px 0 var(--stroke); transition: transform 0.1s;">×</button>
                </div>
                <div style="padding: 20px;">
                    ${commandesHtml}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners avec pattern delegation
        document.getElementById('btn-close-modal-commande').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
    } catch (err) {
        console.error('❌ Erreur affichage commandes prestations:', err);
        showNotification('Erreur lors de l\'affichage des commandes', 'error');
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
window.voirCommandePrestations = voirCommandePrestations;

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
