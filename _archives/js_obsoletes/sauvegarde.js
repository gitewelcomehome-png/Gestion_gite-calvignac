/**
 * 💾 MODULE SAUVEGARDE & EXPORT
 * Gestion des exports Excel, JSON et imports de données
 */

// ==========================================
// 📊 EXPORT EXCEL
// ==========================================

async function exportToExcel() {
    const reservations = await getAllReservations();
    if (reservations.length === 0) {
        showToast('⚠️ Aucune réservation', 'error');
        return;
    }
    
    const wb = XLSX.utils.book_new();
    const trevoux = reservations.filter(r => r.gite === 'Trévoux').map(r => ({
        'Noms': r.nom, 
        'Provenance': r.provenance, 
        'Date début': r.dateDebut,
        'Date fin': r.dateFin, 
        'Nbr Nuits': r.nuits, 
        'Nbr Personnes': r.nbPersonnes,
        'Montant total': r.montant, 
        'Acompte': r.acompte, 
        'Montant restant': r.restant,
        'Paiement': r.paiement, 
        'Site': r.site
    }));
    const couzon = reservations.filter(r => r.gite === 'Couzon').map(r => ({
        'Noms': r.nom, 
        'Provenance': r.provenance, 
        'Date début': r.dateDebut,
        'Date fin': r.dateFin, 
        'Nbr Nuits': r.nuits, 
        'Nbr Personnes': r.nbPersonnes,
        'Montant total': r.montant, 
        'Acompte': r.acompte, 
        'Montant restant': r.restant,
        'Paiement': r.paiement, 
        'Site': r.site
    }));
    
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trevoux), 'Trévoux');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(couzon), 'Couzon');
    XLSX.writeFile(wb, `Reservations_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('✓ Excel téléchargé !');
}

// ==========================================
// 💾 EXPORT JSON
// ==========================================

async function exportAllData() {
    const reservations = await getAllReservations();
    const backup = {
        version: '1.0',
        date: new Date().toISOString(),
        reservations: reservations
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sauvegarde_Gites_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Sauvegarde téléchargée !');
}

// ==========================================
// 📥 IMPORT JSON
// ==========================================

async function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!confirm('⚠️ L\'import va REMPLACER toutes vos données. Continuer ?')) {
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            
            // Note: Cette partie nécessite une adaptation selon votre base de données
            // Si vous utilisez IndexedDB, il faudra adapter le code
            // Si vous utilisez Supabase, il faudra utiliser les fonctions appropriées
            
            for (const r of backup.reservations) {
                delete r.id; // Supprimer l'ancien ID
                await addReservation(r);
            }
            
            await updateReservationsList();
            await updateStats();
            await updateArchivesDisplay();
            showToast('✓ Données importées !');
            event.target.value = '';
        } catch (error) {
            showToast('❌ Erreur import', 'error');
            console.error(error);
        }
    };
    reader.readAsText(file);
}

// ==========================================
// 💾 SAUVEGARDE COMPLÈTE
// ==========================================

async function sauvegarderTout() {
    try {
        await exportAllData();
        await exportToExcel();
        showToast('✓ JSON + Excel sauvegardés !');
    } catch (error) {
        showToast('❌ Erreur lors de la sauvegarde');
        console.error(error);
    }
}

// Exporter les fonctions dans le scope global
window.exportToExcel = exportToExcel;
window.exportAllData = exportAllData;
window.importAllData = importAllData;
window.sauvegarderTout = sauvegarderTout;
