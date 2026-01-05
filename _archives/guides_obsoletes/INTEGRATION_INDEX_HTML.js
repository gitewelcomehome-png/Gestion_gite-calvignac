/*******************************************************************************
 * INSTRUCTIONS D'INTÉGRATION - Fiches Clients dans index.html
 * 
 * Suivez ces 3 étapes pour intégrer le module Fiches Clients dans votre
 * dashboard principal (index.html)
 ******************************************************************************/


/*******************************************************************************
 * ÉTAPE 1 : Ajouter le script dans <head>
 * 
 * Localisation : Dans la section <head> de index.html, après les autres scripts
 ******************************************************************************/

/* CHERCHER cette ligne dans index.html : */
<script src="js/faq.js" type="module"></script>

/* AJOUTER juste après : */
<script src="js/fiches-clients.js"></script>


/*******************************************************************************
 * ÉTAPE 2 : Ajouter le bouton tab dans la navigation
 * 
 * Localisation : Dans la section .nav-tabs (vers ligne 100-150 de index.html)
 ******************************************************************************/

/* CHERCHER cette section dans index.html : */
<div class="nav-tabs">
    <button class="tab-btn active" data-tab="dashboard">
        <span class="tab-icon">📊</span>
        Dashboard
    </button>
    <!-- ... autres tabs ... -->
    <button class="tab-btn" data-tab="faq">
        <span class="tab-icon">❓</span>
        FAQ
    </button>
    
/* AJOUTER ce nouveau bouton juste après le bouton FAQ : */
    <button class="tab-btn" data-tab="fichesClients">
        <span class="tab-icon">📄</span>
        Fiches Clients
    </button>
</div>


/*******************************************************************************
 * ÉTAPE 3 : Ajouter le contenu du tab
 * 
 * Localisation : Dans le <main>, après les autres <div class="tab-content">
 ******************************************************************************/

/* CHERCHER cette section dans index.html (vers ligne 4000+) : */
<!-- TAB FAQ -->
<div class="tab-content" id="faqContent" style="display: none;">
    <!-- Contenu du tab FAQ -->
</div>

/* AJOUTER juste après, TOUT le contenu du fichier tabs/tab-fiches-clients.html : */

<!-- TAB FICHES CLIENTS -->
<div class="tab-content" id="fichesClientsContent" style="display: none;">
    <div class="container">
        <h2 style="margin-bottom: 30px; color: var(--primary); font-family: 'Playfair Display', serif;">
            📄 Fiches Clients Interactives
        </h2>
        
        <!-- ... COPIER TOUT LE CONTENU de tabs/tab-fiches-clients.html ... -->
        
    </div>
</div>


/*******************************************************************************
 * ÉTAPE 4 : Initialiser le module au changement de tab
 * 
 * Localisation : Dans la fonction showTab() (chercher "function showTab")
 ******************************************************************************/

/* CHERCHER cette fonction dans index.html : */
function showTab(tabName) {
    console.log('Affichage du tab:', tabName);
    
    // Cacher tous les tabs
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // ... code existant ...
    
    // Initialiser le contenu selon le tab
    if (tabName === 'dashboard') {
        loadDashboard();
    } else if (tabName === 'reservations') {
        loadReservations();
    }
    // ... autres conditions ...
    
/* AJOUTER cette condition juste avant le dernier } : */
    else if (tabName === 'fichesClients') {
        document.getElementById('fichesClientsContent').style.display = 'block';
        initFichesClients(); // Cette fonction est définie dans js/fiches-clients.js
    }
}


/*******************************************************************************
 * ÉTAPE 5 : (Optionnel) Ajouter un badge de notifications
 * 
 * Pour afficher le nombre de demandes en attente sur le bouton tab
 ******************************************************************************/

/* Dans index.html, modifier le bouton tab : */
<button class="tab-btn" data-tab="fichesClients">
    <span class="tab-icon">📄</span>
    Fiches Clients
    <span class="notification-badge" id="badgeFichesClients" style="display: none;">0</span>
</button>

/* Puis dans le CSS, ajouter ce style (section <style>) : */
.notification-badge {
    background: var(--danger);
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 0.7rem;
    margin-left: 5px;
    font-weight: 700;
}

/* Et dans le JavaScript, après initFichesClients(), ajouter : */
async function updateFichesClientsBadge() {
    const { count } = await window.supabaseClient
        .from('demandes_horaires')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
    
    const badge = document.getElementById('badgeFichesClients');
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

// Appeler cette fonction toutes les 30 secondes
setInterval(updateFichesClientsBadge, 30000);


/*******************************************************************************
 * RÉCAPITULATIF DES MODIFICATIONS
 ******************************************************************************/

/*
✅ ÉTAPE 1 : Script ajouté dans <head>
✅ ÉTAPE 2 : Bouton tab ajouté dans .nav-tabs  
✅ ÉTAPE 3 : Contenu copié depuis tabs/tab-fiches-clients.html
✅ ÉTAPE 4 : Initialisation ajoutée dans showTab()
✅ ÉTAPE 5 : Badge notifications (optionnel)

TOTAL : 5 modifications dans index.html
TEMPS : ~5 minutes
*/


/*******************************************************************************
 * APRÈS L'INTÉGRATION - TEST
 ******************************************************************************/

/*
1. Ouvrir index.html dans le navigateur
2. Cliquer sur l'onglet "📄 Fiches Clients"
3. Vérifier que :
   - Les statistiques s'affichent
   - La liste des réservations se charge
   - Les sous-onglets fonctionnent
   - La configuration gîtes s'ouvre

4. Console navigateur (F12) :
   - Vérifier qu'il n'y a pas d'erreur JavaScript
   - Vérifier les logs : "Initialisation du module Fiches Clients"

5. Tester une génération de fiche :
   - Sélectionner une réservation
   - Cliquer "Générer la fiche"
   - Copier l'URL
   - Ouvrir dans un nouvel onglet
   - ✅ La fiche doit s'afficher !
*/


/*******************************************************************************
 * EN CAS DE PROBLÈME
 ******************************************************************************/

/*
PROBLÈME : Le tab ne s'affiche pas
➡️ Vérifier que le contenu a bien été copié depuis tabs/tab-fiches-clients.html
➡️ Vérifier que l'id est bien "fichesClientsContent"
➡️ Console : vérifier les erreurs

PROBLÈME : "initFichesClients is not defined"
➡️ Vérifier que <script src="js/fiches-clients.js"></script> est bien chargé
➡️ Ordre important : charger AVANT d'appeler la fonction

PROBLÈME : Les statistiques ne se chargent pas
➡️ Vérifier que Supabase est connecté
➡️ Vérifier que les tables ont été créées (Étape SQL)
➡️ Console : vérifier les erreurs Supabase

PROBLÈME : La liste des réservations est vide
➡️ Normal si aucune réservation dans la base
➡️ Ajouter des réservations de test
➡️ Vérifier les filtres (mettre "Tous les gîtes")

PROBLÈME : Token invalide sur la fiche client
➡️ Vérifier que l'URL contient bien ?token=xxxxx
➡️ Vérifier dans Supabase table client_access_tokens
➡️ Vérifier la date d'expiration
*/


/*******************************************************************************
 * FÉLICITATIONS ! 🎉
 * 
 * Vous avez intégré le système de Fiches Clients dans votre dashboard.
 * 
 * Prochaines étapes :
 * 1. Configurer les infos des gîtes (⚙️ Configuration gîtes)
 * 2. Personnaliser les checklists (✅ Checklists)
 * 3. Générer votre première fiche !
 * 
 * Documentation complète : README_FICHES_CLIENTS.md
 * Guide rapide : GUIDE_DEMARRAGE_FICHES_CLIENTS.md
 ******************************************************************************/
