// ==========================================
// 📋 MODULE APERÇU FICHE CLIENT
// ==========================================
// Génération de la fiche client avec toutes les informations pratiques

async function aperçuFicheClient(reservationId) {
    // Fermer le modal si ouvert
    document.querySelectorAll('div[style*="z-index: 10000"]').forEach(el => el.remove());
    
    const reservations = await getAllReservations();
    const reservation = reservations.find(r => r.id === reservationId);
    
    if (!reservation) {
        showToast('Réservation introuvable', 'error');
        return;
    }
    
    const infosGite = loadInfosGites(reservation.gite);
    
    // Charger les activités selon le gîte
    const restaurants = JSON.parse(localStorage.getItem('restaurants') || '{}');
    const activites = JSON.parse(localStorage.getItem('activites') || '{}');
    const restaurantsGite = reservation.gite === 'Trévoux' ? restaurants.trevoux : restaurants.couzon;
    const activitesGite = reservation.gite === 'Trévoux' ? activites.trevoux : activites.couzon;
    const lyon = localStorage.getItem('activitesLyon') || '';
    const dombes = localStorage.getItem('activitesDombes') || '';
    const parcsZoo = localStorage.getItem('parcsZoo') || '';
    
    // Créer le modal avec le contenu de la fiche
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        overflow-y: auto;
        padding: 20px;
    `;
    
    const ficheContent = `
        <div style="background: white; max-width: 900px; width: 100%; border-radius: 20px; overflow: hidden; max-height: 90vh; display: flex; flex-direction: column;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; position: relative;">
                <button onclick="this.closest('[style*=\\'z-index: 10001\\']').remove()" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.3); border: none; color: white; font-size: 24px; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
                <h1 style="font-family: 'Playfair Display', serif; font-size: 2rem; margin: 0 0 10px 0;">🏡 Bienvenue ${reservation.nom} !</h1>
                <p style="font-size: 1.2rem; opacity: 0.95; margin: 0;">Gîte de ${reservation.gite}</p>
            </div>
            
            <!-- Body with scroll -->
            <div style="padding: 30px; overflow-y: auto; flex: 1;">
                <!-- Séjour -->
                <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 25px; border-radius: 10px;">
                    <h2 style="color: #667eea; font-size: 1.5rem; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">📅 Votre Séjour</h2>
                    <div style="font-size: 1.1rem; line-height: 1.8;">
                        <div><strong>Arrivée :</strong> ${formatDate(reservation.dateDebut)}</div>
                        <div><strong>Départ :</strong> ${formatDate(reservation.dateFin)}</div>
                        <div><strong>Durée :</strong> ${reservation.nuits} nuit${reservation.nuits > 1 ? 's' : ''}</div>
                        ${infosGite.adresse ? `<div><strong>📍 Adresse :</strong> ${infosGite.adresse}</div>` : ''}
                    </div>
                </div>
                
                <!-- Accès -->
                <div style="background: #f8f9fa; border-left: 4px solid #27AE60; padding: 20px; margin-bottom: 25px; border-radius: 10px;">
                    <h2 style="color: #27AE60; font-size: 1.5rem; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">🔑 Accès au Gîte</h2>
                    ${infosGite.codeCle ? `
                    <div style="font-size: 1.1rem; margin-bottom: 15px;">
                        <strong>Code boîte à clés :</strong>
                        <span style="background: #27AE60; color: white; padding: 5px 15px; border-radius: 8px; font-weight: 600; font-size: 1.3rem; display: inline-block; margin-left: 10px;">${infosGite.codeCle}</span>
                    </div>` : '<div style="font-size: 1.1rem;">Le code vous sera communiqué séparément.</div>'}
                    ${infosGite.wifi ? `
                    <div style="font-size: 1.1rem;">
                        <strong>📶 WiFi :</strong>
                        <span style="background: #667eea; color: white; padding: 5px 15px; border-radius: 8px; font-weight: 600; font-size: 1.3rem; display: inline-block; margin-left: 10px;">${infosGite.wifi}</span>
                    </div>` : ''}
                </div>
                
                ${infosGite.instructionsArrivee ? `
                <div style="margin-bottom: 25px;">
                    <h2 style="color: #27AE60; font-size: 1.4rem; margin: 0 0 15px 0;">✅ Instructions d'Arrivée</h2>
                    <div style="background: #f0f9f4; padding: 20px; border-radius: 10px; white-space: pre-wrap; line-height: 1.6;">${infosGite.instructionsArrivee}</div>
                </div>` : ''}
                
                ${infosGite.instructionsDepart ? `
                <div style="margin-bottom: 25px;">
                    <h2 style="color: #E74C3C; font-size: 1.4rem; margin: 0 0 15px 0;">🚪 Instructions de Départ</h2>
                    <div style="background: #fef5f5; padding: 20px; border-radius: 10px; white-space: pre-wrap; line-height: 1.6;">${infosGite.instructionsDepart}</div>
                </div>` : ''}
                
                ${restaurantsGite ? `
                <div style="margin-bottom: 25px;">
                    <h2 style="color: #f5576c; font-size: 1.4rem; margin: 0 0 15px 0;">🍽️ Nos Restaurants Recommandés</h2>
                    <div style="background: #fff5f7; padding: 20px; border-radius: 10px; white-space: pre-wrap; line-height: 1.8;">${restaurantsGite}</div>
                </div>` : ''}
                
                ${activitesGite ? `
                <div style="margin-bottom: 25px;">
                    <h2 style="color: #4facfe; font-size: 1.4rem; margin: 0 0 15px 0;">🎯 Activités à Proximité</h2>
                    <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; white-space: pre-wrap; line-height: 1.8;">${activitesGite}</div>
                </div>` : ''}
                
                ${lyon ? `
                <div style="margin-bottom: 25px;">
                    <h2 style="color: #fa709a; font-size: 1.4rem; margin: 0 0 15px 0;">🏛️ Découvrir Lyon (30-40 min)</h2>
                    <div style="background: #fff8f0; padding: 20px; border-radius: 10px; white-space: pre-wrap; line-height: 1.8;">${lyon}</div>
                </div>` : ''}
                
                ${dombes ? `
                <div style="margin-bottom: 25px;">
                    <h2 style="color: #a8edea; font-size: 1.4rem; margin: 0 0 15px 0;">🦆 Les Dombes (15-30 min)</h2>
                    <div style="background: #f0fffe; padding: 20px; border-radius: 10px; white-space: pre-wrap; line-height: 1.8;">${dombes}</div>
                </div>` : ''}
                
                ${parcsZoo ? `
                <div style="margin-bottom: 25px;">
                    <h2 style="color: #fcb69f; font-size: 1.4rem; margin: 0 0 15px 0;">🦁 Parcs Animaliers du Secteur</h2>
                    <div style="background: #fff8f0; padding: 20px; border-radius: 10px; white-space: pre-wrap; line-height: 1.8;">${parcsZoo}</div>
                </div>` : ''}
                
                <!-- Footer -->
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; color: #666;">
                    <p style="font-size: 1.1rem; margin: 0 0 10px 0;">Nous vous souhaitons un excellent séjour ! 🌟</p>
                    <p style="font-size: 0.95rem; margin: 0;">Pour toute question, n'hésitez pas à nous contacter.</p>
                </div>
            </div>
            
            <!-- Actions -->
            <div style="background: #f8f9fa; padding: 20px; border-top: 1px solid #e0e0e0; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button onclick="window.print()" style="padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-size: 1rem; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    🖨️ Imprimer
                </button>
                <button onclick="telechargerPageHTML(${JSON.stringify(reservation).replace(/"/g, '&quot;')}); this.closest('[style*=\\'z-index: 10001\\']').remove();" style="padding: 12px 24px; background: linear-gradient(135deg, #27AE60 0%, #229954 100%); color: white; border: none; border-radius: 10px; font-size: 1rem; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    💾 Télécharger Simple
                </button>
                <button onclick="telechargerFicheInteractive(${reservationId}); this.closest('[style*=\\'z-index: 10001\\']').remove();" style="padding: 12px 24px; background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; border: none; border-radius: 10px; font-size: 1rem; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    ✨ Fiche Interactive Client
                </button>
                <button onclick="this.closest('[style*=\\'z-index: 10001\\']').remove()" style="padding: 12px 24px; background: #e0e0e0; color: #666; border: none; border-radius: 10px; font-size: 1rem; cursor: pointer;">
                    Fermer
                </button>
            </div>
        </div>
    `;
    
    modal.innerHTML = ficheContent;
    document.body.appendChild(modal);
    
    // Fermer au clic sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ==========================================
// 📥 TÉLÉCHARGEMENT FICHE INTERACTIVE
// ==========================================

async function telechargerFicheInteractive(reservationId) {
    const reservations = await getAllReservations();
    const reservation = reservations.find(r => r.id === reservationId);
    
    if (!reservation) {
        showToast('Réservation introuvable', 'error');
        return;
    }
    
    showToast('Génération de la fiche interactive...', 'info');
    
    try {
        const htmlContent = await genererFicheClientComplete(reservation);
        
        // Créer le fichier et le télécharger
        const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fiche-client-${reservation.nom.replace(/\s+/g, '-')}-${reservation.gite}.html`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('Fiche interactive générée avec succès !', 'success');
    } catch (error) {
        console.error('Erreur génération fiche:', error);
        showToast('Erreur lors de la génération', 'error');
    }
}

// ==========================================
// 🌐 EXPORTS GLOBAUX
// ==========================================

window.aperçuFicheClient = aperçuFicheClient;
window.telechargerFicheInteractive = telechargerFicheInteractive
// ==========================================

window.aperçuFicheClient = aperçuFicheClient;
