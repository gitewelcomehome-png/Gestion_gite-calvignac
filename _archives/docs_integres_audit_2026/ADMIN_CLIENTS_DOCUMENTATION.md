# 📋 DOCUMENTATION COMPLÈTE - PAGE GESTION CLIENTS ADMIN

## 🎯 INFORMATIONS GÉNÉRALES

**Nom du module** : Gestion Clients Channel Manager  
**Fichiers source** :
- Interface HTML : `pages/admin-clients.html`
- Logique JavaScript : `js/admin-clients.js`
- Styles CSS : `css/admin-dashboard.css` + styles inline

**Objectif** : Interface administrateur pour gérer les clients du service Channel Manager (SaaS B2B pour propriétaires de gîtes)

**Accès réservé** : Admin uniquement (`stephanecalvignac@hotmail.fr`)

---

## 📊 ARCHITECTURE BASE DE DONNÉES

### Tables Supabase utilisées

#### 1️⃣ TABLE `cm_clients` (Clients principaux)
**Rôle** : Stockage des clients Channel Manager (propriétaires de gîtes utilisant le service)

**Colonnes** :
```typescript
{
  id: UUID (PK),
  user_id: UUID (FK → auth.users),
  nom_entreprise: TEXT,
  nom_contact: TEXT (NOT NULL),
  prenom_contact: TEXT (NOT NULL),
  email_principal: TEXT (NOT NULL, UNIQUE), // ⚠️ NOM EXACT : "email_principal" PAS "email"
  telephone: TEXT,
  type_abonnement: ENUM('basic', 'pro', 'premium'), // Default: 'basic'
  statut: ENUM('actif', 'suspendu', 'resilié', 'trial'), // Default: 'actif'
  date_inscription: TIMESTAMPTZ (Default: NOW()),
  date_fin_abonnement: TIMESTAMPTZ,
  montant_mensuel: DECIMAL(10,2) (Default: 0),
  nb_gites_max: INTEGER (Default: 1),
  nb_gites_actuels: INTEGER (Default: 0),
  adresse: TEXT,
  code_postal: TEXT,
  ville: TEXT,
  pays: TEXT (Default: 'France'),
  onboarding_completed: BOOLEAN (Default: false),
  notes: TEXT,
  created_at: TIMESTAMPTZ (Default: NOW()),
  updated_at: TIMESTAMPTZ (Default: NOW())
}
```

**Index** :
- `idx_cm_clients_user_id` sur `user_id`
- `idx_cm_clients_email` sur `email_principal`
- `idx_cm_clients_statut` sur `statut`
- `idx_cm_clients_type_abonnement` sur `type_abonnement`
- `idx_cm_clients_ville` sur `ville`

---

#### 2️⃣ TABLE `cm_subscriptions` (Historique abonnements)
**Rôle** : Historique complet des abonnements par client

**Colonnes** :
```typescript
{
  id: UUID (PK),
  client_id: UUID (FK → cm_clients, ON DELETE CASCADE),
  type_abonnement: ENUM('basic', 'pro', 'premium'),
  montant: DECIMAL(10,2),
  date_debut: TIMESTAMPTZ (Default: NOW()),
  date_fin: TIMESTAMPTZ,
  statut: ENUM('actif', 'annulé', 'expiré', 'suspendu'),
  mode_paiement: ENUM('carte', 'virement', 'prelevement', 'paypal', 'autre'),
  raison_annulation: TEXT,
  created_at: TIMESTAMPTZ,
  updated_at: TIMESTAMPTZ
}
```

**Requête utilisée** :
```javascript
.from('cm_subscriptions')
.select('*')
.eq('client_id', clientId)
.order('date_debut', { ascending: false })
```

---

#### 3️⃣ TABLE `cm_promo_usage` (Utilisation promotions)
**Rôle** : Tracker l'utilisation des codes promo par client

**Colonnes** :
```typescript
{
  id: UUID (PK),
  promo_id: UUID (FK → cm_promotions),
  client_id: UUID (FK → cm_clients),
  subscription_id: UUID (FK → cm_subscriptions),
  montant_reduction: DECIMAL(10,2),
  ca_genere: DECIMAL(10,2),
  statut: ENUM('appliquée', 'expiré', 'annulée'),
  created_at: TIMESTAMPTZ
}
```

**Requête utilisée avec JOIN** :
```javascript
.from('cm_promo_usage')
.select(`
  *,
  promo:promo_id (*)
`)
.eq('client_id', clientId)
.order('created_at', { ascending: false })
```

**Données JOIN retournées** :
```typescript
{
  // cm_promo_usage
  id, promo_id, client_id, montant_reduction, ca_genere, statut, created_at,
  // cm_promotions (via promo:promo_id)
  promo: {
    id, code, nom, description, type_promotion, valeur, ...
  }
}
```

---

#### 4️⃣ TABLE `cm_referrals` (Parrainage)
**Rôle** : Gestion du programme de parrainage entre clients

**Colonnes** :
```typescript
{
  id: UUID (PK),
  parrain_id: UUID (FK → cm_clients), // Celui qui parraine
  filleul_id: UUID (FK → cm_clients, nullable), // Celui qui est parrainé
  code_parrainage: TEXT (UNIQUE),
  email_filleul: TEXT,
  statut: ENUM('en_attente', 'inscrit', 'converti', 'expiré'),
  date_invitation: TIMESTAMPTZ,
  date_inscription: TIMESTAMPTZ,
  date_conversion: TIMESTAMPTZ,
  recompense_parrain: DECIMAL(10,2),
  recompense_filleul: DECIMAL(10,2),
  recompense_appliquée: BOOLEAN,
  created_at: TIMESTAMPTZ
}
```

**Requête utilisée avec JOIN** :
```javascript
.from('cm_referrals')
.select(`
  *,
  filleul:filleul_id (nom_contact, prenom_contact, email_principal)
`)
.eq('parrain_id', clientId)
.order('created_at', { ascending: false })
```

---

#### 5️⃣ TABLE `cm_activity_logs` (Logs d'activité)
**Rôle** : Traçabilité de toutes les actions clients

**Colonnes** :
```typescript
{
  id: UUID (PK),
  client_id: UUID (FK → cm_clients),
  user_id: UUID (FK → auth.users),
  type_activite: ENUM(
    'connexion', 'deconnexion', 'sync_ical', 'sync_erreur',
    'modification_gite', 'ajout_gite', 'suppression_gite',
    'modification_reservation', 'changement_abonnement',
    'paiement', 'ticket_support', 'autre'
  ),
  details: JSONB (Default: {}),
  ip_address: INET,
  user_agent: TEXT,
  created_at: TIMESTAMPTZ
}
```

**Requête utilisée** :
```javascript
.from('cm_activity_logs')
.select('*')
.eq('client_id', clientId)
.order('created_at', { ascending: false })
.limit(50)
```

---

#### 6️⃣ TABLE `gites` (Gîtes gérés)
**Rôle** : Compter le nombre réel de gîtes par client

**Requête utilisée** :
```javascript
.from('gites')
.select('id')
.eq('owner_user_id', client.user_id)
```

**Usage** : Compter `gites.length` pour afficher le nombre de gîtes réels du client

---

## 🔧 VARIABLES GLOBALES JAVASCRIPT

```javascript
// Variables d'état globales
let currentUser = null;          // Type: User | null - Utilisateur admin connecté
let allClients = [];             // Type: Array<Client> - Cache tous les clients chargés
let currentClientId = null;      // Type: UUID | null - ID du client dans la modale ouverte
```

---

## 🎨 STRUCTURE HTML - COMPOSANTS PRINCIPAUX

### 1. Header Admin
```html
<header class="admin-header">
  <h1>Gestion des Clients</h1>
  <span id="userEmail">stephanecalvignac@hotmail.fr</span>
  <button id="btnLogout">Déconnexion</button>
</header>
```

### 2. Sidebar Navigation
Boutons de navigation vers :
- Dashboard (`admin-channel-manager.html`)
- **Clients** (page active)
- Support (`admin-support.html`)
- Promotions (`admin-promotions.html`)
- Finance & BI (`admin-finance.html`)
- Content IA (`admin-content.html`)
- Monitoring (`admin-monitoring.html`)
- Site Web

### 3. Stats Header
```html
<div>
  <span id="totalClients">0</span> clients
  <span id="activeClients">0</span> actifs
  <span id="trialClients">0</span> en essai
</div>
```

### 4. Filtres et Recherche
```html
<input id="searchInput" placeholder="Rechercher par nom, email, entreprise...">
<select id="filterStatut">
  <option value="">Tous les statuts</option>
  <option value="actif">Actifs</option>
  <option value="trial">Essai gratuit</option>
  <option value="suspendu">Suspendus</option>
  <option value="resilié">Résiliés</option>
</select>
<select id="filterAbonnement">
  <option value="">Tous les abonnements</option>
  <option value="basic">Basic</option>
  <option value="pro">Pro</option>
  <option value="premium">Premium</option>
</select>
```

### 5. Tableau Clients
```html
<table>
  <thead>
    <th>Client</th>
    <th>Email</th>
    <th>Entreprise</th>
    <th>Abonnement</th>
    <th>Statut</th>
    <th>MRR</th>
    <th>Gîtes</th>
    <th>Inscription</th>
  </thead>
  <tbody id="clientsTableBody">
    <!-- Généré dynamiquement -->
  </tbody>
</table>
```

### 6. Modal Fiche Client
```html
<div id="clientModal" class="modal-overlay">
  <div class="modal-content">
    <div class="modal-header">
      <h2 id="modalClientName">Nom Client</h2>
      <p id="modalClientEmail">email@example.com</p>
    </div>
    
    <div class="modal-body">
      <!-- Actions rapides -->
      <button onclick="sendPasswordResetEmail()">Envoyer lien mot de passe</button>
      <button onclick="editClient()">Modifier</button>
      <button onclick="suspendClient()">Suspendre</button>
      
      <!-- Tabs navigation -->
      <div class="tabs">
        <button onclick="switchClientTab('infos')">Informations</button>
        <button onclick="switchClientTab('abonnements')">Abonnements</button>
        <button onclick="switchClientTab('promotions')">Promotions</button>
        <button onclick="switchClientTab('parrainage')">Parrainage</button>
        <button onclick="switchClientTab('activite')">Activité</button>
      </div>
      
      <!-- Tab contents -->
      <div id="tabInfos" class="tab-content active"></div>
      <div id="tabAbonnements" class="tab-content"></div>
      <div id="tabPromotions" class="tab-content"></div>
      <div id="tabParrainage" class="tab-content"></div>
      <div id="tabActivite" class="tab-content"></div>
    </div>
  </div>
</div>
```

---

## 🔄 FLUX DE FONCTIONNEMENT

### 1. Initialisation au chargement de la page

```javascript
document.addEventListener('DOMContentLoaded', () => {
  // 1. Attacher les event listeners
  searchInput.addEventListener('input', filterClients);
  filterStatut.addEventListener('change', filterClients);
  filterAbonnement.addEventListener('change', filterClients);
  
  // 2. Vérifier l'authentification
  checkAuth();
});
```

### 2. Authentification
```javascript
async function checkAuth() {
  // 1. Récupérer l'utilisateur connecté
  const { data: { user } } = await supabaseClient.auth.getUser();
  
  // 2. Redirection si non connecté
  if (!user) window.location.href = '../index.html';
  
  // 3. Vérification admin hardcodée
  if (user.email !== 'stephanecalvignac@hotmail.fr') {
    alert('❌ Accès réservé aux administrateurs');
    window.location.href = '../index.html';
  }
  
  // 4. Stockage utilisateur et chargement clients
  currentUser = user;
  loadClients();
}
```

### 3. Chargement des clients
```javascript
async function loadClients() {
  // 1. Requête Supabase
  const { data: clients } = await supabaseClient
    .from('cm_clients')
    .select('*')
    .order('date_inscription', { ascending: false });
  
  // 2. Mise en cache
  allClients = clients || [];
  
  // 3. Affichage
  displayClients(allClients);
  updateStats(allClients);
}
```

### 4. Affichage du tableau
```javascript
function displayClients(clients) {
  const tbody = document.getElementById('clientsTableBody');
  
  // Vérification vide
  if (!clients || clients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">Aucun client trouvé</td></tr>';
    return;
  }
  
  // Génération HTML
  tbody.innerHTML = clients.map(client => `
    <tr onclick="openClientModal('${client.id}')">
      <td>${client.prenom_contact} ${client.nom_contact}</td>
      <td>${client.email_principal}</td>
      <td>${client.nom_entreprise || '-'}</td>
      <td><span class="badge badge-${client.type_abonnement}">${client.type_abonnement}</span></td>
      <td><span class="badge badge-${client.statut}">${getStatutLabel(client.statut)}</span></td>
      <td>${client.montant_mensuel}€</td>
      <td>${client.nb_gites_actuels} / ${client.nb_gites_max}</td>
      <td>${new Date(client.date_inscription).toLocaleDateString('fr-FR')}</td>
    </tr>
  `).join('');
  
  // Réinitialisation icônes Lucide
  lucide.createIcons();
}
```

### 5. Mise à jour des statistiques
```javascript
function updateStats(clients) {
  const total = clients.length;
  const actifs = clients.filter(c => c.statut === 'actif').length;
  const trials = clients.filter(c => c.statut === 'trial').length;
  
  document.getElementById('totalClients').textContent = total;
  document.getElementById('activeClients').textContent = actifs;
  document.getElementById('trialClients').textContent = trials;
}
```

---

## 🔍 SYSTÈME DE FILTRAGE

### Fonction de filtrage combiné
```javascript
function filterClients() {
  // 1. Récupération des valeurs
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const statutFilter = document.getElementById('filterStatut').value;
  const abonnementFilter = document.getElementById('filterAbonnement').value;
  
  let filtered = allClients;
  
  // 2. Filtre texte (recherche multi-champs)
  if (searchTerm) {
    filtered = filtered.filter(client => 
      client.nom_contact.toLowerCase().includes(searchTerm) ||
      client.prenom_contact.toLowerCase().includes(searchTerm) ||
      client.email_principal.toLowerCase().includes(searchTerm) ||
      (client.nom_entreprise && client.nom_entreprise.toLowerCase().includes(searchTerm))
    );
  }
  
  // 3. Filtre statut
  if (statutFilter) {
    filtered = filtered.filter(client => client.statut === statutFilter);
  }
  
  // 4. Filtre abonnement
  if (abonnementFilter) {
    filtered = filtered.filter(client => client.type_abonnement === abonnementFilter);
  }
  
  // 5. Réaffichage
  displayClients(filtered);
}
```

**Champs de recherche texte** :
- `nom_contact`
- `prenom_contact`
- `email_principal`
- `nom_entreprise`

**Filtres select** :
- Statut : actif, trial, suspendu, resilié
- Abonnement : basic, pro, premium

---

## 🎯 MODAL FICHE CLIENT

### Ouverture de la modale
```javascript
async function openClientModal(clientId) {
  // 1. Stockage ID courant
  currentClientId = clientId;
  
  // 2. Affichage modale
  document.getElementById('clientModal').style.display = 'block';
  
  // 3. Chargement données
  await loadClientDetails(clientId);
}
```

### Chargement des détails
```javascript
async function loadClientDetails(clientId) {
  // 1. Récupération client
  const { data: client } = await supabaseClient
    .from('cm_clients')
    .select('*')
    .eq('id', clientId)
    .single();
  
  // 2. Mise à jour header modale
  document.getElementById('modalClientName').textContent = 
    `${client.prenom_contact} ${client.nom_contact}`;
  document.getElementById('modalClientEmail').textContent = client.email_principal;
  
  // 3. Chargement onglet actif
  displayClientInfos(client);
  
  // 4. Chargement asynchrone autres onglets
  loadAbonnements(clientId);
  loadPromotions(clientId);
  loadParrainage(clientId);
  loadActivite(clientId);
}
```

---

## 📑 ONGLETS DE LA MODALE

### ONGLET 1 : Informations

**Fonction** : `displayClientInfos(client)`

**Données affichées** :
1. **Contact** : `${prenom_contact} ${nom_contact}`
2. **Email** : `email_principal`
3. **Téléphone** : `telephone` ou "Non renseigné"
4. **Entreprise** : `nom_entreprise` ou "Non renseigné"
5. **Adresse** : `adresse` ou "Non renseignée"
6. **Ville** : `${code_postal} ${ville}` ou "Non renseigné"
7. **Pays** : `pays` (default: "France")
8. **Abonnement** : Badge `type_abonnement`
9. **Statut** : Badge `statut`
10. **MRR** : `${montant_mensuel}€ / mois`
11. **Gîtes gérés** : Nombre réel depuis table `gites`
12. **Date inscription** : `date_inscription` formatée
13. **Fin abonnement** : `date_fin_abonnement` ou "Indéterminé"
14. **User ID** : `user_id` (UUID)
15. **Notes** : `notes` (si présent)

**Requête pour comptage gîtes** :
```javascript
const { data: gites } = await supabaseClient
  .from('gites')
  .select('id')
  .eq('owner_user_id', client.user_id);

const nbGitesReels = gites?.length || 0;
```

**Template HTML** :
```html
<div class="info-card">
  <label><i data-lucide="user"></i> Contact</label>
  <div class="value">${prenom_contact} ${nom_contact}</div>
</div>
<!-- ... 14 autres cards similaires ... -->
```

---

### ONGLET 2 : Abonnements

**Fonction** : `loadAbonnements(clientId)`

**Requête** :
```javascript
const { data: abonnements } = await supabaseClient
  .from('cm_subscriptions')
  .select('*')
  .eq('client_id', clientId)
  .order('date_debut', { ascending: false });
```

**Affichage Timeline** :
- Badge `type_abonnement` + Badge `statut`
- Dates : `date_debut` → `date_fin` (ou "Actif")
- Montant : `montant`€
- Mode paiement : `mode_paiement`
- Raison annulation : `raison_annulation` (si présent, affiché en rouge)

**Template HTML** :
```html
<div class="timeline">
  <div class="timeline-item">
    <span class="badge badge-${type_abonnement}">${type_abonnement}</span>
    <span class="badge badge-${statut}">${statut}</span>
    <div>${date_debut} → ${date_fin || 'Actif'}</div>
    <div>${montant}€</div>
    ${raison_annulation ? `⚠️ ${raison_annulation}` : ''}
  </div>
</div>
```

---

### ONGLET 3 : Promotions

**Fonction** : `loadPromotions(clientId)`

**Requête avec JOIN** :
```javascript
const { data: promos } = await supabaseClient
  .from('cm_promo_usage')
  .select(`
    *,
    promo:promo_id (*)
  `)
  .eq('client_id', clientId)
  .order('created_at', { ascending: false });
```

**Structure données retournées** :
```javascript
{
  id: UUID,
  promo_id: UUID,
  client_id: UUID,
  montant_reduction: 50.00,
  ca_genere: 150.00,
  statut: 'appliquée',
  created_at: '2026-01-15T...',
  promo: {
    code: 'PROMO2026',
    nom: 'Promotion Janvier',
    type_promotion: 'pourcentage',
    valeur: 25.00
  }
}
```

**Affichage Cards** :
- Nom promo : `promo.nom`
- Code : `promo.code`
- Badge statut : `statut`
- Réduction : `-${montant_reduction}€` (vert)
- CA généré : `${ca_genere}€`
- Date : `created_at`

---

### ONGLET 4 : Parrainage

**Fonction** : `loadParrainage(clientId)`

**Requête avec JOIN** :
```javascript
const { data: referrals } = await supabaseClient
  .from('cm_referrals')
  .select(`
    *,
    filleul:filleul_id (nom_contact, prenom_contact, email_principal)
  `)
  .eq('parrain_id', clientId)
  .order('created_at', { ascending: false });
```

**Calcul statistiques** :
```javascript
const total = referrals?.length || 0;
const acceptes = referrals?.filter(r => r.statut === 'actif').length || 0;
const enAttente = referrals?.filter(r => r.statut === 'en_attente').length || 0;
const recompenses = referrals?.reduce((sum, r) => sum + (r.recompense_parrain || 0), 0) || 0;
```

**Affichage** :
1. **Stats boxes** (3 cartes) :
   - Total parrainages
   - Actifs
   - Récompenses totales (€)

2. **Timeline filleuls** :
   - Nom filleul : `${filleul.prenom_contact} ${filleul.nom_contact}` ou `email_filleul`
   - Code : `code_parrainage`
   - Badge statut : `statut`
   - Récompense : `+${recompense_parrain}€` (vert)
   - Date : `created_at`

---

### ONGLET 5 : Activité

**Fonction** : `loadActivite(clientId)`

**Requête** :
```javascript
const { data: activities } = await supabaseClient
  .from('cm_activity_logs')
  .select('*')
  .eq('client_id', clientId)
  .order('created_at', { ascending: false })
  .limit(50); // Limité aux 50 dernières
```

**Affichage Timeline** :
- Type activité : `type_activite`
- Détails : `JSON.stringify(details)` (si présent)
- Date/heure : `created_at` formaté

**Types activité possibles** :
- connexion
- deconnexion
- sync_ical
- sync_erreur
- modification_gite
- ajout_gite
- suppression_gite
- modification_reservation
- changement_abonnement
- paiement
- ticket_support
- autre

---

## ⚡ ACTIONS RAPIDES

### 1. Envoyer lien mot de passe

**Fonction** : `sendPasswordResetEmail()`

**Processus** :
```javascript
async function sendPasswordResetEmail() {
  // 1. Vérification client courant
  if (!currentClientId) return;
  
  // 2. Récupération client
  const client = allClients.find(c => c.id === currentClientId);
  if (!client) throw new Error('Client non trouvé');
  
  // 3. Envoi email via Supabase Auth
  const { error } = await supabaseClient.auth.resetPasswordForEmail(
    client.email_principal,
    {
      redirectTo: `${window.location.origin}/pages/reset-password.html`
    }
  );
  
  if (error) throw error;
  
  // 4. Toast succès
  showToast(`✅ Email envoyé à ${client.email_principal}`, 'success');
  
  // 5. Log activité
  await supabaseClient
    .from('cm_activity_logs')
    .insert({
      client_id: currentClientId,
      user_id: currentUser.id,
      type_activite: 'autre',
      details: { action: 'password_reset_sent', by_admin: true }
    });
}
```

**API utilisée** : `supabaseClient.auth.resetPasswordForEmail()`

---

### 2. Modifier client

**Fonction** : `editClient()`

**Statut** : ⚠️ **NON IMPLÉMENTÉ**

**Comportement actuel** :
```javascript
function editClient() {
  showToast('⚠️ Fonctionnalité à implémenter', 'warning');
}
```

**À implémenter** :
- Formulaire modal d'édition
- Validation champs
- UPDATE sur `cm_clients`
- Log activité

---

### 3. Suspendre/Réactiver client

**Fonction** : `suspendClient()`

**Processus** :
```javascript
async function suspendClient() {
  // 1. Vérification client courant
  if (!currentClientId) return;
  
  // 2. Récupération client
  const client = allClients.find(c => c.id === currentClientId);
  if (!client) return;
  
  // 3. Confirmation utilisateur
  const confirm = window.confirm(
    `Êtes-vous sûr de vouloir ${client.statut === 'suspendu' ? 'réactiver' : 'suspendre'} ce client ?`
  );
  if (!confirm) return;
  
  // 4. Toggle statut
  const newStatut = client.statut === 'suspendu' ? 'actif' : 'suspendu';
  
  // 5. UPDATE base de données
  const { error } = await supabaseClient
    .from('cm_clients')
    .update({ statut: newStatut })
    .eq('id', currentClientId);
  
  if (error) throw error;
  
  // 6. Toast succès
  showToast(`✅ Client ${newStatut}`, 'success');
  
  // 7. Rechargement données
  await loadClients();
  await loadClientDetails(currentClientId);
}
```

**Logique** : Toggle entre `actif` ↔ `suspendu`

---

## 🎨 SYSTÈME DE BADGES

### Badges Statuts
```css
.badge-actif {
  background: #dcfce7; /* Vert clair */
  color: #166534;      /* Vert foncé */
}

.badge-trial {
  background: #dbeafe; /* Bleu clair */
  color: #1e40af;      /* Bleu foncé */
}

.badge-suspendu {
  background: #fed7aa; /* Orange clair */
  color: #c2410c;      /* Orange foncé */
}

.badge-resilie {
  background: #fecaca; /* Rouge clair */
  color: #991b1b;      /* Rouge foncé */
}
```

### Badges Abonnements
```css
.badge-basic {
  background: #e0e7ff; /* Violet clair */
  color: #4338ca;      /* Violet foncé */
}

.badge-pro {
  background: #fce7f3; /* Rose clair */
  color: #be185d;      /* Rose foncé */
}

.badge-premium {
  background: #fef3c7; /* Jaune clair */
  color: #92400e;      /* Jaune foncé */
}
```

### Fonction de traduction
```javascript
function getStatutLabel(statut) {
  const labels = {
    'actif': 'Actif',
    'trial': 'Essai gratuit',
    'suspendu': 'Suspendu',
    'resilié': 'Résilié'
  };
  return labels[statut] || statut;
}
```

---

## 🎯 NAVIGATION TABS

**Fonction** : `switchClientTab(tabName)`

**Paramètres** :
- `tabName` : 'infos' | 'abonnements' | 'promotions' | 'parrainage' | 'activite'

**Processus** :
```javascript
function switchClientTab(tabName) {
  // 1. Désactiver tous les tabs
  document.querySelectorAll('.tab').forEach(tab => 
    tab.classList.remove('active')
  );
  document.querySelectorAll('.tab-content').forEach(content => 
    content.classList.remove('active')
  );
  
  // 2. Activer le tab sélectionné
  event.target.closest('.tab').classList.add('active');
  
  // 3. Afficher le contenu correspondant
  const tabId = `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
  document.getElementById(tabId).classList.add('active');
  
  // 4. Réinitialiser icônes
  lucide.createIcons();
}
```

**Mapping tabs → IDs** :
- `infos` → `#tabInfos`
- `abonnements` → `#tabAbonnements`
- `promotions` → `#tabPromotions`
- `parrainage` → `#tabParrainage`
- `activite` → `#tabActivite`

---

## 🛠️ FONCTIONS UTILITAIRES

### Toast notification
```javascript
function showToast(message, type = 'info') {
  const colors = {
    success: '#16a34a',
    error: '#dc2626',
    warning: '#f59e0b',
    info: '#667eea'
  };
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s;
    font-weight: 600;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

**Types disponibles** :
- `success` : Vert (#16a34a)
- `error` : Rouge (#dc2626)
- `warning` : Orange (#f59e0b)
- `info` : Violet (#667eea)

---

### Fermeture modale
```javascript
function closeClientModal() {
  document.getElementById('clientModal').style.display = 'none';
  currentClientId = null;
}

// Fermeture par clic sur overlay
document.addEventListener('click', (e) => {
  if (e.target.id === 'clientModal') {
    closeClientModal();
  }
});
```

---

## 🔒 SÉCURITÉ

### Authentification
- **Vérification** : Hardcheck email admin `stephanecalvignac@hotmail.fr`
- **Méthode** : `supabaseClient.auth.getUser()`
- **Redirection** : Vers `index.html` si non autorisé

### Row Level Security (RLS)
**Policies Supabase attendues** :
```sql
-- Admin full access
CREATE POLICY "Admin full access cm_clients" ON cm_clients
  FOR ALL USING (auth.email() = 'stephanecalvignac@hotmail.fr');

CREATE POLICY "Admin full access cm_subscriptions" ON cm_subscriptions
  FOR ALL USING (auth.email() = 'stephanecalvignac@hotmail.fr');

CREATE POLICY "Admin full access cm_promo_usage" ON cm_promo_usage
  FOR ALL USING (auth.email() = 'stephanecalvignac@hotmail.fr');

CREATE POLICY "Admin full access cm_referrals" ON cm_referrals
  FOR ALL USING (auth.email() = 'stephanecalvignac@hotmail.fr');

CREATE POLICY "Admin full access cm_activity_logs" ON cm_activity_logs
  FOR ALL USING (auth.email() = 'stephanecalvignac@hotmail.fr');
```

---

## 🐛 ERREURS CORRIGÉES

### ❌ ERREUR : Colonne `email` inexistante
**Symptôme** : 
```
GET /rest/v1/cm_clients?select=...email... 400 (Bad Request)
{ code: '42703', message: 'column cm_clients.email does not exist' }
```

**Cause** : La colonne s'appelle `email_principal` et non `email`

**Correction appliquée** : [admin-dashboard.js:433](../js/admin-dashboard.js#L433)
```javascript
// AVANT (❌)
.select('id, nom_contact, prenom_contact, email, ...')

// APRÈS (✅)
.select('id, nom_contact, prenom_contact, email_principal, ...')
```

---

## 📊 MÉTRIQUES AFFICHÉES

### Header page
```javascript
{
  totalClients: allClients.length,
  activeClients: allClients.filter(c => c.statut === 'actif').length,
  trialClients: allClients.filter(c => c.statut === 'trial').length
}
```

### Parrainage (stats boxes)
```javascript
{
  total: referrals.length,
  acceptes: referrals.filter(r => r.statut === 'actif').length,
  recompenses: referrals.reduce((sum, r) => sum + r.recompense_parrain, 0)
}
```

---

## 🎨 STYLES CSS PERSONNALISÉS

### Grille info-cards
```css
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}
```

### Cards hover
```css
.info-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
```

### Timeline
```css
.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e2e8f0;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -26px;
  top: 20px;
  width: 16px;
  height: 16px;
  background: white;
  border: 3px solid #667eea;
  border-radius: 50%;
}
```

---

## 🔗 DÉPENDANCES

### Scripts externes
```html
<!-- Supabase SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Lucide Icons -->
<script src="https://unpkg.com/lucide@latest"></script>
```

### Scripts internes
```html
<script src="../js/shared-config.js"></script>    <!-- Config Supabase -->
<script src="../js/error-tracker.js"></script>   <!-- Gestion erreurs -->
<script src="../js/admin-clients.js"></script>   <!-- Logique page -->
```

### Stylesheets
```html
<link rel="stylesheet" href="../css/main.css">
<link rel="stylesheet" href="../css/admin-dashboard.css">
```

---

## 🚀 AMÉLIORATIONS SUGGÉRÉES

### 1. Pagination
**Problème** : Tous les clients chargés en une fois  
**Solution** : 
```javascript
.from('cm_clients')
.select('*', { count: 'exact' })
.range(0, 49) // Première page (50 clients)
```

### 2. Fonction editClient()
**Actuellement** : Non implémenté  
**À développer** :
- Modal avec formulaire
- Validation champs
- UPDATE Supabase
- Rechargement données

### 3. Export Excel/CSV
**Besoin** : Exporter la liste filtrée  
**Librairie** : SheetJS ou Papa Parse

### 4. Filtres avancés
**Ajouts possibles** :
- Date d'inscription (range)
- MRR (min/max)
- Nombre de gîtes
- Onboarding complété (oui/non)

### 5. Graphiques
**Charts.js** :
- Évolution nombre clients
- Répartition statuts (pie chart)
- MRR mensuel (line chart)
- Churn rate

### 6. Actions bulk
**Fonctionnalités** :
- Checkbox selection multiple
- Suspendre/réactiver en masse
- Export sélection
- Envoyer email groupé

### 7. Real-time
**Supabase Realtime** :
```javascript
supabaseClient
  .channel('cm_clients_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'cm_clients' },
    payload => {
      console.log('Change:', payload);
      loadClients(); // Rechargement auto
    }
  )
  .subscribe();
```

### 8. Variables d'environnement
**Problème** : Email admin hardcodé  
**Solution** : 
```javascript
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'stephanecalvignac@hotmail.fr';
```

### 9. Archivage logs
**Problème** : Table `cm_activity_logs` peut grossir indéfiniment  
**Solution** : Fonction d'archivage automatique (> 6 mois)

### 10. Indicateur onboarding
**Champ existant** : `onboarding_completed`  
**Affichage** : Badge ou indicateur visuel dans le tableau

---

## 📝 NOTES TECHNIQUES

### Format dates
```javascript
// Date courte
new Date(date).toLocaleDateString('fr-FR')
// → "02/02/2026"

// Date longue
new Date(date).toLocaleDateString('fr-FR', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})
// → "2 février 2026"

// Date + heure
new Date(date).toLocaleString('fr-FR')
// → "02/02/2026 14:30:45"
```

### Icônes Lucide
**Initialisation** : Appeler `lucide.createIcons()` après génération HTML dynamique

**Icônes utilisées** :
- `users`, `user`, `mail`, `phone`, `building`, `map-pin`, `map`, `globe`
- `package`, `activity`, `trending-up`, `home`, `calendar`, `clock`, `key`
- `file-text`, `credit-card`, `tag`, `x`, `search`, `log-out`
- `layout-dashboard`, `headphones`, `bar-chart-2`, `pen-tool`

---

## 🎯 CHECKLIST COMPRÉHENSION IA

✅ Structure tables Supabase comprise  
✅ Relations FK identifiées  
✅ Requêtes SQL avec JOINs documentées  
✅ Flux de fonctionnement décrit  
✅ Variables globales listées  
✅ Fonctions principales expliquées  
✅ Système de filtrage détaillé  
✅ 5 onglets modale documentés  
✅ Actions rapides décrites  
✅ Badges et styles CSS explicités  
✅ Sécurité et authentification clarifiée  
✅ Erreurs corrigées tracées  
✅ Améliorations suggérées  

---

**Version documentation** : 1.0  
**Date création** : 2 février 2026  
**Auteur** : GitHub Copilot  
**Maintenance** : À mettre à jour lors des modifications majeures
