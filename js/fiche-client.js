// ==========================================
// 📋 MODULE GÉNÉRATION FICHE CLIENT - VERSION SIMPLE
// ==========================================

async function aperçuFicheClient(reservationId) {
    console.log('🎯 START aperçuFicheClient - ID:', reservationId);
    
    try {
        // 1. Attendre Supabase
        if (!window.supabaseClient) {
            await new Promise(resolve => {
                const check = setInterval(() => {
                    if (window.supabaseClient) {
                        clearInterval(check);
                        resolve();
                    }
                }, 50);
            });
        }
        
        // 2. Charger la réservation
        const reservations = await getAllReservations();
        const reservation = reservations.find(r => r.id === reservationId);
        
        if (!reservation) {
            alert('❌ Réservation introuvable');
            return;
        }
        
        console.log('✅ Réservation trouvée:', reservation.nom);
        
        // 3. Chercher token existant
        const { data: existingTokens } = await window.supabaseClient
            .from('client_access_tokens')
            .select('token')
            .eq('reservation_id', reservationId)
            .limit(1);
        
        let token;
        
        if (existingTokens && existingTokens.length > 0) {
            token = existingTokens[0].token;
            console.log('♻️ Token existant trouvé:', token.substring(0, 10) + '...');
        } else {
            // Générer nouveau token
            token = generateSecureToken();
            console.log('✨ Nouveau token généré:', token.substring(0, 10) + '...');
            
            // Calculer expiration (date fin + 7 jours)
            const dateFin = reservation.dateFin || reservation.date_fin;
            const [year, month, day] = dateFin.split('-').map(Number);
            const expiresAt = new Date(year, month - 1, day);
            expiresAt.setDate(expiresAt.getDate() + 7);
            
            console.log('📅 Expiration:', expiresAt.toLocaleDateString('fr-FR'));
            
            // Sauvegarder
            const { error } = await window.supabaseClient
                .from('client_access_tokens')
                .insert({
                    token: token,
                    reservation_id: reservationId,
                    expires_at: expiresAt.toISOString()
                });
            
            if (error) {
                console.error('❌ Erreur insert token:', error);
                alert('Erreur lors de la création du token');
                return;
            }
        }
        
        // 4. Créer URL fiche
        const ficheUrl = `${window.location.origin}/fiche-client.html?token=${token}`;
        console.log('🔗 URL générée:', ficheUrl.substring(0, 80) + '...');
        
        // 5. Afficher modal
        showSimpleModal(reservation, ficheUrl, token);
        
    } catch (error) {
        console.error('❌ ERREUR aperçuFicheClient:', error);
        alert('Erreur: ' + error.message);
    }
}

// Modal simple avec 3 options
function showSimpleModal(reservation, ficheUrl, token) {
    console.log('📱 Affichage modal pour:', reservation.nom);
    
    // Supprimer anciens modals
    document.querySelectorAll('.modal-fiche-options').forEach(m => m.remove());
    
    const modal = document.createElement('div');
    modal.className = 'modal-fiche-options';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    const hasPhone = reservation.telephone && reservation.telephone.trim() !== '';
    
    window.SecurityUtils.setInnerHTML(modal, `
        <div style="background: white; border-radius: 16px; padding: 30px; max-width: 450px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">📄</div>
                <h2 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 1.4rem;">Fiche Client</h2>
                <p style="color: #7f8c8d; margin: 0; font-size: 0.95rem;">${reservation.nom} · ${reservation.gite}</p>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                <button id="btn-open-fiche" 
                        style="width: 100%; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: transform 0.2s;">
                    <span style="font-size: 1.3rem;">🌐</span> Ouvrir la fiche
                </button>
                
                ${hasPhone ? `
                <button id="btn-whatsapp" 
                        style="width: 100%; padding: 14px; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: transform 0.2s;">
                    <span style="font-size: 1.3rem;">💬</span> Envoyer par WhatsApp
                </button>
                ` : `
                <div style="padding: 12px; background: #f8f9fa; border-radius: 10px; text-align: center; color: #95a5a6; font-size: 0.9rem;">
                    ⚠️ Numéro de téléphone manquant
                </div>
                `}
                
                <button id="btn-copy" 
                        style="width: 100%; padding: 14px; background: #f5f5f5; color: #2c3e50; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s;">
                    <span style="font-size: 1.3rem;">📋</span> Copier le lien
                </button>
            </div>
            
            <button id="btn-close" 
                    style="width: 100%; padding: 10px; background: transparent; border: none; color: #95a5a6; cursor: pointer; font-size: 0.9rem;">
                Fermer
            </button>
        </div>
    `);
    
    document.body.appendChild(modal);
    
    // Événements
    document.getElementById('btn-open-fiche').onclick = () => {
        console.log('🌐 Ouverture fiche:', ficheUrl);
        window.open(ficheUrl, '_blank');
        modal.remove();
    };
    
    if (hasPhone) {
        document.getElementById('btn-whatsapp').onclick = () => {
            const phone = reservation.telephone.replace(/\D/g, '').replace(/^0/, '33');
            const message = `Bonjour ${reservation.nom} ! 👋\n\nVoici votre fiche d'accueil pour votre séjour au gîte ${reservation.gite} :\n\n${ficheUrl}\n\nBon séjour ! 🏡`;
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            console.log('💬 Ouverture WhatsApp:', whatsappUrl.substring(0, 50) + '...');
            window.open(whatsappUrl, '_blank');
            modal.remove();
        };
    }
    
    document.getElementById('btn-copy').onclick = () => {
        navigator.clipboard.writeText(ficheUrl).then(() => {
            const btn = document.getElementById('btn-copy');
            btn.innerHTML = '<span style="font-size: 1.3rem;">✅</span> Lien copié !';
            btn.style.background = '#d4edda';
            btn.style.color = '#155724';
            btn.style.borderColor = '#c3e6cb';
            setTimeout(() => modal.remove(), 1500);
        });
    };
    
    document.getElementById('btn-close').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

// Générer token sécurisé
function generateSecureToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// ==========================================
// 🌐 EXPORTS GLOBAUX
// ==========================================

window.aperçuFicheClient = aperçuFicheClient;
