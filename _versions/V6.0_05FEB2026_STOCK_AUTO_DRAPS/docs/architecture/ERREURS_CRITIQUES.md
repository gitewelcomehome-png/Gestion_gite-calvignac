# Erreurs Critiques & Solutions

> **Objectif:** Tracer les erreurs critiques rencontrées et leurs solutions pour éviter les régressions

---

## 📋 Format d'Entrée

```
### [DATE] - Titre de l'erreur

**Contexte:**
Description de la situation

**Erreur:**
Message d'erreur exact ou comportement

**Cause:**
Origine du problème

**Solution:**
Comment le problème a été résolu

**Prévention:**
Ce qu'il faut faire pour éviter que ça se reproduise

---
```

---

## 🔴 Erreurs Référencées

### [28 Janvier 2026 - V2.0] - ⚡ COLONNES ID MANQUANTES AVEC GÉNÉRATION UUID

**Contexte:**
Suite à la restauration des tables `demandes_horaires` et `problemes_signales` via CREATE TABLE AS SELECT depuis les backups, les colonnes `id` avec génération automatique d'UUID n'ont pas été copiées (comportement normal de PostgreSQL).

**Erreur:**
```
ERROR: null value in column "id" violates not-null constraint
```
- Impossible de créer de nouvelles demandes horaires
- Impossible de créer de nouveaux problèmes signalés
- Les formulaires clients retournaient des erreurs UUID

**Cause:**
1. `CREATE TABLE AS SELECT` ne copie pas les colonnes avec `DEFAULT gen_random_uuid()`
2. Les contraintes PRIMARY KEY ne sont pas copiées automatiquement
3. Les valeurs par défaut des colonnes doivent être redéfinies manuellement

**Solution:**
✅ **Fix SQL idempotent** (`sql/FIX_TABLES_ID_MANQUANTS_28JAN2026.sql`) :
```sql
-- Ajout colonne id avec génération auto UUID
ALTER TABLE demandes_horaires 
ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

ALTER TABLE problemes_signales 
ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

-- Avec vérifications pour idempotence
```

**Prévention:**
1. ⚠️ **Après toute restauration via CREATE TABLE AS SELECT**, vérifier les colonnes avec DEFAULT
2. ⚠️ Toujours redéfinir les PRIMARY KEY et DEFAULT manuellement
3. ⚠️ Tester la création de nouvelles lignes immédiatement après restauration
4. ⚠️ Documenter les colonnes avec génération automatique dans `ARCHITECTURE.md`
5. ⚠️ Utiliser des scripts SQL idempotents avec vérifications EXISTS

**Impact:**
- Version majeure V2.0 créée pour ce fix critique
- Aucune donnée perdue (uniquement fonctionnalité création bloquée)
- Fix déployé en production sans downtime

**Fichiers concernés:**
- `sql/FIX_TABLES_ID_MANQUANTS_28JAN2026.sql` - Script de correction
- Tables: `demandes_horaires`, `problemes_signales`

---

### [28 Janvier 2026] - 🚨 SUPPRESSION ERRONNÉE DE TABLES FONCTIONNELLES

**Contexte:**
Le 23/01/2026, un nettoyage de base de données a supprimé les tables `demandes_horaires` et `problemes_signales` car elles étaient considérées comme "features non développées". **ERREUR GRAVE** : Ces fonctionnalités ÉTAIENT développées et utilisées par les clients sur `pages/fiche-client.html`.

**Erreur:**
- Demandes de changement d'horaires (arrivée anticipée / départ tardif) : ❌ "Fonctionnalité non disponible"
- Demandes retours/améliorations/problèmes : ❌ "Cette fonctionnalité n'est plus disponible"
- Code JavaScript complet et fonctionnel présent dans `js/fiche-client-app.js`
- Formulaires HTML complets dans `pages/fiche-client.html`

**Cause:**
1. Mauvaise analyse lors du nettoyage BDD du 23/01/2026
2. Vérification insuffisante du code frontend avant suppression
3. Les tables étaient marquées comme "non développées" dans `TABLES_SUPPRIMEES_23JAN2026.md`
4. Le code JavaScript avait été volontairement bloqué suite à la suppression

**Solution:**
✅ **Restauration depuis backups** (28/01/2026) :
```sql
-- Restaurer depuis les backups créés automatiquement
CREATE TABLE demandes_horaires AS 
SELECT * FROM backup_demandes_horaires_20260123;

CREATE TABLE problemes_signales AS 
SELECT * FROM backup_problemes_signales_20260123;
```

✅ **Déblocage du code JavaScript** :
- Ligne 2590 : Retrait du return forcé dans `submitRetourDemande()`
- Ligne 1622 : Amélioration gestion d'erreur pour `demandes_horaires`

**Prévention:**
1. ⚠️ **TOUJOURS vérifier le code frontend** avant de supprimer une table BDD
2. ⚠️ Faire une recherche globale du nom de la table dans tout le projet
3. ⚠️ Tester les formulaires clients avant/après nettoyage BDD
4. ⚠️ Garder les backups **au minimum 1 mois** avant suppression
5. ⚠️ Documenter dans `ARCHITECTURE.md` toutes les tables utilisées par le frontend

**Fichiers concernés:**
- `pages/fiche-client.html` - Formulaires clients
- `js/fiche-client-app.js` - Lignes 1550-1690 (demandes_horaires), 2585-2660 (problemes_signales)
- `sql/RESTAURATION_URGENTE_28JAN2026.sql` - Script de restauration

---

### [23 Janvier 2026] - Boutons Modifier/Supprimer/Déplacer Checklist non fonctionnels

**Contexte:**
Dans l'onglet Checklists du back-office, les boutons de gestion des items (Modifier ✏️, Supprimer 🗑️, Monter ⬆️, Descendre ⬇️) ne répondaient pas aux clics.

**Erreur:**
Aucune erreur console, mais les boutons ne déclenchent aucune action au clic.

**Cause:**
1. Les boutons utilisaient des attributs `onclick` inline dans du HTML généré via `innerHTML`
2. Le sélecteur pour trouver le bouton d'ajout (`querySelector('button[onclick*="addChecklistItem"]')`) ne fonctionnait pas correctement

**Problème :** Les event handlers inline (`onclick`) ne sont **PAS évalués** lorsqu'on utilise `innerHTML` ou `insertAdjacentHTML`.

**Solution:**
✅ **Event delegation** avec attributs `data-action` + **ID sur le bouton d'ajout** :

1. Ajout ID au bouton dans `tabs/tab-checklists.html` :
```html
<button id="btn-checklist-submit" onclick="addChecklistItem()">
    ➕ Ajouter l'item
</button>
```

2. Remplacer `onclick` par `data-action` + `data-item-id` dans la génération HTML :
```javascript
<button data-action="delete-item" data-item-id="${item.id}">🗑️</button>
<button data-action="move-up" data-item-id="${item.id}">⬆️</button>
<button data-action="edit-item" data-item-id="${item.id}">✏️</button>
```

3. Attacher un listener unique après génération du HTML :
```javascript
function attachChecklistEventListeners() {
    const container = document.getElementById('checklist-items-list');
    container.addEventListener('click', handleChecklistClick);
}

function handleChecklistClick(e) {
    const button = e.target.closest('[data-action]');
    if (!button) return;
    
    const action = button.getAttribute('data-action');
    const itemId = parseInt(button.getAttribute('data-item-id'));
    
    switch(action) {
        case 'move-up': moveChecklistItem(itemId, 'up'); break;
        case 'move-down': moveChecklistItem(itemId, 'down'); break;
        case 'edit-item': editChecklistItem(itemId); break;
        case 'delete-item': deleteChecklistItem(itemId); break;
    }
}
```

4. Fonction de modification avec sélection correcte du bouton :
```javascript
function editChecklistItem(itemId) {
    // Récupérer le bouton par ID (pas par sélecteur onclick)
    const btnSubmit = document.getElementById('btn-checklist-submit');
    if (btnSubmit) {
        btnSubmit.textContent = '✅ Mettre à jour';
        btnSubmit.style.background = '#10b981';
        btnSubmit.onclick = () => updateChecklistItem(itemId);
        btnSubmit.setAttribute('data-editing-id', itemId);
    }
}
```

5. Réinitialisation correcte du bouton après mise à jour ou annulation :
```javascript
function resetSubmitButton() {
    const btnSubmit = document.getElementById('btn-checklist-submit');
    if (btnSubmit) {
        btnSubmit.textContent = '➕ Ajouter l\'item';
        btnSubmit.style.background = '#27ae60';
        btnSubmit.onclick = addChecklistItem;
        btnSubmit.removeAttribute('data-editing-id');
    }
}
```

**Prévention:**
- ⚠️ **JAMAIS** utiliser `onclick` dans du HTML généré dynamiquement
- ✅ **TOUJOURS** utiliser l'event delegation avec `data-action`
- ✅ **TOUJOURS** donner un ID aux boutons qu'on doit manipuler dynamiquement
- ❌ **NE PAS** utiliser de sélecteurs complexes comme `querySelector('button[onclick*="func"]')`
- ✅ Pattern : `innerHTML` → `attachEventListeners()` → `handleClick(e)`
- Même pattern utilisé pour FAQ, à appliquer partout où nécessaire

---

### [23 Janvier 2026] - Onglet Activités ne s'affiche pas + Bouton "Voir sur carte" inactif

**Contexte:**
L'onglet "Activités et commerces" dans la fiche client ne montrait aucun contenu. Les activités configurées dans le back-office ne s'affichaient pas côté client. La FAQ échouait également avec des erreurs 400, et le bouton "Voir sur carte" ne répondait pas aux clics.

**Erreur:**
```
column activites_gites.gite does not exist
GET https://.../faq?select=*&is_visible=eq.true&... 400 (Bad Request)
Uncaught SyntaxError: Unexpected end of input
Bouton "Voir sur carte" non fonctionnel
```

**Cause:**
1. **activites_gites** : Table refonte le 20/01/2026 avec passage de `gite` (VARCHAR) vers `gite_id` (UUID FK)
2. **FAQ** : 
   - **ERREUR D'ANALYSE** : J'ai supposé que les colonnes étaient `is_visible` et `priority` mais la vraie structure est :
     - ✅ `gite_id` (UUID FK)
     - ✅ `ordre` (integer) 
     - ✅ `question`, `reponse`, `categorie`
     - ❌ PAS de colonne `visible` ou `is_visible`
     - ❌ PAS de colonne `priority`
   - Utilisation de `.eq('is_visible', true)` sur une colonne inexistante → erreur 400
   - Utilisation de `.order('priority')` au lieu de `.order('ordre')`
3. **loadEvenementsSemaine()** : Utilisait `.eq('gite', ...)` au lieu de `.eq('gite_id', ...)`
4. **Bouton "Voir sur carte" inactif** : 
   - Attribut `onclick` avec `JSON.stringify()` générait des guillemets doubles cassant le HTML
   - Caractères spéciaux dans le nom d'activité causaient des SyntaxError JavaScript
5. **Injection XSS potentielle** : Champs nom, description, adresse non échappés
6. Styles CSS manquants pour les cartes d'activités

**Solution:**
1. **fiche-client-app.js - loadActivitesForClient()** : 
   - ✅ `.eq('gite_id', reservationData.gite_id)` au lieu de `.or(variantes)` sur `gite`
   - ✅ Ajout filtre `.eq('is_active', true)`
   - ✅ `.order('distance_km')` au lieu de `.order('distance')`
   
2. **fiche-client-app.js - loadEvenementsSemaine()** :
   - ✅ `.eq('gite_id', reservationData.gite_id)` au lieu de `.eq('gite', ...)`
   - ✅ Ajout filtre `.eq('is_active', true)`
   - ✅ Masquage silencieux si colonne inexistante (code 42703)

3. **fiche-client-app.js - loadFaqData()** ⭐ CORRECTION FINALE :
   - ✅ Suppression du filtre inexistant `.eq('is_visible', true)`
   - ✅ Utilisation de `.order('ordre', { ascending: true })` (colonne réelle)
   - ✅ Conservation de `.or('gite_id.eq.xxx,gite_id.is.null')` pour FAQ globales
   - ✅ Lazy loading au clic (pas d'appel à l'initialisation)

4. **fiche-activites-map.js - Bouton "Voir sur carte"** ⭐ SOLUTION PROPRE :
   - ✅ **Utilisation de data-attributes** au lieu de onclick avec paramètres inline
   - ✅ `data-lat`, `data-lon`, `data-nom`, `data-id` stockés dans le HTML
   - ✅ Lecture via `this.dataset` dans onclick → 100% sûr
   - ✅ Échappement HTML (`<` et `>`) pour protection XSS

5. **fiche-client.html** : 
   - ✅ Ajout de tous les styles CSS pour les cartes d'activités

**Structure réelle de la table FAQ (vérifiée en BDD) :**
```sql
CREATE TABLE public.faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id),
  gite_id UUID NULL REFERENCES gites(id),
  question TEXT NOT NULL,
  reponse TEXT NOT NULL,
  categorie TEXT NULL,
  ordre INTEGER DEFAULT 0,  -- ⭐ Colonne réelle (pas "priority")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ❌ PAS de colonne "visible" ou "is_visible"
```

**Code Final (Requête FAQ corrigée) :**
```javascript
// ✅ SOLUTION CORRECTE
const { data: faqs, error } = await supabase
    .from('faq')
    .select('*')
    .or(`gite_id.eq.${reservationData.gite_id},gite_id.is.null`)
    .order('ordre', { ascending: true });  // ⭐ Colonne réelle
```

**Code Final (Bouton sécurisé) :**
```javascript
// ✅ SOLUTION PROPRE avec data-attributes
<button class="btn-show-map" 
        data-lat="${activite.latitude}" 
        data-lon="${activite.longitude}" 
        data-nom="${nomSafe}" 
        data-id="${activite.id}"
        onclick="showActivityOnMap(this.dataset.lat, this.dataset.lon, this.dataset.nom, this.dataset.id)">
    📍 Voir sur carte
</button>
```

**Prévention:**
- ✅ **TOUJOURS vérifier la structure réelle en BDD avant de modifier une requête**
- ✅ Ne JAMAIS supposer les noms de colonnes sans vérification
- ✅ Consulter le fichier SQL de création ou faire un `DESCRIBE table` en BDD
- ✅ Vérifier comment le back-office utilise la même table (référence fiable)
- ✅ Après une refonte, chercher TOUS les usages (back-office ET fiche client)
- ✅ **JAMAIS** passer des strings complexes dans onclick - Utiliser data-attributes
- ✅ Toujours échapper les contenus HTML générés dynamiquement (protection XSS)
- ✅ Lazy loading pour éviter erreurs 400 au chargement
- ✅ Documenter la structure exacte dans ARCHITECTURE.md

**Note importante:**
Les tables `infos_gites` et `cleaning_schedule` conservent temporairement la colonne `gite` (TEXT) en plus de `gite_id` (UUID) pour transition progressive.

---

### [22 Janvier 2026] - Trajets kilométriques non créés automatiquement lors de sync iCal

**Contexte:**
Plus de 30 réservations étaient présentes dans le système mais seulement 3 trajets kilométriques étaient enregistrés. L'automatisation des trajets ne fonctionnait pas lors de l'import iCal.

**Erreur:**
Pas d'erreur console, mais les trajets auto n'étaient pas créés pour les réservations importées depuis iCal.

**Cause:**
- La fonction `addReservationFromIcal()` dans `js/sync-ical-v2.js` n'appelait PAS `window.KmManager.creerTrajetsAutoReservation()`
- La fonction `updateReservationFromIcal()` ne mettait pas à jour les trajets lors de changement de dates
- La fonction `cancelReservation()` ne supprimait pas les trajets liés
- La fonction `saveReservationFromModal()` dans `js/calendrier-tarifs.js` faisait un insert direct sans passer par `addReservation()`
- Les fonctions `updateReservation()` et `deleteReservation()` dans `js/supabase-operations.js` ne géraient pas les trajets auto

**Solution:**
1. **sync-ical-v2.js - addReservationFromIcal()** : Ajout de l'appel à `creerTrajetsAutoReservation()` après insert + récupération de la réservation via `.select().single()`
2. **sync-ical-v2.js - updateReservationFromIcal()** : Ajout détection changement dates + suppression anciens trajets + recréation nouveaux trajets
3. **sync-ical-v2.js - cancelReservation()** : Ajout suppression trajets auto via `supprimerTrajetsAutoReservation()`
4. **calendrier-tarifs.js - saveReservationFromModal()** : Remplacement insert direct par appel à `window.addReservation()`
5. **supabase-operations.js - updateReservation()** : Ajout détection changement dates + recréation trajets
6. **supabase-operations.js - deleteReservation()** : Ajout suppression trajets auto avant suppression réservation

**Fichiers modifiés:**
- `js/sync-ical-v2.js` (3 fonctions corrigées)
- `js/calendrier-tarifs.js` (saveReservationFromModal)
- `js/supabase-operations.js` (updateReservation, deleteReservation)
- `ARCHITECTURE.md` (documentation automatisation)

**Prévention:**
- Toujours utiliser `addReservation()` pour créer des réservations (jamais d'insert direct)
- Toujours gérer les trajets auto dans update/delete de réservations
- Documenter les effets de bord des opérations CRUD dans ARCHITECTURE.md

---

### [22 Janvier 2026] - Erreurs 400 sur table todos inexistante

**Contexte:**
Lors du chargement de l'onglet Draps, des erreurs 400 apparaissaient en console sur des requêtes vers la table `todos` (fonctionnalité de gestion de tâches automatiques).

**Erreur:**
```
GET https://...supabase.co/rest/v1/todos?... 400 (Bad Request)
POST https://...supabase.co/rest/v1/todos 400 (Bad Request)
```

**Cause:**
La table `todos` n'existe pas dans la base de données Supabase. Le code dans `draps.js` essayait de créer automatiquement des tâches "Commander draps" mais ne gérait pas le cas où la table n'existe pas.

**Solution:**
Ajout de gestion d'erreur silencieuse dans `js/draps.js` (lignes 953-980) :
```javascript
const { data: tachesExistantes, error: errorTodos } = await window.supabaseClient
    .from('todos')
    .select('*')
    // ...

// Si la table n'existe pas, ignorer silencieusement
if (errorTodos) {
    console.warn('⚠️ Table todos non disponible (normal si non créée)');
    return;
}

// Créer la tâche seulement si elle n'existe pas déjà
if (!tachesExistantes || tachesExistantes.length === 0) {
    const { error: insertError } = await window.supabaseClient
        .from('todos')
        .insert({...});
    
    if (insertError) {
        console.warn('⚠️ Erreur insertion todo (table peut-être inexistante)');
    }
}
```

**Fichiers modifiés:**
- `js/draps.js` - Ajout gestion d'erreur sur requêtes todos

**Prévention:**
- Toujours catcher les erreurs sur des tables optionnelles
- Ne pas bloquer l'application si une fonctionnalité secondaire échoue
- Logger en warning plutôt qu'en erreur pour les tables optionnelles

---

### [22 Janvier 2026] - Calcul kilomètres KO (KmManager non disponible)

**Contexte:**
Le calcul des frais kilométriques ne fonctionnait pas dans l'onglet Fiscalité. La fonction `calculerFraisKm()` plantait silencieusement.

**Erreur:**
`TypeError: Cannot read properties of undefined (reading 'calculerTotalKm')`

**Cause:**
La fonction `calculerFraisKm()` appelait directement `KmManager.calculerTotalKm(trajetsAnnee)` sans vérifier :
1. Que `KmManager` est chargé et disponible
2. Que `trajetsAnnee` est défini (peut être undefined si les tables km ne sont pas créées)

**Solution:**
Ajout de protections dans `js/fiscalite-v2.js` (ligne ~3922) :
```javascript
function calculerFraisKm() {
    try {
        // Vérifier que KmManager est disponible
        if (!window.KmManager || typeof window.KmManager.calculerTotalKm !== 'function') {
            console.warn('⚠️ KmManager non disponible');
            return;
        }
        
        // Vérifier que trajetsAnnee existe
        if (!trajetsAnnee) {
            trajetsAnnee = [];
        }
        
        const totalKm = window.KmManager.calculerTotalKm(trajetsAnnee);
        // ... suite du calcul
    } catch (error) {
        console.error('❌ Erreur calcul frais km:', error);
        // Ne pas bloquer l'interface
    }
}
```

**Fichiers modifiés:**
- `js/fiscalite-v2.js` - Ajout protections KmManager

**Prévention:**
- Toujours vérifier qu'un module/manager est chargé avant de l'utiliser
- Initialiser les variables à des valeurs par défaut ([] pour arrays)
- Utiliser try/catch pour éviter que les erreurs ne bloquent l'UI
- Tester avec les tables SQL non créées pour vérifier la robustesse

---

### [22 Janvier 2026] - Modal frais kilométriques salariés manquante (TypeError null)

**Contexte:**
Le bouton "⚙️ Frais" à côté des salaires Madame/Monsieur ne fonctionnait pas. Erreur console lors du clic.

**Erreur:**
```
fiscalite-v2.js:485 Uncaught TypeError: Cannot set properties of null (setting 'textContent')
    at openFraisReelsSalarieModal (fiscalite-v2.js:485:23)
```

**Cause:**
La fonction `openFraisReelsSalarieModal` essayait d'accéder à l'élément `#titre-personne-modal` qui n'existait pas dans le HTML. La modal `#modal-frais-salarie` n'avait jamais été créée, alors que le code JS essayait de l'utiliser.

**Solution:**
1. **Ajout de la modal complète** dans `tabs/tab-fiscalite-v2.html` :
```html
<div id="modal-frais-salarie" class="modal-overlay" style="display: none;">
    <div class="modal-content">
        <h3>⚙️ Frais - <span id="titre-personne-modal">Madame</span></h3>
        <!-- Formulaire avec radio buttons forfaitaire/réel -->
        <!-- Champs: km, CV, péages -->
        <!-- Calcul et affichage du total -->
    </div>
</div>
```

2. **Ajout alias fonction** dans `js/fiscalite-v2.js` :
```javascript
window.fermerFraisSalarieModal = closeFraisReelsSalarieModal; // Alias pour correspondre au HTML
```

**Fichiers modifiés:**
- `tabs/tab-fiscalite-v2.html` - Ajout modal frais salariés
- `js/fiscalite-v2.js` - Ajout alias fermerFraisSalarieModal

**Prévention:**
- Toujours créer le HTML avant d'écrire le JS qui l'utilise
- Vérifier que tous les `getElementById()` correspondent à des éléments existants
- Tester les modals en cliquant sur les boutons après modification

---

### [22 Janvier 2026] - Automatisation km avec mauvais noms de champs (check_in vs date_arrivee)

**Contexte:**
L'automatisation des trajets kilométriques créait toujours 3 trajets au lieu de créer un trajet pour chaque réservation. Le code essayait d'accéder à `reservation.date_arrivee` et `reservation.date_depart` mais les réservations Supabase utilisent `check_in` et `check_out`.

**Erreur:**
`new Date(reservation.date_arrivee)` retournait `Invalid Date` car le champ n'existe pas dans l'objet réservation.

**Cause:**
Incohérence entre le format de données attendu par `km-manager.js` et le format réel des réservations en base de données. Les réservations utilisent le format Supabase (`check_in`, `check_out`) alors que le code attendait l'ancien format (`date_arrivee`, `date_depart`).

**Solution:**
Support des deux formats dans `km-manager.js` (lignes 278-279 et 303) :
```javascript
// Support des deux formats : check_in/check_out (Supabase) et date_arrivee/date_depart (legacy)
const dateArrivee = reservation.check_in || reservation.date_arrivee;
const dateDepart = reservation.check_out || reservation.date_depart;
```

**Fichiers modifiés:**
- `js/km-manager.js` - Support double format check_in/date_arrivee

**Prévention:**
- Toujours vérifier le format des données en base avant d'accéder aux propriétés
- Utiliser un support de compatibilité descendante lors de migrations de schéma
- Logger les objets en console pour vérifier leur structure réelle
- Documenter le format attendu en commentaire au-dessus du code

---

### [22 Janvier 2026] - Menu admin non fonctionnel (event listeners manquants)

**Contexte:**
Les boutons du menu admin (Gérer mes gîtes, Config iCal, Archives, FAQ, Déconnexion) ne répondaient plus aux clics. Le menu déroulant s'ouvrait mais les actions ne s'exécutaient pas.

**Erreur:**
Aucune action lors du clic sur les boutons du menu utilisateur.

**Cause:**
Les event listeners pour les boutons avec `data-action` étaient dans un bloc de code commenté (ligne 3603 de index.html) marqué comme "SYSTÈME ANCIEN DÉSACTIVÉ". Le code de gestion des clics n'était donc jamais exécuté.

**Solution:**
Ajout des event listeners directement après le DOMContentLoaded existant (ligne ~270) :
```javascript
// 🔧 Event listeners pour le menu admin
const actionButtons = document.querySelectorAll('.user-menu-item[data-action]');
actionButtons.forEach(button => {
    button.addEventListener('click', function() {
        const action = this.getAttribute('data-action');
        if (window.toggleUserMenu) window.toggleUserMenu();
        
        if (action === 'gites') {
            if (window.showGitesManager) {
                window.showGitesManager();
            }
        } else if (action === 'faq') {
            window.switchTab('faq');
        } else if (window.handleQuickAction) {
            window.handleQuickAction(action);
        }
    });
});
```

**Fichiers modifiés:**
- `index.html` - Ajout event listeners menu admin après DOMContentLoaded principal

**Prévention:**
- Ne jamais commenter du code fonctionnel sans ajouter un remplacement
- Toujours vérifier que les event listeners sont bien attachés au chargement
- Tester tous les boutons après modification du code d'initialisation

---

### [22 Janvier 2026] - Automatisation km non déclenchée à la création de réservation

**Contexte:**
Le système d'automatisation des trajets kilométriques existe (`KmManager.creerTrajetsAutoReservation`) mais n'était jamais appelé lors de l'import iCal ou de la création manuelle de réservations.

**Erreur:**
Aucun trajet automatique n'était créé malgré la configuration activée dans `km_config_auto`.

**Cause:**
La fonction `addReservation` dans `supabase-operations.js` n'appelait pas `KmManager.creerTrajetsAutoReservation` après l'insertion réussie d'une réservation.

**Solution:**
Ajout de l'appel automatique après insertion (ligne ~82 de supabase-operations.js) :
```javascript
if (result.error) throw result.error;

// 🚗 Automatisation des trajets kilométriques
if (result.data && typeof window.KmManager?.creerTrajetsAutoReservation === 'function') {
    try {
        await window.KmManager.creerTrajetsAutoReservation(result.data);
    } catch (kmError) {
        console.error('⚠️ Erreur création trajets auto:', kmError);
        // Ne pas bloquer la création de réservation si les trajets échouent
    }
}
```

**Fichiers modifiés:**
- `js/supabase-operations.js` - Ajout appel automatisation km

**Prévention:**
- Toujours intégrer les automatisations dans les fonctions centrales (CRUD)
- Utiliser try/catch pour éviter qu'une erreur d'automatisation ne bloque l'action principale
- Documenter clairement les hooks d'automatisation dans ARCHITECTURE.md

---

### [22 Janvier 2026] - Onglet Réservations surligné au lieu de Dashboard au démarrage

**Contexte:**
Au chargement de l'application, l'onglet "Réservations" était surligné alors que le contenu affiché était le Dashboard.

**Erreur:**
Incohérence entre l'onglet actif visuellement et le contenu affiché.

**Cause:**
La classe `active` était appliquée au mauvais bouton dans le HTML (ligne 345 de index.html) :
```html
<button class="tab-neo" data-tab="dashboard">...</button>
<button class="tab-neo active" data-tab="reservations">...</button>
```

**Solution:**
Inversion des classes `active` :
```html
<button class="tab-neo active" data-tab="dashboard">...</button>
<button class="tab-neo" data-tab="reservations">...</button>
```

**Fichiers modifiés:**
- `index.html` - Correction classe active sur bouton dashboard

**Prévention:**
- Toujours vérifier la cohérence entre l'onglet actif et le contenu affiché
- Le dashboard doit TOUJOURS être l'onglet par défaut au démarrage

---

### [22 Janvier 2026] - Message checklist trop verbeux

**Contexte:**
Quand aucun item de checklist n'était trouvé, le message affichait : "Aucun item pour **Calvignac** - **Entrée**".

**Erreur:**
Message trop long et répétitif (le gîte et le type sont déjà visibles dans l'interface).

**Cause:**
Template string incluant des informations redondantes (ligne 99 de checklists.js).

**Solution:**
Simplification du message :
```javascript
// AVANT
<p>Aucun item pour <strong>${currentGiteFilter}</strong> - <strong>${currentTypeFilter === 'entree' ? 'Entrée' : 'Sortie'}</strong></p>

// APRÈS
<p>Aucun item</p>
```

**Fichiers modifiés:**
- `js/checklists.js` - Simplification message vide

**Prévention:**
- Éviter les redondances dans les messages
- Privilégier les messages courts et clairs
- Le contexte (gîte/type) est déjà visible dans les filtres au-dessus

---

### [22 Janvier 2026] - parseInt() sur UUID bloque l'affichage des réservations en calendrier mobile

**Contexte:**
Dans le calendrier tarifs mobile, les dates réservées n'apparaissaient pas bloquées (pas de 🔒), alors que dans la version desktop elles l'étaient.

**Erreur:**
48 réservations chargées mais 0 réservation filtrée pour le gîte sélectionné. Les dates réservées n'étaient pas marquées comme bloquées dans le calendrier mobile.

**Cause:**
Le code utilisait `parseInt()` pour comparer un UUID string :
```javascript
reservationsCacheMobile.filter(r => r.gite_id === parseInt(currentGiteIdMobile));
// currentGiteIdMobile = "5e3af1b2-f344-4f1e-90cb-6b999f87393a"
// parseInt("5e3af1b2-...") = NaN
```

`parseInt()` sur un UUID retourne `NaN`, donc le filtre ne correspondait jamais.

**Solution:**
Comparer directement les strings UUID sans parseInt() :
```javascript
reservationsCacheMobile.filter(r => r.gite_id === currentGiteIdMobile);
```

**Fichiers modifiés:**
- `tabs/mobile/calendrier-tarifs.html` - Suppression parseInt() ligne ~316

**Prévention:**
- **JAMAIS** utiliser `parseInt()` sur des UUIDs
- Les UUIDs sont des strings, toujours comparer avec `===` directement
- Quand un filtre retourne 0 résultat alors qu'il devrait y en avoir, vérifier les types (string vs number)

---

### [21 Janvier 2026] - Planning ménage mobile écrasé par fonction desktop

**Contexte:**
Après correction du problème onclick, le planning ménage mobile ne s'affichait plus correctement. Le contenu mobile était écrasé par le rendu desktop.

**Erreur:**
L'affichage mobile du planning ménage ne s'adaptait pas et affichait le layout desktop (colonnes, semaines, etc.) au lieu du layout mobile (cartes empilées, filtres collapsibles).

**Cause:**
Dans `js/shared-utils.js`, la fonction `switchTab()` appelait `afficherPlanningParSemaine()` (fonction DESKTOP) sans vérifier si on était en mode mobile. Cette fonction desktop écrasait le contenu HTML mobile chargé depuis `tabs/mobile/menage.html` qui a son propre script `loadMenages()`.

**Solution:**
Ajout d'une vérification `!isMobile` avant d'appeler la fonction desktop dans `switchTab()` :

```javascript
} else if (tabName === 'menage') {
    // DESKTOP uniquement
    if (!isMobile && typeof window.afficherPlanningParSemaine === 'function') {
        setTimeout(() => {
            window.afficherPlanningParSemaine();
        }, 200);
    }
}
```

**Fichiers modifiés:**
- `js/shared-utils.js` - Ajout condition `!isMobile` dans switchTab()

**Prévention:**
- **TOUJOURS** vérifier `isMobile` avant d'appeler une fonction desktop dans `switchTab()`
- Séparation stricte : `js/menage.js` = DESKTOP, `tabs/mobile/menage.html` = MOBILE

---

### [21 Janvier 2026] - Attributs onclick supprimés par DOMPurify en mode trusted

**Contexte:**
Les boutons du Planning Ménage (Règles de Ménage, Voir les Règles, Page Validation, Espace Femme de Ménage) ne répondaient pas aux clics. Le HTML source dans `tabs/tab-menage.html` contenait bien les attributs `onclick="showCleaningRulesModal()"` etc., mais le HTML chargé dans le navigateur ne les avait pas.

**Erreur:**
Les attributs `onclick` étaient présents dans le fichier source mais absents du DOM après chargement par `SecurityUtils.setInnerHTML()`. Les boutons s'affichaient mais ne déclenchaient aucune action.

**Cause:**
DOMPurify supprimait les attributs `onclick` même en mode `trusted: true` car ils n'étaient pas explicitement autorisés dans la configuration. La config trusted avait :
```javascript
const trustedConfig = {
    ALLOW_DATA_ATTR: true,
    KEEP_CONTENT: true,
    FORBID_ATTR: ['onerror', 'onload']  // ❌ Pas de ADD_ATTR pour autoriser onclick
};
```

DOMPurify, par défaut, bloque TOUS les event handlers pour la sécurité. Il fallait les autoriser explicitement avec `ADD_ATTR`.

**Solution:**
Ajout de `ADD_ATTR` dans la configuration trusted de `js/security-utils.js` (ligne ~55) :

```javascript
const trustedConfig = {
    ALLOW_DATA_ATTR: true,
    KEEP_CONTENT: true,
    ADD_TAGS: ['script', 'style'],
    ADD_ATTR: ['onclick', 'onmouseover', 'onmouseout', 'onchange', 'oninput', 'onsubmit', 'onfocus', 'onblur'],
    FORBID_ATTR: ['onerror', 'onload']
};
```

**Fichiers modifiés:**
- `js/security-utils.js` - Ajout ADD_ATTR dans config trusted

**Prévention:**
- Les attributs `onclick` dans les tabs chargés dynamiquement DOIVENT être listés dans `ADD_ATTR` de DOMPurify
- Quand un bouton avec onclick ne fonctionne pas, vérifier d'abord si l'attribut est présent dans le DOM (Inspecter l'élément)
- Si onclick est absent alors qu'il est dans le source, c'est DOMPurify qui le supprime
- Ne PAS confondre avec le problème des fonctions non exportées dans window (qui donne une erreur console différente)

---

### [21 Janvier 2026] - Boutons onclick Planning Ménage non fonctionnels

**Contexte:**
Dans l'onglet Planning Ménage (version desktop), plusieurs boutons ne répondaient pas aux clics :
- Bouton "🎯 Règles de Ménage" (showCleaningRulesModal)
- Bouton "📋 Voir les Règles" (showRulesModal)
- Bouton "🏢 Page Validation" (ouvrirPageValidation)
- Bouton "🧹 Espace Femme de Ménage" (ouvrirPageFemmeMenage)
- Disparition des icônes de validation
- Bouton sauvegarder ne fonctionnant pas

**Erreur:**
Console navigateur : "function is not defined" lors du clic sur les boutons

**Cause:**
1. **Fonctions non exportées dans window:** Les fonctions `showRulesModal`, `closeRulesModal`, `ouvrirPageValidation`, `ouvrirPageFemmeMenage` étaient déclarées dans `index.html` mais pas exportées dans le scope global `window`, rendant les attributs `onclick` inaccessibles
2. **Mauvais nom de fonction:** `shared-utils.js` appelait `afficherPlanningMenageNew()` au lieu de `afficherPlanningParSemaine()` lors du changement d'onglet

**Solution:**
1. **Ajout exports dans index.html** (lignes ~672-675) :
```javascript
// Exporter dans le scope global
window.showRulesModal = showRulesModal;
window.closeRulesModal = closeRulesModal;
window.ouvrirPageValidation = ouvrirPageValidation;
window.ouvrirPageFemmeMenage = ouvrirPageFemmeMenage;
```

2. **Correction appel fonction dans shared-utils.js** (ligne ~237) :
```javascript
// AVANT:
if (typeof afficherPlanningMenageNew === 'function') {
    setTimeout(() => {
        afficherPlanningMenageNew();
    }, 200);
}

// APRÈS:
if (typeof window.afficherPlanningParSemaine === 'function') {
    setTimeout(() => {
        window.afficherPlanningParSemaine();
    }, 200);
}
```

**Fichiers modifiés:**
- `index.html` : Ajout exports window pour fonctions onclick
- `js/shared-utils.js` : Correction nom fonction afficherPlanningParSemaine
- Documentation : `CORRECTION_MENAGE_21JAN2026.md`
- Fichier test : `test-menage-functions.html`

**Prévention:**
- **TOUJOURS** exporter dans `window` les fonctions utilisées dans des attributs `onclick` HTML
- Utiliser `window.nomFonction` pour garantir l'accès au scope global
- Créer des tests de disponibilité des fonctions (cf. test-menage-functions.html)
- Vérifier dans la console : `typeof window.nomFonction === 'function'`
- Documenter les exports requis dans ARCHITECTURE.md

---

### [20 Janvier 2026] - Frais réels impôts : interface globale inadaptée

**Contexte:**
L'interface des frais réels pour l'impôt sur le revenu utilisait un système global avec répartition proportionnelle des km entre Madame et Monsieur. Or, le système fiscal français permet à **chaque salarié** de choisir individuellement entre :
- 10% d'abattement forfaitaire (min 472€, max 13 522€)
- OU frais réels (déplacements domicile-travail)

**Erreur:**
1. Nombre d'enfants ne se sauvegardait pas
2. Interface unique pour les deux salariés → pas de choix individuel
3. Confusion entre "frais professionnels LMP" et "frais réels IR"
4. Pas d'affichage clair du mode de déduction choisi

**Cause:**
- Mauvaise compréhension du système fiscal français
- Code pensé pour un calcul global avec répartition au prorata
- Interface HTML ne permettant pas le choix par personne

**Solution:**
Refonte complète du système de frais réels :

1. **HTML** : Bouton `⚙️ Frais` individuel à côté de chaque salaire
2. **Modal** : Une modal dédiée pour Madame ET Monsieur avec :
   - Radio button : 10% forfaitaire / frais réels
   - Champs conditionnels : km, puissance fiscale, péages
   - Calcul temps réel du montant déductible
3. **JavaScript** : 
   - Variables globales : `fraisMadameData` et `fraisMonsieurData`
   - Fonctions : `openFraisReelsSalarieModal(personne)`, `validerFraisSalarie()`, etc.
4. **Calcul IR** : Abattement appliqué individuellement par personne
5. **Sauvegarde BDD** : 2 objets JSON distincts (`frais_madame`, `frais_monsieur`)

**Fichiers modifiés:**
- `pages/tab-fiscalite-v2.html` : Suppression interface globale + ajout modal individuelle
- `js/fiscalite-v2.js` : Nouvelles fonctions + mise à jour calculerIR() + sauvegarde/chargement
- `index.html` : Cache busting v=1737331200
- Documentation : `docs/FIX_FRAIS_REELS_INDIVIDUELS.md`

**Prévention:**
- Toujours vérifier la règle fiscale avant d'implémenter une fonctionnalité
- Frais réels IR ≠ Frais professionnels LMP
- Tester avec différentes combinaisons : forfaitaire/réel, 0€, etc.

---

### [19 Janvier 2026] - Valeurs 0 non restaurées (bug falsy values)

**Contexte:**
Les charges de résidence principale étaient sauvegardées en base de données avec des valeurs à 0, mais après rechargement de la page, les champs restaient vides au lieu d'afficher "0.00".

**Erreur:**
Les champs de résidence (intérêts, assurance, électricité, etc.) restaient vides après rechargement alors que la base de données contenait bien la valeur `0`.

**Cause:**
Bug JavaScript classique avec les "falsy values". Le code utilisait l'opérateur `||` pour les valeurs par défaut :

```javascript
// ❌ ERREUR : 0 est falsy, donc remplacé par ''
interetsRes.value = details.interets_residence || '';
```

Quand `details.interets_residence` vaut `0`, l'expression `0 || ''` retourne `''` car `0` est considéré comme falsy en JavaScript.

**Solution:**
Remplacer l'opérateur `||` par un test strict `!== undefined` :

```javascript
// ✅ CORRECT : 0 n'est pas undefined, donc on garde 0
interetsRes.value = details.interets_residence !== undefined ? details.interets_residence : '';
```

Appliqué à tous les champs de résidence dans la fonction `chargerAnnee()` (lignes 1294-1337 de fiscalite-v2.js).

**Fichiers modifiés:**
- `js/fiscalite-v2.js` - fonction `chargerAnnee()`, restauration des 7 champs de résidence

**Prévention:**
- **TOUJOURS** utiliser `!== undefined` ou `!== null` au lieu de `||` quand la valeur `0` est valide
- Attention aux valeurs falsy en JavaScript : `0`, `''`, `false`, `null`, `undefined`, `NaN`
- Tester avec des valeurs à 0 lors des tests de sauvegarde/restauration

---

### [19 Janvier 2026] - Frais résidence principale non sauvegardés

**Contexte:**
Les utilisateurs saisissaient les charges de résidence principale (intérêts emprunt, assurance, électricité, etc.) mais après rechargement de la page, les valeurs n'étaient pas restaurées.

**Erreur:**
Les champs de résidence principale perdaient leurs valeurs après sauvegarde/rechargement.

**Cause:**
Le code JavaScript cherchait des éléments HTML avec des IDs comme `interets_residence_type`, `assurance_residence_type`, etc. pour récupérer le type (mensuel/annuel), mais **ces éléments n'existent pas dans le HTML**. 

Les champs utilisent l'attribut `data-period-type` directement sur l'input :
```html
<input type="number" id="interets_residence" data-period-type="mensuel">
```

Mais le code essayait de faire :
```javascript
// ❌ ERREUR : cet élément n'existe pas !
document.getElementById('interets_residence_type')?.value
```

Résultat : 
- Lors de la sauvegarde : le type récupéré était toujours `undefined` ou `'mensuel'` par défaut
- Lors de la restauration : tentative d'écrire dans des éléments inexistants
- La fonction `getAnnualValue()` ne trouvait pas le type et utilisait `'annuel'` par défaut, faussant les calculs

**Solution:**
1. **Modification de `getAnnualValue()`** pour lire `data-period-type` si l'élément `typeFieldId` n'existe pas :
```javascript
function getAnnualValue(fieldId, typeFieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return 0;
    
    const value = parseFloat(field.value || 0);
    
    // Essayer d'abord typeFieldId
    const typeField = document.getElementById(typeFieldId);
    let type = typeField?.value;
    
    // Sinon, utiliser data-period-type
    if (!type) {
        type = field.getAttribute('data-period-type') || 'annuel';
    }
    
    return type === 'mensuel' ? value * 12 : value;
}
```

2. **Modification de la sauvegarde** pour lire depuis `data-period-type` :
```javascript
detailsData.interets_residence_type = document.getElementById('interets_residence')?.getAttribute('data-period-type') || 'mensuel';
```

3. **Modification de la restauration** pour écrire dans `data-period-type` :
```javascript
const interetsRes = document.getElementById('interets_residence');
if (interetsRes) {
    interetsRes.value = details.interets_residence || '';
    if (details.interets_residence_type) {
        interetsRes.setAttribute('data-period-type', details.interets_residence_type);
    }
}
```

**Fichiers modifiés:**
- `js/fiscalite-v2.js` - Fonctions `getAnnualValue()`, `sauvegarderDonneesFiscales()`, `chargerDerniereSimulation()`

**Prévention:**
- Toujours vérifier que les IDs utilisés dans le JavaScript existent réellement dans le HTML
- Utiliser la console pour vérifier que `document.getElementById()` ne retourne pas `null`
- Tester le cycle complet : saisie → sauvegarde → rechargement → vérification

---

### [19 Janvier 2026] - Variable config non définie dans calculerIR()

**Contexte:**
Après l'ajout de l'option frais réels/abattement 10% pour les impôts, l'erreur `ReferenceError: config is not defined` apparaissait dans la console à la ligne 559 de fiscalite-v2.js.

**Erreur:**
```javascript
Uncaught ReferenceError: config is not defined at calculerIR (fiscalite-v2.js:559:20)
```

**Cause:**
La variable `config` était déclarée dans le bloc `else` (abattement 10%) mais utilisée plus bas dans la fonction en dehors de ce bloc pour accéder au barème IR. Quand l'option "frais réels" était cochée, le bloc else n'était pas exécuté et `config` n'était jamais définie.

**Solution:**
Déplacer la déclaration de `config` au début de la fonction `calculerIR()`, avant le test de l'option frais réels :

```javascript
function calculerIR() {
    const salaireMadameBrut = parseFloat(document.getElementById('salaire_madame')?.value || 0);
    const salaireMonsieurBrut = parseFloat(document.getElementById('salaire_monsieur')?.value || 0);
    const revenuLMP = parseFloat(document.getElementById('revenu_lmp')?.value || 0);
    const nbEnfants = parseInt(document.getElementById('nombre_enfants')?.value || 0);
    
    // Récupérer la config fiscale pour l'année en cours (DOIT être au début)
    const annee = new Date().getFullYear();
    const config = window.TAUX_FISCAUX.getConfig(annee);
    
    // Vérifier si l'option frais réels est activée
    const radioReel = document.querySelector('input[name="option_frais_reels"][value="reel"]');
    const optionReels = radioReel && radioReel.checked;
    
    // ... suite du code
}
```

**Prévention:**
- Toujours déclarer les variables utilisées dans plusieurs branches conditionnelles au niveau supérieur
- Tester toutes les branches d'un code conditionnel (option réel ET abattement 10%)
- Vérifier la portée (scope) des variables avant de les utiliser

---

### [19 Janvier 2026] - Charges résidence non prises en compte dans reste à vivre

**Contexte:**
Les charges de résidence principale (intérêts emprunt, assurance, électricité, internet, eau, assurance habitation, taxe foncière) étaient bien saisies et sauvegardées, mais elles n'apparaissaient pas dans le calcul du "Reste à vivre après crédits".

**Erreur:**
Le calcul du reste à vivre ne prenait pas en compte les charges personnelles de la résidence principale, ce qui faussait complètement l'estimation du reste à vivre réel.

**Cause:**
Dans la fonction `calculerResteAVivre()` du fichier `js/fiscalite-v2.js`, seuls les frais personnels saisis directement dans la section "Reste à vivre" étaient pris en compte. Les charges de résidence principale (qui sont partiellement déductibles fiscalement) n'étaient pas du tout intégrées dans les frais personnels.

**Solution:**
1. Calcul du ratio professionnel/personnel basé sur `surface_bureau / surface_totale`
2. Calcul de la partie personnelle : `ratioPerso = 1 - ratio`
3. Récupération de toutes les charges résidence et conversion en montant annuel
4. Application du ratio personnel : `chargesResPersonnellesMensuel = (totalChargesResAnnuel * ratioPerso) / 12`
5. Ajout aux frais personnels : `totalFraisPerso += chargesResPersonnellesMensuel`

**Fichier modifié:** `js/fiscalite-v2.js` - fonction `calculerResteAVivre()`

**Prévention:**
- Toujours vérifier que les données saisies dans une section sont bien utilisées dans les calculs liés
- Penser à la distinction entre partie professionnelle (déductible fiscalement) et partie personnelle (non déductible mais dépense réelle)

---

### [19 Janvier 2026] - Impôts sur le revenu non sauvegardés

**Contexte:**
Les utilisateurs saisissaient leurs salaires, nombre d'enfants et autres données pour le calcul de l'impôt sur le revenu, mais après rechargement de la page, toutes ces données étaient perdues.

**Erreur:**
Les données de la section "Calcul Impôt sur le Revenu (IR)" n'étaient pas sauvegardées dans la base de données.

**Cause:**
Les champs `salaire_madame`, `salaire_monsieur`, `nombre_enfants` étaient bien collectés dans `sauvegarderDonneesFiscales()` et sauvegardés dans `donnees_detaillees`, mais la fonction `chargerDerniereSimulation()` les restaurait correctement. Le problème était que les nouvelles options de frais réels (ajoutées dans cette correction) n'étaient pas sauvegardées.

**Solution:**
1. Ajout de la sauvegarde des nouvelles données dans `sauvegarderDonneesFiscales()` :
   - `option_frais_reels` (reel ou abattement)
   - `km_perso_impots`
   - `chevaux_fiscaux_impots`
   - `peages_impots`

2. Ajout de la restauration dans `chargerDerniereSimulation()` :
   - Restauration du choix radio button
   - Restauration de tous les champs
   - Appel de `toggleFraisReels()` pour afficher/masquer l'interface

**Prévention:**
- Toujours penser à ajouter la sauvegarde ET la restauration des nouveaux champs
- Tester le cycle complet : saisie → sauvegarde → rechargement → vérification

---

### [19 Janvier 2026] - Absence d'option frais réels pour les impôts

**Contexte:**
Les utilisateurs ne pouvaient pas choisir entre l'abattement de 10% (option par défaut) et la déduction des frais réels pour le calcul de l'impôt sur le revenu. Cette option est pourtant importante car elle peut être plus avantageuse selon les situations (notamment pour ceux qui font beaucoup de kilomètres).

**Erreur:**
Pas d'interface pour :
1. Choisir entre abattement 10% ou frais réels
2. Saisir les km parcourus, chevaux fiscaux et péages (si option réel)
3. Différencier les frais personnels (impôts) des frais professionnels (URSSAF)

**Cause:**
Fonctionnalité non implémentée initialement.

**Solution:**
1. **Interface HTML** (`tabs/tab-fiscalite-v2.html`) :
   - Ajout de radio buttons pour choisir entre "10% d'abattement" et "Au réel"
   - Ajout d'une div `interface-frais-reels` (masquée par défaut) contenant :
     - Champ km parcourus (personnel/an)
     - Champ chevaux fiscaux
     - Champ péages annuels
     - Affichage du total calculé

2. **Fonctions JavaScript** (`js/fiscalite-v2.js`) :
   - `toggleFraisReels()` : Affiche/masque l'interface selon le choix
   - `calculerFraisReelsImpots()` : Calcule les frais réels selon le barème fiscal 2026
   - Modification de `calculerIR()` pour utiliser les frais réels ou l'abattement selon le choix

3. **Barème fiscal appliqué** :
   - ≤ 3 CV : 0.529 €/km
   - 4 CV : 0.606 €/km
   - 5 CV : 0.636 €/km
   - 6 CV : 0.665 €/km
   - ≥ 7 CV : 0.697 €/km
   - + Péages

**Distinction importante:**
- **URSSAF** : Frais professionnels LMP (trajets pour les gîtes)
- **IMPÔTS** : Frais personnels (trajet domicile-travail salarié)

**Prévention:**
- Toujours proposer les options fiscales légales aux utilisateurs
- Bien différencier les frais professionnels (URSSAF) et personnels (Impôts)
- Documenter clairement la différence pour éviter la confusion

---

### [13 Janvier 2026] - Initialisation du fichier

**Note:** Ce fichier sera alimenté au fur et à mesure des erreurs critiques rencontrées.

---

### [13 Janvier 2026] - IDs UUID non quotés dans onclick causant SyntaxError

**Contexte:**
Les boutons Modifier/Supprimer/Fiche Client dans reservations.js et dashboard.js ne fonctionnaient pas. Erreur console : "Uncaught SyntaxError: Invalid or unexpected token (at (index):1:28)"

**Erreur:**
```javascript
onclick="aperçuFicheClient(${r.id})"
// Génère: aperçuFicheClient(feb33125-130a-4299-b9fd-1ea17784fc73)
// ❌ UUID interprété comme du code JavaScript invalide (tirets = opérateurs de soustraction)
```

**Cause:**
Les UUID contiennent des tirets (-) qui sont interprétés comme des opérateurs de soustraction en JavaScript quand ils ne sont pas entre guillemets. Sans guillemets, le navigateur essaie d'évaluer `feb33125-130a-4299-b9fd-1ea17784fc73` comme une expression mathématique invalide.

**Solution:**
Ajouter des guillemets simples autour des IDs dans tous les onclick :
```javascript
onclick="aperçuFicheClient('${r.id}')"
// Génère: aperçuFicheClient('feb33125-130a-4299-b9fd-1ea17784fc73')
// ✅ UUID passé comme string valide
```

**Fichiers modifiés:**
- `js/reservations.js` lignes 104-106, 481, 486-488
- `js/dashboard.js` lignes 404, 409

**Prévention:**
- **TOUJOURS** mettre des guillemets simples autour des variables UUID/ID dans les attributs onclick HTML
- Vérifier systématiquement tous les onclick lors de création de nouveaux boutons d'action
- Pattern à utiliser : `onclick="maFonction('${variable}')"`
- Pattern à éviter : `onclick="maFonction(${variable})"`

---

<!-- NOUVELLES ERREURS À AJOUTER CI-DESSOUS -->

### [23 Janvier 2026] - Boutons Modifier/Supprimer FAQ non fonctionnels

**Contexte:**
Les boutons "Modifier" et "Supprimer" dans la liste des FAQ du back-office ne répondaient pas aux clics, empêchant toute modification ou suppression de questions existantes.

**Erreur:**
Aucun événement déclenché au clic sur les boutons. Pas d'erreur console, simplement aucune réaction.

**Cause:**
Les boutons utilisaient des attributs `data-action="modifier-question"` et `data-question-id="${question.id}"` mais **aucun gestionnaire d'événements n'était attaché** pour écouter ces clics. Le HTML était généré dynamiquement via `innerHTML` sans listeners.

**Solution:**
Ajout d'un **gestionnaire d'événements par délégation** dans `js/faq.js` :
1. Création de `attachFaqEventListeners(container)` appelée après chaque affichage
2. Création de `handleFaqClick(e)` qui gère tous les clics avec `e.target.closest('[data-action]')`
3. Switch sur `data-action` : 'modifier-question', 'supprimer-question', 'toggle-faq'
4. Appel des fonctions globales `window.modifierQuestion(id)` et `window.supprimerQuestion(id)`

**Code ajouté (lignes ~163-195) :**
```javascript
// Attacher les gestionnaires d'événements aux boutons FAQ
function attachFaqEventListeners(container) {
    container.removeEventListener('click', handleFaqClick);
    container.addEventListener('click', handleFaqClick);
}

function handleFaqClick(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    
    const action = target.getAttribute('data-action');
    const questionId = target.getAttribute('data-question-id');
    
    e.stopPropagation();
    
    switch(action) {
        case 'modifier-question':
            window.modifierQuestion(questionId);
            break;
        case 'supprimer-question':
            window.supprimerQuestion(questionId);
            break;
        case 'toggle-faq':
            target.closest('.faq-item')?.classList.toggle('open');
            break;
    }
}
```

**Prévention:**
- ⚠️ **TOUJOURS** attacher des event listeners après génération dynamique de HTML avec `innerHTML`
- ✅ Utiliser la **délégation d'événements** sur le conteneur parent (écoute sur `#faq-list`)
- ✅ Pattern recommandé : `data-action` + `data-*` plutôt que `onclick` inline pour le HTML généré
- ✅ Appeler `attachEventListeners()` systématiquement après `innerHTML = ...`

---
### [28 Janvier 2026] - Icônes Lucide ne s'affichent pas après génération dynamique de HTML

**Contexte:**
Lors du remplacement des emojis par des icônes Lucide dans les fiches clients, les icônes ajoutées via `innerHTML` dans du contenu JavaScript dynamique ne s'affichaient pas (éléments `<i data-lucide="icon-name"></i>` restaient invisibles).

**Erreur:**
Les balises `<i data-lucide="icon-name"></i>` sont présentes dans le DOM mais n'affichent pas l'icône SVG correspondante.

**Cause:**
Lucide transforme les éléments `<i data-lucide="...">` en SVG **au moment du chargement initial** via `lucide.createIcons()`. Lorsqu'on injecte du nouveau HTML avec `innerHTML`, les nouvelles balises `<i data-lucide>` ne sont pas automatiquement transformées en SVG.

**Solution:**
✅ **Appeler `lucide.createIcons()` après CHAQUE injection de HTML dynamique** :

```javascript
// ❌ AVANT (icônes ne s'affichent pas)
document.getElementById('conteneur').innerHTML = `
    <div>
        <i data-lucide="home"></i> Accueil
    </div>
`;

// ✅ APRÈS (icônes s'affichent)
document.getElementById('conteneur').innerHTML = `
    <div>
        <i data-lucide="home"></i> Accueil
    </div>
`;
// OBLIGATOIRE : réinitialiser les icônes Lucide
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}
```

**Exemples d'implémentation :**

1. **Après injection dans un élément spécifique :**
```javascript
const cuisineSection = document.getElementById('cuisineSection');
if (cuisineHTML) {
    document.getElementById('cuisineInfo').innerHTML = cuisineHTML;
    cuisineSection.style.display = 'block';
    if (typeof lucide !== 'undefined') lucide.createIcons(); // ✅
}
```

2. **À la fin d'une fonction de rendu :**
```javascript
function displayActivitesList(activites) {
    const container = document.getElementById('listeActivites');
    container.innerHTML = activites.map(activite => `
        <div class="card">
            <a href="tel:${activite.phone}">
                <i data-lucide="phone"></i> Appeler
            </a>
        </div>
    `).join('');
    
    // ✅ Initialiser Lucide après génération
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
```

3. **Après affichage d'une carte Google Maps avec icônes :**
```javascript
mapElement.innerHTML = `
    <iframe src="..."></iframe>
    <div>
        <i data-lucide="map-pin"></i> Voir sur Google Maps
    </div>
`;
// ✅ Obligatoire
if (typeof lucide !== 'undefined') lucide.createIcons();
```

**Prévention:**
- ⚠️ **TOUJOURS** appeler `lucide.createIcons()` après utilisation de `innerHTML`, `insertAdjacentHTML` ou `append()` avec du contenu contenant `<i data-lucide>`
- ✅ Ajouter systématiquement la vérification `if (typeof lucide !== 'undefined')` pour éviter les erreurs
- ✅ Dans les fonctions de rendu (`render*`, `display*`, `load*`), placer l'appel à la fin
- ✅ Pour les templates literals complexes, appeler `createIcons()` juste après l'injection
- 💡 Alternative : utiliser directement les SVG Lucide inline si les icônes ne changent jamais

**Note importante :**
Cette règle s'applique aussi dans `index.html` où un `setTimeout(() => lucide.createIcons(), 50)` est utilisé après le chargement des tabs pour transformer toutes les icônes du contenu chargé dynamiquement.

---