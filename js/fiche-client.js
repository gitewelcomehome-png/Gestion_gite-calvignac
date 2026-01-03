// ==========================================
// 📋 MODULE GÉNÉRATION FICHE CLIENT
// ==========================================
// Génération directe du token et options d'envoi/partage

async function aperçuFicheClient(reservationId) {
    console.log('🎯 aperçuFicheClient appelé avec reservationId:', reservationId);
    try {
        // Attendre que supabaseClient soit disponible
        console.log('🔍 Vérification supabaseClient...');
        if (typeof window.supabaseClient === 'undefined') {
            console.log('⏳ Attente de supabaseClient...');
            await new Promise(resolve => {
                const check = setInterval(() => {
                    if (typeof window.supabaseClient !== 'undefined') {
                        clearInterval(check);
                        console.log('✅ supabaseClient chargé');
                        resolve();
                    }
                }, 50);
            });
        } else {
            console.log('✅ supabaseClient déjà disponible');
        }
        
        console.log('📋 Récupération des réservations...');
        const reservations = await getAllReservations();
        console.log('📋 Réservations récupérées:', reservations.length);
        
        const reservation = reservations.find(r => r.id === reservationId);
        console.log('🔍 Réservation trouvée:', reservation);
        
        if (!reservation) {
            console.error('❌ Réservation introuvable pour ID:', reservationId);
            showToast('Réservation introuvable', 'error');
            return;
        }
        
        // Vérifier si un token existe déjà
        const { data: existingTokens } = await window.supabaseClient
            .from('client_access_tokens')
            .select('token')
            .eq('reservation_id', reservationId)
            .limit(1);
        
        let token;
        let isNewToken = false;
        
        if (existingTokens && existingTokens.length > 0) {
            token = existingTokens[0].token;
        } else {
            // Générer un nouveau token
            token = generateSecureToken();
            isNewToken = true;
            // Support des deux formats de nom de colonne
            const dateFin = reservation.date_fin || reservation.dateFin;
            console.log('📅 Date fin récupérée:', dateFin);
            
            // Utiliser parseLocalDate si disponible, sinon parser manuellement
            let expiresAt;
            if (typeof parseLocalDate === 'function' && dateFin.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Format YYYY-MM-DD
                console.log('✅ Utilisation de parseLocalDate');
                expiresAt = parseLocalDate(dateFin);
            } else if (dateFin.includes('-')) {
                // Format DD-MM-YYYY
                console.log('📝 Format DD-MM-YYYY détecté');
                const [day, month, year] = dateFin.split('-');
                expiresAt = new Date(year, month - 1, day);
            } else if (dateFin.includes('/')) {
                // Format DD/MM/YYYY
                console.log('📝 Format DD/MM/YYYY détecté');
                const [day, month, year] = dateFin.split('/');
                expiresAt = new Date(year, month - 1, day);
            } else {
                // Fallback
                console.log('⚠️ Fallback parsing');
                expiresAt = new Date(dateFin);
            }
            
            console.log('📅 Date expiration calculée:', expiresAt);
            expiresAt.setDate(expiresAt.getDate() + 7);
            console.log('📅 Date expiration +7 jours:', expiresAt);
            console.log('📅 ISO String:', expiresAt.toISOString());
            
            const { error } = await window.supabaseClient
                .from('client_access_tokens')
                .insert({
                    token: token,
                    reservation_id: reservationId,
                    expires_at: expiresAt.toISOString()
                });
            
            if (error) {
                console.error('Erreur génération token:', error);
                showToast('Erreur lors de la génération', 'error');
                return;
            }
        }
        
        const ficheUrl = `${window.location.origin}/fiche-client.html?token=${token}`;
        
        // Afficher modal avec options
        showFicheOptionsModal(reservation, ficheUrl, isNewToken);
        
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur lors de la génération', 'error');
    }
}

// Afficher modal avec options d'envoi
function showFicheOptionsModal(reservation, ficheUrl, isNewToken) {
    // Fermer modals existants
    document.querySelectorAll('.modal-fiche-options').forEach(m => m.remove());
    
    const modal = document.createElement('div');
    modal.className = 'modal-fiche-options';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; padding: 30px; max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="font-size: 3rem; margin-bottom: 10px;">${isNewToken ? '✨' : '📄'}</div>
                <h2 style="margin: 0 0 10px 0; color: #333;">Fiche Client ${isNewToken ? 'Générée' : 'Prête'}</h2>
                <p style="color: #666; margin: 0;">${reservation.nom} - ${reservation.gite}</p>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button onclick="window.open('${ficheUrl}', '_blank'); this.closest('.modal-fiche-options').remove();" 
                        style="padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-size: 1.05rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 600;">
                    <span style="font-size: 1.3rem;">🌐</span> Ouvrir la fiche
                </button>
                
                ${reservation.telephone ? `
                <button onclick="sendWhatsAppFiche('${reservation.telephone}', '${ficheUrl}', '${reservation.nom}'); this.closest('.modal-fiche-options').remove();" 
                        style="padding: 16px; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; border: none; border-radius: 12px; font-size: 1.05rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 600;">
                    <span style="font-size: 1.3rem;">💬</span> Envoyer par WhatsApp
                </button>
                ` : '<p style="text-align: center; color: #999; padding: 10px;">⚠️ Numéro de téléphone manquant</p>'}
                
                <button onclick="copyToClipboard('${ficheUrl}'); showToast('Lien copié !', 'success');" 
                        style="padding: 16px; background: #f5f5f5; color: #333; border: 2px solid #ddd; border-radius: 12px; font-size: 1.05rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 600;">
                    <span style="font-size: 1.3rem;">📋</span> Copier le lien
                </button>
            </div>
            
            <button onclick="this.closest('.modal-fiche-options').remove();" 
                    style="margin-top: 20px; width: 100%; padding: 12px; background: transparent; border: none; color: #999; font-size: 0.95rem; cursor: pointer;">
                Fermer
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fermer en cliquant en dehors
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Fonction helper pour envoyer WhatsApp
function sendWhatsAppFiche(telephone, ficheUrl, nom) {
    const message = `Bonjour ${nom},

Voici votre guide personnalisé pour votre séjour :
${ficheUrl}

Vous y trouverez toutes les informations nécessaires (codes, WiFi, horaires, activités...).

À très bientôt ! 🏡`;
    
    const whatsappUrl = `https://wa.me/${telephone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    showToast('WhatsApp ouvert', 'success');
}

// Fonction helper pour copier dans le presse-papier
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // Fallback pour navigateurs anciens
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

// Fonction pour générer un token sécurisé
function generateSecureToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Ancienne fonction d'aperçu (conservée pour référence mais non utilisée)
async function aperçuFicheClientOLD_UNUSED(reservationId) {
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
window.showFicheOptionsModal = showFicheOptionsModal;
window.telechargerFicheInteractive = telechargerFicheInteractive;
window.genererPageClient = aperçuFicheClient; // Alias
