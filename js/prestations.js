/**
 * 🛒 MODULE PRESTATIONS - Gestion du catalogue et statistiques
 * Version: 2026-02-16 - Extraction depuis tab-prestations.html
 */

// Variables globales
let giteSelectionne = null;
let gitesDisponibles = [];
let isLoadingGites = false; // Flag pour éviter les appels multiples

// ========================================
// CHARGEMENT DES GÎTES
// ========================================

/**
 * Charger les gîtes disponibles dans le sélecteur
 */
async function loadGitesSelector() {
    if (isLoadingGites) {
        return;
    }
    
    // Si déjà chargé et qu'on a des gîtes, ne pas recharger
    if (gitesDisponibles.length > 0) {
        return;
    }
    
    isLoadingGites = true;
    try {
        
        // IMPORTANT : Pour l'onglet prestations, on veut TOUS les gîtes
        // (pas de limitation d'abonnement sur la gestion du catalogue)
        const gites = await window.gitesManager.getAll();
        
        gitesDisponibles = gites;
        
        const select = document.getElementById('select-gite-prestations');
        
        if (!select) {
            console.error('❌ Element select-gite-prestations introuvable!');
            return;
        }
        
        select.innerHTML = '<option value="">-- Choisir un gîte --</option>';
        
        if (!gites || gites.length === 0) {
            return;
        }
        
        gites.forEach((gite, index) => {
            const option = document.createElement('option');
            option.value = gite.id;
            option.textContent = gite.name;
            select.appendChild(option);
        });
        
        // Si un seul gîte, le sélectionner automatiquement
        if (gites.length === 1) {
            select.value = gites[0].id;
            onGiteSelected();
        }
        
        isLoadingGites = false;
    } catch (err) {
        console.error('❌ Erreur chargement gîtes:', err);
        isLoadingGites = false;
    }
}

// ========================================
// SÉLECTION GÎTE
// ========================================

/**
 * Quand un gîte est sélectionné
 */
async function onGiteSelected() {
    const select = document.getElementById('select-gite-prestations');
    const giteId = select.value;
    
    if (!giteId) {
        // Retour à la vue initiale avec stats générales
        document.getElementById('prestations-stats-view').style.display = 'block';
        document.getElementById('prestations-management-view').style.display = 'none';
        document.getElementById('btn-gestion-catalogue-container').style.display = 'none';
        giteSelectionne = null;
        
        // Recharger les stats générales (tous les gîtes)
        await chargerStatsGenerales();
        return;
    }
    
    giteSelectionne = gitesDisponibles.find(g => g.id === giteId);
    
    // Afficher le bouton de gestion du catalogue
    document.getElementById('btn-gestion-catalogue-container').style.display = 'block';
    
    // Afficher les statistiques pour ce gîte
    await refreshPrestationsStats();
}

// ========================================
// RAFRAÎCHISSEMENT STATISTIQUES
// ========================================

/**
 * Rafraîchir les statistiques
 */
async function refreshPrestationsStats() {
    // Si aucun gîte sélectionné, afficher les stats pour TOUS les gîtes
    if (!giteSelectionne) {
        await chargerStatsGenerales();
        return;
    }
    
    const today = new Date();
    
    // SEMAINE (lundi à dimanche)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // MOIS
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    // ANNÉE
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearEnd = new Date(today.getFullYear(), 11, 31);
    yearEnd.setHours(23, 59, 59, 999);
    
    // Charger les 3 périodes
    await Promise.all([
        displayCommandesPrestationsSingle('prestations-semaine', weekStart, weekEnd, giteSelectionne),
        displayCommandesPrestationsSingle('prestations-mois', monthStart, monthEnd, giteSelectionne),
        displayCommandesPrestationsSingle('prestations-annee', yearStart, yearEnd, giteSelectionne)
    ]);
}

// ========================================
// AFFICHAGE COMMANDES
// ========================================

/**
 * Charger les statistiques générales (tous les gîtes)
 */
async function chargerStatsGenerales() {
    const today = new Date();
    
    // SEMAINE (lundi à dimanche)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // MOIS
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    // ANNÉE
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearEnd = new Date(today.getFullYear(), 11, 31);
    yearEnd.setHours(23, 59, 59, 999);
    
    // Charger les 3 périodes pour TOUS les gîtes
    await Promise.all([
        displayCommandesPrestationsTous('prestations-semaine', weekStart, weekEnd),
        displayCommandesPrestationsTous('prestations-mois', monthStart, monthEnd),
        displayCommandesPrestationsTous('prestations-annee', yearStart, yearEnd)
    ]);
}

/**
 * Afficher les commandes pour TOUS les gîtes sur une période
 */
async function displayCommandesPrestationsTous(containerId, startDate, endDate) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Chargement...</p>';
    
    try {
        // Requête Supabase SANS filtre de gîte (tous les gîtes)
        const { data, error } = await window.supabaseClient
            .from('commandes_prestations')
            .select(`
                *,
                lignes_commande_prestations(*)
            `)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Aucune commande sur cette période</p>';
            return;
        }
        
        // Agréger par type de prestation
        const prestationsMap = new Map();
        let totalCA = 0;
        
        data.forEach(commande => {
            if (commande.lignes_commande_prestations) {
                commande.lignes_commande_prestations.forEach(ligne => {
                    const nom = ligne.nom_prestation;
                    if (!prestationsMap.has(nom)) {
                        prestationsMap.set(nom, { quantite: 0, ca: 0 });
                    }
                    const prestation = prestationsMap.get(nom);
                    prestation.quantite += ligne.quantite;
                    prestation.ca += ligne.prix_total;
                });
            }
            totalCA += commande.montant_prestations || 0;
        });
        
        // Construire le HTML
        let html = `
            <div style="margin-bottom: 12px; padding: 10px; background: var(--surface-alt); border-radius: 8px; text-align: center;">
                <strong>Tous les gîtes</strong>
            </div>
            <table class="data-table" style="width: 100%;">
                <thead>
                    <tr>
                        <th style="text-align: left;">Prestation</th>
                        <th style="text-align: center;">Quantité</th>
                        <th style="text-align: right;">CA</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        prestationsMap.forEach((prestation, nom) => {
            html += `
                <tr>
                    <td>${nom}</td>
                    <td style="text-align: center;">×${prestation.quantite}</td>
                    <td style="text-align: right; font-weight: 600;">${prestation.ca.toFixed(2)}€</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
                <tfoot>
                    <tr style="font-weight: 700; background: var(--surface-alt);">
                        <td>TOTAL (${data.length} commande${data.length > 1 ? 's' : ''})</td>
                        <td></td>
                        <td style="text-align: right; color: var(--primary);">${totalCA.toFixed(2)}€</td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        container.innerHTML = html;
        
    } catch (err) {
        console.error('❌ Erreur affichage commandes tous gîtes:', err);
        container.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 20px;">Erreur lors du chargement</p>';
    }
}

/**
 * Afficher les commandes pour un gîte sur une période
 */
async function displayCommandesPrestationsSingle(containerId, startDate, endDate, gite) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Chargement...</p>';
    
    try {
        // Requête Supabase
        const { data, error } = await window.supabaseClient
            .from('commandes_prestations')
            .select(`
                *,
                lignes_commande_prestations(*)
            `)
            .eq('gite_id', gite.id)
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Aucune commande sur cette période</p>';
            return;
        }
        
        // Agréger par type de prestation
        const prestationsMap = new Map();
        let totalCA = 0;
        
        data.forEach(commande => {
            if (commande.lignes_commande_prestations) {
                commande.lignes_commande_prestations.forEach(ligne => {
                    const nom = ligne.nom_prestation;
                    if (!prestationsMap.has(nom)) {
                        prestationsMap.set(nom, { quantite: 0, ca: 0 });
                    }
                    const prestation = prestationsMap.get(nom);
                    prestation.quantite += ligne.quantite;
                    prestation.ca += ligne.prix_total;
                });
            }
            totalCA += commande.montant_prestations || 0;
        });
        
        // Construire le HTML
        let html = `
            <table class="data-table" style="width: 100%;">
                <thead>
                    <tr>
                        <th style="text-align: left;">Prestation</th>
                        <th style="text-align: center;">Quantité</th>
                        <th style="text-align: right;">CA</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        prestationsMap.forEach((prestation, nom) => {
            html += `
                <tr>
                    <td>${nom}</td>
                    <td style="text-align: center;">×${prestation.quantite}</td>
                    <td style="text-align: right; font-weight: 600;">${prestation.ca.toFixed(2)}€</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
                <tfoot>
                    <tr style="font-weight: 700; background: var(--surface-alt);">
                        <td>TOTAL (${data.length} commande${data.length > 1 ? 's' : ''})</td>
                        <td></td>
                        <td style="text-align: right; color: var(--primary);">${totalCA.toFixed(2)}€</td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        container.innerHTML = html;
        
    } catch (err) {
        console.error('❌ Erreur affichage commandes:', err);
        container.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 20px;">Erreur lors du chargement</p>';
    }
}

// ========================================
// GESTION DU CATALOGUE
// ========================================

/**
 * Afficher l'interface de gestion du catalogue
 */
async function afficherGestionCatalogue() {
    if (!giteSelectionne) {
        console.error('❌ Aucun gîte sélectionné');
        return;
    }
    
    
    // Masquer les stats, afficher l'interface de gestion
    document.getElementById('prestations-stats-view').style.display = 'none';
    document.getElementById('prestations-management-view').style.display = 'block';
    
    const container = document.getElementById('prestations-management-container');
    
    // Charger le contenu de desktop-owner-prestations.html
    try {
        const response = await fetch('pages/desktop-owner-prestations.html?v=' + Date.now());
        let html = await response.text();
        
        // Extraire les styles du <head>
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        const styles = [];
        let styleMatch;
        while ((styleMatch = styleRegex.exec(html)) !== null) {
            styles.push(styleMatch[1]);
        }
        
        // Extraire uniquement le contenu du body (éviter les conflits HTML)
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
            html = bodyMatch[1];
        }
        
        // Insérer le contenu
        container.innerHTML = html;
        
        // Injecter les styles extraits
        if (styles.length > 0) {
            styles.forEach((styleContent, index) => {
                if (styleContent.trim()) {
                    const style = document.createElement('style');
                    style.textContent = styleContent;
                    style.setAttribute('data-prestations-style', index);
                    container.appendChild(style);
                }
            });
        }
        
        
        // Charger le script JS
        if (!window.desktopOwnerPrestationsLoaded) {
            const script = document.createElement('script');
            script.src = 'js/desktop-owner-prestations.js';
            script.onload = () => {
                window.desktopOwnerPrestationsLoaded = true;
                
                // Initialiser avec le gîte sélectionné
                if (typeof window.initEventListeners === 'function') {
                    window.initEventListeners();
                }
                
                // Charger les données pour ce gîte
                if (typeof window.loadGites === 'function') {
                    setTimeout(() => {
                        window.loadGites().then(() => {
                            // Après le chargement des gîtes, forcer la sélection du bon gîte
                            setTimeout(() => {
                                const select = document.getElementById('giteSelect');
                                
                                if (select) {
                                    select.value = giteSelectionne.id;
                                    
                                    // Charger les données pour ce gîte
                                    if (typeof window.loadAllData === 'function') {
                                        window.loadAllData();
                                    } else {
                                        console.error('❌ [GESTION] loadAllData non disponible');
                                    }
                                } else {
                                    console.error('❌ [GESTION] Select #giteSelect introuvable!');
                                }
                            }, 300);
                        });
                    }, 200);
                }
            };
            script.onerror = (err) => {
                console.error('❌ [GESTION] Erreur chargement script:', err);
            };
            document.body.appendChild(script);
        } else {
            // Script déjà chargé, juste réinitialiser
            if (typeof window.loadGites === 'function') {
                setTimeout(() => {
                    window.loadGites().then(() => {
                        const select = document.getElementById('giteSelect');
                        if (select) {
                            select.value = giteSelectionne.id;
                            
                            if (typeof window.loadAllData === 'function') {
                                window.loadAllData();
                            }
                        }
                    });
                }, 100);
            }
        }
        
        // Réinitialiser les icônes Lucide
        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 100);
        }
        
    } catch (err) {
        console.error('❌ Erreur chargement interface prestations:', err);
        container.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 40px;">Erreur lors du chargement de l\'interface</p>';
    }
}

/**
 * Retour aux statistiques depuis l'interface de gestion
 */
function retourAuxStatistiques() {
    
    const managementView = document.getElementById('prestations-management-view');
    const statsView = document.getElementById('prestations-stats-view');
    
    if (!managementView || !statsView) {
        console.error('❌ [RETOUR] Elements introuvables!', { managementView, statsView });
        return;
    }
    
    managementView.style.display = 'none';
    statsView.style.display = 'block';
    
    
    // Réinitialiser les icônes Lucide
    if (typeof lucide !== 'undefined') {
        setTimeout(() => lucide.createIcons(), 50);
    }
}

// ========================================
// INITIALISATION
// ========================================

/**
 * Initialisation au chargement de l'onglet
 */
async function initPrestations() {
    // Attendre que gitesManager soit disponible
    let retries = 0;
    while (!window.gitesManager && retries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
    }
    
    if (window.gitesManager) {
        await loadGitesSelector();
        // Charger les statistiques générales au démarrage
        await chargerStatsGenerales();
    } else {
        console.error('❌ gitesManager non disponible après 5 secondes');
    }
    
    // Initialiser les icônes Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ========================================
// EXPOSITION GLOBALE
// ========================================

window.initPrestations = initPrestations;
window.onGiteSelected = onGiteSelected;
window.refreshPrestationsStats = refreshPrestationsStats;
window.afficherGestionCatalogue = afficherGestionCatalogue;
window.retourAuxStatistiques = retourAuxStatistiques;

// ========================================
// EVENT DELEGATION (sécurité)
// ========================================
// S'assurer que les clics fonctionnent même si onclick ne marche pas
document.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (!target) return;
    
    // Bouton retour aux statistiques
    if (target.textContent.includes('Retour aux statistiques')) {
        e.preventDefault();
        if (typeof window.retourAuxStatistiques === 'function') {
            window.retourAuxStatistiques();
        }
    }
});
