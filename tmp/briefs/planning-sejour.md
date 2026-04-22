# BRIEF COPILOT — Refonte de l'onglet "Activités" en planificateur de séjour

**Page cible :** `pages/fiche-client.html` (portable voyageur, accès via token)
**Onglet impacté :** `tab-activites` (existant) — **on le fait évoluer, on ne crée pas de nouvel onglet**.
**Niveau roadmap :** Niveau 2.5 (intelligence locale + intégration partenaires)
**Objectif business :** transformer l'onglet Activités en planificateur de séjour tout-en-un, avec activités du propriétaire + activités démarchées par un partenaire (Gîtes de France) qui prend sa commission (5 %).
**Priorité :** découper en 5 lots indépendants — chacun livrable et testable séparément.

---

## 0. Stratégie : fusion avec l'onglet existant (pas de nouvel onglet)

L'onglet actuel `tab-activites` affiche déjà une carte Google Maps + la liste des activités du gîte (`activites_gites`). On garde exactement ce qui fonctionne (chargement Supabase, carte, cards, i18n, distance Haversine déjà présente en base) et on l'**enrichit** avec trois nouvelles capacités :

1. Le **catalogue d'activités partenaires** vient s'ajouter à la liste existante, avec un filtre de source (Propriétaire / Partenaire / Tout).
2. Un **sous-mode "Mon planning"** que le client active via un toggle en haut de l'onglet : la vue bascule de "catalogue" à "planning timeline jours + heures".
3. Depuis chaque card d'activité (catalogue), un bouton **"Ajouter à mon séjour"** l'envoie directement dans la timeline, avec calcul distance/temps/heure de départ.

Donc un seul onglet, deux sous-vues : **Catalogue** (défaut) et **Planning**. L'utilisateur passe de l'une à l'autre sans changer de contexte. La card d'une activité reste la même dans les deux vues — même design, même données.

---

## 1. Vision utilisateur

Le voyageur, depuis son téléphone pendant son séjour, ouvre l'onglet Activités. Il voit :

**Vue Catalogue (comportement actuel enrichi) :**
- La carte du gîte avec les activités autour (existant).
- Les filtres par catégorie (existant) + un nouveau filtre source : "Toutes / Proposées par le gîte / Partenaires".
- Les cards d'activités, avec un badge visuel `[Gîte]` ou `[Partenaire - Gîtes de France]`.
- Sur chaque card, un bouton **"+ Ajouter à mon séjour"** (+ "Réserver" si source partenaire).

**Vue Planning (nouvelle, toggle en haut) :**
- À gauche, la **liste verticale des jours de présence** (déduits de `reservation.date_arrivee` → `reservation.date_depart`).
- À droite, une **timeline horaire** (7h → 23h, créneaux 30 min) où les activités sont posées.
- En bas, un **résumé du jour** (total km, temps de trajet cumulé).

Quand le voyageur ajoute une activité à son planning, le système calcule automatiquement :
- La **distance gîte → activité** (et, si enchaînement, activité → activité suivante).
- Le **temps de trajet** selon le mode choisi (voiture, vélo, à pied).
- L'**heure de départ suggérée** pour arriver à l'heure.
- Une **alerte visuelle** (badge rouge + notification navigateur si permission accordée) quand il faut partir dans les 15 prochaines minutes.

Il peut demander une **réservation** sur une activité partenaire. La demande part au prestataire qui la valide (ou auto-validation si créneau libre configuré). Le partenaire Gîtes de France touche sa commission.

---

## 2. Architecture UI — refonte de `tab-activites`

### 2.1 On conserve l'existant

Dans `pages/fiche-client.html`, l'onglet `tab-activites` (ligne ~2798) garde ses éléments actuels :
- `#mapActivites` (carte Google Maps iframe)
- `#filtresActivites` (filtres par catégorie)
- `#listeActivites` (cards)

La fonction existante `loadActivitesForClient()` dans `js/fiche-client-app.js` reste le point d'entrée. On ne la supprime pas, on l'enrichit.

### 2.2 Ce qu'on ajoute en haut de l'onglet

Juste au-dessus de `#mapActivites`, on insère un **bandeau de navigation interne** :

```html
<div class="activites-switcher">
  <button class="sub-tab-btn active" data-view="catalogue">
    <i data-lucide="map"></i> Catalogue
  </button>
  <button class="sub-tab-btn" data-view="planning">
    <i data-lucide="calendar-check"></i> Mon planning
    <span class="planning-count-badge" id="planningCount">0</span>
  </button>
</div>
```

Et un conteneur pour la vue planning (masqué par défaut) :

```html
<div id="vueCatalogue">
  <!-- tout l'existant : map + filtres + liste -->
</div>

<div id="vuePlanning" style="display:none;">
  <div class="planning-layout">
    <aside class="planning-jours"><!-- jours --></aside>
    <section class="planning-timeline">
      <div class="planning-toolbar">
        <select id="modeTransportGlobal">voiture / vélo / à pied</select>
        <button id="btnVoirCatalogue">+ Ajouter depuis le catalogue</button>
      </div>
      <div class="timeline-container"><!-- grille 7h-23h --></div>
      <div class="planning-resume-jour"><!-- km total, temps total --></div>
    </section>
  </div>
</div>
```

Le filtre source ("Toutes / Gîte / Partenaire") s'ajoute dans `#filtresActivites` aux filtres de catégorie existants.

### 2.3 Comportement

**Vue Catalogue :**
- Fonctionnement actuel préservé à 100 %.
- Chaque card d'activité gagne un bouton `+ Ajouter à mon séjour` (ouvre un mini-sélecteur jour + heure) et, si source partenaire, un bouton `Réserver` (flow du lot 5).
- Badge source sur la card : `[Proposée par le gîte]` ou `[Partenaire Gîtes de France]`.
- Si une activité est déjà dans le planning du client : badge `Ajoutée ✓` sur la card, bouton devient `Retirer du séjour`.

**Vue Planning :**
- Click sur un jour → filtre la timeline sur ce jour.
- Bouton "+ Ajouter depuis le catalogue" → bascule sur la vue Catalogue (sous-tab).
- Possibilité de saisir une **activité libre** (pas dans le catalogue) directement dans la timeline via clic sur un créneau vide → modal titre + adresse + heure.
- Drag & drop d'un bloc posé pour changer d'heure (desktop) ou tap pour éditer (mobile).
- Chaque bloc activité posé affiche : titre, icône catégorie, heure début/fin, distance, mode transport, temps trajet, **heure de départ calculée**, bouton "×" pour retirer.
- Résumé kilométrique du jour sous la timeline (total km, temps cumulé, CO₂ estimé en option).

**Responsive :**
- Desktop : layout planning en deux colonnes (30 % jours / 70 % timeline).
- Mobile (< 768 px) : colonne jours devient un scroll horizontal collant en haut, timeline pleine largeur.

### 2.4 Internationalisation

Traductions à ajouter dans `translations` (FR/EN) de `js/fiche-client-app.js`, préfixées `planning_*` :
- `planning_vue_catalogue`, `planning_vue_planning`
- `planning_ajouter_au_sejour`, `planning_retirer_du_sejour`, `planning_deja_ajoutee`
- `planning_source_gite`, `planning_source_partenaire`
- `planning_jours_presence`, `planning_aucune_activite_jour`
- `planning_depart_a`, `planning_distance_km`, `planning_duree_trajet`
- `planning_mode_voiture`, `planning_mode_velo`, `planning_mode_pied`
- `planning_resume_total_km`, `planning_resume_temps_total`
- `planning_activite_libre`, `planning_titre`, `planning_adresse`
- `planning_alerte_depart_15min`, `planning_alerte_depart_5min`

---

## 3. Modèle de données

### 3.1 Tables nouvelles à créer en migration Supabase

**`partenaires_activites`** — les organismes externes (Gîtes de France, etc.)

```sql
CREATE TABLE partenaires_activites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  type text CHECK (type IN ('organisme', 'commercant_direct')),
  contact_email text,
  contact_telephone text,
  commission_pct_defaut numeric(5,2) DEFAULT 5.00,
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

**`activites_partenaires`** — catalogue d'activités proposées

```sql
CREATE TABLE activites_partenaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partenaire_id uuid REFERENCES partenaires_activites(id),
  nom text NOT NULL,
  categorie text,                 -- restaurant, cave, visite, loisir, culturel, nature
  description text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  adresse text,
  code_postal text,
  ville text,
  telephone text,
  email text,
  site_web text,
  prix_unitaire numeric(10,2),     -- prix par personne ou forfait
  unite_prix text,                 -- 'personne', 'forfait', 'heure'
  duree_estimee_min integer,       -- durée prévue de l'activité en minutes
  capacite_max integer,
  jours_ouverture jsonb,           -- {"lun":true,"mar":false,...}
  horaires_ouverture jsonb,        -- [{"debut":"09:00","fin":"12:00"},...]
  photos text[],
  commission_pct numeric(5,2),     -- override du défaut partenaire
  zone_rayon_km integer DEFAULT 30,-- pertinent pour quels gîtes
  validation_mode text CHECK (validation_mode IN ('auto','manuelle')) DEFAULT 'manuelle',
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

**`planning_sejour`** — le planning du client pour sa résa

```sql
CREATE TABLE planning_sejour (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  token_fiche_client text,          -- double clé de sécurité comme les autres tables fiche-client
  jour date NOT NULL,
  heure_debut time NOT NULL,
  heure_fin time,
  source text CHECK (source IN ('gite','partenaire','libre')) NOT NULL,
  activite_gite_id uuid REFERENCES activites_gites(id),
  activite_partenaire_id uuid REFERENCES activites_partenaires(id),
  titre_libre text,                 -- si source='libre'
  notes text,
  mode_transport text CHECK (mode_transport IN ('voiture','velo','pied')) DEFAULT 'voiture',
  distance_km numeric(6,2),
  duree_trajet_min integer,
  heure_depart_suggeree time,
  latitude_dest numeric(9,6),
  longitude_dest numeric(9,6),
  statut text CHECK (statut IN ('planifie','reserve','confirme','termine','annule')) DEFAULT 'planifie',
  reservation_activite_id uuid,     -- FK vers reservations_activites si source='partenaire'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**`reservations_activites`** — demandes de résa client → partenaire

```sql
CREATE TABLE reservations_activites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservations(id),
  token_fiche_client text,
  activite_partenaire_id uuid REFERENCES activites_partenaires(id),
  date_prevue date NOT NULL,
  heure_prevue time NOT NULL,
  nb_personnes integer DEFAULT 2,
  prix_brut numeric(10,2),
  commission_pct numeric(5,2),
  commission_montant numeric(10,2),
  prix_net_partenaire numeric(10,2),
  statut text CHECK (statut IN ('en_attente','confirmee','refusee','annulee')) DEFAULT 'en_attente',
  motif_refus text,
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz
);
```

### 3.2 RLS — règles obligatoires

Aligner sur le modèle existant des tables fiche-client (voir `sql/security_hardening_rls_fiche_client_token.sql`) :

- Le client (anon) accède en lecture/écriture à ses lignes `planning_sejour` et `reservations_activites` **uniquement** via `token_fiche_client` valide (fonction `is_valid_fiche_client_token(token)` déjà existante).
- Le propriétaire voit les planning/résas de ses propres `reservations` (via `owner_id`).
- Les partenaires auront à terme leur propre interface — pour ce lot, pas de session partenaire, on mock avec une page admin.
- `activites_partenaires` et `partenaires_activites` sont en lecture publique (anon) mais filtrées côté appli par proximité géo.

### 3.3 Index

```sql
CREATE INDEX idx_planning_reservation ON planning_sejour(reservation_id);
CREATE INDEX idx_planning_jour ON planning_sejour(reservation_id, jour, heure_debut);
CREATE INDEX idx_activites_part_geo ON activites_partenaires USING GIST(
  ll_to_earth(latitude, longitude)
);  -- requiert extension earthdistance + cube
```

---

## 4. Logique métier : calcul distance et temps de trajet

### 4.1 Approche recommandée

**Phase 1 — formule approximative** (aucune API externe, zéro coût)

Calcul distance à vol d'oiseau (Haversine) + multiplication par facteur de sinuosité + vitesse moyenne par mode :

```javascript
const VITESSES = { voiture: 50, velo: 15, pied: 4.5 };  // km/h
const FACTEUR_SINUOSITE = { voiture: 1.3, velo: 1.2, pied: 1.15 };

function distanceHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function estimerTrajet(distanceVol, mode) {
  const distRoute = distanceVol * FACTEUR_SINUOSITE[mode];
  const dureeMin = (distRoute / VITESSES[mode]) * 60;
  return { distance_km: distRoute, duree_min: Math.round(dureeMin) };
}
```

**Phase 2 — API routière réelle** (quand la feature est adoptée)

Utiliser **OpenRouteService** (gratuit 2 000 requêtes/jour, routage voiture + vélo + pied) via une Vercel Edge Function `/api/route-estimate` qui prend `{from, to, mode}` et retourne `{distance_km, duree_min, polyline}`.

Clé API en variable d'env `ORS_API_KEY` (jamais dans le code client).

Cache côté client : un objet `Map<"lat1,lon1|lat2,lon2|mode", résultat>` en mémoire + `sessionStorage` pour éviter les recalculs.

### 4.2 Calcul de l'heure de départ

```javascript
heure_depart_suggeree = heure_debut_activite - duree_trajet - marge_securite(10 min)
```

Marge paramétrable (défaut 10 min, 15 min en ville, 5 min à pied).

### 4.3 Enchaînement activités

Si une activité A se termine à 12:00 et activité B commence à 14:00 dans la même journée :
- Point de départ de B = coordonnées de A (pas du gîte).
- Recalcul automatique quand on déplace A ou B.

---

## 5. Système d'alertes "il faut partir"

### 5.1 Côté fiche-client (page ouverte)

Un `setInterval` toutes les 60 secondes qui parcourt le planning du jour et compare `heure_depart_suggeree` à `Date.now()`.

Seuils :
- T-30 min : notification silencieuse (badge cloche sur l'onglet).
- T-15 min : bannière top de page + vibration mobile (`navigator.vibrate([200,100,200])`).
- T-5 min : notification navigateur (si `Notification.permission === 'granted'`) + son court.
- T+5 min si l'activité n'est pas marquée "en cours" : alerte "Vous êtes peut-être en retard".

### 5.2 Demande de permission

Au premier ajout d'activité, modal pédagogique : "Activer les rappels ? Vous recevrez une alerte 15 min avant chaque départ." → `Notification.requestPermission()`.

### 5.3 Service Worker

Le projet a déjà `config/sw-fiche-client.js`. Pas de push backend pour cette V1 — les alertes sont locales (page ouverte ou PWA en arrière-plan proche).

Une V2 plus tard : Vercel Edge Function + Web Push API avec VAPID keys pour des notifications même app fermée.

---

## 6. Flow de réservation activité partenaire

```
1. Client clique "Réserver" sur activité partenaire dans le modal catalogue
2. Choix date + heure + nb personnes dans un sous-modal
3. INSERT reservations_activites (statut='en_attente')
4. INSERT planning_sejour (source='partenaire', statut='reserve')
5. Email auto au partenaire (via Edge Function existante ou nouvelle /api/notify-partenaire)
6. Partenaire se connecte → valide / refuse
   → statut passe à 'confirmee' ou 'refusee'
   → email au client
7. Si validation_mode='auto' et créneau dans horaires_ouverture :
   → statut direct 'confirmee', pas d'attente
```

Pour la V1 : pas de paiement en ligne. Le client paie sur place, le partenaire déclare la transaction dans son portail (qui reste à construire en lot 5). La commission de 5 % est facturée mensuellement à Gîtes de France sur base du rapport des réservations `confirmee`.

---

## 7. Découpage en 5 lots livrables

### LOT 1 — Fondations base de données (1 commit)
- Migration SQL créant les 4 tables + RLS + index.
- Seed d'un partenaire "Gîtes de France" + 10 activités d'exemple autour du gîte Le Levade.
- Fichier : `sql/migrations/create_planning_sejour_tables.sql`.
- Commit : `feat(db): tables planning sejour et activites partenaires`.

### LOT 2 — Refonte UI de `tab-activites` (1 commit)
- Dans `pages/fiche-client.html` : ajouter le bandeau switcher Catalogue/Planning dans l'onglet `tab-activites` existant.
- Envelopper le contenu actuel dans `#vueCatalogue` (sans rien casser).
- Créer `#vuePlanning` avec la coquille : colonne jours (générée depuis `reservation.date_arrivee`/`date_depart`), timeline horaire 7h-23h par 30 min, toolbar, résumé.
- Ajouter les badges source et boutons "Ajouter à mon séjour" sur les cards existantes (HTML + CSS).
- Ajouter le filtre source dans `#filtresActivites` (Toutes / Gîte / Partenaire).
- Pas de logique métier encore, juste la coquille responsive et la bascule visuelle entre sous-vues.
- CSS dans le `<style>` de la page (pattern existant).
- Commit : `feat(fiche-client): tab-activites - bascule Catalogue/Planning + badges source`.

### LOT 3 — Logique planning + calcul trajet local (1 commit)
- Fichier nouveau `js/fiche-client-planning.js`, chargé depuis `fiche-client.html` après `fiche-client-app.js`.
- Hook dans `loadActivitesForClient()` : après chargement des activités du gîte, charger aussi `activites_partenaires` (filtrées par proximité GPS du gîte) et les fusionner dans la liste affichée, chacune tagguée par source.
- Fonctions nouvelles : `chargerPlanning()`, `ajouterActiviteAuPlanning()`, `supprimerDuPlanning()`, `calculerTrajet()` (Haversine), `afficherPlanning()`, `calculerHeureDepart()`, `bascullerVue(view)`.
- Enregistrement en base (Supabase) avec RLS via token.
- Drag & drop activité sur créneau (desktop) + tap mobile.
- Résumé kilométrique du jour sous la timeline.
- Mise à jour du badge `planningCount` en temps réel.
- Commit : `feat(planning): logique planning + activites partenaires + trajets Haversine`.

### LOT 4 — Alertes et notifications (1 commit)
- Fonctions `verifierAlertes()` appelées toutes les 60 s.
- Bannière top + badge + Notification API + vibration.
- Modal pédagogique de demande de permission au 1er ajout.
- Commit : `feat(planning): alertes depart anticipe`.

### LOT 5 — Réservation partenaire + commission (1-2 commits)
- Flow de réservation (sous-modal date/heure/pax).
- Insert `reservations_activites` avec calcul commission.
- Edge Function `/api/notify-partenaire` (email via Resend ou équivalent déjà en place).
- Page admin `pages/admin-partenaires.html` pour lister les partenaires + valider/refuser les demandes (simple, pour démarrer — le vrai portail partenaire vient plus tard).
- Vue rapport commissions pour export mensuel.
- Commit 5a : `feat(planning): reservation activites partenaires`.
- Commit 5b : `feat(admin): portail partenaires v1`.

---

## 8. Points d'attention techniques

- **Ne rien casser dans l'onglet "Activités" existant** : la fonction `loadActivitesForClient()`, la carte, les filtres catégorie, le chargement `activites_gites` restent actifs. On ajoute par-dessus, on ne remplace pas.
- **Respecter l'architecture vanilla JS** : pas de framework, pas de lib drag&drop lourde. Pour le DnD, l'API HTML5 native (`draggable`, `dragstart`, `drop`) suffit. Sur mobile, utiliser `touchstart`/`touchmove` ou bibliothèque légère `interact.js` (6 KB gzippé) si vraiment besoin — mais essayer sans d'abord.
- **Fuseau horaire** : tous les calculs heure en Europe/Paris, stockage des `time` sans timezone (c'est le standard Postgres `time without time zone`). Attention au piège UTC déjà rencontré sur les tarifs (FIX-007).
- **Internationalisation** : toutes les chaînes passent par `t()` avec clés FR/EN dans `translations`.
- **Performance** : la liste d'activités partenaires peut grossir — filtrer côté SQL par distance au gîte (`earthdistance` extension) pour ne renvoyer que le pertinent.
- **Sécurité RLS** : copier exactement le pattern des tables `fiches_clients_retours_demandes` ou équivalent qui utilisent déjà le token.
- **Mobile-first** : tester en priorité sur iPhone SE (375 px), car la cible est le voyageur sur téléphone.

---

## 9. Ce que Claude attend de Copilot

À chaque lot :
1. Lire le brief, questions si flou.
2. Implémenter **uniquement le lot en cours**, pas les suivants.
3. Commit avec le message indiqué.
4. Mettre à jour la doc : `docs/DOCUMENTATION_PAGES_3_ADMIN_CLIENT.md` (section fiche-client) + `docs/ARCHITECTURE.md` (tables + flows) + diagramme UML si pertinent.
5. Déployer sur `preprod`, laisser passer le Vercel preview, signaler l'URL.
6. Tests manuels minimum : création planning, calcul trajet, alerte (simulation en décalant l'heure), réservation partenaire → validation admin.

---

## 10. Questions ouvertes à trancher avec Stéphane avant LOT 5

1. **Le partenaire (Gîtes de France) a-t-il déjà confirmé** le partenariat et le 5 % ? Si non, le lot 5 peut être préparé mais pas activé en prod.
2. **Paiement en ligne** dans la V2 : Stripe Connect pour split automatique commission / partenaire ? Ou on reste sur paiement sur place pour éviter la complexité réglementaire PSD2 ?
3. **Couverture géographique** : Gîtes de France démarche autour de chaque gîte individuellement ou par zone (département) ?
4. **Modération** des activités partenaires : qui approuve avant mise en ligne publique ?
5. **Compte partenaire** : à terme, auth Supabase dédiée (role `partenaire`) avec son propre dashboard ? À prévoir en lot 6.
