// ==========================================
// FICHE CLIENT - PRESTATIONS
// Version: 1.0
// ==========================================

// État du panier
let panier = [];
let prestationsDisponibles = [];
let giteIdCourant = null;

// ==========================================
// INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Charger le panier du localStorage
    chargerPanier();
    
    // Event listeners
    document.getElementById('btnPanier')?.addEventListener('click', openPanierModal);
    
    // Filtres catégories
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            e.target.closest('.btn-filter').classList.add('active');
            const category = e.target.closest('.btn-filter').dataset.category;
            filtrerPrestations(category);
        });
    });
    
    // Fermer modal au clic extérieur
    document.getElementById('modalPanier')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalPanier') {
            closePanierModal();
        }
    });
});

// ==========================================
// CHARGEMENT PRESTATIONS
// ==========================================
async function loadPrestationsForGite(giteId) {
    giteIdCourant = giteId;
    
    try {
        const { data, error } = await window.supabaseClient
            .from('prestations_catalogue')
            .select('*')
            .eq('gite_id', giteId)
            .eq('is_active', true)
            .order('ordre');
        
        if (error) throw error;
        
        prestationsDisponibles = data || [];
        renderPrestations(prestationsDisponibles);
        
    } catch (error) {
        console.error('Erreur chargement prestations:', error);
    }
}

// ==========================================
// AFFICHAGE PRESTATIONS
// ==========================================
function renderPrestations(prestations) {
    const grid = document.getElementById('prestationsGrid');
    
    if (!prestations || prestations.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                <p data-i18n="prestations_vide">Aucune prestation disponible pour le moment</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = prestations.map(p => `
        <div class="prestation-card" data-id="${p.id}">
            <div class="prestation-header">
                <div class="prestation-icone">
                    ${p.photo_url ? `<img src="${p.photo_url}" alt="${p.nom}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">` : (p.icone || '📦')}
                </div>
                <div>
                    <h3 class="prestation-nom">${(window.currentLanguage === 'en' && p.nom_en) ? p.nom_en : p.nom}</h3>
                </div>
            </div>
            
            ${p.description ? `<p class="prestation-description">${(window.currentLanguage === 'en' && p.description_en) ? p.description_en : p.description}</p>` : ''}
            
            <div class="prestation-prix">${p.prix.toFixed(2)} €</div>
            
            <div class="prestation-actions">
                <div class="qty-controls">
                    <button class="qty-btn" onclick="updateQty(${p.id}, -1)">-</button>
                    <span class="qty-value" id="qty-${p.id}">1</span>
                    <button class="qty-btn" onclick="updateQty(${p.id}, 1)">+</button>
                </div>
                <button class="btn-add-panier" onclick="ajouterAuPanier(${p.id})">
                    <i data-lucide="plus"></i> Ajouter
                </button>
            </div>
        </div>
    `).join('');
    
    // Réinitialiser les icônes Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function filtrerPrestations(category) {
    if (category === 'all') {
        renderPrestations(prestationsDisponibles);
    } else {
        const filtered = prestationsDisponibles.filter(p => p.categorie === category);
        renderPrestations(filtered);
    }
}

// ==========================================
// GESTION QUANTITÉS
// ==========================================
function updateQty(prestationId, delta) {
    const qtyElement = document.getElementById(`qty-${prestationId}`);
    let currentQty = parseInt(qtyElement.textContent);
    currentQty = Math.max(1, Math.min(99, currentQty + delta));
    qtyElement.textContent = currentQty;
}

// ==========================================
// GESTION PANIER
// ==========================================
function ajouterAuPanier(prestationId) {
    const prestation = prestationsDisponibles.find(p => p.id === prestationId);
    if (!prestation) return;
    
    const qty = parseInt(document.getElementById(`qty-${prestationId}`)?.textContent || 1);
    
    // Chercher si déjà dans le panier
    const existingIndex = panier.findIndex(item => item.id === prestationId);
    
    if (existingIndex >= 0) {
        panier[existingIndex].quantite += qty;
    } else {
        panier.push({
            id: prestation.id,
            nom: prestation.nom,
            nom_en: prestation.nom_en,
            prix: parseFloat(prestation.prix),
            icone: prestation.icone,
            quantite: qty
        });
    }
    
    savePanier();
    updatePanierUI();
    
    // Toast notification
    showToast(`${prestation.nom} ajouté au panier`, 'success');
    
    // Reset quantity
    document.getElementById(`qty-${prestationId}`).textContent = '1';
}

function retirerDuPanier(prestationId) {
    panier = panier.filter(item => item.id !== prestationId);
    savePanier();
    updatePanierUI();
    renderPanierItems();
}

function updatePanierQuantite(prestationId, delta) {
    const item = panier.find(i => i.id === prestationId);
    if (!item) return;
    
    item.quantite += delta;
    
    if (item.quantite <= 0) {
        retirerDuPanier(prestationId);
    } else {
        savePanier();
        renderPanierItems();
    }
}

function savePanier() {
    try {
        localStorage.setItem('panier_prestations', JSON.stringify(panier));
    } catch (e) {
        console.error('Erreur sauvegarde panier:', e);
    }
}

function chargerPanier() {
    try {
        const saved = localStorage.getItem('panier_prestations');
        if (saved) {
            panier = JSON.parse(saved);
            updatePanierUI();
        }
    } catch (e) {
        console.error('Erreur chargement panier:', e);
        panier = [];
    }
}

function updatePanierUI() {
    const btnPanier = document.getElementById('btnPanier');
    const badge = document.getElementById('panierCount');
    
    const totalItems = panier.reduce((sum, item) => sum + item.quantite, 0);
    
    if (totalItems > 0) {
        btnPanier.style.display = 'flex';
        badge.textContent = totalItems;
    } else {
        btnPanier.style.display = 'none';
    }
}

// ==========================================
// MODAL PANIER
// ==========================================
function openPanierModal() {
    const modal = document.getElementById('modalPanier');
    modal.classList.add('active');
    renderPanierItems();
    
    // Attacher event listener au bouton commander (au cas où onclick inline ne fonctionne pas)
    const btnCommander = document.querySelector('.btn-commander');
    if (btnCommander) {
        btnCommander.onclick = () => passerCommande();
    }
    
    // Mettre à jour les traductions du modal
    if (typeof window.updateTranslations === 'function') {
        window.updateTranslations();
    }
    
    // Réinitialiser les icônes Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function closePanierModal() {
    document.getElementById('modalPanier').classList.remove('active');
}

function renderPanierItems() {
    const container = document.getElementById('panierItems');
    const totauxContainer = document.getElementById('panierTotaux');
    
    if (panier.length === 0) {
        container.innerHTML = `
            <div class="panier-empty">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🛒</div>
                <p data-i18n="panier_vide">Votre panier est vide</p>
            </div>
        `;
        totauxContainer.style.display = 'none';
        return;
    }
    
    container.innerHTML = panier.map(item => {
        const total = item.prix * item.quantite;
        return `
            <div class="panier-item">
                <div class="panier-item-icone">${item.icone || '📦'}</div>
                <div class="panier-item-details">
                    <div class="panier-item-nom">${(window.currentLanguage === 'en' && item.nom_en) ? item.nom_en : item.nom}</div>
                    <div class="panier-item-prix">
                        ${item.prix.toFixed(2)} € × ${item.quantite} = 
                        <span class="panier-item-total">${total.toFixed(2)} €</span>
                    </div>
                </div>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="updatePanierQuantite(${item.id}, -1)">-</button>
                    <span class="qty-value">${item.quantite}</span>
                    <button class="qty-btn" onclick="updatePanierQuantite(${item.id}, 1)">+</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Calculs
    const montantBrut = panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
    const commission = montantBrut * 0.05;
    const montantTotal = montantBrut + commission;
    
    document.getElementById('panierMontantBrut').textContent = montantBrut.toFixed(2) + ' €';
    document.getElementById('panierCommission').textContent = commission.toFixed(2) + ' €';
    document.getElementById('panierTotal').textContent = montantTotal.toFixed(2) + ' €';
    
    totauxContainer.style.display = 'block';
    
    // Réinitialiser les icônes Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ==========================================
// PASSAGE COMMANDE
// ==========================================
async function passerCommande() {
    if (panier.length === 0) {
        showToast('Votre panier est vide', 'error');
        return;
    }
    
    // Récupérer reservation_id depuis les données globales
    const reservationId = window.reservationData?.id;
    
    if (!reservationId) {
        showToast('Erreur : Réservation non trouvée', 'error');
        console.error('❌ reservationData:', window.reservationData);
        return;
    }
    
    console.log('📦 Commande en cours...', { reservationId, panier });
    
    try {
        // Calculs
        const montantBrut = panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
        const commission = montantBrut * 0.05;
        const montantNet = montantBrut - commission;
        
        // Créer la commande
        const { data: commande, error: errorCommande } = await window.supabaseClient
            .from('commandes_prestations')
            .insert([{
                reservation_id: reservationId,
                gite_id: giteIdCourant,
                numero_commande: generateNumeroCommande(),
                montant_prestations: montantBrut,
                montant_commission: commission,
                montant_net_owner: montantNet,
                statut: 'paid',
                methode_paiement: 'carte'
            }])
            .select()
            .single();
        
        if (errorCommande) throw errorCommande;
        
        // Créer les lignes de commande
        const lignes = panier.map(item => ({
            commande_id: commande.id,
            prestation_id: item.id,
            nom_prestation: item.nom,
            prix_unitaire: item.prix,
            quantite: item.quantite,
            prix_total: item.prix * item.quantite
        }));
        
        const { error: errorLignes } = await window.supabaseClient
            .from('lignes_commande_prestations')
            .insert(lignes);
        
        if (errorLignes) throw errorLignes;
        
        // Succès !
        showToast('✅ Commande passée avec succès !', 'success');
        
        // Vider le panier
        panier = [];
        savePanier();
        updatePanierUI();
        closePanierModal();
        
        // Afficher confirmation
        setTimeout(() => {
            alert(`Commande ${commande.numero_commande} confirmée !\n\nMontant : ${montantBrut.toFixed(2)} €\nCommission : ${commission.toFixed(2)} €\nTotal : ${(montantBrut + commission).toFixed(2)} €\n\nVous recevrez une confirmation par email.`);
        }, 500);
        
    } catch (error) {
        console.error('Erreur commande:', error);
        showToast('Erreur lors de la commande : ' + error.message, 'error');
    }
}

function generateNumeroCommande() {
    const date = new Date();
    const dateStr = date.getFullYear() + 
                   String(date.getMonth() + 1).padStart(2, '0') + 
                   String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 99999) + 1).padStart(5, '0');
    return `CMD-${dateStr}-${random}`;
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Export fonctions globales
window.ajouterAuPanier = ajouterAuPanier;
window.updateQty = updateQty;
window.updatePanierQuantite = updatePanierQuantite;
window.openPanierModal = openPanierModal;
window.closePanierModal = closePanierModal;
window.passerCommande = passerCommande;
window.loadPrestationsForGite = loadPrestationsForGite;
