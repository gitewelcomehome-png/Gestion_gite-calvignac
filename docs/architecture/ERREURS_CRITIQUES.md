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

### [28 Mars 2026] - iCal Homelidays: erreurs 403 sur proxy CORS et fallbacks publics

**Contexte:**
La synchronisation iCal depuis Homelidays remontait des erreurs `403` répétées dans la console, malgré des fallbacks partiellement fonctionnels.

**Erreur:**
- `GET /api/cors-proxy?...homelidays...` retournait `403`
- `GET https://corsproxy.io/?...homelidays...` retournait `403`
- bruit console en production lors des tentatives de fallback

**Cause:**
1. le proxy interne considérait certaines requêtes same-origin sans header `Origin` comme non autorisées
2. `corsproxy.io` est instable/filtré sur Homelidays
3. certaines URLs Homelidays en `http` augmentaient les risques de refus en amont

**Solution:**
✅ Correctifs appliqués:
- assouplissement contrôlé de la validation d'origine dans `api/cors-proxy.js` pour accepter les requêtes sans `Origin` (same-origin)
- normalisation des URLs Homelidays en `https` dans le moteur de sync
- exclusion de `corsproxy.io` pour Homelidays afin d'éviter les 403 récurrents
- maintien du proxy interne en priorité, puis fallbacks restants

**Prévention:**
1. privilégier le proxy interne Vercel sur les flux iCal externes
2. éviter les dépendances non maîtrisées quand un fallback public est connu instable
3. tracer les 403 par plateforme pour ajuster les stratégies de fallback

**Fichiers concernés:**
- `api/cors-proxy.js`
- `js/sync-ical-v2.js`
- `docs/ARCHITECTURE.md`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [27 Mars 2026] - Reste à vivre: omission de l'IR mensuel dans les dépenses

**Contexte:**
Après correctifs fiscaux gîtes/LMNP/IR, le module "Reste à vivre" continuait d'afficher une capacité mensuelle surévaluée.

**Erreur:**
Le total des dépenses mensuelles n'intégrait pas l'IR du foyer, alors qu'il est bien calculé annuellement dans la simulation.

**Cause:**
Le calcul RAV additionnait crédits + frais personnels + charges résidence perso, sans ajouter la charge IR mensualisée.

**Solution:**
✅ Correctif appliqué:
- récupération de la valeur annuelle `ir-montant`
- conversion robuste en nombre puis mensualisation (IR annuel / 12)
- ajout de l'IR mensuel dans `totalDepenses` du RAV

**Prévention:**
1. garder une checklist des flux de trésorerie obligatoires (impôts, crédits, charges fixes)
2. valider le RAV sur cas de contrôle avec et sans IR pour détecter les omissions

**Fichiers concernés:**
- `js/fiscalite-v2.js`
- `docs/ARCHITECTURE.md`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [27 Mars 2026] - Fiscalité gîtes/LMNP: assiette de charges réelle inexacte et déficit LMNP imputé à tort

**Contexte:**
Après mise à jour du document d'audit complet fiscalité, plusieurs points CRITIQUES restaient ouverts sur le moteur gîtes/IR/comparatif.

**Erreur:**
- Calcul BIC réel basé sur mensualités de crédits au lieu des seuls intérêts déductibles
- Charges résidence (prorata pro) et frais véhicule calculés mais non intégrés dans le total réel
- En LMNP < 23k€, URSSAF à 0 sans ajout systématique des PS patrimoine 18,6%
- Revenu reporté vers l'IR permettant la baisse du revenu global via déficit LMNP
- Critère LMP "recettes > autres revenus pro" comparé aux salaires bruts

**Cause:**
1. héritage de logique "trésorerie" injectée dans une assiette fiscale
2. divergence entre affichage détaillé et formule de total réel
3. non-uniformisation des règles LMNP entre calcul principal, comparatif et IR

**Solution:**
✅ Correctifs appliqués:
- ajout d'un calcul dédié des intérêts de crédits déductibles annuels (et suppression des mensualités comme charge fiscale)
- inclusion des charges résidence proratisées + frais véhicule dans le total des charges BIC réel
- application des PS patrimoine 18,6% pour LMNP exonéré URSSAF dans le calcul principal et le comparatif
- neutralisation du déficit LMNP dans le revenu global IR (imputation maintenue pour LMP)
- recalcul des "autres revenus professionnels" sur salaires imposables (abattement 10% appliqué)
- mise à jour de la configuration `TAUX_FISCAUX` 2026 (barème IR + paramètres 2026 complémentaires)

**Prévention:**
1. séparer explicitement logique fiscale et logique trésorerie dans les helpers partagés
2. centraliser les taux réglementaires annuels dans `TAUX_FISCAUX` puis interdire les constantes locales
3. valider les règles LMNP/LMP via cas de tests croisés (comparatif + IR + aperçu temps réel)

**Fichiers concernés:**
- `js/fiscalite-v2.js`
- `js/taux-fiscaux-config.js`
- `docs/ARCHITECTURE.md`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [27 Mars 2026] - Page fiscalité: handlers inline orphelins + toggle frais pro incohérent

**Contexte:**
Audit global de la page fiscalité après évolutions CH et ajustements UI.

**Erreur:**
- Appels inline vers fonctions absentes: `calculerFraisReelsImpots`, `closeFraisReelsModal`, `validerFraisReels`
- Toggle période non appliqué sur frais pro quand la section est transmise en `frais_pro`
- Injection HTML de libellés dynamiques via `innerHTML` dans l'affichage détaillé des charges

**Cause:**
1. reliquat d'une ancienne modal encore branchée dans le HTML
2. divergence de nommage section (`frais_pro` côté HTML vs `frais-pro` côté JS)
3. rendu historique basé sur templates string pour des valeurs dynamiques

**Solution:**
✅ Correctifs appliqués:
- ajout des fonctions de compatibilité modal (`calculerFraisReelsImpots`, `closeFraisReelsModal`, `validerFraisReels`)
- export global `window.*` pour les handlers inline existants
- prise en charge des deux clés de section (`frais_pro` et `frais-pro`) dans `togglePeriodSection`
- remplacement ciblé de `innerHTML` par création DOM sûre pour les lignes de détail charges/amortissements

**Prévention:**
1. valider automatiquement la correspondance handlers inline ↔ fonctions déclarées après chaque refactor
2. imposer un nommage canonique des clés de section UI
3. éviter `innerHTML` pour tout texte issu de données dynamiques

**Fichiers concernés:**
- `js/fiscalite-v2.js`
- `tabs/tab-fiscalite-v2.html`
- `docs/ARCHITECTURE.md`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [27 Mars 2026] - Moteur fiscal CH: base IR micro faussée et seuils réglementaires incomplets

**Contexte:**
Les simulations Chambres d'hôtes (CH) présentaient des écarts de comparaison Micro vs Réel et des alertes réglementaires incomplètes.

**Erreur:**
- base IR micro CH calculée après déduction des cotisations sociales
- seuil SSI CH codé en dur (6 248€) sans variation annuelle
- taux patrimoine CH à 17,2% au lieu de 18,6%
- absence du seuil TVA majoré (41 250€)
- frais de notaire CH traités uniquement en charge immédiate
- absence de contrôle d'éligibilité VL via RFR N-2

**Cause:**
1. logique de calcul micro CH implémentée avec revenu net de cotisations
2. constantes réglementaires figées dans la fonction CH
3. interface CH sans paramètres métier complémentaires (RFR N-2, mode notaire)

**Solution:**
✅ Correctifs appliqués dans le moteur CH:
- IR micro CH calculé sur la base imposable micro (sans déduction cotisations)
- taux patrimoine CH passé à 18,6%
- seuil SSI CH calculé dynamiquement: 13% du PASS annuel
- ajout seuil TVA majoré 41 250€ avec messages différenciés
- ajout mode frais de notaire: déduction immédiate ou amortissement
- ajout champ RFR N-2 et alerte d'éligibilité VL

**Prévention:**
1. centraliser les paramètres fiscaux CH dans une structure configurable annuelle
2. éviter les constantes réglementaires figées dans les fonctions de calcul
3. maintenir une checklist de conformité CH à chaque changement de millésime fiscal

**Fichiers concernés:**
- `js/fiscalite-v2.js`
- `tabs/tab-fiscalite-v2.html`
- `docs/ARCHITECTURE.md`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [1 Mars 2026] - Doublons de phases manifest (progression >100%) en reprise de charge

**Contexte:**
Lors d'une reprise de campagne longue avec plusieurs relances, certaines phases pouvaient être enregistrées plusieurs fois dans `phases_completed`, ce qui faussait la progression (`>100%`) et brouillait la lecture d'exécution.

**Erreur:**
- `progress.done` supérieur au nombre réel de phases
- `%` de progression pouvant dépasser 100%
- manifest contenant des entrées dupliquées `scenario + phase`

**Cause:**
1. ajout systématique dans `phases_completed` sans vérification d'existence
2. calcul de progression basé sur la longueur brute du tableau

**Solution:**
✅ Correctif appliqué dans `scripts/load-test-curl.sh`:
- remplacement du comptage brut par un comptage **unique** (`scenario|phase`) pour `progress.done`
- upsert d'une phase dans `phases_completed` (mise à jour si déjà présente, sinon ajout)

**Prévention:**
1. conserver un identifiant de phase canonique (`scenario + phase`) pour tout état de progression
2. borner les KPI de progression sur des décomptes uniques

**Fichiers concernés:**
- `scripts/load-test-curl.sh`
- `docs/rapports/performance/LOAD_TEST_MANIFEST_2026-03-01T20-30-33Z.json`

---

### [1 Mars 2026] - Campagne de charge interrompue sans reprise fiable (effet tunnel)

**Contexte:**
Une campagne de montée en charge longue (12 phases) s'interrompait en cours de route ; la reprise relançait partiellement des phases, ce qui provoquait des pertes de temps et une perception de blocage.

**Erreur:**
- progression peu lisible pendant l'exécution
- redémarrage perçu "depuis zéro" lors des coupures de session
- exécution parallèle instable via `bash -lc` (bruit d'initialisation environnement)

**Cause:**
1. script initial sans mode reprise explicite par `run_id`
2. absence de compteur d'avancement `%` persistant
3. sous-processus lancés via shell login (`bash -lc`) avec hooks environnement non nécessaires

**Solution:**
✅ Fiabilisation appliquée sur `scripts/load-test-curl.sh`:
- ajout de reprise par `RUN_ID_OVERRIDE`
- skip automatique des phases déjà validées depuis le manifest
- ajout d'un bloc `progress` (done/total/percent) mis à jour à chaque phase
- remplacement `bash -lc` par `sh -c` pour stabiliser l'exécution parallèle

✅ Résultat opérationnel:
- campagne finalisée à **100% (12/12 phases)** avec checkpoints persistés
- génération des artefacts de preuve dans `docs/rapports/performance/`

**Prévention:**
1. lancer les campagnes longues uniquement en mode checkpoint/reprise
2. imposer un indicateur de progression `%` côté manifest pour tout run multi-phases
3. éviter les shells login pour les workers parallèles non interactifs

**Fichiers concernés:**
- `scripts/load-test-curl.sh`
- `docs/rapports/performance/LOAD_TEST_MANIFEST_2026-03-01T18-11-28Z.json`
- `docs/rapports/performance/AUDIT_MONTEE_CHARGE_2026-03-01.md`

---

### [24 Février 2026] - Régression potentielle évitée: scripts legacy orphelins et logs debug verbeux en runtime

**Contexte:**
Un audit qualité a identifié des scripts JS historiques présents dans `js/` mais non référencés par les HTML actifs, ainsi qu'un volume élevé de `console.log` dans des modules chargés en production.

**Erreur:**
- Risque de confusion opérationnelle (fichiers legacy dans le périmètre actif)
- Bruit console excessif rendant le diagnostic d'incidents plus difficile

**Cause:**
1. accumulation de scripts historiques non retirés après migration (`sync-ical-v2` remplaçant `sync-ical`)
2. persistance de logs de debug dans des modules métier actifs

**Solution:**
✅ Nettoyage préventif appliqué:
- archivage des scripts orphelins:
    - `js/calou-icons.js`
    - `js/mobile.js`
    - `js/sync-ical.js`
    vers `_archives/by_category/js/js_cleanup_20260224_orphans_phase2/` (avec `MANIFEST.md`)
- réduction du bruit console dans:
    - `js/kanban.js`
    - `js/infos-gites.js`

**Prévention:**
1. maintenir un scan périodique des références HTML actives vers `js/`
2. archiver (et non supprimer) les modules non référencés en lot versionné
3. interdire les `console.log` de debug non indispensables sur les modules runtime actifs

**Fichiers concernés:**
- `_archives/by_category/js/js_cleanup_20260224_orphans_phase2/MANIFEST.md`
- `js/kanban.js`
- `js/infos-gites.js`
- `docs/ARCHITECTURE.md`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [23 Février 2026] - Récursion infinie RLS sur `user_roles` (42P17) bloquant le chargement des communications client

**Contexte:**
Le dashboard client déclenchait des erreurs 500 lors du chargement de `admin_communications`, avec le message Postgres `infinite recursion detected in policy for relation "user_roles"`.

**Erreur:**
- `GET .../rest/v1/admin_communications ... 500`
- code: `42P17`
- message: `infinite recursion detected in policy for relation "user_roles"`
- effet visible: bruit console répétitif + widget communications non chargé

**Cause:**
Policy RLS `Admins gèrent les rôles` sur `user_roles` écrite avec une sous-requête sur `user_roles` elle-même (`EXISTS (SELECT 1 FROM user_roles ...)`), ce qui crée une boucle d'évaluation de policy.

**Solution:**
✅ Correctif structurel appliqué:
- suppression de la policy auto-référente
- remplacement par un modèle non récursif:
    - `authenticated`: lecture de ses propres rôles (`user_id = auth.uid()`)
    - `service_role`: gestion complète des rôles
- patch source: `_archives/by_category/sql/sql_cleanup_20260224_clean_rebuild/sql/features/create_user_roles.sql` (historique)
- script prod de remédiation immédiate: `sql/securite/FIX_USER_ROLES_RLS_RECURSION_2026-02-23.sql`

✅ Stabilisation runtime front:
- ajout d'un garde dans `js/client-communications.js` pour désactiver temporairement le widget en cas de `42P17` afin d'éviter la boucle de requêtes/erreurs tant que le fix SQL n'est pas exécuté.

**Prévention:**
1. interdire toute policy `user_roles` qui contient une sous-requête directe sur `user_roles`
2. réserver l'écriture `user_roles` à `service_role` ou à une fonction `SECURITY DEFINER` explicitement auditée
3. conserver un post-check SQL sur les policies `user_roles` après chaque migration sécurité

**Fichiers concernés:**
- `_archives/by_category/sql/sql_cleanup_20260224_clean_rebuild/sql/features/create_user_roles.sql` (historique)
- `sql/securite/FIX_USER_ROLES_RLS_RECURSION_2026-02-23.sql`
- `js/client-communications.js`
- `docs/ARCHITECTURE.md`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [23 Février 2026] - Clics non fonctionnels après durcissement sanitization (`onclick` supprimés dans HTML injecté)

**Contexte:**
Après durcissement XSS, plusieurs boutons ne répondaient plus sur des écrans qui injectent du HTML via `SecurityUtils.setInnerHTML(...)`.

**Erreur:**
- boutons visibles mais aucun effet au clic
- régressions dispersées sur modules utilisant du HTML injecté avec handlers inline

**Cause:**
La configuration de sanitization retirait les attributs `on*` dans le flux par défaut de `setInnerHTML`, ce qui supprimait les `onclick` attendus par des composants legacy.

**Solution:**
✅ Correctif de compatibilité appliqué dans `js/security-utils.js` :
- détection des handlers inline dans le HTML injecté
- autorisation ciblée des attributs `onclick/onchange/oninput/...` **uniquement** sur ce chemin de compatibilité
- périmètre réduit: compatibilité inline active uniquement sur une **allowlist explicite** de routes legacy (et blocage sur surfaces admin)
- activation hors allowlist possible seulement par opt-in explicite (`config.allowInlineHandlers === true`)
- maintien du blocage des vecteurs dangereux (`script`, `onerror`, `onload`)

**Prévention:**
1. privilégier `data-action` + délégation d’événements pour tout nouveau composant
2. ne pas réintroduire d’exécution de `<script>` dans `setInnerHTML`
3. conserver ce mode compatibilité uniquement pour les vues legacy tant que la migration complète n’est pas terminée

**Fichiers concernés:**
- `js/security-utils.js`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [23 Février 2026] - Clôture globale : handlers inline résiduels sur périmètre admin actif

**Contexte:**
Après plusieurs lots successifs (`admin-prestations`, `admin-finance`, `admin-communications`, `admin-monitoring`, `admin-channel-manager`, `admin-support`), des reliquats inline subsistaient encore sur d'autres modules admin actifs (pages statiques + rendu dynamique JS).

**Erreur:**
- surface XSS admin encore fragmentée sur différents écrans
- hétérogénéité d'implémentation entre modules migrés et modules restants
- risque de régression de sécurité tant que le pattern inline n'était pas éliminé globalement

**Cause:**
1. héritage historique de templates HTML avec `onclick/onchange/onsubmit` sur plusieurs pages admin
2. rendu dynamique JS avec actions injectées en inline dans certains modules restants

**Solution:**
✅ Clôture complète appliquée:
- migration des modules restants (`admin-content`, `admin-clients`, `admin-emails`, `admin-parrainage`, `admin-promotions`, `admin-ticket-workflow`)
- nettoyage des reliquats complémentaires (`admin-content-analytics`, `admin-error-details`, `admin-prestations-stats`, `admin-prompt-editor`, `admin-dashboard`, `admin-error-monitor`)
- remplacement par `data-action`/`data-nav-url` + délégation d'événements centralisée
- validation finale: scan global des fichiers actifs `admin-*.html/js` sans archives = `0` handlers inline

**Prévention:**
1. interdire toute réintroduction de `on*=` inline sur modules admin actifs
2. imposer la délégation centralisée pour tous les rendus statiques et dynamiques
3. conserver un scan de conformité sécurité avant chaque release admin

**Fichiers concernés:**
- `pages/admin-content.html`
- `js/admin-content.js`
- `js/admin-content-ai-strategy.js`
- `pages/admin-clients.html`
- `js/admin-clients.js`
- `pages/admin-emails.html`
- `pages/admin-parrainage.html`
- `js/admin-parrainage.js`
- `pages/admin-promotions.html`
- `pages/admin-ticket-workflow.html`
- `pages/admin-content-analytics.html`
- `pages/admin-error-details.html`
- `pages/admin-prestations-stats.html`
- `pages/admin-prompt-editor.html`
- `js/admin-dashboard.js`
- `js/admin-error-monitor.js`
- `docs/ARCHITECTURE.md`
- `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [23 Février 2026] - Handlers inline persistants sur modules admin channel manager / support

**Contexte:**
Après migration des modules `admin-prestations`, `admin-finance`, `admin-communications` et `admin-monitoring`, les interfaces actives `pages/admin-channel-manager.html` et `pages/admin-support.html` conservaient des handlers inline statiques (`onclick`) ; le rendu dynamique de `js/admin-support.js` conservait également un reliquat inline.

**Erreur:**
- surface XSS admin résiduelle maintenue sur des écrans opérationnels critiques
- dépendance au binding inline pour navigation/actions alors que la base de durcissement impose la délégation centralisée
- incohérence entre pages migrées et pages support/channel manager

**Cause:**
1. héritage de templates HTML historiques avec `onclick="window.location.href=..."`
2. reliquat de rendu dynamique dans `js/admin-support.js` avec handlers inline non totalement supprimés

**Solution:**
✅ Durcissements appliqués:
- retrait des handlers inline statiques dans `pages/admin-channel-manager.html` et `pages/admin-support.html`
- migration vers `data-nav-url` / `data-action`
- ajout/usage de délégation d'événements centralisée pour les actions de navigation et de support
- suppression du reliquat inline dans `js/admin-support.js` (détail ticket), validation sans erreurs éditeur

**Prévention:**
1. interdire toute réintroduction de `onclick/onchange` sur pages admin actives
2. imposer `data-action`/`data-nav-url` + délégation centralisée pour tout rendu statique/dynamique
3. vérifier systématiquement les fichiers actifs (`pages/`, `js/`) via scan ciblé avant release (hors `_versions`)

**Fichiers concernés:**
- `pages/admin-channel-manager.html`
- `pages/admin-support.html`
- `js/admin-support.js`
- `docs/ARCHITECTURE.md`
- `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`
- `pages/admin-security-audit.html`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [23 Février 2026] - Handlers inline dynamiques persistants dans js/admin-monitoring

**Contexte:**
Après retrait des handlers inline statiques de `pages/admin-monitoring.html`, le rendu dynamique de `js/admin-monitoring.js` conservait encore des `onclick/onchange` injectés dans le HTML (actions erreurs/tickets/logs/modals/tests).

**Erreur:**
- surface XSS admin résiduelle maintenue dans le code JS de rendu
- dépendance à des handlers inline concaténés dans des templates dynamiques
- robustesse incomplète sur la mise à jour de statut ticket (usage implicite de `event` global)

**Cause:**
1. héritage de templates dynamiques historiques construits avec `onclick`/`onchange`
2. absence d'un routeur d'actions unique pour les composants générés à chaud

**Solution:**
✅ Durcissements appliqués:
- retrait des handlers inline dynamiques dans `js/admin-monitoring.js`
- migration vers attributs `data-action`/`data-*` sur boutons/selects générés
- ajout d'une délégation centralisée (`setupMonitoringDynamicDelegation()`)
- sécurisation de `updateTicketStatus(ticketId, newStatus, controlElement)` sans dépendance au `event` global

**Prévention:**
1. interdire toute réintroduction de `onclick/onchange` dans les templates dynamiques admin
2. imposer un dispatch centralisé par `data-action` pour les éléments rendus côté JS
3. vérifier systématiquement les fichiers actifs `js/` + `pages/` avant release (hors archives)

**Fichiers concernés:**
- `js/admin-monitoring.js`
- `docs/ARCHITECTURE.md`
- `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`
- `pages/admin-security-audit.html`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [23 Février 2026] - Handlers inline statiques persistants sur module admin monitoring

**Contexte:**
Après les migrations `admin-prestations`, `admin-finance` et `admin-communications`, la page `admin-monitoring` conservait des handlers inline statiques (`onclick`) sur navigation, actions de pilotage et fermeture de modal.

**Erreur:**
- surface XSS admin résiduelle sur une interface critique de supervision
- dépendance au binding inline au lieu d'une délégation centralisée

**Cause:**
1. héritage de templates statiques avec `onclick` côté HTML
2. absence de délégation unifiée pour les actions de page principales

**Solution:**
✅ Durcissements appliqués:
- retrait des `onclick` inline statiques dans `pages/admin-monitoring.html`
- migration vers attributs `data-nav-url` / `data-action`
- délégation d'événements centralisée dans le script inline de la page

**Prévention:**
1. interdire toute réintroduction de handlers inline sur pages admin critiques
2. imposer `data-action` + délégation d'événements pour les actions de page
3. vérifier systématiquement le périmètre courant avant release via grep ciblé

**Fichiers concernés:**
- `pages/admin-monitoring.html`
- `docs/ARCHITECTURE.md`
- `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`
- `pages/admin-security-audit.html`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [23 Février 2026] - Handlers inline persistants sur module admin communications

**Contexte:**
Après migration des modules `admin-prestations` et `admin-finance`, la page `admin-communications` conservait encore des handlers inline (`onclick`) sur des actions actives (navigation, modes IA, suppression d'items).

**Erreur:**
- surface XSS admin résiduelle inutilement maintenue
- dépendance à l'exécution inline dans une page à fort usage opérationnel

**Cause:**
1. héritage de templates historiques avec `onclick` dans le HTML statique
2. génération dynamique des items avec action de suppression en inline

**Solution:**
✅ Durcissements appliqués:
- retrait des `onclick` inline dans `pages/admin-communications.html`
- migration vers attributs `data-nav-url` / `data-action`
- délégation d'événements centralisée dans le script de page

**Prévention:**
1. interdire toute réintroduction de handlers inline sur pages admin actives
2. imposer `data-action` + délégation d'événements pour le HTML dynamique
3. vérifier systématiquement le périmètre courant avec grep ciblé avant release

**Fichiers concernés:**
- `pages/admin-communications.html`
- `docs/ARCHITECTURE.md`
- `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`
- `pages/admin-security-audit.html`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [23 Février 2026] - Handlers inline persistants sur module admin finance (navigation/export)

**Contexte:**
Après migration du module admin prestations, la page `admin-finance` conservait des `onclick` inline sur la navigation sidebar et l'action d'export CSV.

**Erreur:**
- maintien d'une surface XSS évitable sur une interface admin active
- dépendance au JavaScript inline pour des actions sensibles de navigation/extraction

**Cause:**
1. implémentation historique de la navigation admin via `onclick="window.location.href=..."`
2. action export exposée via `onclick` inline côté template HTML

**Solution:**
✅ Durcissements appliqués:
- retrait des `onclick` inline dans `pages/admin-finance.html`
- migration vers `data-nav-url` / `data-action`
- binding événementiel centralisé dans `js/admin-finance.js`

**Prévention:**
1. interdire tout `onclick` inline sur les pages admin actives
2. imposer les handlers JS centralisés pour navigation et actions sensibles
3. contrôler via grep ciblé `onclick=` avant publication

**Fichiers concernés:**
- `pages/admin-finance.html`
- `js/admin-finance.js`
- `docs/ARCHITECTURE.md`
- `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`
- `pages/admin-security-audit.html`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [23 Février 2026] - Handlers inline persistants sur module admin prestations (surface XSS résiduelle)

**Contexte:**
Malgré les durcissements RLS/CORS, le module `admin-prestations` conservait des handlers inline (`onclick`, `onchange`, `onsubmit`) dans le HTML statique et dans le rendu dynamique JS.

**Erreur:**
- maintien d'une surface XSS évitable sur une interface admin active
- dépendance à l'exécution inline côté navigateur, moins robuste en posture durcie

**Cause:**
1. implémentation historique orientée rapidité (`onclick=...`) sur actions et onglets
2. rendu dynamique des cartes/tableau avec handlers inline concaténés

**Solution:**
✅ Durcissements appliqués:
- retrait des handlers inline dans `pages/admin-prestations.html`
- migration vers attributs `data-action` / `data-tab`
- délégation d'événements centralisée dans `js/admin-prestations.js` (actions, tabs, formulaires)

**Prévention:**
1. interdire toute réintroduction de `onclick/onchange/onsubmit` inline sur pages admin actives
2. imposer la délégation d'événements via JS pour les vues dynamiques
3. valider systématiquement l'absence de régression via grep ciblé sur `onclick=` avant release

**Fichiers concernés:**
- `pages/admin-prestations.html`
- `js/admin-prestations.js`
- `docs/ARCHITECTURE.md`
- `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`
- `pages/admin-security-audit.html`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [23 Février 2026] - Endpoints API en CORS monitor/wildcard + exécution implicite scripts injectés

**Contexte:**
Après clôture du hardening RLS, plusieurs endpoints sensibles restaient en posture CORS monitor (ou wildcard pour `content-ai`) et le mode `trusted` du helper `SecurityUtils.setInnerHTML` pouvait exécuter des scripts injectés.

**Erreur:**
- exposition API potentielle à des origines non autorisées tant que l'enforcement n'était pas la posture par défaut
- surface XSS accrue via exécution implicite de `<script>` injectés en mode `trusted`

**Cause:**
1. paramètres CORS conservateurs orientés compatibilité (`ENFORCE_ALLOWED_ORIGINS=false` par défaut)
2. implémentation historique du mode `trusted` autorisant l'exécution dynamique de scripts

**Solution:**
✅ Durcissements appliqués:
- activation de l'enforcement CORS par défaut sur endpoints sensibles (`api/openai.js`, `api/send-email.js`, `api/cors-proxy.js`)
- remplacement du CORS wildcard de `api/content-ai.js` par allowlist + enforcement configurable
- suppression de l'exécution automatique de scripts injectés dans `js/security-utils.js` (mode `trusted`)

**Prévention:**
1. maintenir les allowlists d'origines via variables d'environnement explicitement documentées
2. refuser toute réintroduction de `Access-Control-Allow-Origin: *` sur endpoints sensibles
3. interdire toute exécution automatique de scripts injectés via helper frontend partagé

**Fichiers concernés:**
- `api/openai.js`
- `api/send-email.js`
- `api/cors-proxy.js`
- `api/content-ai.js`
- `js/security-utils.js`
- `docs/ARCHITECTURE.md`
- `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`
- `pages/admin-security-audit.html`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [23 Février 2026] - Surface d'exposition anon fiche-client trop large (RLS permissif + token persistant)

**Contexte:**
La fiche client publique reposait sur des policies anon trop permissives (`USING(true)` sur plusieurs tables) et un stockage OAuth côté navigateur persistant au-delà de la session.

**Erreur:**
- exposition potentielle inter-clients si policy anon trop large
- persistance locale de tokens sensibles Zoho (`localStorage`)
- sanitization par défaut autorisant des attributs inline de type event handler

**Cause:**
1. anciennes policies de secours créées pour rétablir rapidement l'accès mobile fiche-client
2. stockage token OAuth historiquement orienté persistance utilisateur
3. configuration sanitizer trop permissive pour les attributs HTML

**Solution:**
✅ Durcissements appliqués:
- migration stockage tokens Zoho vers `sessionStorage` avec purge/migration legacy (`js/zoho-mail-config.js`)
- suppression des event handlers inline autorisés par défaut et interdiction explicite des balises actives (`js/security-utils.js`)
- ajout du header `x-client-token` dans le client Supabase fiche-client (`js/fiche-client-app.js`)
- ajout d'un script SQL RLS strict token-scope (owner/réservation) pour remplacement des accès anon permissifs (`sql/security_hardening_rls_fiche_client_token.sql`)

**Prévention:**
1. interdire toute nouvelle policy anon en `USING(true)` sur tables métier client
2. imposer le scope token via header dédié (`x-client-token`) pour les accès publics
3. conserver les tokens OAuth sensibles en session uniquement côté frontend
4. maintenir le sanitizer par défaut sans attributs d'événements inline

**Fichiers concernés:**
- `js/zoho-mail-config.js`
- `js/security-utils.js`
- `js/fiche-client-app.js`
- `sql/security_hardening_rls_fiche_client_token.sql`
- `docs/ARCHITECTURE.md`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [22 Février 2026] - Rafale d'erreurs runtime admin/monitoring (KPI null, Supabase invalide, 404/401 bruit)

**Contexte:**
Plusieurs erreurs JS remontaient en cascade sur les écrans admin (dashboard, monitoring, parrainage, ménage, draps), avec impact lecture KPI et pollution console.

**Erreur:**
- `Cannot set properties of null` sur KPI dashboard
- `supabase.from is not a function` sur parrainage admin
- logs iCal peu exploitables (`[object Object]`)
- erreurs no-row sur `cleaner_tokens` (usage `.single()`)
- bruit récurrent 404 `/api/ai-health` et 401/403 `cm_error_logs`
- conflits 409 potentiels sur upsert `linen_stock_items`

**Cause:**
1. Écritures DOM non protégées sur éléments parfois absents selon écran
2. Variable client Supabase incohérente (`supabase` au lieu de `window.supabaseClient`)
3. Appels `.single()` sur lectures optionnelles
4. Absence de mode dégradé local pour endpoints/tables indisponibles
5. Upsert stock sans clé de conflit explicite complète

**Solution:**
✅ Correctifs appliqués:
- garde d'écriture DOM KPI (`js/dashboard.js`)
- correction client Supabase + `maybeSingle` settings (`js/admin-clients.js`)
- log erreur BDD iCal structuré (message + code) (`js/sync-ical-v2.js`)
- `maybeSingle` sur tokens ménage (`js/menage.js`, `js/femme-menage.js`)
- mode dégradé pour accès refusé `cm_error_logs` et API IA absente (`js/admin-dashboard.js`, `js/admin-monitoring.js`)
- upsert stock draps avec `onConflict: owner_user_id,gite_id,item_key` (`js/draps.js`)
- page de recette/validation créée: `pages/test-fixes.html`

**Prévention:**
1. Toujours protéger les écritures DOM sur blocs optionnels
2. Utiliser `window.supabaseClient` de manière uniforme
3. Réserver `.single()` aux cas strictement garantis, sinon `maybeSingle()`
4. Implémenter un mode dégradé explicite pour 404/401 attendus en environnement partiel
5. Conserver les scripts de recette rapide après chaque lot de fix runtime

**Fichiers concernés:**
- `js/dashboard.js`
- `js/admin-clients.js`
- `js/sync-ical-v2.js`
- `js/menage.js`
- `js/femme-menage.js`
- `js/draps.js`
- `js/admin-dashboard.js`
- `js/admin-monitoring.js`
- `pages/test-fixes.html`
- `docs/ARCHITECTURE.md`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [20 Février 2026] - Ménage conservé au milieu d'une nouvelle réservation (risque opérationnel)

**Contexte:**
Lorsqu'une nouvelle réservation était importée/ajoutée entre deux séjours, un ménage déjà planifié pouvait rester dans la période occupée par cette nouvelle réservation.

**Erreur:**
- Ancienne date de ménage conservée alors qu'elle tombait au milieu d'un séjour
- Pas de suppression automatique de l'ancien ménage
- Pas de proposition explicite des 2 nouvelles dates (avant/après nouvelle réservation)

**Cause:**
Absence de workflow automatique de replanification au moment de la création/mise à jour réservation.

**Solution:**
✅ Ajout d'une résolution automatique via `autoResolveCleaningConflictForReservation()`:
- détection des lignes `cleaning_schedule` en conflit strict (`scheduled_date` dans la nouvelle réservation)
- suppression automatique de l'ancien ménage conflictuel
- création automatique de 2 nouveaux ménages proposés:
    - avant la nouvelle réservation (matin)
    - après la nouvelle réservation (matin)
- enregistrement d'un warning métier dans `notes` (`[AUTO_CLEANING_CONFLICT] ...`)

✅ Affichage warning:
- côté owner: alerte dashboard + bloc d'explication dans l'onglet ménage
- côté société ménage: warning explicatif dans `pages/validation.html` avec anciennes/nouvelles dates

**Prévention:**
1. Exécuter la résolution conflit ménage à chaque création/mise à jour de réservation (manuel + iCal)
2. Conserver une trace explicite en `notes` pour audit et validation humaine
3. Vérifier que l'ancien ménage est supprimé et que les 2 nouvelles dates sont visibles dans les deux interfaces

**Fichiers concernés:**
- `js/supabase-operations.js`
- `js/sync-ical-v2.js`
- `js/menage.js`
- `js/dashboard.js`
- `pages/validation.html`
- `docs/ARCHITECTURE.md`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [20 Février 2026] - Conflits planning ménage non signalés sur le dashboard owner

**Contexte:**
Des ménages pouvaient rester planifiés après la prochaine arrivée d'un même gîte sans alerte visible dans le dashboard.

**Erreur:**
- Absence d'alerte proactive pour conflit de date ménage
- Risque opérationnel: ménage trop tardif par rapport au check-in suivant

**Cause:**
Le bloc d'alertes dashboard couvrait les statuts (`refused`, `pending_validation`) mais pas le contrôle métier de cohérence `scheduled_date > prochaine arrivée`.

**Solution:**
✅ Extension de `updateDashboardAlerts()` dans `js/dashboard.js`:
- chargement des lignes `cleaning_schedule`
- reconstitution des réservations par gîte
- détection des conflits de planning (date ménage strictement après la prochaine arrivée)
- ajout d'une alerte `danger` avec redirection vers l'onglet ménage

**Prévention:**
1. Maintenir les alertes de statut + les alertes de cohérence métier
2. Revalider ce contrôle à chaque évolution des règles de planification ménage

**Fichiers concernés:**
- `js/dashboard.js`
- `docs/ARCHITECTURE.md`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [18 Février 2026] - Alertes critiques monitoring sans ticket client proactif

**Contexte:**
Le monitoring IA support remontait correctement des alertes critiques, mais le client impacté n'était pas systématiquement prévenu automatiquement via un ticket dédié.

**Erreur:**
- Incident visible côté admin, mais pas de ticket client auto
- Détection proactive incomplète côté expérience client
- Risque de délai de communication quand plusieurs incidents surviennent

**Cause:**
1. Les logs IA ne portaient pas suffisamment le contexte client/ticket (`requester_client_id`, etc.)
2. Aucun workflow serveur de création automatique de ticket sur incident critique
3. Clôture manuelle non standardisée pour "corrigé + message client"

**Solution:**
✅ Extension télémétrie IA (`sql/migrations/CREATE_SUPPORT_AI_USAGE_LOGS.sql`)
- Ajout des colonnes de corrélation client/ticket et suivi auto-ticket

✅ Extension `api/support-ai.js`
- Enregistrement du contexte client transmis (`clientContext`) dans les logs serveur
- Signature incident stable pour anti-doublons

✅ Extension `api/ai-health.js`
- Traitement auto-ticket activable via `autoTicket=1`
- Création/liaison ticket client sur incidents critiques détectés
- Pré-analyse incluse dans le ticket pour expliquer ce que le client a pu voir

✅ Extension `js/admin-support.js`
- Action "Corrigé + notifier + clôturer" pour envoyer le message de résolution puis clore

**Prévention:**
1. Toujours tracer l'identité client/ticket dans les logs incidents exploitables
2. Garder l'auto-ticketing activé (`SUPPORT_AI_AUTO_TICKET_ENABLED=true`)
3. Clore uniquement avec message de résolution explicite au client

**Fichiers concernés:**
- `sql/migrations/CREATE_SUPPORT_AI_USAGE_LOGS.sql`
- `api/support-ai.js`
- `api/ai-health.js`
- `js/admin-dashboard.js`
- `js/admin-support.js`
- `docs/ARCHITECTURE.md`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [18 Février 2026] - Réponses copilote N1 trop génériques pour support métier gîtes

**Contexte:**
Le copilote support niveau 1 répondait parfois avec des formulations trop techniques ou non actionnables pour des gestionnaires de gîtes (public non technique).

**Erreur:**
- Réponses perçues comme "blabla" et peu opérationnelles
- Faible réutilisation des meilleures réponses déjà validées par l'équipe support

**Cause:**
1. Prompt copilote insuffisamment contraint sur les actions vérifiables
2. Absence d'apprentissage progressif des réponses type validées

**Solution:**
✅ Renforcement `js/admin-support.js`
- Playbook incident explicite pour cas critiques support IA
- Contraintes anti-réponses vagues dans le prompt serveur

✅ Apprentissage progressif des réponses type
- Enregistrement depuis l'interface admin (bouton "Enregistrer réponse type")
- Sauvegarde prioritaire en BDD `cm_support_solutions` + fallback local sécurisé
- Réutilisation automatique des réponses type dans les suggestions du copilote

**Prévention:**
1. Toujours exiger un format N1 orienté action (prochain pas vérifiable)
2. Capitaliser les réponses support validées pour réduire la variabilité

**Fichiers concernés:**
- `js/admin-support.js`
- `docs/ARCHITECTURE.md`
- `docs/architecture/ERREURS_CRITIQUES.md`

---

### [18 Février 2026] - Absence de monitoring temps réel des incidents/coûts IA support

**Contexte:**
Le support IA était sécurisé côté serveur, mais le dashboard admin ne remontait pas la consommation tokens/coût ni les signaux d'incident (taux d'erreur, latence, indisponibilité).

**Erreur:**
- Pas de visibilité consolidée sur les appels `/api/support-ai`
- Pas d'alerte proactive en cas de dérive (coût, erreurs, panne)
- Risque de détection tardive d'un incident en production

**Cause:**
1. Aucune table dédiée pour la télémétrie support IA
2. Dashboard admin sans widget spécifique monitoring IA support
3. Absence d'endpoint d'agrégation des KPI/alertes

**Solution:**
✅ Ajout de la migration `sql/migrations/CREATE_SUPPORT_AI_USAGE_LOGS.sql`
- Table `cm_support_ai_usage_logs` (tokens, coût estimé, latence, status, erreur)
- Index pour agrégations rapides dashboard

✅ Extension de `api/support-ai.js`
- Persist logs de succès/échec (incluant erreurs amont et rate limit)
- Hash IP côté serveur (pas d'IP brute stockée)

✅ Ajout de l'agrégation métriques dans `api/ai-health.js` (section support)
- KPI 24h/1h + seuils configurables via variables d'environnement
- Alertes critiques/avertissements exploitées par le dashboard

✅ Mise à jour dashboard admin
- Carte "Monitoring IA Support" + états opérationnels
- Injection des alertes IA dans la liste d'alertes existante

**Prévention:**
1. Ne jamais déployer une feature IA sans télémétrie minimale (usage/coût/erreurs)
2. Maintenir des seuils d'alertes configurables en variables d'environnement
3. Vérifier à chaque release dashboard que les alertes critiques remontent bien

**Fichiers concernés:**
- `api/support-ai.js`
- `api/ai-health.js`
- `js/admin-dashboard.js`
- `pages/admin-channel-manager.html`
- `sql/migrations/CREATE_SUPPORT_AI_USAGE_LOGS.sql`
- `docs/ARCHITECTURE.md`

---

### [18 Février 2026] - Exposition potentielle de clé OpenAI dans le frontend support

**Contexte:**
Le module `js/support-ai.js` contenait une constante de clé OpenAI et effectuait un appel direct à `https://api.openai.com/v1/chat/completions`, chargé par `pages/client-support.html`.

**Erreur:**
- Risque d'exposition de secret côté navigateur
- Surface d'attaque accrue (clé récupérable via DevTools/source)
- Architecture non conforme au principe "secret côté serveur uniquement"

**Cause:**
1. Implémentation initiale IA support en mode frontend direct
2. Absence d'endpoint serveur dédié au support IA

**Solution:**
✅ Création d'un endpoint serverless dédié : `api/support-ai.js`
- Appel OpenAI centralisé côté serveur
- Validation des entrées (`prompt` requis)
- Endpoint de santé (`GET`) pour supervision disponibilité

✅ Migration du module client : `js/support-ai.js`
- Suppression de toute clé OpenAI côté frontend
- Remplacement des appels directs OpenAI par `fetch('/api/support-ai')`
- Parsing JSON robuste avec fallback sur contenu encapsulé (code fences)

**Prévention:**
1. ⛔ Ne jamais stocker de secrets API dans le frontend
2. ✅ Imposer un proxy serveur unique pour tous les appels IA
3. ✅ Vérifier avant merge qu'aucune occurrence `sk-` n'existe dans `js/` et `pages/`
4. ✅ Documenter les endpoints IA et variables d'environnement dans `ARCHITECTURE.md`

**Fichiers concernés:**
- `js/support-ai.js`
- `api/support-ai.js`
- `docs/ARCHITECTURE.md`

---

### [18 Février 2026] - Checklist: modification qui créait un nouvel item au lieu d'une mise à jour

**Contexte:**
Dans l'onglet checklists, l'action de modification d'un item pouvait aboutir à une création supplémentaire au lieu d'un update sur l'item ciblé.

**Erreur:**
- En modifiant un item, un nouvel item apparaissait
- Flux perçu comme instable par l'utilisateur

**Cause:**
1. L'état d'édition n'était pas suffisamment fiabilisé entre ouverture/fermeture de la modale et sauvegarde
2. Le routage final sauvegarde pouvait retomber sur le flux création selon l'état courant

**Solution:**
✅ Consolidation du mode édition dans `js/checklists.js` :
- Gestion explicite du mode submit (`create` / `edit`) avec `data-editing-id`
- Sauvegarde qui priorise l'ID d'édition du bouton avant de décider `update` vs `insert`
- Réinitialisation centralisée du formulaire et du mode

✅ Suppression des validations bloquantes navigateur sur checklist :
- Retrait de la confirmation de suppression (`confirm`)
- Remplacement des `alert` par notifications non modales

✅ Ajout fonctionnel :
- Duplication des items checklist d'un gîte vers un autre (même type entrée/sortie), avec filtrage des doublons exacts

✅ Alignement module historique :
- Application du même correctif sur `js/fiches-clients.js` (table `checklists`) avec formulaire inline (création/édition), suppression sans `confirm`, et duplication vers autre gîte

**Prévention:**
- Toujours stocker explicitement l'identifiant d'entité en mode édition dans l'UI
- Éviter les dépendances implicites entre état global et action de sauvegarde
- Préférer des notifications non bloquantes (`showNotification`) aux popups navigateur

**Fichiers concernés:**
- `js/checklists.js`
- `tabs/tab-checklists.html`
- `js/fiches-clients.js`
- `tabs/tab-fiches-clients.html`
- `docs/architecture/ARCHITECTURE.md`

---

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
✅ **Fix SQL idempotent** (`_archives/sql_obsoletes_2026/FIX_TABLES_ID_MANQUANTS_28JAN2026.sql`) :
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
- `_archives/sql_obsoletes_2026/FIX_TABLES_ID_MANQUANTS_28JAN2026.sql` - Script de correction (historique)
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
- `_archives/sql_obsoletes_2026/RESTAURATION_URGENTE_28JAN2026.sql` - Script de restauration (historique)

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