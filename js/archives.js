// ==========================================
// 📦 MODULE GESTION DES ARCHIVES
// ==========================================
// Affichage des réservations passées

async function updateArchivesDisplay() {
    const reservations = await getAllReservations();
    const section = document.getElementById('archivesSection');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const archives = reservations.filter(r => parseLocalDate(r.dateFin) < today);
    archives.sort((a, b) => parseLocalDate(b.dateFin) - parseLocalDate(a.dateFin));
    
    if (archives.length === 0) {
        section.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">Aucune archive</p>';
        return;
    }
    
    let html = '<div class="gite-section">';
    
    archives.forEach(r => {
        const badgeClass = getPlatformBadgeClass(r.site);
        html += `
            <div class="reservation-item ${r.gite.toLowerCase()}">
                <div class="reservation-header">
                    <span class="reservation-name">${r.nom} - ${r.gite}</span>
                    <span class="badge-platform ${badgeClass}">
                        ${r.site}
                    </span>
                </div>
                <div style="margin-top: 8px; font-size: 0.9rem; color: #666;">
                    📅 ${formatDate(r.dateDebut)} → ${formatDate(r.dateFin)} (${r.nuits} nuits)
                </div>
                <div style="margin-top: 8px; font-size: 0.9rem;">
                    💰 ${r.montant ? r.montant.toFixed(2) : '0.00'} € | Statut: ${r.paiement}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    section.innerHTML = html;
}

function getPlatformBadgeClass(platform) {
    const normalized = platform.toLowerCase();
    if (normalized.includes('airbnb')) return 'airbnb';
    if (normalized.includes('abritel')) return 'abritel';
    if (normalized.includes('gîtes') || normalized.includes('gites')) return 'gites';
    return 'autre';
}

// ==========================================
// 🌐 EXPORTS GLOBAUX
// ==========================================

window.updateArchivesDisplay = updateArchivesDisplay;
window.getPlatformBadgeClass = getPlatformBadgeClass;
