// ==========================================
// 📅 AFFICHAGE RÉSERVATIONS - VERSION PROPRE
// ==========================================

async function updateReservationsList() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 1. CHARGER LES DONNÉES (respecte l'abonnement)
    const reservations = await getAllReservations(true);
    const gites = await window.gitesManager.getVisibleGites();
    
    // 2. FILTRER : réservations futures avec vrai nom de client (pas BLOCKED/Reserved)
    const active = reservations.filter(r => {
        const dateFin = parseLocalDate(r.dateFin);
        dateFin.setHours(0, 0, 0, 0);
        
        // Garder si date de fin > aujourd'hui
        return dateFin > today;
    });
    
    // 3. ORGANISER PAR GÎTE
    const byGite = {};
    gites.forEach(g => {
        byGite[g.id] = active
            .filter(r => r.giteId === g.id)
            .sort((a, b) => parseLocalDate(a.dateDebut) - parseLocalDate(b.dateDebut));
    });
    
    // 4. CALCULER LES SEMAINES (de aujourd'hui jusqu'à la dernière réservation)
    const weekKeys = new Set();
    
    // Semaine actuelle
    const todayWeek = getWeekNumber(today);
    const todayYear = today.getFullYear();
    weekKeys.add(`${todayYear}-W${todayWeek}`);
    
    // Semaines des réservations
    active.forEach(r => {
        const d = parseLocalDate(r.dateDebut);
        weekKeys.add(`${d.getFullYear()}-W${getWeekNumber(d)}`);
    });
    
    // Remplir toutes les semaines intermédiaires
    const sorted = Array.from(weekKeys).sort();
    if (sorted.length > 1) {
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        
        let current = new Date(today);
        let currentKey = first;
        
        while (currentKey <= last) {
            weekKeys.add(currentKey);
            current.setDate(current.getDate() + 7);
            currentKey = `${current.getFullYear()}-W${getWeekNumber(current)}`;
        }
    }
    
    const weeks = Array.from(weekKeys).sort();
    
    // 5. GÉNÉRER LE HTML
    const container = document.getElementById('planning-container');
    if (!container) return;
    
    if (gites.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;">⚠️ Aucun gîte configuré</p>';
        return;
    }
    
    if (active.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;">Aucune réservation future</p>';
        return;
    }
    
    let html = '<div class="planning-weeks">';
    
    weeks.forEach(weekKey => {
        const [year, wNum] = weekKey.split('-W');
        const weekNum = parseInt(wNum);
        const weekDates = getWeekDates(parseInt(year), weekNum);
        
        // Grille responsive selon nb gîtes
        let gridCols = Math.min(gites.length, 4);
        let gridStyle = `display:grid; grid-template-columns:repeat(${gridCols}, 1fr); gap:20px; padding:20px;`;
        
        html += `<div class="week-block">
            <div style="${gridStyle}">`;
        
        gites.forEach(g => {
            const color = g.brand_color || '#667eea';
            const resasGite = byGite[g.id].filter(r => getWeekNumber(parseLocalDate(r.dateDebut)) === weekNum);
            
            html += `
                <div style="display:flex; flex-direction:column;">
                    <div style="padding:8px 20px; background:#34495e; color:white; border-radius:8px 8px 0 0; border:3px solid #2D3436; border-bottom:none;">
                        <div style="font-size:0.75rem; opacity:0.8;">${g.name}</div>
                        <div style="font-size:0.95rem; font-weight:bold;">Semaine ${weekNum}</div>
                        <div style="font-size:0.8rem; opacity:0.9;">${formatDateShort(weekDates.start)} - ${formatDateShort(weekDates.end)}</div>
                    </div>
                    <div style="background:rgba(102,126,234,0.15); border:3px solid #2D3436; border-radius:0 0 12px 12px; padding:20px; min-height:120px; box-shadow:6px 6px 0 #2D3436;">
                        ${resasGite.length === 0 ? '<div style="text-align:center;color:#999;padding:20px;">Disponible</div>' : ''}
                        ${resasGite.map(r => renderReservation(r)).join('')}
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function renderReservation(r) {
    const platform = getPlatformLogo(r.site);
    
    return `
        <div style="position:relative; padding:12px; padding-top:40px; background:white; border-radius:8px; margin-bottom:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            <div style="position:absolute; top:8px; right:8px; display:flex; gap:4px;">
                <button onclick="openEditModal(${r.id})" style="background:#e3f2fd; border:none; border-radius:6px; padding:6px 8px; cursor:pointer;">✏️</button>
                <button onclick="aperçuFicheClient(${r.id})" style="background:#e8f5e9; border:none; border-radius:6px; padding:6px 8px; cursor:pointer;">📄</button>
                <button onclick="deleteReservationById(${r.id})" style="background:#ffebee; border:none; border-radius:6px; padding:6px 8px; cursor:pointer;">🗑️</button>
            </div>
            
            <div style="font-weight:700; font-size:1.15rem; color:#0f172a; margin-bottom:8px;">
                ${escapeHtml(r.nom)}
            </div>
            
            <div style="font-size:1rem; color:#334155; margin-bottom:8px;">
                📅 <strong>${formatDate(r.dateDebut)} → ${formatDate(r.dateFin)}</strong><br>
                💰 <strong>${r.montant.toFixed(2)} €</strong>
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; padding-top:8px; border-top:1px solid #e5e7eb;">
                <div style="font-size:0.85rem; color:#64748b;">
                    ${r.nuits} nuits • ${r.nbPersonnes || '-'} pers.
                </div>
                <div>${platform}</div>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getPlatformLogo(platform) {
    if (!platform) return '';
    const p = platform.toLowerCase();
    
    if (p.includes('airbnb')) return '<span style="padding:3px 10px; background:#FF5A5F; color:white; border-radius:6px; font-weight:600; font-size:0.75rem;">airbnb</span>';
    if (p.includes('abritel')) return '<span style="padding:3px 10px; background:#0D4F8B; color:white; border-radius:6px; font-weight:600; font-size:0.75rem;">abritel</span>';
    if (p.includes('gîtes') || p.includes('gites')) return '<span style="padding:3px 10px; background:#27AE60; color:white; border-radius:6px; font-weight:600; font-size:0.75rem;">gîtes de france</span>';
    
    return `<span style="padding:3px 10px; background:#95a5a6; color:white; border-radius:6px; font-weight:600; font-size:0.75rem;">${platform}</span>`;
}

// Fonctions de modification (gardées telles quelles)
function openEditModal(id) {
    getAllReservations(true).then(reservations => {
        const r = reservations.find(x => x.id === id);
        if (!r) return;
        
        document.getElementById('editId').value = r.id;
        document.getElementById('editNom').value = r.nom;
        document.getElementById('editTelephone').value = r.telephone || '';
        document.getElementById('editProvenance').value = r.provenance || '';
        document.getElementById('editNbPersonnes').value = r.nbPersonnes || '';
        document.getElementById('editMontant').value = r.montant;
        document.getElementById('editAcompte').value = r.acompte || 0;
        document.getElementById('editPaiement').value = r.paiement;
        
        document.getElementById('editModal').classList.add('show');
    });
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
}

async function saveEditReservation(event) {
    event.preventDefault();
    
    const id = parseInt(document.getElementById('editId').value);
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
    
    try {
        await updateReservation(id, {
            nom, telephone, provenance,
            nbPersonnes: nbPersonnes ? parseInt(nbPersonnes) : null,
            montant, acompte,
            restant: montant - acompte,
            paiement
        });
        
        await updateReservationsList();
        closeEditModal();
        showToast('✓ Réservation modifiée', 'success');
    } catch (error) {
        console.error('❌ Erreur modification:', error);
        showToast('Erreur lors de la modification', 'error');
    }
}

async function deleteReservationById(id) {
    if (!confirm('Supprimer cette réservation ?')) return;
    
    await deleteReservation(id);
    await updateReservationsList();
    showToast('✓ Réservation supprimée');
}

// Exports
window.updateReservationsList = updateReservationsList;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.saveEditReservation = saveEditReservation;
window.deleteReservationById = deleteReservationById;
