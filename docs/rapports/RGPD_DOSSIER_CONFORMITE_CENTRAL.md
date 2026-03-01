# Dossier Global RGPD - Conformité Centralisée

**Projet :** Gestion Gîte Calvignac  
**Version :** 1.12.0  
**Date de création :** 21/02/2026  
**Périmètre :** Application web (pages client/owner/admin), APIs serverless, base Supabase, logs support IA  
**Statut :** Dossier central de consolidation (documents existants + preuves techniques rattachées)

---

## 1) Objet du dossier

Ce dossier centralise les éléments RGPD et conformité déjà disponibles dans l'organisation, avec rattachement explicite aux artefacts techniques du projet.

Objectifs :
- rendre l'audit RGPD traçable en un seul emplacement ;
- référencer les preuves techniques existantes ;
- lister les pièces juridiques/organisationnelles à rattacher ;
- préparer les contrôles récurrents sans risque de régression production.

---

## 2) Gouvernance & responsabilités

### 2.1 Rôles (à compléter/valider)
- **Responsable de traitement :** Entité éditrice LiveOwnerUnit / Gestion Gîte Calvignac (raison sociale à confirmer dans les mentions légales)
- **Sous-traitants principaux :** Supabase, Vercel, OpenAI (via API serveur), autres prestataires à inventorier
- **Référent conformité interne :** Référent opérationnel produit (nominal à renseigner dans la version juridique publiée)
- **Contact exercice des droits (DSAR) :** Canal support client existant (`pages/client-support.html`) en attendant adresse RGPD dédiée

### 2.2 Principe de pilotage
- La conformité est pilotée via ce dossier + l'audit admin (`pages/admin-security-audit.html`).
- Les évolutions techniques à impact données personnelles doivent être tracées dans :
  - `docs/ARCHITECTURE.md`
  - `docs/architecture/ERREURS_CRITIQUES.md`

---

## 3) Cartographie des traitements (registre opérationnel)

### 3.1 Données personnelles traitées (synthèse)
- **Réservations** : nom, email, téléphone, dates de séjour, informations de séjour
- **Comptes utilisateurs/admin** : identifiants de connexion, rôles, métadonnées de session
- **Support** : tickets, contenus de messages, journaux techniques liés au support IA
- **Exploitation applicative** : logs erreurs, événements techniques nécessaires à la sécurité/maintenance

### 3.2 Finalités (synthèse)
- exécution du service de gestion de gîtes ;
- support client et résolution d'incidents ;
- sécurité, prévention des abus, traçabilité ;
- obligations légales/comptables (selon pièces juridiques à rattacher).

### 3.3 Base légale (cadre de consolidation)
- **Exécution contractuelle** : gestion des réservations et services associés ;
- **Intérêt légitime** : sécurité, supervision, anti-abus ;
- **Obligation légale** : conservation de certaines données réglementaires ;
- **Consentement** : traitements qui l'exigent explicitement (à documenter selon cas).

> Les formulations juridiques finales (politique de confidentialité, mentions légales, DPA) doivent être rattachées en annexe documentaire.

---

## 4) Mesures techniques et organisationnelles (article 32)

### 4.1 Contrôles techniques déjà en place (preuves)
- Contrôles d'accès admin renforcés (session + allowlist + rôle actif)
- Durcissement CORS API en mode enforcement sur endpoints sensibles
- Réduction des fuites d'erreurs API
- Journalisation et monitoring incidents support IA
- Traçabilité des incidents critiques
- Durcissement RLS confirmé (`FORCE RLS`, policies anon restrictives sur périmètre fiche-client)
- Réduction de la surface XSS admin (suppression handlers inline sur périmètre admin actif + délégation d'événements)

**Références techniques :**
- `pages/admin-security-audit.html`
- `js/admin-dashboard.js`
- `js/admin-support.js`
- `api/support-ai.js`
- `api/ai-health.js`
- `api/openai.js`
- `api/send-email.js`
- `api/cors-proxy.js`
- `js/shared-config.js`
- `docs/ARCHITECTURE.md`
- `docs/architecture/ERREURS_CRITIQUES.md`

### 4.2 Points de vigilance ouverts (déjà identifiés en audit)
- réduction XSS à poursuivre sur écrans historiques hors périmètre admin actif ;
- stockage local de tokens OAuth ;
- CSP à durcir.

---

## 5) Conservation, minimisation, suppression

### 5.1 Politique de conservation (cadre)
- conserver uniquement ce qui est nécessaire aux finalités métier et obligations légales ;
- appliquer des durées de conservation explicites par type de donnée ;
- documenter suppression/anonymisation en fin de durée.

### 5.2 État actuel
- principes de minimisation partiellement appliqués côté sécurité/accès ;
- politique de conservation formelle à consolider dans ce dossier (annexe à compléter).

### 5.3 Action documentaire attendue
- ajouter un tableau de conservation par catégorie :
  - catégorie de données ;
  - finalité ;
  - base légale ;
  - durée ;
  - mode de suppression/anonymisation ;
  - responsable.

**Annexe modèle disponible :** `docs/rapports/RGPD_MATRICE_CONSERVATION_MODELE.md`

---

## 6) Droits des personnes (DSAR)

### 6.1 Droits couverts
- droit d'accès ;
- droit de rectification ;
- droit d'effacement ;
- droit à la limitation ;
- droit d'opposition ;
- droit à la portabilité (selon applicabilité).

### 6.2 Procédure minimale à formaliser
- point de contact unique ;
- vérification d'identité du demandeur ;
- enregistrement de la demande (date, type, statut, échéance) ;
- réponse dans les délais légaux ;
- preuve de traitement conservée.

### 6.3 Trace de conformité
- intégrer un registre DSAR (interne/externe) et le référencer dans ce dossier.

**Annexe modèle disponible :** `docs/rapports/RGPD_REGISTRE_DSAR_MODELE.md`

---

## 7) Sous-traitants, transferts et DPA

### 7.1 Sous-traitants techniques identifiés
- **Supabase** (base, auth, stockage, RLS)
- **Vercel** (hébergement serverless)
- **OpenAI** (fonctionnalités IA via backend)

### 7.2 Pièces à rattacher
- DPA/SCC de chaque sous-traitant ;
- localisation des données et transferts éventuels ;
- mesures contractuelles et techniques associées.

---

## 8) Gestion des violations de données

### 8.1 Processus attendu
- détection + qualification incident ;
- journalisation horodatée ;
- évaluation du risque pour les personnes ;
- notification interne ;
- notification réglementaire si applicable ;
- plan de remédiation et preuve de clôture.

### 8.2 Preuves techniques disponibles
- historique d'incidents dans `docs/architecture/ERREURS_CRITIQUES.md` ;
- monitoring sécurité/support dans l'interface admin.

---

## 9) Inventaire des preuves techniques rattachées

### 9.1 Documentation centrale
- `docs/ARCHITECTURE.md`
- `docs/architecture/ERREURS_CRITIQUES.md`
- `pages/admin-security-audit.html`
- `pages/conformite-rgpd-securite.html`
- `docs/rapports/INVENTAIRE_COMPLET_SITE_LIVEOWNERUNIT_2026-02-19.md`
- `docs/rapports/RGPD_MATRICE_CONSERVATION_MODELE.md`
- `docs/rapports/RGPD_REGISTRE_DSAR_MODELE.md`

### 9.2 Sécurité API / backend
- `api/support-ai.js`
- `api/ai-health.js`
- `api/openai.js`
- `api/send-email.js`
- `api/cors-proxy.js`

### 9.3 Sécurité frontend / admin
- `js/admin-dashboard.js`
- `js/admin-support.js`
- `js/admin-monitoring.js`
- `js/admin-content.js`
- `js/admin-clients.js`
- `js/admin-finance.js`
- `js/admin-promotions.js`
- `js/admin-prestations.js`
- `js/shared-config.js`
- `js/security-utils.js`

### 9.4 SQL / RLS
- `_archives/by_category/sql/sql_cleanup_20260224_clean_rebuild/sql/fix_rls_policy_conflict.sql` (historique)
- `_archives/by_category/sql/sql_cleanup_20260224_clean_rebuild/sql/fix_rls_fiche_client_anon.sql` (historique)
- `_archives/by_category/sql/sql_cleanup_20260224_clean_rebuild/sql/fixes/fix_cleaning_schedule_rls.sql` (historique)
- `_archives/by_category/sql/sql_cleanup_20260224_clean_rebuild/sql/features/parrainage_admin_view_participants_rls.sql` (historique)
- `sql/migrations/CREATE_SUPPORT_AI_USAGE_LOGS.sql`

---

## 10) Pièces juridiques/organisationnelles à raccorder (documents déjà existants à centraliser)

Ajouter ici les chemins internes ou emplacements partagés des documents déjà détenus :

- Politique de confidentialité : **page publiée (version interne provisoire)** dans `privacy.html` ; brouillon source maintenu dans `docs/business/PLAN_COMMERCIALISATION.md` (section 4.1).
- Mentions légales : **page publiée (version interne provisoire)** dans `legal.html` ; brouillon source maintenu dans `docs/business/PLAN_COMMERCIALISATION.md` (section 4.2).
- CGU/CGV : **page publiée (version interne provisoire)** dans `cgu-cgv.html` ; version contractuelle signée à rattacher en annexe documentaire.
- Registre de traitement formel : base documentaire existante dans ce dossier (section 3) + inventaire fonctionnel `docs/rapports/INVENTAIRE_COMPLET_SITE_LIVEOWNERUNIT_2026-02-19.md` ; version registre juridique formel à figer.
- Procédure DSAR : modèle opérationnel présent dans `docs/rapports/RGPD_REGISTRE_DSAR_MODELE.md` + registre en service `docs/rapports/RGPD_REGISTRE_DSAR_OPERATIONNEL_2026-02-24.md`.
- Politique de conservation/suppression : modèle opérationnel présent dans `docs/rapports/RGPD_MATRICE_CONSERVATION_MODELE.md`.
- Procédure de gestion des violations : cadre présent section 8 + traçabilité incidents dans `docs/architecture/ERREURS_CRITIQUES.md` ; procédure juridique de notification à finaliser.
- DPA/SCC sous-traitants : sous-traitants identifiés (Supabase, Vercel, OpenAI) ; suivi opérationnel créé dans `docs/rapports/RGPD_REGISTRE_SOUS_TRAITANTS_DPA_SCC_2026-02-24.md`, pièces contractuelles finales à centraliser en annexe hors repo code.

> Cette section confirme que les documents peuvent déjà exister hors repo ; l'objectif ici est leur rattachement explicite au dossier central.

---

## 11) Plan d’alignement court terme (sans risque production)

1. ✅ Publier les pages juridiques minimales (`privacy.html`, `legal.html`) — réalisé en version interne provisoire le 24/02/2026.
2. Valider juridiquement et remplacer les placeholders (raison sociale, SIRET, adresse, contact RGPD) sur les pages publiées.
3. ✅ Publier une version provisoire CGU/CGV (`cgu-cgv.html`) — réalisé le 24/02/2026.
4. Raccorder les CGU/CGV contractuelles signées dans la section 10.
5. Finaliser juridiquement les durées de la matrice de conservation (annexe dédiée).
6. ✅ Mettre en exploitation un registre DSAR opérationnel — réalisé via `docs/rapports/RGPD_REGISTRE_DSAR_OPERATIONNEL_2026-02-24.md`.
7. ✅ Ouvrir un registre de suivi DPA/SCC fournisseurs — réalisé via `docs/rapports/RGPD_REGISTRE_SOUS_TRAITANTS_DPA_SCC_2026-02-24.md`.
8. Consolider les DPA/SCC contractuels finaux (section 7.2) et maintenir la mise à jour avec audit + architecture.

---

## 12) Traçabilité de ce dossier

- **v1.12.0 (24/02/2026)** : clôture des sujets internes faisables sur les 5 points externes avec création des artefacts opérationnels dédiés (`RGPD_COLLECTE_INFOS_LEGALES_2026-02-24.md`, `RGPD_VALIDATION_JURIDIQUE_TEXTES_2026-02-24.md`, `RGPD_ANNEXES_CONTRACTUELLES_2026-02-24.md`, `RGPD_GOUVERNANCE_NOMINATIVE_2026-02-24.md`, `RGPD_NOTATION_AVANCEMENT_2026-02-24.md`) et mise à jour de la notation d’avancement.
- **v1.11.0 (24/02/2026)** : ajout des livrables de clôture RGPD opérationnelle (`cgu-cgv.html`, registre DSAR opérationnel, registre sous-traitants DPA/SCC, document `RESTE_A_FAIRE_RGPD_2026-02-24.md`) et mise à jour des statuts associés.
- **v1.10.0 (24/02/2026)** : publication des pages juridiques minimales en version interne provisoire (`privacy.html`, `legal.html`) + mise à jour des statuts checklist/preuves associées.
- **v1.9.0 (23/02/2026)** : passage RGPD post-clôture hardening sécurité (RLS/CORS/XSS admin), alignement des mesures article 32 avec l'état consolidé `98/99/86` et maintien des points juridiques externes à rattacher.

- **v1.8.0 (22/02/2026)** : ajout d’une page en ligne de référence RGPD/sécurité (`pages/conformite-rgpd-securite.html`) pour centraliser les éléments à conserver.
- **v1.7.0 (22/02/2026)** : ajout des livrables d’exécution et de preuve (`CHECKLIST_EXECUTION_NON_PROD_15J`, `REGISTRE_PREUVES_AUDIT_EXTERNE`).
- **v1.6.0 (22/02/2026)** : ajout d’un plan d’action non-prod priorisé (15 jours) et KPI de pilotage documentaire.
- **v1.5.0 (22/02/2026)** : ajout d’une synthèse GO/NO GO audit (5 lignes) pour décision rapide, sans modification runtime.
- **v1.4.0 (22/02/2026)** : ajout d’une checklist finale “prête audit” (10 points) orientée conformité documentaire, sans modification runtime.
- **v1.3.0 (22/02/2026)** : préremplissage des sections `A RENSEIGNER` avec références repo réelles et statuts explicites (présent/absent/à finaliser), sans modification runtime.
- **v1.2.0 (22/02/2026)** : ajout d’annexes opérationnelles prêtes à l’emploi (matrice conservation + registre DSAR), sans modification runtime.
- **v1.1.0 (21/02/2026)** : recalcul des notes sécurité/RGPD aligné avec l'audit, ajout de l'inventaire fonctionnel exhaustif dans les preuves de conformité.
- **v1.0.0 (21/02/2026)** : création du dossier global RGPD centralisé et rattachement des preuves techniques existantes.

---

## 13) Checklist finale “Prête Audit” (sans impact production)

> Objectif : vérifier la complétude documentaire avant audit, sans changement applicatif.

1. ✅ Dossier RGPD central présent et versionné.
2. ✅ Preuves techniques rattachées (architecture, audit admin, inventaire fonctionnel).
3. ✅ Matrice de conservation présente (préremplie, validation juridique à finaliser).
4. ✅ Registre DSAR présent (format opérationnel prêt).
5. ✅ Procédure de gestion des violations décrite et traçabilité incidents référencée.
6. ⚠️ Politique de confidentialité publiée en version provisoire (`privacy.html`) ; validation juridique finale et complétude légale à finaliser.
7. ⚠️ Mentions légales publiées en version provisoire (`legal.html`) ; validation juridique finale et complétude légale à finaliser.
8. ⚠️ CGU/CGV publiées en version provisoire (`cgu-cgv.html`) ; version contractuelle signée à raccorder en annexe documentaire.
9. ⚠️ Registre DPA/SCC créé mais pièces contractuelles finales fournisseurs à rattacher (`docs/rapports/RGPD_REGISTRE_SOUS_TRAITANTS_DPA_SCC_2026-02-24.md`).
10. ⚠️ Responsable de traitement nominatif + contact DSAR dédié à figer dans les documents publiés.

### Statut global

- **Couverture documentaire interne :** avancée
- **Prêt audit externe :** conditionnel (après clôture des 5 points ⚠️)

---

## 14) Synthèse GO / NO GO Audit (décision rapide)

- **GO partiel (interne)** : dossier consolidé, annexes opérationnelles en place, preuves techniques rattachées.
- **NO GO externe (à ce stade)** : pages juridiques publiées en version provisoire, mais validation juridique finale encore ouverte.
- **NO GO externe (à compléter)** : CGU/CGV contractuelles et DPA/SCC non encore centralisées en annexe.
- **Condition de passage GO externe** : fermeture des 5 points ⚠️ de la checklist section 13.
- **Décision recommandée** : lancer audit interne documentaire maintenant, audit externe après clôture des pièces juridiques manquantes.

### Notation d’avancement (24/02/2026)

- **Exécution interne (faisable sans validation externe) : 100/100**
- **Clôture juridique externe : 0/100**
- **Avancement global de clôture externe : 50/100**
- Référence de détail : `docs/rapports/RGPD_NOTATION_AVANCEMENT_2026-02-24.md`

---

## 15) Plan d’exécution non-prod (référence opérationnelle)

- Plan priorisé et séquencé : `docs/rapports/PLAN_ACTION_NON_PROD_SECURITE_RGPD_2026-02-22.md`
- Checklist exécutable jour par jour : `docs/rapports/CHECKLIST_EXECUTION_NON_PROD_15J_2026-02-22.md`
- Registre central des preuves audit : `docs/rapports/REGISTRE_PREUVES_AUDIT_EXTERNE_2026-02-22.md`
- Registre DSAR opérationnel : `docs/rapports/RGPD_REGISTRE_DSAR_OPERATIONNEL_2026-02-24.md`
- Registre sous-traitants DPA/SCC : `docs/rapports/RGPD_REGISTRE_SOUS_TRAITANTS_DPA_SCC_2026-02-24.md`
- Suivi de clôture : `docs/rapports/RESTE_A_FAIRE_RGPD_2026-02-24.md`
- Pack preuves OK interne : `docs/rapports/RGPD_PACK_PREUVES_OK_INTERNE_2026-02-24.md`
- Index opérationnel : `docs/rapports/RGPD_INDEX_OPERATIONNEL_2026-02-24.md`
- Fiche collecte légale : `docs/rapports/RGPD_COLLECTE_INFOS_LEGALES_2026-02-24.md`
- Fiche validation juridique : `docs/rapports/RGPD_VALIDATION_JURIDIQUE_TEXTES_2026-02-24.md`
- Fiche annexes contractuelles : `docs/rapports/RGPD_ANNEXES_CONTRACTUELLES_2026-02-24.md`
- Fiche gouvernance nominative : `docs/rapports/RGPD_GOUVERNANCE_NOMINATIVE_2026-02-24.md`
- Notation d’avancement : `docs/rapports/RGPD_NOTATION_AVANCEMENT_2026-02-24.md`
- Pilotage recommandé : revue quotidienne courte + revue hebdomadaire de clôture des ⚠️
- Condition de clôture documentaire : 0 point ⚠️ ouvert + pièces juridiques rattachées
