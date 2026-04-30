// ==========================================
// 📱 RÉSERVATIONS MOBILE - Grille 2 colonnes
// ==========================================

// console.log('📱 reservations.js MOBILE chargé');

// Fonction principale réservations mobile
async function updateReservationsList() {
    // console.log('🔄 updateReservationsList MOBILE');
    
    const reservations = await getAllReservations(true);
    // console.log('📊 Réservations chargées:', reservations?.length || 0);
    
    const gites = await window.gitesManager.getVisibleGites();
    // console.log('🏠 Gîtes chargés:', gites?.length || 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filtrer réservations futures (check_out >= aujourd'hui)
    const active = reservations.filter(r => {
        const dateFin = parseLocalDate(r.dateFin);
        dateFin.setHours(0, 0, 0, 0);
        return dateFin >= today;
    });
    
    const container = document.getElementById('planning-container');
    if (!container) return;
    
    if (gites.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: #999; padding: 40px;">⚠️ Aucun gîte configuré</p>');
        return;
    }
    
    if (active.length === 0) {
        window.SecurityUtils.setInnerHTML(container, '<p style="text-align: center; color: #999; padding: 40px;">Aucune réservation</p>');
        return;
    }
    
    // Trier par date de début
    active.sort((a, b) => parseLocalDate(a.dateDebut) - parseLocalDate(b.dateDebut));
    
    let html = '<div class="resa-card-grid">';
    
    active.forEach(r => {
        const gite = gites.find(g => g.id === r.giteId);
        const giteColor = gite?.color || '#667eea';
        const dateDebut = parseLocalDate(r.dateDebut);
        const dateFin = parseLocalDate(r.dateFin);
        
        html += `
            <div style="background: white; border: 2px solid ${giteColor}; border-radius: 8px; padding: 8px; box-shadow: 2px 2px 0 #2D3436;">
                <div style="font-size: 0.7rem; font-weight: 700; color: #2D3436; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(r.nom)}</div>
                <div style="font-size: 0.6rem; color: ${giteColor}; font-weight: 600; margin-bottom: 4px;">🏠 ${escapeHtml(gite?.name || r.gite)}</div>
                <div style="font-size: 0.6rem; color: #27AE60; margin-bottom: 2px; font-weight: 600;">📥 ${formatDateShort(dateDebut)}</div>
                <div style="font-size: 0.6rem; color: #E74C3C; margin-bottom: 6px; font-weight: 600;">📤 ${formatDateShort(dateFin)}</div>
                <div class="resa-actions-grid-3">
                    <button onclick="openEditModal('${r.id}')" style="background: #667eea; color: white; border: 1px solid #2D3436; padding: 4px 2px; border-radius: 4px; cursor: pointer; font-size: 0.65rem; font-weight: 600;">✏️</button>
                    <button onclick="aperçuFicheClient('${r.id}')" style="background: #27ae60; color: white; border: 1px solid #2D3436; padding: 4px 2px; border-radius: 4px; cursor: pointer; font-size: 0.65rem; font-weight: 600;">📄</button>
                    <button onclick="deleteReservationById('${r.id}')" style="background: #e74c3c; color: white; border: 1px solid #2D3436; padding: 4px 2px; border-radius: 4px; cursor: pointer; font-size: 0.65rem; font-weight: 600;">🗑️</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    window.SecurityUtils.setInnerHTML(container, html);
}

// Fonction de recherche mobile
function filterReservations(term) {
    // TODO: implémenter recherche si nécessaire
    // console.log('🔍 Recherche:', term);
}

// Actualisation
async function forceRefreshReservations() {
    const btn = event?.target;
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Actualisation...';
    }
    
    try {
        invalidateCache('all');
        await updateReservationsList();
        showToast('Données actualisées', 'success');
    } catch (error) {
        console.error('❌ Erreur actualisation:', error);
        showToast('Erreur actualisation', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

// Utilitaires
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDateShort(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
}
