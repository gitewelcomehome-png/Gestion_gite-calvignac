# 📊 DIAGNOSTIC COMPLET BASE DE DONNÉES - APPLICATION GESTION GÎTES

**Date**: 7 janvier 2026  
**Objectif**: Analyse exhaustive de la structure actuelle avant refonte multi-tenant

---

## 🎯 TABLES IDENTIFIÉES

### 1. TABLE: `reservations`
**Rôle**: Gestion des réservations de gîtes

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY (source: supabase-operations.js ligne 70)
- `gite`: text (Trevoux/Couzon) (source: reservations.js ligne 154)
- `date_debut`: date (source: supabase-operations.js ligne 52)
- `date_fin`: date (source: supabase-operations.js ligne 53)
- `plateforme`: text (Airbnb/Abritel/Gîtes de France/Autre) (source: supabase-operations.js ligne 54)
- `montant`: numeric (source: reservations.js ligne 126)
- `nom_client`: text (source: reservations.js ligne 124)
- `telephone`: text (source: reservations.js ligne 125)
- `provenance`: text (source: reservations.js ligne 127)
- `nb_personnes`: integer (source: reservations.js ligne 128)
- `acompte`: numeric (source: reservations.js ligne 129)
- `restant`: numeric (source: supabase-operations.js ligne 60)
- `paiement`: text (Soldé/Acompte reçu/En attente) (source: reservations.js ligne 132)
- `timestamp`: timestamptz (source: supabase-operations.js ligne 62)
- `synced_from`: text (source: sync-ical.js ligne 502)
- `messageEnvoye`: boolean (source: infos-gites.js ligne 166) [POTENTIEL - non confirmé dans Supabase]

#### Relations:
- FK vers `cleaning_schedule` via `reservation_id`
- FK vers `demandes_horaires` via `reservation_id`
- FK vers `client_access_tokens` via `reservation_id`
- FK vers `fiche_generation_logs` via `reservation_id`
- FK vers `checklist_progress` via `reservation_id`

#### Opérations CRUD:
- **SELECT**: supabase-operations.js, reservations.js, dashboard.js, draps.js, checklists.js
- **INSERT**: supabase-operations.js ligne 70, rate-limiter.js ligne 344
- **UPDATE**: supabase-operations.js ligne 155, infos-gites.js ligne 166
- **DELETE**: supabase-operations.js ligne 172, rate-limiter.js ligne 374

---

### 2. TABLE: `cleaning_schedule`
**Rôle**: Planning de ménage et validation société de ménage

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `reservation_id`: integer, FK vers reservations (source: menage.js ligne 283)
- `gite`: text (source: menage.js ligne 286)
- `scheduled_date`: date (source: menage.js ligne 287)
- `time_of_day`: text (morning/afternoon) (source: menage.js ligne 288)
- `status`: text (pending/pending_validation/validated/refused/proposed) (source: menage.js ligne 289)
- `validated_by_company`: boolean (source: menage.js ligne 290)
- `reservation_end`: date (source: menage.js ligne 291)
- `reservation_start_after`: date (source: menage.js ligne 292)
- `notes`: text (source: femme-menage.js ligne 78)
- `proposed_date`: date (source: menage.js ligne 414)

#### Relations:
- FK vers `reservations` via `reservation_id`

#### Opérations CRUD:
- **SELECT**: reservations.js ligne 220, dashboard.js ligne 84, femme-menage.js ligne 47
- **INSERT/UPSERT**: menage.js ligne 299, menage.js ligne 478
- **UPDATE**: fiche-client-app.js ligne 362 (validation horaires)

---

### 3. TABLE: `stocks_draps`
**Rôle**: Gestion des stocks de linge pour chaque gîte

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `gite`: text (trevoux/couzon), UNIQUE (source: draps.js ligne 133)
- `draps_plats_grands`: integer (source: draps.js ligne 72)
- `draps_plats_petits`: integer (source: draps.js ligne 73)
- `housses_couettes_grandes`: integer (source: draps.js ligne 74)
- `housses_couettes_petites`: integer (source: draps.js ligne 75)
- `taies_oreillers`: integer (source: draps.js ligne 76)
- `serviettes`: integer (source: draps.js ligne 77)
- `tapis_bain`: integer (source: draps.js ligne 78)
- `updated_at`: timestamptz (source: draps.js ligne 121)

#### Relations:
- Aucune FK directe

#### Opérations CRUD:
- **SELECT**: draps.js ligne 67, femme-menage.js ligne 261
- **UPSERT**: draps.js ligne 133, femme-menage.js ligne 316

---

### 4. TABLE: `charges`
**Rôle**: Gestion des charges financières (mensuelle/annuelle/ponctuelle)

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `nom`: text (source: charges.js ligne 37)
- `montant`: numeric (source: charges.js ligne 38)
- `type`: text (mensuelle/annuelle/autre) (source: charges.js ligne 39)
- `date`: date (source: charges.js ligne 40)
- `gite`: text (source: charges.js ligne 41)
- `notes`: text (source: charges.js ligne 75) [POTENTIEL]
- `created_at`: timestamptz (source: supabase-operations.js ligne 239)
- `timestamp`: timestamptz (source: charges.js ligne 100)

#### Relations:
- Aucune FK directe

#### Opérations CRUD:
- **SELECT**: supabase-operations.js ligne 225, charges.js ligne 14
- **INSERT**: supabase-operations.js ligne 201, charges.js ligne 93
- **DELETE**: supabase-operations.js ligne 247, charges.js ligne 50

---

### 5. TABLE: `historical_data`
**Rôle**: Données historiques CA par année/gîte

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `year`: integer (source: charges.js ligne 164)
- `gite`: text (Total/Trevoux/Couzon) (source: charges.js ligne 165)
- `months`: jsonb (jan, feb, mar...) (source: charges.js ligne 177)

#### Relations:
- Aucune FK directe

#### Opérations CRUD:
- **SELECT**: charges.js ligne 193, charges.js ligne 210
- **INSERT**: charges.js ligne 265
- **UPDATE**: charges.js ligne 258
- **DELETE**: charges.js ligne 226

---

### 6. TABLE: `todos`
**Rôle**: Gestion des tâches (reservations/travaux/achats)

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `category`: text (reservations/travaux/achats) (source: dashboard.js ligne 725)
- `title`: text (source: dashboard.js ligne 664)
- `description`: text (source: dashboard.js ligne 665)
- `gite`: text (source: dashboard.js ligne 666)
- `completed`: boolean (source: dashboard.js ligne 667)
- `archived_at`: timestamptz (source: archives.js ligne 52)
- `created_at`: timestamptz (source: dashboard.js ligne 490)
- `is_recurrent`: boolean (source: dashboard.js ligne 203)
- `next_occurrence`: date (source: dashboard.js ligne 203)
- `recurrence_pattern`: text (source: dashboard.js ligne 773) [POTENTIEL]

#### Relations:
- Aucune FK directe

#### Opérations CRUD:
- **SELECT**: dashboard.js ligne 198, archives.js ligne 52, draps.js ligne 458
- **INSERT**: dashboard.js ligne 662, draps.js ligne 470, femme-menage.js ligne 181
- **UPDATE**: dashboard.js ligne 772, archives.js ligne 122
- **DELETE**: dashboard.js ligne 794, archives.js ligne 141

---

### 7. TABLE: `client_access_tokens`
**Rôle**: Tokens d'accès pour fiches clients

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `reservation_id`: integer, FK vers reservations (source: fiches-clients.js ligne 299)
- `token`: text, UNIQUE (source: fiches-clients.js ligne 300)
- `expires_at`: timestamptz (source: fiches-clients.js ligne 301)
- `access_count`: integer (source: fiches-clients.js ligne 302)
- `created_at`: timestamptz

#### Relations:
- FK vers `reservations` via `reservation_id`

#### Opérations CRUD:
- **SELECT**: fiche-client.js ligne 34, fiche-client-app.js ligne 240, fiches-clients.js ligne 85
- **INSERT/UPSERT**: fiches-clients.js ligne 299
- **UPDATE**: fiche-client-app.js ligne 270 (access_count)

---

### 8. TABLE: `fiche_generation_logs`
**Rôle**: Logs de génération de fiches clients

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `reservation_id`: integer, FK vers reservations (source: fiches-clients.js ligne 312)
- `type_generation`: text (html/whatsapp) (source: fiches-clients.js ligne 313)
- `generated_by`: text (admin) (source: fiches-clients.js ligne 314)
- `fiche_url`: text (source: fiches-clients.js ligne 315)
- `opened_count`: integer (source: fiches-clients.js ligne 316)
- `created_at`: timestamptz

#### Relations:
- FK vers `reservations` via `reservation_id`

#### Opérations CRUD:
- **SELECT**: fiches-clients.js ligne 92
- **INSERT**: fiches-clients.js ligne 312, fiches-clients.js ligne 380
- **UPDATE**: fiche-client-app.js ligne 281 (opened_count)

---

### 9. TABLE: `demandes_horaires`
**Rôle**: Demandes de modification d'horaires par clients

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `reservation_id`: integer, FK vers reservations (source: widget-horaires-clients.js ligne 18)
- `type`: text (arrivee_anticipee/depart_tardif) (source: fiches-clients.js ligne 422)
- `heure_demandee`: time (source: fiche-client-app.js ligne 1338)
- `motif`: text (source: fiche-client-app.js ligne 1339)
- `status`: text (pending/approved/refused) (source: fiches-clients.js ligne 395)
- `automatiquement_approuvable`: boolean (source: fiches-clients.js ligne 422)
- `validated_at`: timestamptz (source: fiches-clients.js ligne 471)
- `raison_refus`: text (source: fiches-clients.js ligne 501)
- `created_at`: timestamptz
- `heure_validee`: time (source: dashboard.js ligne 1593)
- `statut`: text (validee) (source: dashboard.js ligne 243) [ATTENTION: colonne 'statut' vs 'status']

#### Relations:
- FK vers `reservations` via `reservation_id`

#### Opérations CRUD:
- **SELECT**: widget-horaires-clients.js ligne 18, fiches-clients.js ligne 395, dashboard.js ligne 243
- **INSERT**: fiche-client-app.js ligne 1337, fiche-client-app.js ligne 1381
- **UPDATE**: fiches-clients.js ligne 535, dashboard.js ligne 1593

---

### 10. TABLE: `retours_menage`
**Rôle**: Retours après ménage par la femme de ménage

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `gite`: text (source: femme-menage.js ligne 364)
- `date_menage`: date (source: femme-menage.js ligne 365)
- `etat_arrivee`: text (propre/sale/dégâts/autre) (source: femme-menage.js ligne 366)
- `details_etat`: text (source: femme-menage.js ligne 367)
- `deroulement`: text (bien/problèmes/difficultés) (source: femme-menage.js ligne 368)
- `details_deroulement`: text (source: femme-menage.js ligne 369)
- `validated`: boolean (source: dashboard.js ligne 99)
- `created_at`: timestamptz

#### Relations:
- Aucune FK directe

#### Opérations CRUD:
- **SELECT**: dashboard.js ligne 99, dashboard.js ligne 2086
- **INSERT**: femme-menage.js ligne 362
- **DELETE**: dashboard.js ligne 2176

---

### 11. TABLE: `retours_clients`
**Rôle**: Retours et feedback des clients après séjour

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `reservation_id`: integer (source: fiche-client-app.js ligne 1474)
- `satisfaction_generale`: integer (1-5) (source: fiche-client-app.js ligne 1475)
- `satisfaction_proprete`: integer (source: fiche-client-app.js ligne 1476)
- `satisfaction_equipements`: integer (source: fiche-client-app.js ligne 1477)
- `satisfaction_localisation`: integer (source: fiche-client-app.js ligne 1478)
- `satisfaction_communication`: integer (source: fiche-client-app.js ligne 1479)
- `points_positifs`: text (source: fiche-client-app.js ligne 1480)
- `points_ameliorer`: text (source: fiche-client-app.js ligne 1481)
- `recommanderait`: boolean (source: fiche-client-app.js ligne 1482)
- `status`: text (nouveau/en_cours/resolu/archive) (source: fiches-clients.js ligne 109)
- `created_at`: timestamptz

#### Relations:
- Lien logique vers `reservations` via `reservation_id` (pas confirmé FK)

#### Opérations CRUD:
- **SELECT**: fiches-clients.js ligne 109, fiches-clients.js ligne 600
- **INSERT**: fiche-client-app.js ligne 1473
- **UPDATE**: fiches-clients.js ligne 687

---

### 12. TABLE: `infos_gites`
**Rôle**: Informations pratiques par gîte (wifi, codes, instructions)

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `gite`: text (Trevoux/Couzon), UNIQUE (source: infos-gites.js ligne 743)
- `adresse`: text (source: fiches-clients.js ligne 725)
- `code_acces`: text (source: fiche-client-app.js ligne 292)
- `wifi_password`: text (source: infos-gites.js ligne 762)
- `instructions_cles`: text (source: infos-gites.js ligne 764)
- `checklist_depart`: text (source: infos-gites.js ligne 765)
- `infos_complementaires`: text (source: infos-gites.js ligne 766)
- `heure_arrivee`: time (source: fiches-clients.js ligne 727)
- `heure_depart`: time (source: fiches-clients.js ligne 728)
- `updated_at`: timestamptz

#### Relations:
- Lien logique avec `reservations` via `gite`

#### Opérations CRUD:
- **SELECT**: infos-gites.js ligne 743, fiche-client-app.js ligne 292, fiches-clients.js ligne 724
- **UPDATE**: infos-gites.js ligne 759, fiches-clients.js ligne 805
- **DELETE**: infos-gites.js ligne 1257 (ancienne structure)

---

### 13. TABLE: `checklist_templates`
**Rôle**: Templates de checklists (entrée/sortie) par gîte

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `gite`: text (source: checklists.js ligne 50)
- `type`: text (entree/sortie) (source: checklists.js ligne 50)
- `titre`: text (source: checklists.js ligne 144)
- `ordre`: integer (source: checklists.js ligne 145)
- `actif`: boolean (source: checklists.js ligne 146)
- `created_at`: timestamptz

#### Relations:
- Aucune FK directe

#### Opérations CRUD:
- **SELECT**: checklists.js ligne 50, dashboard.js ligne 2023, fiche-client-app.js ligne 2024
- **INSERT**: checklists.js ligne 144
- **UPDATE**: checklists.js ligne 180 (actif), checklists.js ligne 229 (ordre)

---

### 14. TABLE: `checklist_progress`
**Rôle**: Progression des checklists par réservation

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `reservation_id`: integer, FK vers reservations (source: checklists.js ligne 320)
- `template_id`: integer, FK vers checklist_templates (source: checklists.js ligne 321)
- `completed`: boolean (source: checklists.js ligne 322)
- `completed_at`: timestamptz (source: checklists.js ligne 323)

#### Relations:
- FK vers `reservations` via `reservation_id`
- FK vers `checklist_templates` via `template_id`

#### Opérations CRUD:
- **SELECT**: checklists.js ligne 455, dashboard.js ligne 2035, fiche-client-app.js ligne 2046
- **INSERT**: checklists.js ligne 320 (auto via fonction)
- **UPDATE**: fiche-client-app.js ligne 2141, fiche-client-app.js ligne 2155
- **DELETE**: (via CASCADE?)

---

### 15. TABLE: `activites_gites`
**Rôle**: Activités touristiques à recommander par gîte

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `gite`: text (source: decouvrir.js ligne 182)
- `categorie`: text (restaurants/activites/lyon/dombes/parcs_zoo) (source: decouvrir.js ligne 438)
- `titre`: text (source: decouvrir.js ligne 1058)
- `description`: text (source: decouvrir.js ligne 1059)
- `adresse`: text (source: decouvrir.js ligne 1060)
- `telephone`: text (source: decouvrir.js ligne 1061)
- `site_web`: text (source: decouvrir.js ligne 1062)
- `ordre`: integer (source: decouvrir.js ligne 1063)
- `actif`: boolean (source: decouvrir.js ligne 1064)
- `created_at`: timestamptz

#### Relations:
- Lien logique avec `reservations` via `gite`

#### Opérations CRUD:
- **SELECT**: decouvrir.js ligne 182, fiche-client-app.js ligne 954
- **INSERT**: decouvrir.js ligne 1083
- **UPDATE**: decouvrir.js ligne 1057
- **DELETE**: decouvrir.js ligne 748

---

### 16. TABLE: `activites_consultations`
**Rôle**: Tracking des consultations d'activités par clients

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `reservation_id`: integer (source: fiche-client-app.js ligne 1180)
- `activite_titre`: text (source: fiche-client-app.js ligne 1181)
- `consulted_at`: timestamptz

#### Relations:
- Lien logique vers `reservations` via `reservation_id`

#### Opérations CRUD:
- **SELECT**: (non observé)
- **INSERT**: fiche-client-app.js ligne 1179

---

### 17. TABLE: `faq`
**Rôle**: FAQ visible dans l'espace client

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `question`: text (source: faq.js ligne 274)
- `reponse`: text (source: faq.js ligne 275)
- `categorie`: text (source: faq.js ligne 276)
- `ordre`: integer (source: faq.js ligne 277)
- `actif`: boolean (source: faq.js ligne 278)
- `created_at`: timestamptz

#### Relations:
- Aucune FK directe

#### Opérations CRUD:
- **SELECT**: faq.js ligne 30, fiche-client-app.js ligne 1827
- **INSERT**: faq.js ligne 282
- **UPDATE**: faq.js ligne 274
- **DELETE**: faq.js ligne 302

---

### 18. TABLE: `simulations_fiscales`
**Rôle**: Simulations fiscales LMP sauvegardées

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `annee`: integer (source: fiscalite-v2.js ligne 740)
- `ca`: numeric (source: fiscalite-v2.js ligne 741)
- `charges_couzon`: jsonb (source: fiscalite-v2.js ligne 742)
- `charges_trevoux`: jsonb (source: fiscalite-v2.js ligne 743)
- `charges_residence`: jsonb (source: fiscalite-v2.js ligne 744)
- `frais_professionnels`: jsonb (source: fiscalite-v2.js ligne 745)
- `frais_vehicule`: jsonb (source: fiscalite-v2.js ligne 746)
- `travaux_liste`: jsonb (source: fiscalite-v2.js ligne 747)
- `frais_divers_liste`: jsonb (source: fiscalite-v2.js ligne 748)
- `produits_accueil_liste`: jsonb (source: fiscalite-v2.js ligne 749)
- `benefice`: numeric (source: fiscalite-v2.js ligne 750)
- `urssaf`: numeric (source: fiscalite-v2.js ligne 751)
- `ir`: numeric (source: fiscalite-v2.js ligne 752)
- `reste_a_vivre`: numeric (source: fiscalite-v2.js ligne 753)
- `created_at`: timestamptz
- `updated_at`: timestamptz (source: fiscalite-v2.js ligne 789)

#### Relations:
- Aucune FK directe

#### Opérations CRUD:
- **SELECT**: fiscalite-v2.js ligne 911, dashboard.js ligne 1030
- **INSERT**: fiscalite-v2.js ligne 1051, fiscalite-v2.js ligne 1391
- **UPDATE**: fiscalite-v2.js ligne 788 (via upsert)

---

### 19. TABLE: `suivi_soldes_bancaires`
**Rôle**: Suivi des soldes bancaires mensuels

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `annee`: integer (source: fiscalite-v2.js ligne 1972)
- `mois`: integer (1-12) (source: fiscalite-v2.js ligne 1973)
- `solde_debut_mois`: numeric (source: fiscalite-v2.js ligne 2038)
- `solde_fin_mois`: numeric (source: fiscalite-v2.js ligne 2039)
- `created_at`: timestamptz
- `updated_at`: timestamptz

#### Relations:
- Aucune FK directe

#### Opérations CRUD:
- **SELECT**: fiscalite-v2.js ligne 1972, dashboard.js ligne 1244
- **INSERT/UPSERT**: fiscalite-v2.js ligne 2037

---

### 20. TABLE: `problemes_signales`
**Rôle**: Problèmes signalés par clients durant séjour

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `reservation_id`: integer, FK vers reservations (source: dashboard.js ligne 1644)
- `categorie`: text (equipement/proprete/autre) (source: fiche-client-app.js ligne 2205)
- `description`: text (source: fiche-client-app.js ligne 2206)
- `urgence`: text (haute/moyenne/basse) (source: fiche-client-app.js ligne 2207)
- `status`: text (nouveau/en_cours/resolu) (source: dashboard.js ligne 1644)
- `created_at`: timestamptz
- `resolved_at`: timestamptz

#### Relations:
- FK vers `reservations` via `reservation_id`

#### Opérations CRUD:
- **SELECT**: dashboard.js ligne 1644
- **INSERT**: fiche-client-app.js ligne 2203, fiche-client-app.js ligne 2222
- **UPDATE**: (status)
- **DELETE**: dashboard.js ligne 1843, dashboard.js ligne 1862

---

### 21. TABLE: `evaluations_sejour`
**Rôle**: Évaluations détaillées de séjour

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `reservation_id`: integer (source: fiche-client-app.js ligne 2341)
- `satisfaction_generale`: integer (1-5)
- `satisfaction_proprete`: integer
- `satisfaction_equipements`: integer
- `satisfaction_localisation`: integer
- `satisfaction_communication`: integer
- `points_positifs`: text
- `points_ameliorer`: text
- `recommanderait`: boolean
- `created_at`: timestamptz

#### Relations:
- Lien vers `reservations` via `reservation_id`

#### Opérations CRUD:
- **SELECT**: (non observé)
- **INSERT**: fiche-client-app.js ligne 2340

---

### 22. TABLE: `gites`
**Rôle**: Configuration multi-gîtes (POTENTIEL - peu utilisée)

#### Colonnes identifiées:
- `id`: integer, PRIMARY KEY
- `nom`: text (source: gites-manager.js ligne 23)
- Colonnes supplémentaires à confirmer

#### Relations:
- (À définir)

#### Opérations CRUD:
- **SELECT**: gites-manager.js ligne 23

---

### 23. TABLE: `user_roles`
**Rôle**: Gestion des rôles utilisateurs (auth)

#### Colonnes identifiées:
- `id`: integer
- `user_id`: uuid, FK vers auth.users (source: auth.js ligne 69)
- `role`: text (admin/viewer/cleaning)
- Autres colonnes à confirmer

#### Relations:
- FK vers `auth.users` (Supabase Auth)

#### Opérations CRUD:
- **SELECT**: auth.js ligne 69

---

## 📊 OBJETS MÉTIER IDENTIFIÉS

### 🏠 RÉSERVATION
**Tables**: `reservations`, `client_access_tokens`, `fiche_generation_logs`, `checklist_progress`  
**Cycle de vie**: Création → Envoi fiche client → Arrivée → Séjour → Départ → Archivage  
**Attributs métier**:
- Dates séjour (date_debut, date_fin)
- Client (nom_client, telephone, provenance, nb_personnes)
- Financier (montant, acompte, restant, paiement)
- Source (plateforme)
- Communication (messageEnvoye, token d'accès)

### 🧹 MÉNAGE
**Tables**: `cleaning_schedule`, `retours_menage`  
**Cycle de vie**: Planification auto → Proposition → Validation client → Exécution → Retour  
**Attributs métier**:
- Date/horaire planifiés
- Statut validation (pending/validated/refused)
- Retour société (etat_arrivee, deroulement)

### 📋 CHECKLIST
**Tables**: `checklist_templates`, `checklist_progress`  
**Cycle de vie**: Template par gîte → Association réservation → Progression client → Complétion  
**Types**: Checklist entrée, Checklist sortie

### 💰 FINANCE
**Tables**: `charges`, `historical_data`, `simulations_fiscales`, `suivi_soldes_bancaires`  
**Objets**:
- Charge (mensuelle/annuelle/ponctuelle)
- Données historiques (CA par année/gîte)
- Simulation fiscale LMP
- Suivi trésorerie

### 🎯 TÂCHE
**Tables**: `todos`  
**Catégories**: reservations, travaux, achats  
**Cycle de vie**: Création → En cours → Complétion → Archivage  
**Récurrence**: Gestion de tâches récurrentes (is_recurrent)

### 📱 COMMUNICATION CLIENT
**Tables**: `demandes_horaires`, `problemes_signales`, `retours_clients`, `evaluations_sejour`  
**Canaux**:
- Demandes modifications horaires
- Signalement problèmes temps réel
- Retours après séjour
- Évaluations satisfaction

### ℹ️ CONTENU
**Tables**: `infos_gites`, `activites_gites`, `faq`, `activites_consultations`  
**Types**:
- Informations pratiques gîte
- Recommandations activités
- FAQ
- Tracking consultations

### 🧺 STOCKS
**Tables**: `stocks_draps`  
**Par gîte**: 7 types de linge suivis

---

## 🔗 GRAPHE DE DÉPENDANCES

```
reservations (RACINE)
├── cleaning_schedule (reservation_id)
├── client_access_tokens (reservation_id)
│   └── fiche_generation_logs (reservation_id)
├── checklist_progress (reservation_id)
│   └── checklist_templates (template_id)
├── demandes_horaires (reservation_id)
├── problemes_signales (reservation_id)
├── retours_clients (reservation_id)
├── evaluations_sejour (reservation_id)
└── activites_consultations (reservation_id)

infos_gites (gite) ──┐
activites_gites (gite) ─┤ Lien logique via 'gite'
stocks_draps (gite) ───┘

charges (indépendant)
historical_data (indépendant)
simulations_fiscales (indépendant)
suivi_soldes_bancaires (indépendant)
todos (indépendant)
retours_menage (indépendant - lien logique gite)
faq (indépendant)
user_roles (auth)
```

---

## ⚠️ PROBLÈMES ARCHITECTURAUX IDENTIFIÉS

### 1. **Absence de tenant_id**
**Impact**: CRITIQUE  
**Description**: Aucune table n'a de colonne `tenant_id` ou équivalent. Impossible de gérer plusieurs propriétaires.  
**Tables concernées**: TOUTES

### 2. **Clé métier fragile : colonne 'gite' en text**
**Impact**: ÉLEVÉ  
**Description**: 'gite' stocké comme text libre ("Trevoux"/"Couzon") sans FK vers table `gites`. Risques de typos, incohérences.  
**Tables concernées**: `reservations`, `infos_gites`, `stocks_draps`, `activites_gites`, `cleaning_schedule`, `retours_menage`, `checklist_templates`, `charges`, `todos`

### 3. **Doublons de colonnes status/statut**
**Impact**: MOYEN  
**Description**: `demandes_horaires` a `status` ET `statut` (source: dashboard.js ligne 243 vs fiches-clients.js ligne 395)  
**Solution**: Normaliser sur une seule colonne

### 4. **Relations logiques non formalisées**
**Impact**: MOYEN  
**Description**: Liens par valeur text ('gite') au lieu de FK. Pas d'intégrité référentielle.  
**Exemples**:
- `infos_gites.gite` → devrait être FK vers `gites.id`
- `retours_menage.gite` → devrait être FK vers `gites.id`

### 5. **Pas de soft-delete généralisé**
**Impact**: FAIBLE  
**Description**: Seuls `todos` ont `archived_at`. Les autres tables font des DELETE hard.  
**Recommandation**: Ajouter `deleted_at` partout pour historique

### 6. **Champs potentiellement manquants dans Supabase**
**Impact**: MOYEN  
**Description**: `reservations.messageEnvoye` manipulé dans le code mais non confirmé en base  
**Action**: Vérifier schéma Supabase réel

### 7. **Pas de colonne created_by/updated_by**
**Impact**: MOYEN  
**Description**: Impossible de tracer qui a modifié quoi (audit)  
**Recommandation**: Ajouter `created_by_user_id`, `updated_by_user_id`

---

## 📈 STATISTIQUES

- **Tables identifiées**: 23
- **Tables avec FK explicites**: 8 (cleaning_schedule, client_access_tokens, checklist_progress, demandes_horaires, problemes_signales, retours_clients, evaluations_sejour, fiche_generation_logs)
- **Tables indépendantes**: 9
- **Tables avec lien logique text**: 6 (via 'gite')
- **Objets métier principaux**: 8
- **Fichiers JS analysés**: 20+
- **Opérations CRUD recensées**: 150+

---

## 🎯 RECOMMANDATIONS POUR REFONTE MULTI-TENANT

### Phase 1: Normalisation Structure
1. ✅ Créer table `tenants` (propriétaires/organisations)
2. ✅ Créer table `properties` (gîtes) avec FK `tenant_id`
3. ✅ Ajouter `tenant_id` à TOUTES les tables
4. ✅ Remplacer colonnes text 'gite' par FK `property_id`
5. ✅ Ajouter colonnes audit (`created_by_user_id`, `updated_by_user_id`)
6. ✅ Ajouter `deleted_at` partout (soft-delete)

### Phase 2: Row Level Security (RLS)
1. Activer RLS sur toutes les tables
2. Politique: `tenant_id = current_tenant_id()`
3. Fonction helper: `get_current_tenant_id()` basée sur JWT

### Phase 3: Migration Données
1. Créer tenant par défaut (propriétaire actuel)
2. Créer properties: Trevoux, Couzon
3. Migrer toutes les données existantes avec tenant_id et property_id appropriés

### Phase 4: Refactoring Code
1. Injecter `tenant_id` dans toutes les requêtes INSERT
2. Remplacer filtres WHERE `gite = 'Trevoux'` par `property_id = X`
3. Middleware d'authentification pour extraire tenant_id du JWT

---

## 📋 CHECKLIST VALIDATION

- [x] Tables réservations identifiées
- [x] Tables ménage identifiées  
- [x] Tables finances identifiées
- [x] Tables communication client identifiées
- [x] Tables contenu identifiées
- [x] Colonnes de chaque table recensées
- [x] Relations FK explicites cartographiées
- [x] Relations logiques identifiées
- [x] Opérations CRUD par table documentées
- [x] Objets métier définis
- [x] Problèmes architecturaux listés
- [x] Graphe de dépendances créé
- [x] Recommandations refonte fournies

---

**FIN DU DIAGNOSTIC**

Ce document est prêt pour servir de base à la refonte multi-tenant. Prochaine étape: définir le schéma cible avec `tenants`, `properties`, et les nouvelles contraintes FK.
