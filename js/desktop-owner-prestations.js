// ==========================================
// DESKTOP OWNER - PRESTATIONS & REVENUS
// Version: 2.1 - Compatible app.html
// ==========================================

let giteIdCourant = null;
let prestationsList = [];

// ==========================================
// INITIALISATION
// ==========================================
async function loadGites() {
    console.log('🔍 [PRESTATIONS] Début loadGites');
    
    const select = document.getElementById('giteSelect');
    
    try {
        // Vérifier Supabase
        if (!window.supabaseClient) {
            console.error('❌ [PRESTATIONS] window.supabaseClient non défini');
            select.innerHTML = '<option value="">Erreur: Supabase non initialisé</option>';
            document.getElementById('prestationsGrid').innerHTML = '<div class="empty-state"><p style="color: #ef4444;">❌ Erreur: Supabase non initialisé</p></div>';
            return;
        }
        
        console.log('✓ [PRESTATIONS] Supabase OK');
        
        // Récupérer l'utilisateur connecté
        const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
        
        if (userError) {
            console.error('❌ [PRESTATIONS] Erreur auth:', userError);
            throw userError;
        }
        
        if (!user) {
            console.warn('⚠️ [PRESTATIONS] Pas d\'utilisateur connecté');
            select.innerHTML = '<option value="">Non connecté</option>';
            document.getElementById('prestationsGrid').innerHTML = '<div class="empty-state"><p style="color: #f59e0b;">⚠️ Vous devez être connecté</p></div>';
            return;
        }
        
        console.log('✓ [PRESTATIONS] User ID:', user.id);
        
        // Charger les gîtes
        const { data: gites, error } = await window.supabaseClient
            .from('gites')
            .select('id, name')
            .eq('owner_user_id', user.id)
            .order('name');
        
        if (error) {
            console.error('❌ [PRESTATIONS] Erreur gites:', error);
            throw error;
        }
        
        console.log('✓ [PRESTATIONS] Gîtes trouvés:', gites?.length || 0);
        
        if (!gites || gites.length === 0) {
            select.innerHTML = '<option value="">Aucun gîte trouvé</option>';
            document.getElementById('prestationsGrid').innerHTML = '<div class="empty-state"><p>Aucun gîte trouvé pour cet utilisateur</p></div>';
            document.getElementById('revenusTableBody').innerHTML = '<tr><td colspan="6" class="empty-state"><p>Aucun gîte disponible</p></td></tr>';
            return;
        }
        
        // Vérifier les doublons
        console.log('📋 [PRESTATIONS] Liste des gîtes:', gites.map(g => `${g.name} (${g.id})`));
        
        select.innerHTML = gites.map(g => 
            `<option value="${g.id}">${g.name}</option>`
        ).join('');
        
        console.log('✅ [PRESTATIONS] Options ajoutées au select, total:', select.options.length);
        
        // Charger le premier gîte
        giteIdCourant = gites[0].id;
        console.log('✓ [PRESTATIONS] Gîte sélectionné:', giteIdCourant);
        loadAllData();
        
    } catch (error) {
        console.error('❌ [PRESTATIONS] Erreur fatale:', error);
        select.innerHTML = '<option value="">Erreur de chargement</option>';
        document.getElementById('prestationsGrid').innerHTML = `<div class="empty-state"><p style="color: #ef4444;">❌ Erreur: ${error.message}</p></div>`;
        document.getElementById('revenusTableBody').innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 20px;">❌ Erreur: ${error.message}</td></tr>`;
    }
}

// ==========================================
// CHARGEMENT DONNÉES
// ==========================================
async function loadAllData() {
    console.log('🔄 [PRESTATIONS] loadAllData()');
    
    const select = document.getElementById('giteSelect');
    giteIdCourant = select.value;
    
    console.log('📍 [PRESTATIONS] Gîte ID:', giteIdCourant);
    
    if (!giteIdCourant) {
        console.warn('⚠️ [PRESTATIONS] Pas de gîte sélectionné');
        return;
    }
    
    try {
        await Promise.all([
            loadStatsAnnuelles(),
            loadPrestations(),
            loadRevenusMensuels()
        ]);
        console.log('✅ [PRESTATIONS] Toutes les données chargées');
    } catch (error) {
        console.error('❌ [PRESTATIONS] Erreur loadAllData:', error);
    }
}

// ==========================================
// STATS ANNUELLES
// ==========================================
async function loadStatsAnnuelles() {
    console.log('📊 [STATS] Chargement stats annuelles...');
    
    try {
        const anneeActuelle = new Date().getFullYear();
        
        const { data: commandes, error } = await window.supabaseClient
            .from('commandes_prestations')
            .select('*')
            .eq('gite_id', giteIdCourant)
            .eq('statut', 'paid')
            .gte('created_at', `${anneeActuelle}-01-01`)
            .lte('created_at', `${anneeActuelle}-12-31`);
        
        if (error) throw error;
        
        console.log('✓ [STATS] Commandes trouvées:', commandes?.length || 0);
        
        const caBrut = commandes?.reduce((sum, c) => sum + (c.montant_prestations || 0), 0) || 0;
        const caNet = commandes?.reduce((sum, c) => sum + (c.montant_net_owner || 0), 0) || 0;
        const nbCommandes = commandes?.length || 0;
        const panierMoyen = nbCommandes > 0 ? caBrut / nbCommandes : 0;
        
        document.getElementById('stat-ca-net').textContent = formatEuro(caNet);
        document.getElementById('stat-ca-brut').textContent = formatEuro(caBrut);
        document.getElementById('stat-nb-commandes').textContent = nbCommandes;
        document.getElementById('stat-panier-moyen').textContent = formatEuro(panierMoyen);
        
        console.log('✅ [STATS] Stats affichées');
        
    } catch (error) {
        console.error('❌ [STATS] Erreur:', error);
    }
}

// ==========================================
// PRESTATIONS CATALOGUE
// ==========================================
async function loadPrestations() {
    console.log('📦 [PRESTA] Chargement prestations...');
    
    try {
        const { data, error } = await window.supabaseClient
            .from('prestations_catalogue')
            .select('*')
            .eq('gite_id', giteIdCourant)
            .order('ordre');
        
        if (error) {
            console.error('❌ [PRESTA] Erreur SQL:', error);
            throw error;
        }
        
        console.log('✓ [PRESTA] Prestations trouvées:', data?.length || 0);
        
        prestationsList = data || [];
        renderPrestations();
        
    } catch (error) {
        console.error('❌ [PRESTA] Erreur fatale:', error);
        document.getElementById('prestationsGrid').innerHTML = `
            <div class="empty-state">
              <p style="color: #ef4444;">❌ Erreur: ${error.message}</p>
              <p style="font-size: 12px; color: #64748b; margin-top: 8px;">Vérifiez que la table prestations_catalogue existe</p>
            </div>
        `;
    }
}

function renderPrestations() {
    console.log('🖼️ [PRESTA] Rendu prestations, count:', prestationsList.length);
    
    const grid = document.getElementById('prestationsGrid');
    
    if (prestationsList.length === 0) {
        console.log('ℹ️ [PRESTA] Aucune prestation, affichage empty state');
        grid.innerHTML = `
            <div class="empty-state">
                <i data-lucide="package" style="width: 48px; height: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>Aucune prestation créée</p>
                <p style="font-size: 13px; margin-top: 8px;">Cliquez sur "Créer une prestation" pour commencer</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    grid.innerHTML = prestationsList.map(p => `
        <div class="prestation-card">
            <div class="prestation-header">
                <span class="prestation-icone">${p.icone || '📦'}</span>
                <div>
                    <div class="prestation-name">${p.nom}</div>
                    ${p.categorie ? `<span class="badge badge-info">${p.categorie}</span>` : ''}
                </div>
            </div>
            ${p.description ? `<div class="prestation-description">${p.description}</div>` : ''}
            <div class="prestation-prix">${formatEuro(p.prix)}</div>
            ${p.charges_fiscales > 0 ? `<div class="prestation-charges">Charges: ${formatEuro(p.charges_fiscales)}</div>` : ''}
            <div class="prestation-actions">
                <button onclick="editPrestation(${p.id})" class="btn btn-sm btn-secondary">
                    <i data-lucide="edit"></i> Modifier
                </button>
                <button onclick="deletePrestation(${p.id})" class="btn btn-sm btn-danger">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

// ==========================================
// MODAL PRESTATION
// ==========================================
function openPrestationModal(prestationId = null) {
    const modal = document.getElementById('modalPrestation');
    const form = document.getElementById('formPrestation');
    const title = document.getElementById('modalPrestationTitle');
    
    form.reset();
    document.getElementById('photoPreview').style.display = 'none';
    
    if (prestationId) {
        title.innerHTML = '<i data-lucide="edit"></i> Modifier la prestation';
        const presta = prestationsList.find(p => p.id === prestationId);
        if (presta) {
            document.getElementById('prestationId').value = presta.id;
            document.getElementById('prestationNom').value = presta.nom;
            document.getElementById('prestationDescription').value = presta.description || '';
            document.getElementById('prestationPrix').value = presta.prix;
            document.getElementById('prestationCharges').value = presta.charges_fiscales || 0;
            document.getElementById('prestationCategorie').value = presta.categorie || '';
            document.getElementById('prestationIcone').value = presta.icone || '';
            document.getElementById('prestationPhotoUrl').value = presta.photo_url || '';
            
            if (presta.photo_url) {
                document.getElementById('photoPreview').src = presta.photo_url;
                document.getElementById('photoPreview').style.display = 'block';
            }
        }
    } else {
        title.innerHTML = '<i data-lucide="plus-circle"></i> Créer une prestation';
    }
    
    modal.classList.add('active');
    lucide.createIcons();
}

function closePrestationModal() {
    document.getElementById('modalPrestation').classList.remove('active');
}

async function savePrestation(event) {
    if (event) event.preventDefault();
    
    const form = document.getElementById('formPrestation');
    if (!form) {
        console.error('❌ Formulaire non trouvé');
        return;
    }
    
    const prestationId = document.getElementById('prestationId').value;
    
    console.log('💾 Sauvegarde prestation...', { giteIdCourant, prestationId });
    
    const data = {
        gite_id: giteIdCourant,
        nom: form.nom.value,
        description: form.description.value || null,
        prix: parseFloat(form.prix.value),
        charges_fiscales: parseFloat(form.charges_fiscales.value) || 0,
        categorie: form.categorie.value || null,
        icone: form.icone.value || '📦',
        photo_url: form.photo_url.value || null,
        is_active: true
    };
    
    console.log('💾 Données à sauvegarder:', data);
    
    try {
        if (prestationId) {
            // Modifier
            const { error } = await window.supabaseClient
                .from('prestations_catalogue')
                .update(data)
                .eq('id', prestationId);
            
            if (error) throw error;
            console.log('✓ Prestation modifiée');
        } else {
            // Créer
            const { error } = await window.supabaseClient
                .from('prestations_catalogue')
                .insert(data);
            
            if (error) throw error;
            console.log('✓ Prestation créée');
        }
        
        closePrestationModal();
        await loadPrestations();
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde prestation:', error);
        alert('Erreur lors de la sauvegarde: ' + error.message);
    }
}

function editPrestation(id) {
    openPrestationModal(id);
}

async function deletePrestation(id) {
    if (!confirm('Supprimer cette prestation ?')) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('prestations_catalogue')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        await loadPrestations();
        
    } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
    }
}

function previewPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('photoPreview').src = e.target.result;
        document.getElementById('photoPreview').style.display = 'block';
        document.getElementById('prestationPhotoUrl').value = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ==========================================
// REVENUS MENSUELS
// ==========================================
async function loadRevenusMensuels() {
    console.log('📅 [REVENUS] Chargement revenus...');
    
    try {
        const anneeActuelle = new Date().getFullYear();
        
        const { data: commandes, error } = await window.supabaseClient
            .from('commandes_prestations')
            .select('*')
            .eq('gite_id', giteIdCourant)
            .eq('statut', 'paid')
            .gte('created_at', `${anneeActuelle}-01-01`)
            .lte('created_at', `${anneeActuelle}-12-31`)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ [REVENUS] Erreur SQL:', error);
            throw error;
        }
        
        console.log('✓ [REVENUS] Commandes trouvées:', commandes?.length || 0);
        
        // Grouper par mois
        const groupes = {};
        commandes?.forEach(cmd => {
            const date = new Date(cmd.created_at);
            const moisKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!groupes[moisKey]) {
                groupes[moisKey] = {
                    mois: moisKey,
                    nbCommandes: 0,
                    caBrut: 0,
                    commission: 0,
                    caNet: 0,
                    commandes: []
                };
            }
            
            groupes[moisKey].nbCommandes++;
            groupes[moisKey].caBrut += cmd.montant_prestations || 0;
            groupes[moisKey].commission += cmd.montant_commission || 0;
            groupes[moisKey].caNet += cmd.montant_net_owner || 0;
            groupes[moisKey].commandes.push(cmd);
        });
        
        const dataArray = Object.values(groupes).sort((a, b) => b.mois.localeCompare(a.mois));
        renderRevenusMensuels(dataArray);
        
    } catch (error) {
        console.error('❌ [REVENUS] Erreur:', error);
        document.getElementById('revenusTableBody').innerHTML = `
            <tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 20px;">
                Erreur: ${error.message}
            </td></tr>
        `;
    }
}

function renderRevenusMensuels(data) {
    const tbody = document.getElementById('revenusTableBody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>Aucun revenu ce mois</p></td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(m => `
        <tr onclick="openDetailModal('${m.mois}')" style="cursor: pointer;">
            <td>${formatMois(m.mois)}</td>
            <td><span class="badge badge-info">${m.nbCommandes}</span></td>
            <td>${formatEuro(m.caBrut)}</td>
            <td>${formatEuro(m.commission)}</td>
            <td><strong style="color: #10b981;">${formatEuro(m.caNet)}</strong></td>
            <td>
                <button onclick="event.stopPropagation(); openDetailModal('${m.mois}')" class="btn btn-sm btn-secondary">
                    <i data-lucide="eye"></i> Voir
                </button>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
}

// ==========================================
// MODAL DÉTAILS MOIS
// ==========================================
async function openDetailModal(moisKey) {
    const modal = document.getElementById('modalDetail');
    const content = document.getElementById('detailContent');
    
    modal.classList.add('active');
    content.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement...</div>';
    
    try {
        const [annee, mois] = moisKey.split('-');
        const dateDebut = `${annee}-${mois}-01`;
        const dateFin = new Date(annee, parseInt(mois), 0).toISOString().split('T')[0];
        
        const { data: commandes, error } = await window.supabaseClient
            .from('commandes_prestations')
            .select(`
                *,
                lignes:lignes_commande_prestations(*)
            `)
            .eq('gite_id', giteIdCourant)
            .eq('statut', 'paid')
            .gte('created_at', dateDebut)
            .lte('created_at', `${dateFin}T23:59:59`)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Grouper les prestations par type
        const types = {};
        commandes?.forEach(cmd => {
            cmd.lignes?.forEach(ligne => {
                if (!types[ligne.nom_prestation]) {
                    types[ligne.nom_prestation] = {
                        nom: ligne.nom_prestation,
                        quantite: 0,
                        montant: 0
                    };
                }
                types[ligne.nom_prestation].quantite += ligne.quantite;
                types[ligne.nom_prestation].montant += ligne.prix_total;
            });
        });
        
        const totalCommandes = commandes?.length || 0;
        const totalCA = commandes?.reduce((sum, c) => sum + (c.montant_prestations || 0), 0) || 0;
        
        content.innerHTML = `
            <h4 style="margin-bottom: 20px; font-size: 16px; color: #1a202c;">
                ${formatMois(moisKey)} - Résumé
            </h4>
            <div class="detail-row">
                <span class="detail-label">Total commandes</span>
                <span class="detail-value">${totalCommandes}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Chiffre d'affaires</span>
                <span class="detail-value">${formatEuro(totalCA)}</span>
            </div>
            
            <h4 style="margin: 25px 0 15px; font-size: 16px; color: #1a202c;">
                Prestations vendues
            </h4>
            ${Object.values(types).map(t => `
                <div class="detail-row">
                    <span class="detail-label">${t.nom} (×${t.quantite})</span>
                    <span class="detail-value">${formatEuro(t.montant)}</span>
                </div>
            `).join('')}
        `;
        
    } catch (error) {
        console.error('Erreur détails mois:', error);
        content.innerHTML = `<p style="color: #ef4444;">Erreur: ${error.message}</p>`;
    }
}

function closeDetailModal() {
    document.getElementById('modalDetail').classList.remove('active');
}

// ==========================================
// HELPERS
// ==========================================
function formatEuro(montant) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(montant);
}

function formatMois(moisKey) {
    const [annee, mois] = moisKey.split('-');
    const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${moisNoms[parseInt(mois) - 1]} ${annee}`;
}

// Attacher les event listeners après chargement du HTML
function initEventListeners() {
    console.log('🔗 Initialisation des event listeners...');
    
    // Event delegation sur document pour capturer tous les clics
    document.addEventListener('click', handlePrestationsClick);
    console.log('✓ Event delegation activée');
}

function handlePrestationsClick(e) {
    // Bouton créer une prestation
    if (e.target.closest('#btn-create-prestation')) {
        console.log('🔵 Clic sur Créer une prestation');
        openPrestationModal();
        return;
    }
    
    // Bouton submit du formulaire prestation
    if (e.target.closest('#btn-save-prestation')) {
        e.preventDefault();
        console.log('💾 Clic sur Enregistrer - appel savePrestation');
        savePrestation(e);
        return;
    }
    
    // Bouton fermer modal
    if (e.target.closest('.modal-close') && e.target.closest('#modalPrestation')) {
        console.log('🔵 Clic sur fermer modal');
        closePrestationModal();
        return;
    }
    
    // Bouton annuler
    if (e.target.closest('#btn-cancel-prestation')) {
        console.log('🔵 Clic sur annuler');
        closePrestationModal();
        return;
    }
}

// Export fonctions globales
window.loadGites = loadGites;
window.loadAllData = loadAllData;
window.openPrestationModal = openPrestationModal;
window.closePrestationModal = closePrestationModal;
window.savePrestation = savePrestation;
window.editPrestation = editPrestation;
window.deletePrestation = deletePrestation;
window.previewPhoto = previewPhoto;
window.initEventListeners = initEventListeners;
window.openDetailModal = openDetailModal;
window.closeDetailModal = closeDetailModal;
