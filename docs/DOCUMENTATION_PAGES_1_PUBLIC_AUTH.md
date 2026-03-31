# Documentation Pages — Partie 1 : Pages Publiques & Authentification

> **LiveOwnerUnit** — Application SaaS de gestion de gîtes  
> Généré le 28 mars 2026 | Version 2.13.46  
> Stack : Vanilla JS/HTML/CSS + Supabase CDN + Vercel serverless

---

## Table des matières

- [Pages publiques / marketing](#pages-publiques--marketing)
  - [index.html](#indexhtml)
  - [commercial.html](#commercialhtml)
  - [cgu-cgv.html](#cgu-cgvhtml)
  - [legal.html](#legalhtml)
  - [privacy.html](#privacyhtml)
- [Pages d'authentification](#pages-dauthentification)
  - [pages/login.html](#pagesloginhtml)
  - [pages/logout.html](#pageslogouthtml)
  - [pages/forgot-password.html](#pagesforgot-passwordhtml)
  - [pages/reset-password.html](#pagesreset-passwordhtml)
  - [pages/onboarding.html](#pagesonboardinghtml)
- [Pages utilitaires client](#pages-utilitaires-client)
  - [pages/options.html](#pagesoptionshtml)
  - [pages/validation.html](#pagesvalidationhtml)

---

## Pages publiques / marketing

### index.html

**Type :** Page marketing publique  
**Audience :** Visiteurs / prospects  
**URL :** `/` (racine)

**Objectif :** Landing page principale de LiveOwnerUnit. Présente la plateforme, ses fonctionnalités, son pricing et pousse les visiteurs vers l'inscription ou une démo.

**Sections principales :**
| # | Section | Description |
|---|---------|-------------|
| 1 | Barre de navigation fixe | Logo, liens menu, bouton "Se connecter", CTA "Demander une démo" |
| 2 | Hero | Titre principal, sous-titre, chips fonctionnalités (2×2), 2 CTAs, indicateurs de confiance |
| 3 | Dashboard mock | Visualisation flottante avec stats et calendrier |
| 4 | Barre stats | 4 KPIs fond sombre (cyan sur navy) |
| 5 | Problèmes | 3 cartes problèmes avec icônes et badges impact |
| 6 | Flow solution | Intégration visuelle 4 plateformes → hub |
| 7 | Bénéfices | 3 cartes avec numéros et descriptions |
| 8 | Feature blocks | 6 blocs texte/visuel alternés avec listes |
| 9 | Tableau comparatif | 3 colonnes features avec ✓/✗ |
| 10 | Pricing | 3 cartes d'abonnement |
| 11 | FAQ | Accordéon questions fréquentes |
| 12 | Footer | Liens légaux |

**Boutons / CTAs :**
| Texte | Destination | Type |
|-------|------------|------|
| Se connecter | `/pages/login.html` | Lien navbar |
| Demander une démo | `/pages/login.html` | Bouton navbar (gradient) |
| Essai gratuit 14 jours | `/pages/login.html` | Bouton hero primaire |
| Découvrir le pricing | Ancre section pricing | Bouton hero secondaire |

**Formulaires :** Aucun

**Scripts chargés :**
- `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- `js/shared-config.js`

**Fonctions JS inline :**
- Animations CSS : `pulse-live`, `pulse-dot`, `float-slow`, `float-card`, `gradient-flow`, `rotate-slow`, `spin`, `slideUp`, `slideDown`

---

### commercial.html

**Type :** Page commerciale publique  
**Audience :** Prospects / décideurs  
**URL :** `/commercial.html`

**Objectif :** Page de vente secondaire présentant les fonctionnalités clés avec captures d'écran, KPIs et CTAs vers l'inscription.

**Sections principales :**
| # | Section | Description |
|---|---------|-------------|
| 1 | Topbar sticky | Logo + bouton "Demander une démo" |
| 2 | Hero | H1 + description + CTA + screenshot dashboard |
| 3 | KPIs | 3 stats : "7+ Modules", "1 vue", "0 Excel" |
| 4 | Galerie screenshots | Grille 6 captures : Réservations, Kanban, Draps, Ménage, Fiscalité, Calendrier |
| 5 | CTA section | Appel à l'action centré |
| 6 | Footer | Copyright |

**Boutons / CTAs :**
| Texte | Destination | Type |
|-------|------------|------|
| Demander une démo | `/pages/login.html` | Topbar primaire |
| Voir la plateforme | `/pages/login.html` | Hero primaire |
| Commencer maintenant | `/pages/login.html` | CTA section primaire |

**Formulaires :** Aucun

**Scripts chargés :** Aucun script externe (uniquement inline)

**Fonctions JS inline :**
```javascript
// Gestion images manquantes
(function() {
    const images = document.querySelectorAll('img[data-required]');
    images.forEach(img => {
        img.addEventListener('error', () => {
            // Remplace l'image par un div placeholder avec nom du fichier attendu
            img.replaceWith(holder);
        }, { once: true });
    });
})();
```

---

### cgu-cgv.html

**Type :** Page légale publique  
**Audience :** Tous utilisateurs  
**URL :** `/cgu-cgv.html`

**Objectif :** Conditions Générales d'Utilisation et de Vente — document légal provisoire en attente de validation formelle.

**Sections :**
1. Objet
2. Identité de l'éditeur
3. Accès au service
4. Obligations des utilisateurs
5. Conditions commerciales
6. Propriété intellectuelle
7. Données personnelles (→ lien privacy.html)
8. Responsabilité
9. Droit applicable et litiges
10. Entrée en vigueur

**Liens internes :**
- `mentions légales` → `/legal.html`
- `politique de confidentialité` → `/privacy.html`

**Scripts :** Aucun  
**Formulaires :** Aucun

---

### legal.html

**Type :** Page légale publique  
**Audience :** Tous utilisateurs  
**URL :** `/legal.html`

**Objectif :** Mentions légales obligatoires — informations éditeur, hébergement, PI, données personnelles.

**Sections :**
1. Éditeur (SIRET, adresse, email — à compléter)
2. Hébergement : Vercel Inc (app) + Supabase (BDD/services)
3. Propriété intellectuelle
4. Données personnelles
5. Droit applicable

**Liens internes :**
- `Voir les CGU / CGV` → `/cgu-cgv.html`

**Scripts :** Aucun  
**Formulaires :** Aucun

---

### privacy.html

**Type :** Page légale publique  
**Audience :** Tous utilisateurs  
**URL :** `/privacy.html`

**Objectif :** Politique de confidentialité RGPD — document provisoire détaillant les traitements de données personnelles.

**Sections :**
1. Responsable du traitement
2. Données traitées (4 catégories)
3. Finalités et bases légales (4 bases)
4. Durées de conservation
5. Destinataires et sous-traitants
6. Droits RGPD
7. Sécurité
8. Mises à jour

**Liens internes :**
- `Support client` → `/pages/client-support.html`
- `Voir les mentions légales` → `/legal.html`
- `Voir les CGU / CGV` → `/cgu-cgv.html`

**Scripts :** Aucun  
**Formulaires :** Aucun

---

## Pages d'authentification

### pages/login.html

**Type :** Page d'authentification  
**Audience :** Utilisateurs enregistrés  
**URL :** `/pages/login.html`

**Objectif :** Connexion par email/mot de passe avec basculement thème, lien récupération mot de passe et lien création compte.

**Sections :**
- Toggle thème (top-right) : ☀️ Jour / 🌙 Nuit
- Container centré : logo, tagline, zone alerte, formulaire, liens footer

**Boutons / CTAs :**
| Texte | Action | Type |
|-------|--------|------|
| Se connecter | Soumission formulaire | Bouton primaire (gradient cyan→electric) |
| Mot de passe oublié ? | `forgot-password.html` | Lien texte |
| Créer un compte | `onboarding.html` | Lien texte |
| ☀️ Jour | `setTheme('light')` | Toggle thème |
| 🌙 Nuit | `setTheme('dark')` | Toggle thème |

**Formulaire de connexion :**
| Champ | Type | Requis | Attributs |
|-------|------|--------|-----------|
| email | email | Oui | autocomplete="email", autofocus, placeholder="votre@email.com" |
| password | password | Oui | autocomplete="current-password", placeholder="••••••••" |

**Scripts chargés :**
- `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- `../js/utils.js`
- `../js/shared-config.js`
- `../js/referral-signup.js`

**Fonctions JS inline :**
```javascript
function setTheme(theme)         // Applique thème et sauvegarde en localStorage
function showAlert(msg, type)    // Affiche message d'erreur/succès
function setLoading(isLoading)   // Active/désactive état chargement bouton
// IIFE : vérification session existante pour éviter double connexion
// supabaseClient.auth.signInWithPassword({ email, password })
// supabaseClient.auth.getSession()
```

---

### pages/logout.html

**Type :** Page de déconnexion  
**Audience :** Utilisateurs connectés  
**URL :** `/pages/logout.html`

**Objectif :** Déconnexion immédiate et redirection vers login. Page minimaliste (texte "Déconnexion en cours...").

**Boutons :** Aucun (automatique)  
**Formulaires :** Aucun

**Scripts chargés :**
- `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- `../js/utils.js`
- `../js/shared-config.js`

**Fonctions JS inline :**
```javascript
(async () => {
    await window.supabaseClient.auth.signOut();
    window.location.href = '/pages/login.html';
})();
```

---

### pages/forgot-password.html

**Type :** Page de récupération mot de passe  
**Audience :** Utilisateurs enregistrés  
**URL :** `/pages/forgot-password.html`

**Objectif :** Envoi d'un email de réinitialisation mot de passe avec confirmation d'envoi.

**Sections :**
- Toggle thème (top-right)
- Container centré : logo, titre "Mot de passe oublié", description, zone alerte, formulaire, lien retour

**Boutons / CTAs :**
| Texte | Action | Type |
|-------|--------|------|
| Envoyer le lien de réinitialisation | Soumission formulaire | Bouton primaire |
| ← Retour à la connexion | `login.html` | Lien texte |
| ☀️ Jour / 🌙 Nuit | `setTheme()` | Toggles thème |

**Formulaire :**
| Champ | Type | Requis | Attributs |
|-------|------|--------|-----------|
| email | email | Oui | autocomplete="email", autofocus |

**Scripts chargés :**
- `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- `../js/utils.js`
- `../js/shared-config.js`

**Fonctions JS inline :**
```javascript
function setTheme(theme)
function showAlert(msg, type)
function setLoading(isLoading)
// supabaseClient.auth.resetPasswordForEmail(email, { redirectTo })
// Affiche "Si un compte existe avec cette adresse..." en cas de succès
```

---

### pages/reset-password.html

**Type :** Page de réinitialisation mot de passe  
**Audience :** Utilisateurs ayant cliqué un lien de reset  
**URL :** `/pages/reset-password.html`

**Objectif :** Permet de définir un nouveau mot de passe après avoir cliqué le lien email, avec validation OAuth session et indicateurs de force.

**Sections :**
- Toggle thème (top-right)
- Container centré : logo, titre "Nouveau mot de passe", description, zone alerte, formulaire, prérequis, lien retour

**Boutons / CTAs :**
| Texte | Action | Type |
|-------|--------|------|
| Enregistrer le nouveau mot de passe | Soumission formulaire | Bouton primaire |
| ← Retour à la connexion | `login.html` | Lien texte |
| ☀️ Jour / 🌙 Nuit | `setTheme()` | Toggles thème |

**Formulaire :**
| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| password | password | Oui | minlength="8", autocomplete="new-password" |
| passwordConfirm | password | Oui | minlength="8", confirmation identique |

**Scripts chargés :**
- `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- `../js/utils.js`
- `../js/shared-config.js`

**Fonctions JS inline :**
```javascript
function setTheme(theme)
function showAlert(msg, type)
function setLoading(isLoading)
// Écoute événement PASSWORD_RECOVERY de Supabase
window.supabaseClient.auth.onAuthStateChange((event, session) => {...})
// supabaseClient.auth.updateUser({ password })
// Validation token depuis fragment URL (access_token / token_hash)
```

---

### pages/onboarding.html

**Type :** Page d'inscription multi-étapes  
**Audience :** Nouveaux utilisateurs  
**URL :** `/pages/onboarding.html?plan=solo&cycle=mensuel`

**Objectif :** Wizard de création de compte en 4 étapes (email/mdp → infos perso → adresse → confirmation) avec sélection de plan et auto-login à la fin.

**Paramètres URL :**
- `?plan=solo|duo|quattro` — plan sélectionné (défaut : solo)
- `?cycle=mensuel|annuel` — cycle de facturation (défaut : mensuel)

**Sections / Étapes :**
| Étape | Titre | Contenu |
|-------|-------|---------|
| 0 | Créer votre compte | Email + mot de passe + confirmation |
| 1 | Informations personnelles | Prénom, nom, téléphone, entreprise |
| 2 | Votre adresse | Adresse, CP, ville, pays |
| 3 | Confirmation | Récapitulatif + bannière plan + bouton final |
| Post | Email envoyé | Confirmation + panel de connexion auto |

**Boutons / CTAs :**
| Texte | Action | Étape |
|-------|--------|-------|
| Suivant → | `nextStep(n)` | 0, 1, 2 |
| ← Retour | `prevStep(n)` | 1, 2, 3 |
| Créer mon compte | `finishOnboarding()` | Étape 3 |
| Se connecter | `doLogin()` | Post-inscription |

**Formulaires :**

**Étape 0 — Compte :**
| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| email | email | Oui | autocomplete="email" |
| password | password | Oui | minlength="6" |
| passwordConfirm | password | Oui | minlength="6" |

**Étape 1 — Infos perso :**
| Champ | Type | Requis |
|-------|------|--------|
| prenom | text | Oui |
| nom | text | Oui |
| telephone | tel | Oui |
| entreprise | text | Non |

**Étape 2 — Adresse :**
| Champ | Type | Requis | Options |
|-------|------|--------|---------|
| adresse | text | Oui | — |
| codePostal | text | Oui | — |
| ville | text | Oui | — |
| pays | select | Oui | France, Belgique, Suisse, Luxembourg, Canada, Autre |

**Scripts chargés :**
- `https://cdn.jsdelivr.net/npm/lucide@latest`
- `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- `../js/utils.js`
- `../js/shared-config.js`
- `../js/error-tracker.js`
- `../js/referral-signup.js`

**Fonctions JS inline :**
```javascript
let currentStep = 0
function nextStep(step)         // Navigation étape suivante + validation
function prevStep(step)         // Navigation étape précédente
function updateSteps()          // Mise à jour UI selon étape
function updateProgress()       // Mise à jour points de progression
function validateCurrentStep()  // Validation champs étape courante
function displaySummary()       // Affichage récapitulatif étape 3
function finishOnboarding()     // Création compte Supabase
function doLogin()              // Auto-connexion post-inscription

// Données plans (depuis URL params) :
const selectedPlan = _urlParams.get('plan') || 'solo'
const selectedCycle = _urlParams.get('cycle') || 'mensuel'
_planNames  = { solo: 'Solo', duo: 'Duo', quattro: 'Quattro' }
_planPrices = { solo: {...}, duo: {...}, quattro: {...} }
_planGites  = { solo: '1 gîte', duo: '2 gîtes', quattro: '4 gîtes' }

// Supabase :
// supabaseClient.auth.getUser()
// supabaseClient.from('cm_clients').select().eq().single()
// supabaseClient.auth.signUp({ email, password })
```

---

## Pages utilitaires client

### pages/options.html

**Type :** Page paramètres utilisateur  
**Audience :** Propriétaires de gîtes connectés  
**URL :** `/pages/options.html`

**Objectif :** Tableau de bord paramètres complet : profil, abonnement, sécurité, outils de gestion, thème/style, archives, support, notifications, parrainage.

**Navigation latérale (sidebar fixe 260px) :**
| Icône | Section | Ancre |
|-------|---------|-------|
| 👤 | Mon Profil | `#profil` |
| 💳 | Mon Abonnement | `#abonnement` |
| 🔒 | Sécurité | `#securite` |
| 🛠️ | Outils de Gestion | `#outils` |
| 🌓 | Thème & Style | `#theme` |
| 📦 | Archives | `#archives` |
| 🎫 | Support | `#support` |
| 🔔 | Notifications | `#notifications` |
| 🤝 | Parrainage | `#parrainage` |
| ↩️ | Retour au Dashboard | `/app.html` |

**Formulaires par section :**

**Section Profil :**
| Champ | Type | Requis | Note |
|-------|------|--------|------|
| profilePrenom | text | Oui | — |
| profileNom | text | Oui | — |
| profileEmail | email | Non | **Désactivé** (affichage seulement) |
| profileTelephone | tel | Oui | — |
| profileEntreprise | text | Non | — |
| profileAdresse | text | Oui | — |
| profileCodePostal | text | Oui | — |
| profileVille | text | Oui | — |
| profilePays | select | Oui | France, Belgique, Suisse, Luxembourg, Canada, Autre |

**Section Sécurité :**
| Champ | Type | Requis | Note |
|-------|------|--------|------|
| currentPassword | password | Oui | Vérification ancien mdp |
| newPassword | password | Oui | Minimum 8 caractères |
| passwordConfirm | password | Oui | Confirmation |

**Section Support :**
| Champ | Type | Requis |
|-------|------|--------|
| support-subject | text | Oui |
| support-category | select | Oui (Bug / Feature Request / Billing / Other) |
| support-message | textarea | Oui |
| support-priority | select | Non |

**Boutons / CTAs principaux :**
| Section | Texte | Action |
|---------|-------|--------|
| Profil | Sauvegarder | `saveProfile()` |
| Sécurité | Changer mon mot de passe | `changePassword()` |
| Thème | Toggle clair/sombre | `setTheme()` |
| Support | Créer le ticket | `createTicket()` |
| Parrainage | Copier le lien | `copyReferralLink()` |
| Général | ↩️ Retour | `/app.html` |

**Scripts chargés :** CSS uniquement visible (logique inline)

**Fonctions JS inline :**
```javascript
// Navigation panneaux
document.querySelectorAll('[data-panel]').forEach(link => {
    link.addEventListener('click', () => showPanel(...))
})

async function loadProfile()            // Chargement profil depuis Supabase
async function saveProfile()            // Sauvegarde modifications profil
function validateProfileFields()        // Validation côté client
async function changePassword()         // Mise à jour mdp via Supabase
async function createTicket()           // Création ticket support
async function loadTickets()            // Chargement tickets utilisateur
async function replyToTicket()          // Réponse à un ticket
function toggleNotification(type)       // Toggle préférence notification
async function saveNotificationPrefs()  // Sauvegarde préférences
function copyReferralLink()             // Copie lien parrainage
async function generateNewCode()        // Génère nouveau code parrainage
function showSuccessMessage(text)       // Toast succès
function showError(text)                // Toast erreur
```

---

### pages/validation.html

**Type :** Interface société de ménage (externe)  
**Audience :** Entreprises/prestataires de ménage  
**URL :** `/pages/validation.html?token=XXX`

**Objectif :** Interface dédiée aux prestataires de nettoyage pour visualiser, valider, proposer ou refuser les ménages assignés sur 2 semaines glissantes. Supporte le mode token (sans compte Supabase).

**Sections principales :**
| # | Section | Description |
|---|---------|-------------|
| 1 | Bannière notifications | Alertes refus/problèmes (masquée par défaut) |
| 2 | Planning semaines | Cartes hebdomadaires → par gîte → items ménage |
| 3 | Modal auto-conflit | ⚠️ Overlay conflits auto-replanifiés |
| 4 | Toast notification | Feedback actions utilisateur |

**Chaque item ménage affiche :**
- Nom client, période, badge statut
- Sélecteurs horaire : **Matin / Après-midi / Soir**
- Sélecteur date (input date)
- Boutons d'action : Valider ✓ / Proposer / Annuler ✗

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| Valider ✓ | `validateCleaning(id)` | Confirme le ménage |
| Proposer | `proposeCleaning(id)` | Propose une autre date/heure |
| Annuler ✗ | `cancelCleaning(id)` | Refuse le ménage |
| Matin / Après-midi / Soir | Toggle `.time-btn` | Sélection créneau |
| Compris (modal) | `autoConflictModalCloseBtn.onclick` | Ferme modal conflits |

**Scripts chargés :**
- `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- `../js/shared-config.js`
- `../js/gites-manager.js`
- `../js/menage.js`
- `https://cdn.jsdelivr.net/npm/dompurify@3.1.7/dist/purify.min.js`
- `../js/security-utils.js` (type=module)

**Fonctions JS inline :**
```javascript
window.cleanerOwnerId = null
window.cleanerTokenMode = false

async function initTokenMode()     // Lecture ?token= URL, validation via RPC Supabase
async function loadPlanning()      // Chargement gîtes, réservations, ménages

// Validation token :
supabaseClient.rpc('validate_cleaner_token', { p_token: token })

// Chargement conflits auto :
.from('cleaning_schedule').select()
  .eq('owner_user_id', ...)
  .ilike('notes', '%[AUTO_CLEANING_CONFLICT]%')

function renderAutoConflictWarning(notes)   // Parse et affiche détails conflit
function showAutoConflictModal(menages)     // Affiche overlay modal avertissement
function displayNotifications(menages)     // Alertes 2 semaines glissantes
function generateMenageHTML(m)             // Rendu HTML item ménage
function parseLocalDate(dateStr)           // Parse format DD/MM/YYYY
function getWeekNumber(date)               // Numéro semaine ISO
function setSafeHtml(el, html)             // innerHTML XSS-safe via DOMPurify
function showToast(message, type)          // Toast notification
function hasClientValidatedModification(notes)  // Vérifie marqueurs validation
```

---

*Fin partie 1/3 — Pages publiques & Authentification (12 pages documentées)*
