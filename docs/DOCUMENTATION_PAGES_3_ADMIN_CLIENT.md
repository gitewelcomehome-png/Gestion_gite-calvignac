# Documentation Pages — Partie 3 : Pages Admin & Pages Client/Métier

> **LiveOwnerUnit** — Application SaaS de gestion de gîtes  
> Généré le 28 mars 2026 | Version 2.13.46

---

## Table des matières

- [Pages Admin (SaaS Back-office)](#pages-admin)
  - [admin-channel-manager.html](#admin-channel-managerhtml)
  - [admin-clients.html](#admin-clientshtml)
  - [admin-communications.html](#admin-communicationshtml)
  - [admin-content.html](#admin-contenthtml)
  - [admin-content-analytics.html](#admin-content-analyticshtml)
  - [admin-emails.html](#admin-emailshtml)
  - [admin-finance.html](#admin-financehtml)
  - [admin-monitoring.html](#admin-monitoringhtml)
  - [admin-parrainage.html](#admin-parrainagehtml)
  - [admin-prestations.html](#admin-prestationshtml)
  - [admin-prestations-stats.html](#admin-prestations-statshtml)
  - [admin-promotions.html](#admin-promotionshtml)
  - [admin-support.html](#admin-supporthtml)
  - [admin-ticket-workflow.html](#admin-ticket-workflowhtml)
  - [admin-security-audit.html](#admin-security-audithtml)
  - [admin-error-details.html](#admin-error-detailshtml)
  - [admin-performance-audit.html](#admin-performance-audithtml)
  - [admin-scalabilite-roadmap.html](#admin-scalabilite-roadmaphtml)
  - [admin-prompt-editor.html](#admin-prompt-editorhtml)
- [Pages Client & Métier](#pages-client--métier)
  - [pages/fiche-client.html](#pagesfiche-clienthtml)
  - [pages/client-support.html](#pagesclient-supporthtml)
  - [pages/femme-menage.html](#pagesfemme-menagehtml)

---

## Pages Admin

> Toutes les pages admin sont réservées aux **administrateurs SaaS** de la plateforme LiveOwnerUnit. Elles gèrent les clients abonnés, les finances, le contenu, le support, la technique et la sécurité.

### admin-channel-manager.html

**URL :** `/pages/admin-channel-manager.html`

**Objectif :** Dashboard principal admin — vue d'ensemble santé système, KPIs financiers, avertissements critiques et accès rapide à tous les modules admin.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Santé système | Services (Supabase, API, Vercel), métriques perf, uptime, santé IA, tickets support, promos actives |
| KPIs Grid | MRR / Clients actifs / NPS / Taux churn |
| Graphiques évolution | MRR 12 mois + évolution clients |
| Derniers clients | Liste 5 clients récents |
| Navigation sidebar | Liens vers toutes les pages admin |

**Boutons / Actions :**
| ID / Handler | Description |
|-------------|-------------|
| `btnLogout` | Déconnexion |
| `btnRefreshAIStatus` | Actualise santé services IA |
| Filtres graphiques | 12 mois / 6 mois / 3 mois |
| `data-nav-url` | Navigation vers autres pages admin |

**Scripts chargés :**
- `js/utils.js`
- `js/shared-config.js`
- Lucide Icons, Chart.js

---

### admin-clients.html

**URL :** `/pages/admin-clients.html`

**Objectif :** Gestion complète des comptes clients SaaS — listing, recherche, filtres, fiche détaillée par client avec historique.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Stats header | Total clients / Actifs / En essai |
| Recherche & filtres | Texte libre + statut + abonnement |
| Tableau clients | Liste complète avec badges |
| Modal fiche client | Profil détaillé avec 4 onglets |

**Filtres :**
| Filtre | ID | Options |
|--------|----|---------|
| Recherche | `searchInput` | Nom, email, entreprise |
| Statut | `filterStatut` | Actifs / Essai / Suspendus / Résiliés |
| Abonnement | `filterAbonnement` | Solo / Duo / Quattro |

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| Réinitialiser mdp | `send-password-reset-email` | Envoie lien reset |
| Modifier | `edit-client` | Édite données client |
| Suspendre | `suspend-client` | Suspend compte |
| Supprimer | `delete-client` | Suppression définitive |
| Onglets modal | `switch-client-tab` | Infos / Abonnements / Promotions / Parrainage / Activité |

**Tableau clients :**
Client | Email | Entreprise | Abonnement | Statut | MRR | Gîtes | Date inscription

**Modal client — Onglets :**
1. **Informations** — données perso, infos abonnement
2. **Abonnements** — abonnement actuel, dates renouvellement
3. **Promotions** — codes promo appliqués, remises
4. **Parrainage** — stats filleuls, codes

**Scripts chargés :**
- `js/utils.js`
- `js/shared-config.js`
- `js/error-tracker.js`
- `js/admin-clients.js`

---

### admin-communications.html

**URL :** `/pages/admin-communications.html`

**Objectif :** Envoi de communications ciblées (emails ou notifications) aux clients abonnés avec assistance IA pour amélioration du contenu et analyse vidéo.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Bouton Nouvelle communication | Ouvre modal formulaire |
| Grille | Gauche : formulaire / Droite : liste publiées |
| Switcher mode | Texte ↔ Vidéo |
| Analyse vidéo | Parsing URL vidéo via IA |
| Amélioration texte | Enhancement IA du message |

**Formulaire mode Texte :**
| Champ | ID | Type | Requis |
|-------|----|------|--------|
| Titre | `commTitre` | text | Oui |
| Message | `commMessage` | textarea | Non |
| Type | `commType` | select | Non (info / warning / success / urgent) |
| Cible | `commCible` | — | Non |
| Date fin | `commDateFin` | date | Non |

**Formulaire mode Vidéo :**
| Champ | ID | Description |
|-------|----|-------------|
| URL vidéo | `videoUrl` | URL à analyser par IA |

**Boutons / Actions :**
| Data-action / ID | Description |
|-----------------|-------------|
| `close-modal` | Ferme modal |
| `switch-mode` | Toggle Texte/Vidéo |
| `analyze-video` | Analyse vidéo via IA |
| `improve-text` | Améliore texte via IA |
| `delete-communication` | Supprime communication |
| Submit | Publie communication |

**Scripts chargés :**
- `js/utils.js`
- `js/shared-config.js`
- `js/zoho-mail-config.js`
- `js/admin-communications.js`

---

### admin-content.html

**URL :** `/pages/admin-content.html`

**Objectif :** Stratégie de contenu marketing pilotée par IA — génération de posts, emails, blogs, newsletters avec planning 12 semaines et queue de publication.

**Tabs de navigation :**
| Onglet | Description |
|--------|-------------|
| Stratégie | Plan 12 semaines + stratégie semaine courante |
| Actions validées | Queue de publication planifiée |
| Actions proposées | Recommandations IA business & marketing |
| Génération manuelle | Interface de création libre |

**Sections supplémentaires :**
| Section | Description |
|---------|-------------|
| Quick Actions Grid | Social post / Email / Blog / Newsletter / Image / Social connect |
| Bibliothèque contenu | Tableau tout le contenu généré |
| Templates IA | Templates pré-construits recommandés |

**Filtres :**
| Filtre | Description |
|--------|-------------|
| `aiProviderSelect` | OpenAI / Claude |
| Plateformes | LinkedIn / Facebook / Instagram / Blog / Email / Vidéo |
| `filterType` | Type de contenu |
| `searchContent` | Recherche dans le contenu |

**Modal de génération :**
| Champ | Type | Description |
|-------|------|-------------|
| Sujet/Thème | text | — |
| Ton | select | professionnel / amical / enthousiaste / informatif / urgent |
| Modèle IA | select | OpenAI / Claude |
| Points clés | textarea | — |
| CTA | text | — |
| Longueur | select | — |

**Boutons / Actions :**
| Data-action | Description |
|-------------|-------------|
| `show-generate-modal` | Ouvre modal création contenu |
| `show-image-generator` | Interface génération image |
| `show-social-connect` | Connexion réseaux sociaux |
| `generate-longterm-plan` | Génère plan 12 semaines |
| `load-archived-actions` | Charge contenu archivé |
| `generate-business-actions` | Recommandations IA |
| `use-template` | Utilise template pré-défini |
| `switch-tab` | Changement d'onglet |

---

### admin-content-analytics.html

**URL :** `/pages/admin-content-analytics.html`

**Objectif :** Tableau de bord BI pour analyser la performance du contenu marketing — KPIs, graphiques, top actions, insights IA.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Header | Titre + sélecteur période (7/30/90/365 jours) |
| KPIs cards | Métriques clés (injection dynamique) |
| Graphiques (2 colonnes) | Performance par plateforme (bar) + Évolution leads & vues (line) |
| Top 10 actions | Tableau scrollable injected |
| Insights IA | Recommandations texte, dégradé cyan |

**Boutons / Actions :**
| Handler | Description |
|---------|-------------|
| `timeRange.change()` → `loadAnalytics()` | Recharge avec nouvelle période |

**Scripts chargés :**
- `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- `/js/utils.js`
- `/js/shared-config.js`
- `/js/admin-content-analytics.js`
- Chart.js v4.4.0, Lucide Icons

---

### admin-emails.html

**URL :** `/pages/admin-emails.html`

**Objectif :** Client email intégré avec Zoho Mail pour la communication admin → clients.

**États de la page :**
1. **Non connecté** : Écran de connexion Zoho Mail
2. **Connecté** : Interface email complète

**Sections (état connecté) :**
| Section | Description |
|---------|-------------|
| Sidebar | Bouton Composer + dossiers (INBOX, Envoyés, Brouillons, Corbeille) |
| Liste emails | En-tête dossier + filtre lu/non-lu + items emails |
| Visionneuse | Email sélectionné avec métadonnées + corps |

**Filtres :**
| Filtre | ID | Description |
|--------|----|-------------|
| Statut lecture | `emailReadFilter` | Tous / Lu / Non lu |
| Dossier | `folderSelect` | Navigation dossiers |

**Boutons / Actions :**
| Handler / Data | Description |
|---------------|-------------|
| `initiate-zoho-auth` | Lance authentification Zoho |
| `data-folder` | Navigation entre dossiers |
| `open-compose` | Ouvre modal composition |
| `send-email` | Envoie email |
| `close-compose` | Ferme modal composition |
| Reply / Forward / Delete / Mark | Actions sur email sélectionné |

**Modal composition :**
Champs : Destinataire (To) / Objet (Subject) / Corps (Body)

**Scripts chargés :**
- `js/utils.js`
- `js/shared-config.js`
- `js/zoho-mail-config.js`

---

### admin-finance.html

**URL :** `/pages/admin-finance.html`

**Objectif :** Analytique financière et business intelligence SaaS — MRR, LTV, CAC, cohortes de rétention, historique transactions, prévisions IA.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Sélecteur période | 30 / 90 / 365 jours / tout |
| KPIs ligne 1 | Revenus total / MRR / Marge brute / Taux croissance |
| KPIs ligne 2 | LTV / CAC / Payback period / Taux churn |
| Graphiques | Évolution revenus + Répartition abonnements (pie) |
| Analyse cohortes | Tableau rétention par mois cohorte |
| Transactions récentes | Historique complet |
| Prédictions IA | Prévision revenus / nouveaux clients / risque churn avec scores confiance |

**Boutons / Actions :**
| Handler / ID | Description |
|-------------|-------------|
| `periodSelector` | Filtre période |
| `export-transactions` | Export CSV transactions |

**Tableau cohortes :**
Mois cohorte | Nb clients | Rétention Mois 0 → Mois 12 (%)

**Tableau transactions :**
Date | Client | Type | Abonnement | Montant | Statut

**Scripts chargés :**
- `js/utils.js`
- `js/shared-config.js`
- `js/admin-finance.js`
- Chart.js

---

### admin-monitoring.html

**URL :** `/pages/admin-monitoring.html`

**Objectif :** Monitoring temps réel — santé système, gestion des erreurs, explorateur de logs, top erreurs, corrections automatiques.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Santé système | Services (Supabase, API, Vercel), perf, uptime, IA |
| Erreurs non résolues | Liste filtrée avec auto-fix |
| Test corrections | Statut validation, résultats tests |
| Explorateur logs | Recherche avancée + filtres |
| Top 10 erreurs | Erreurs les plus fréquentes |

**Filtres :**
| Filtre | ID | Description |
|--------|----|-------------|
| Criticité | `unresolvedErrorTypeFilter` | Critical / Warning |
| Date début | `filterDateFrom` | — |
| Date fin | `filterDateTo` | — |
| Source | `filterSource` | — |
| Type | `filterType` | — |

**Boutons / Actions :**
| Handler | Description |
|---------|-------------|
| `refresh-ai-health` | Actualise santé IA |
| `delete-all-errors` | Supprime toutes les erreurs non résolues |
| `auto-fix-errors` | Lance correction automatique erreurs |
| `refresh-errors` | Actualise liste erreurs |
| `search-logs` | Recherche avec filtres actifs |
| `clear-filters` | Réinitialise tous les filtres |
| `refresh-test-corrections` | Actualise statut tests |

**Tableaux affichés :**
- Erreurs : Message / Type / Sévérité
- Logs : Date / Type / Source / Message / Utilisateur / Actions
- Top erreurs : Occurrence / Fréquence / Sévérité

**Scripts chargés :**
- `js/console-cleaner.js`
- `js/utils.js`
- `js/shared-config.js`
- `js/admin-monitoring.js`

---

### admin-parrainage.html

**URL :** `/pages/admin-parrainage.html`

**Objectif :** Configuration et analyse du programme de parrainage — création de campagnes, gestion des bonus, statistiques participants.

**Sections UI :**
| Section | Description |
|---------|-------------|
| KPIs Grid | Campagnes actives / Participants / Total filleuls / Bonus distribués |
| Cartes campagnes | Stats et actions par campagne |

**Modal création campagne :**
| Champ | Type | Description |
|-------|------|-------------|
| Nom campagne | text | — |
| Code | text | Majuscules forcées |
| Description | textarea | — |
| Type bonus | select | discount_multiplier / discount_fixed / points_multiplier / points_fixed |
| Date début | date | — |
| Date fin | date | — |
| Max utilisations | number | — |
| Min filleuls requis | number | — |
| Types abonnement | checkboxes | Standard / Gîtes France |
| Actif | checkbox | — |

**Boutons / Actions :**
| Handler | Description |
|---------|-------------|
| `open-create-modal` | Ouvre modal nouvelle campagne |
| `close-modal` | Ferme modal |
| Edit campagne | Édition campagne existante |
| Delete campagne | Suppression campagne |

**Scripts chargés :**
- `js/utils.js`
- `js/shared-config.js`
- `js/admin-parrainage.js`

---

### admin-prestations.html

**URL :** `/pages/admin-prestations.html`

**Objectif :** Gestion du catalogue de prestations additionnelles par gîte — configuration des services facturables, suivi des commandes, statistiques revenus.

**Tabs :**
| Onglet | Description |
|--------|-------------|
| Catalogue | Cards services avec icône, nom, prix, description, disponibilités |
| Commandes | Tableau historique commandes |
| Statistiques | CA brut / net / commissions / nombre commandes |

**Modal création service :**
| Champ | Type | Requis |
|-------|------|--------|
| Nom FR | text | Oui |
| Nom EN | text | Non |
| Description FR | textarea | Non |
| Description EN | textarea | Non |
| Prix | number | Oui |
| Icône/Emoji | text | Non |
| Disponibilité | checkboxes jours | Non |
| Statut | toggle | Non (actif/inactif) |

**Boutons / Actions :**
| Handler | Description |
|---------|-------------|
| `open-config` | Configuration paramètres |
| `open-add-prestation` | Ouvre modal nouvelle prestation |
| `close-modal` | Ferme modal |
| `data-tab` | Changement d'onglet |

---

### admin-prestations-stats.html

**URL :** `/pages/admin-prestations-stats.html`

**Objectif :** Statistiques globales cross-clients de toutes les prestations additionnelles — analytics plateforme complète.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Stats Grid | CA brut / Total commissions / Nb commandes / Taux commission |
| Alerte info | Explication des stats unifiées |
| Tableau historique | Toutes les commandes de tous les clients |
| Tableau par client | Statistiques client par client |

**Tableau commandes :**
Numéro | Client | Gîte | Date | Brut | Commission | Net propriétaire | Statut

**Modal configuration :**
- Champ : Pourcentage commission

**Boutons / Actions :**
| Handler | Description |
|---------|-------------|
| `open-config-modal` | Configuration commission |
| `close-config-modal` | Ferme modal |

**Scripts chargés :**
- `js/utils.js`
- `js/shared-config.js`
- `js/admin-prestations-stats.js`

---

### admin-promotions.html

**URL :** `/pages/admin-promotions.html`

**Objectif :** Gestion complète des codes promotionnels — création, suivi d'utilisation, calcul ROI, segmentation cible.

**Sections UI :**
| Section | Description |
|---------|-------------|
| KPIs Grid | Promos actives / Utilisations 30j / Coût total 30j / Revenus générés 30j / ROI moyen |
| Filtres & recherche | Statut + type + texte libre |
| Tableau promotions | Liste toutes promos actives/inactives |

**Filtres :**
| Filtre | ID | Options |
|--------|----|---------|
| Statut | `filterStatut` | Tous / Actives / Inactives / Expirées |
| Type | `filterType` | Tous / Pourcentage / Montant fixe / Mois gratuits / Upgrade |
| Recherche | `searchPromo` | Texte libre |

**Modal création promo :**
| Champ | ID | Type | Contraintes |
|-------|----|------|-------------|
| Code | `promoCode` | text | Majuscules requises |
| Nom | `promoNom` | text | — |
| Type | `promoType` | select | pourcentage / montant_fixe / mois_gratuits / upgrade |
| Valeur | `promoValeur` | number | Montant ou % |
| Cible | `promoCible` | select | tous / nouveaux / existants / churn_risk / vip |
| Types abonnement | checkboxes | — | Basic / Pro / Premium |
| Date début | `promoDateDebut` | date | — |
| Date fin | `promoDateFin` | date | — |
| Max utilisations | `promoMaxUtilisations` | number | — |
| Actif | `promoActif` | toggle | — |

**Boutons / Actions :**
| Handler | Description |
|---------|-------------|
| `open-modal` | Nouvelle promo |
| `close-modal` | Ferme modal |
| Edit / Delete | Actions sur promo existante |
| Voir statistiques | Modal stats utilisation |

**Scripts chargés :**
- `js/utils.js`
- `js/shared-config.js`
- `js/admin-promotions.js`

---

### admin-support.html

**URL :** `/pages/admin-support.html`

**Objectif :** Gestion centralisée des tickets support clients — workflow complet, base de connaissances, analytics qualité support.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Stats cards | Tickets ouverts / En attente / Temps réponse moy / Score CSAT |
| Barre filtres | Recherche + statut + priorité + catégorie + tri |
| Vue double panneau | Gauche : liste tickets / Droite : détail ticket |
| Section analytics | Graphique temps résolution / Tendance CSAT / Top problèmes / Heatmap |
| Base de connaissances | Catégories + articles + recherche |

**Filtres :**
| Filtre | ID | Options |
|--------|----|---------|
| Recherche | `searchTickets` | Texte libre |
| Statut | `filterStatus` | ouvert / en_cours / en_attente_client / resolu / ferme |
| Priorité | `filterPriority` | critique / haute / normale / basse |
| Catégorie | `filterCategory` | technique / facturation / fonctionnalite / bug / autre |
| Tri | `sortBy` | — |

**Boutons / Actions :**
| Handler | Description |
|---------|-------------|
| `coming-soon-ticket` | Nouveau ticket (placeholder) |
| Clic ticket | Ouvre détail dans panneau droit |
| `btnClearFilters` | Réinitialise filtres |
| Précédent / Suivant | Pagination |
| Article KB | Modal contenu article |

**Scripts chargés :**
- `js/utils.js`
- `js/shared-config.js`
- `js/admin-support.js`

---

### admin-ticket-workflow.html

**URL :** `/pages/admin-ticket-workflow.html`

**Objectif :** Vue détaillée workflow d'un ticket individuel avec timeline d'historique, erreur associée, commentaires et changement de statut.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Résumé ticket | Titre / Client / Statut / Priorité |
| Erreur associée | Détails erreur liée (si applicable) |
| Timeline | Historique chronologique actions/commentaires |
| Panneau actions (droite) | Dropdown statut + actions rapides + zone commentaire |

**Statuts disponibles :**
Ouvert / En cours / En attente client / Résolu / Fermé

**Boutons / Actions :**
| Handler | Description |
|---------|-------------|
| `btnOpenInSupport` | Ouvre dans page support principale |
| `btnViewError` | Voir l'erreur dans monitoring |
| `btnNotifyClient` | Envoie notification email au client |
| `btnMarkResolved` | Marque comme résolu |
| `btnCloseTicket` | Ferme le ticket |
| `btnAddComment` | Ajoute commentaire |
| `statusSelect` | Change statut ticket |

**Formulaire :**
| Champ | Type | Description |
|-------|------|-------------|
| `statusSelect` | select | Changement statut |
| `commentText` | textarea | Texte commentaire |

**Scripts chargés :**
- `js/utils.js`
- `js/shared-config.js`
- `js/ticket-workflow.js`

---

### admin-security-audit.html

**URL :** `/pages/admin-security-audit.html`

**Objectif :** Rapport d'audit sécurité & RGPD — document statique de synthèse avec scores, risques identifiés et plan de remédiation.

> **Page statique (lecture seule)** — aucun bouton interactif.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Header audit | Date, type, périmètre |
| Score cards (3) | Sécurité globale: 99/100 / RGPD: 86/100 / Clôture externe: 50/100 |
| Constat principal | Résumé exécutif |
| Actions traitées | Liste 15+ éléments résolus (21/02→24/02/2026) |
| Risques prioritaires | Tableau criticité / risque / impact / observation |
| Plan remédiation 30j | Timeline 3 semaines |
| Note RGPD détail | Tableau 5 dimensions |
| Dossier RGPD | Lien vers artefacts de preuve |

**Périmètre couvert :** 30 pages runtime, 11 endpoints API, scripts SQL

---

### admin-error-details.html

**URL :** `/pages/admin-error-details.html`

**Objectif :** Vue détaillée d'une erreur spécifique avec stack trace, diff corrections appliquées et timeline.

> **Page lecture seule** — données chargées dynamiquement depuis Supabase.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Métadonnées | 4 colonnes : Statut / Fichier / Ligne / Timestamp |
| Stack trace | Code block monospace |
| Ticket associé | Info ticket support lié (si existe) |
| Corrections | Diff 2 colonnes : code avant / code après |
| Timeline | Événements chronologiques avec icônes + dates |

**Boutons / Actions :**
| Handler | Description |
|---------|-------------|
| Retour au monitoring | `btnBackToMonitoring` → `window.history.back()` |

**Authentification :** Vérification admin via email ou table `user_roles` (rôle admin/super_admin actif)

**Scripts chargés :**
- `js/utils.js`
- `js/shared-config.js` (+ Supabase CDN, Lucide Icons)

---

### admin-performance-audit.html

**URL :** `/pages/admin-performance-audit.html`

**Objectif :** Rapport de performance et tests de charge API — résultats phases de test, SLOs, verdict conforme/non-conforme.

> **Page statique** avec un seul bouton fonctionnel.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Header audit | Date, type "test de charge API-only", Run ID, 8/8 phases |
| Score cards (3) | Verdict SLO / Point fort (API stable) / Point bloquant (transport errors) |
| Résultats consolidés | Tableau scénario / volume / erreur / latence / statut |
| Points à améliorer | P0 / P1 / P2 |
| Tabs surveillance | Vue globale / Point bloquant / Check hebdo / Scalabilité |
| Artefacts | Liens rapports/JSON/CSV |

**Métriques clés :**
- Worst p95 : 207ms
- Worst error rate : 0.25%
- Verdict : **PASS** (SLO API-only conforme)

**Boutons / Actions :**
| Handler | Description |
|---------|-------------|
| `copyApiOnlyCommand()` | Copie commande API-only dans clipboard (tab "Check hebdo") |

---

### admin-scalabilite-roadmap.html

**URL :** `/pages/admin-scalabilite-roadmap.html`

**Objectif :** Plan stratégique de montée en charge jusqu'à 70 000 utilisateurs — feuille de route par paliers.

> **Page statique**.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Section cible | Objectif 70k utilisateurs |
| Paliers (tableau 4 colonnes) | Range users / Objectif / Actions / Déclencheur de passage |
| Checklist minimale | 4 critères par palier |

**Paliers documentés :** 0→500 / 500→2k / 2k→10k / 10k→25k / 25k→50k / 50k→70k

**Boutons / Actions :**
| Handler | Description |
|---------|-------------|
| Retour Surveillance | Lien vers `/pages/admin-surveillance-evolution.html` |

---

### admin-prompt-editor.html

**URL :** `/pages/admin-prompt-editor.html`

**Objectif :** Éditeur de prompts système Claude — modification, test et déploiement du prompt IA avec gestion des règles éthiques.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Grille éditeur (2 colonnes) | Gauche : textarea édition / Droite : preview read-only |
| Panneau règles éthiques | Liste règles avec catégories (interdiction/obligation/recommandation) |

**Boutons / Actions :**
| Data-action | Description |
|-------------|-------------|
| `load-prompt` | 🔄 Recharge prompt depuis BDD |
| `save-prompt` | 💾 Sauvegarde & déploie |
| `test-prompt` | 🧪 Test avec Claude |
| `view-history` | 📜 Historique versions |
| `add-rule` | ➕ Ajoute règle éthique |

**Formulaires :**
| Champ | Type | Description |
|-------|------|-------------|
| `promptEditor` | textarea | Édition libre du prompt |
| Formulaire règle | dynamique | Ajout règle éthique avec catégorie |

**Règles éthiques — catégories :**
- 🔴 Interdiction
- 🟢 Obligation
- 🟡 Recommandation

**Sécurité :** `escapeHTML()` pour protection XSS en preview live

**Scripts chargés :**
- `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- `../js/utils.js`
- `../js/shared-config.js`

---

## Pages Client & Métier

### pages/fiche-client.html

**URL :** `/pages/fiche-client.html?token=XXX`

**Type :** Interface client externe (hôtes en séjour)  
**Audience :** Clients (voyageurs) pendant leur séjour  

**Objectif :** Guide interactif complet pour les hôtes pendant leur séjour — informations d'accès, WiFi, équipements, services additionnels, activités à proximité, demandes et formulaires d'évaluation. Accessible via lien/token unique.

**Navigation — 8 onglets :**
| # | Onglet | Icône | Contenu |
|---|--------|-------|---------|
| 1 | ENTRÉE | 🚪 | Adresse, horaire, code accès, WiFi, parking, checklist |
| 2 | PENDANT | 🏡 | Chauffage, cuisine, linge, sécurité, équipements, règlement, contacts urgence |
| 3 | SORTIE | 🏃 | Horaire départ, instructions, checklist départ |
| 4 | PRESTATIONS | 🛒 | Services facturables disponibles à la réservation |
| 5 | ACTIVITÉS | 🗺️ | Carte Leaflet + activités et commerces autour du gîte |
| 6 | DEMANDES | 📝 | Signalement problèmes / demandes / retours |
| 7 | ÉVALUATION | ⭐ | Guidance sur la notation (pédagogique) |
| 8 | FAQ | ❓ | Questions fréquentes avec recherche et filtres catégorie |

**Boutons / Actions :**
| Texte | Location | Handler | Description |
|-------|----------|---------|-------------|
| Partager | Header | `btnShare.click()` | Partager le lien |
| Exporter PDF | Header | `btnExportPDF.click()` | Export PDF via html2pdf.js |
| FR / EN | Header | `language-btn onclick` | Bascule langue |
| Google Maps | Onglet Entrée | `mapsLink.href` | Ouvre itinéraire |
| Copier SSID | Onglet Entrée | `copyToClipboard()` | Copie SSID WiFi |
| Copier mdp WiFi | Onglet Entrée | `copyToClipboard()` | Copie mot de passe WiFi |
| Demander arrivée plus tôt | Onglet Entrée | Form submit | Envoie demande horaire |
| Demander départ tardif | Onglet Sortie | Form submit | Envoie demande horaire |
| ➕ Ajouter au panier | Onglet Prestations | `btn-add-panier.onclick` | Ajoute service au panier |
| Voir itinéraire | Onglet Activités | `modalActiviteItineraire.click()` | Ouvre carte détail activité |
| Envoyer demande | Onglet Demandes | Form submit | Envoie retour/demande |
| Passer commande | Modal panier | `passerCommande()` | Valide la commande |

**Formulaires :**

**Demande d'arrivée anticipée :**
| Champ | Type | Options |
|-------|------|---------|
| heureArriveeDemandee | select | Créneaux horaires |
| motifArrivee | textarea | Texte libre |

**Demande de départ tardif :**
| Champ | Type | Options |
|-------|------|---------|
| heureDepartDemandee | select | Créneaux horaires |
| motifDepart | textarea | Texte libre |

**Formulaire retour/demande :**
| Champ | Type | Options |
|-------|------|---------|
| typeRetourDemande | select | Type de retour |
| sujetRetourDemande | text | — |
| descriptionRetourDemande | textarea | — |
| urgenceDemande | radio | Niveaux urgence |

**Hero section (avant séjour) :**
- Countdown chrono avant arrivée
- Quick Actions 2×2 : Code / WiFi / Activités / Contact

**Scripts chargés :**
- `../js/security-utils.js`
- `../js/utils.js`
- `../js/shared-config.js`
- `../js/fiche-activites-map.js?v=2.5.5`
- `../js/fiche-client-app.js?v=2.10.2`
- `../js/fiche-client-prestations.js?v=1.0.2`

**Bibliothèques externes :**
- Leaflet v1.9.4 (cartes)
- Lucide Icons
- html2pdf.js (export PDF)
- Font Awesome 6.5.1
- DOMPurify 3.1.7 (sécurité XSS)

---

### pages/client-support.html

**URL :** `/pages/client-support.html`

**Type :** Interface support client  
**Audience :** Propriétaires de gîtes (utilisateurs de la plateforme)  

**Objectif :** Création et suivi de tickets support avec FAQ libre-service. Permet aux utilisateurs de signaler des problèmes et de suivre les réponses de l'équipe.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Header | Logo / titre / email utilisateur / déconnexion |
| Bannière info | Explication du service support |
| Créer un ticket | Formulaire de création |
| Mes tickets | Grille filtrable des tickets |
| FAQ rapide | 4 articles fréquents (2×2) |
| Modal ticket | Détail + historique échanges |

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| Retour | `window.location.href='../index.html'` | Vers page d'accueil |
| Déconnexion | `btnLogout.click()` | Déconnexion |
| Annuler | `btnResetForm.click()` | Réinitialise formulaire |
| Créer le ticket | Form submit | Envoie ticket |
| Tous les statuts | `filterStatus.change()` | Filtre par statut |
| Fermer modal | `closeTicketModal()` | Ferme détail ticket |

**Formulaire création ticket (`createTicketForm`) :**
| Champ | ID | Type | Requis | Options |
|-------|----|------|--------|---------|
| Catégorie | `ticketCategory` | select | Oui | Bug / Feature / Facturation / Autre |
| Priorité | `ticketPriority` | select | Oui | — |
| Titre | `ticketTitle` | text | Oui | — |
| Description | `ticketDescription` | textarea | Oui | Limite 1000 caractères (compteur) |

**Scripts chargés :**
- `../js/utils.js`
- `../js/shared-config.js`
- `../js/support-ai.js`
- `../js/client-support.js`

---

### pages/femme-menage.html

**URL :** `/pages/femme-menage.html?token=XXX`

**Type :** Interface prestataire interne  
**Audience :** Personnel de ménage (femmes/hommes de ménage)  

**Objectif :** Interface dédiée au personnel de ménage — consulter le planning d'interventions, créer des tâches (achats/travaux), mettre à jour les stocks de draps et envoyer des retours post-ménage.

**Sections UI :**
| Section | Description |
|---------|-------------|
| Header | Titre "Espace Femme de Ménage" + sous-titre bienvenue |
| Interventions prévues | Planning semaines avec cards néo-brutalisme |
| Créer une tâche | 2 onglets : Achats vs Travaux |
| Stocks de draps | Onglets par gîte + grille numérique |
| Mes retours envoyés | Historique retours |
| Faire un retour | Grand formulaire feedback ménage |

**Cards d'intervention (néo-brutalisme) :**
- Barre couleur top (couleur par gîte)
- Nom gîte + date + heure
- Badge statut (validé / à faire)
- Notes éventuelles
- Grille responsive

**Onglets tâches :**
- **Achats & Courses** — formulaire achats
- **Travaux & Maintenance** — formulaire travaux avec priorité

**Boutons / Actions :**
| Texte | Handler | Description |
|-------|---------|-------------|
| Actualiser | `forceRefreshReservations()` | Recharge planning interventions |
| Achats & Courses | `switchTaskTab('achats')` | Affiche formulaire achats |
| Travaux & Maintenance | `switchTaskTab('travaux')` | Affiche formulaire travaux |
| Créer tâche achats | Form submit | Envoie tâche achat |
| Créer tâche travaux | Form submit | Envoie tâche travaux |
| Envoyer retour ménage | Form submit | Envoie feedback |

**Formulaire tâche achats (`form-tache-achats`) :**
| Champ | Type | Requis | Options |
|-------|------|--------|---------|
| Titre | text | Oui | — |
| Gîte | select | Non | Trevoux / Couzon / Les deux |
| Description | textarea | Non | — |

**Formulaire tâche travaux (`form-tache-travaux`) :**
| Champ | Type | Requis | Options |
|-------|------|--------|---------|
| Titre | text | Oui | — |
| Gîte | select | Non | Trevoux / Couzon |
| Priorité | select | Non | Normale / Urgente |
| Description | textarea | Non | — |

**Formulaire retour ménage (`form-retour-menage`) :**
| Champ | Type | Requis | Options |
|-------|------|--------|---------|
| Gîte | select | Oui | — |
| Date | date | Oui | — |
| État à l'arrivée | select | Non | Options état logement |
| Détails état | textarea | Non | — |
| Déroulement ménage | select | Non | Options déroulement |
| Détails déroulement | textarea | Non | — |

**Scripts chargés :**
- `../js/gites-manager.js`
- `../js/utils.js`
- `../js/shared-config.js`
- `../js/femme-menage.js?v=2.2`

---

## Récapitulatif Global

### Index de toutes les pages

| Page | Type | Audience | JS principal |
|------|------|----------|-------------|
| `index.html` | Marketing | Prospects | shared-config.js |
| `commercial.html` | Commercial | Prospects | Inline uniquement |
| `cgu-cgv.html` | Légal | Public | Aucun |
| `legal.html` | Légal | Public | Aucun |
| `privacy.html` | Légal | Public | Aucun |
| `pages/login.html` | Auth | Tous | shared-config.js |
| `pages/logout.html` | Auth | Connectés | shared-config.js |
| `pages/forgot-password.html` | Auth | Connectés | shared-config.js |
| `pages/reset-password.html` | Auth | Connectés | shared-config.js |
| `pages/onboarding.html` | Inscription | Nouveaux | shared-config.js, referral-signup.js |
| `pages/options.html` | Paramètres | Propriétaires | Inline |
| `pages/validation.html` | Métier | Sociétés ménage | menage.js, shared-config.js |
| `app.html` | Shell SPA | Propriétaires | Tous les modules |
| `tabs/tab-dashboard.html` | Onglet | Propriétaires | dashboard.js |
| `tabs/tab-reservations.html` | Onglet | Propriétaires | reservations.js, sync-ical-v2.js |
| `tabs/tab-menage.html` | Onglet | Propriétaires | menage.js, cleaning-rules.js |
| `tabs/tab-draps.html` | Onglet | Propriétaires | draps.js |
| `tabs/tab-fiscalite-v2.html` | Onglet | Propriétaires | fiscalite-v2.js, taux-fiscaux-config.js |
| `tabs/tab-infos-gites.html` | Onglet | Propriétaires | infos-gites.js, infos-gites-photos.js |
| `tabs/tab-checklists.html` | Onglet | Propriétaires | checklists.js |
| `tabs/tab-fiches-clients.html` | Onglet | Propriétaires | fiches-clients.js, fiche-client.js |
| `tabs/tab-kanban.html` | Onglet | Propriétaires | kanban.js |
| `tabs/tab-parrainage.html` | Onglet | Propriétaires | Inline |
| `tabs/tab-prestations.html` | Onglet | Propriétaires | prestations.js |
| `tabs/tab-statistiques.html` | Onglet | Propriétaires | statistiques.js |
| `tabs/tab-gestion.html` | Onglet wrapper | Propriétaires | gites-manager.js |
| `tabs/tab-archives.html` | Onglet | Propriétaires | archives.js |
| `tabs/tab-decouvrir.html` | Onglet | Propriétaires | Inline |
| `tabs/tab-faq.html` | Onglet | Propriétaires | faq.js |
| `tabs/tab-communaute.html` | Onglet | Propriétaires | communaute.js |
| `tabs/tab-dashboard-calou.html` | Variante Calou | Propriétaires | dashboard.js |
| `tabs/tab-menage-calou.html` | Variante Calou | Propriétaires | menage.js |
| `tabs/tab-draps-calou.html` | Variante Calou | Propriétaires | draps.js |
| `pages/admin-channel-manager.html` | Admin | Admin SaaS | shared-config.js |
| `pages/admin-clients.html` | Admin | Admin SaaS | admin-clients.js |
| `pages/admin-communications.html` | Admin | Admin SaaS | admin-communications.js |
| `pages/admin-content.html` | Admin | Admin SaaS | admin-content.js |
| `pages/admin-content-analytics.html` | Admin | Admin SaaS | admin-content-analytics.js |
| `pages/admin-emails.html` | Admin | Admin SaaS | zoho-mail-config.js |
| `pages/admin-finance.html` | Admin | Admin SaaS | admin-finance.js |
| `pages/admin-monitoring.html` | Admin | Admin SaaS | admin-monitoring.js |
| `pages/admin-parrainage.html` | Admin | Admin SaaS | admin-parrainage.js |
| `pages/admin-prestations.html` | Admin | Admin SaaS | CSS uniquement |
| `pages/admin-prestations-stats.html` | Admin | Admin SaaS | admin-prestations-stats.js |
| `pages/admin-promotions.html` | Admin | Admin SaaS | admin-promotions.js |
| `pages/admin-support.html` | Admin | Admin SaaS | admin-support.js |
| `pages/admin-ticket-workflow.html` | Admin | Admin SaaS | ticket-workflow.js |
| `pages/admin-security-audit.html` | Rapport statique | Admin SaaS | Aucun |
| `pages/admin-error-details.html` | Admin | Admin SaaS | shared-config.js |
| `pages/admin-performance-audit.html` | Rapport statique | Admin SaaS | Aucun |
| `pages/admin-scalabilite-roadmap.html` | Rapport statique | Admin SaaS | Aucun |
| `pages/admin-prompt-editor.html` | Admin | Admin SaaS | shared-config.js |
| `pages/fiche-client.html` | Client | Hôtes séjour | fiche-client-app.js |
| `pages/client-support.html` | Client | Propriétaires | client-support.js |
| `pages/femme-menage.html` | Métier | Personnel ménage | femme-menage.js |

---

*Fin partie 3/3 — Pages Admin & Client/Métier (19 pages admin + 3 pages client documentées)*  
*Documentation totale : ~55 pages documentées sur 3 fichiers*
