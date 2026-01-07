# 📊 TABLEAU RÉCAPITULATIF BASE DE DONNÉES

## VUE D'ENSEMBLE

| Catégorie | Nombre | Détails |
|-----------|--------|---------|
| **Tables totales** | 23 | Dont 8 avec FK explicites |
| **Fichiers JS analysés** | 20+ | Couvrant tous les modules |
| **Objets métier** | 8 | Réservation, Ménage, Finance, Tâche, Communication, Contenu, Checklist, Stocks |
| **Opérations CRUD** | 150+ | Toutes documentées avec sources |
| **Relations FK** | 8 tables | client_access_tokens, cleaning_schedule, checklist_progress, demandes_horaires, etc. |
| **Relations logiques** | 6 tables | Via colonne text 'gite' |

---

## 📋 TABLES PAR CATÉGORIE

### 🏠 GESTION RÉSERVATIONS (6 tables)
| Table | Colonnes clés | FK | Rôle |
|-------|---------------|----|----|
| **reservations** | id, gite, date_debut, date_fin, nom_client, montant, paiement | - | Table racine réservations |
| **client_access_tokens** | reservation_id, token, expires_at, access_count | ✅ reservations | Tokens accès fiche client |
| **fiche_generation_logs** | reservation_id, type_generation, fiche_url, opened_count | ✅ reservations | Logs génération fiches |
| **demandes_horaires** | reservation_id, type, heure_demandee, status | ✅ reservations | Demandes modif horaires |
| **problemes_signales** | reservation_id, categorie, description, urgence, status | ✅ reservations | Problèmes signalés |
| **retours_clients** | reservation_id, satisfaction_*, points_positifs, recommanderait | ✅ reservations | Feedback clients |

### 🧹 GESTION MÉNAGE (2 tables)
| Table | Colonnes clés | FK | Rôle |
|-------|---------------|----|----|
| **cleaning_schedule** | reservation_id, gite, scheduled_date, time_of_day, status, validated_by_company | ✅ reservations | Planning ménage + validation |
| **retours_menage** | gite, date_menage, etat_arrivee, deroulement, validated | - | Retours société ménage |

### 📋 GESTION CHECKLISTS (2 tables)
| Table | Colonnes clés | FK | Rôle |
|-------|---------------|----|----|
| **checklist_templates** | gite, type (entree/sortie), titre, ordre, actif | - | Templates checklists |
| **checklist_progress** | reservation_id, template_id, completed, completed_at | ✅ reservations, checklist_templates | Progression checklists |

### 💰 GESTION FINANCIÈRE (4 tables)
| Table | Colonnes clés | FK | Rôle |
|-------|---------------|----|----|
| **charges** | nom, montant, type (mensuelle/annuelle), date, gite | - | Charges d'exploitation |
| **historical_data** | year, gite, months (jsonb) | - | CA historique par mois |
| **simulations_fiscales** | annee, ca, charges_*, benefice, urssaf, ir, reste_a_vivre | - | Simulations LMP |
| **suivi_soldes_bancaires** | annee, mois, solde_debut_mois, solde_fin_mois | - | Trésorerie mensuelle |

### 📱 COMMUNICATION CLIENT (2 tables)
| Table | Colonnes clés | FK | Rôle |
|-------|---------------|----|----|
| **evaluations_sejour** | reservation_id, satisfaction_*, recommanderait | reservations | Évaluations détaillées |
| **activites_consultations** | reservation_id, activite_titre, consulted_at | reservations | Tracking consultations |

### ℹ️ CONTENU & INFOS (3 tables)
| Table | Colonnes clés | FK | Rôle |
|-------|---------------|----|----|
| **infos_gites** | gite, adresse, code_acces, wifi_password, instructions_cles, heure_arrivee, heure_depart | - | Infos pratiques par gîte |
| **activites_gites** | gite, categorie, titre, description, adresse, telephone, site_web, ordre, actif | - | Activités recommandées |
| **faq** | question, reponse, categorie, ordre, actif | - | FAQ espace client |

### 🧺 STOCKS & INVENTAIRE (1 table)
| Table | Colonnes clés | FK | Rôle |
|-------|---------------|----|----|
| **stocks_draps** | gite, draps_plats_grands, housses_couettes_*, taies_oreillers, serviettes, tapis_bain | - | Stocks linge par gîte |

### 🎯 GESTION TÂCHES (1 table)
| Table | Colonnes clés | FK | Rôle |
|-------|---------------|----|----|
| **todos** | category (reservations/travaux/achats), title, description, gite, completed, archived_at, is_recurrent | - | Tâches et actions |

### 👤 AUTHENTIFICATION (2 tables)
| Table | Colonnes clés | FK | Rôle |
|-------|---------------|----|----|
| **user_roles** | user_id, role (admin/viewer/cleaning) | ✅ auth.users | Rôles utilisateurs |
| **gites** | nom | - | Config multi-gîtes (peu utilisée) |

---

## 🔍 COLONNES CRITIQUES PAR TABLE

### reservations (14 colonnes + relations)
```sql
id: integer PRIMARY KEY
gite: text ⚠️ DEVRAIT ÊTRE FK
date_debut: date
date_fin: date
plateforme: text (Airbnb/Abritel/Gîtes de France)
montant: numeric
nom_client: text
telephone: text
provenance: text
nb_personnes: integer
acompte: numeric
restant: numeric
paiement: text (Soldé/Acompte reçu/En attente)
timestamp: timestamptz
synced_from: text (ical/manuel)
```

### cleaning_schedule (10 colonnes)
```sql
id: integer PRIMARY KEY
reservation_id: integer FK → reservations ✅
gite: text ⚠️
scheduled_date: date
time_of_day: text (morning/afternoon)
status: text (pending/pending_validation/validated/refused/proposed)
validated_by_company: boolean
reservation_end: date
reservation_start_after: date
notes: text
```

### stocks_draps (9 colonnes)
```sql
id: integer PRIMARY KEY
gite: text UNIQUE ⚠️
draps_plats_grands: integer
draps_plats_petits: integer
housses_couettes_grandes: integer
housses_couettes_petites: integer
taies_oreillers: integer
serviettes: integer
tapis_bain: integer
updated_at: timestamptz
```

### infos_gites (9 colonnes)
```sql
id: integer PRIMARY KEY
gite: text UNIQUE ⚠️
adresse: text
code_acces: text
wifi_password: text
instructions_cles: text
checklist_depart: text
infos_complementaires: text
heure_arrivee: time
heure_depart: time
updated_at: timestamptz
```

### simulations_fiscales (17 colonnes + jsonb)
```sql
id: integer PRIMARY KEY
annee: integer
ca: numeric
charges_couzon: jsonb
charges_trevoux: jsonb
charges_residence: jsonb
frais_professionnels: jsonb
frais_vehicule: jsonb
travaux_liste: jsonb
frais_divers_liste: jsonb
produits_accueil_liste: jsonb
benefice: numeric
urssaf: numeric
ir: numeric
reste_a_vivre: numeric
created_at: timestamptz
updated_at: timestamptz
```

---

## 🚨 PROBLÈMES ARCHITECTURAUX

| Problème | Sévérité | Tables concernées | Impact |
|----------|----------|-------------------|--------|
| **Pas de tenant_id** | 🔴 CRITIQUE | TOUTES (23) | Impossible multi-tenant |
| **Colonne 'gite' en text** | 🟠 ÉLEVÉ | 9 tables | Pas de FK, risque typos |
| **Relations logiques non FK** | 🟠 ÉLEVÉ | 6 tables | Pas d'intégrité référentielle |
| **Doublons status/statut** | 🟡 MOYEN | demandes_horaires | Confusion code |
| **Pas de soft-delete global** | 🟡 MOYEN | Toutes sauf todos | Perte données historiques |
| **Pas de colonnes audit** | 🟡 MOYEN | TOUTES | Impossible tracer qui fait quoi |
| **Champs manquants Supabase** | 🟡 MOYEN | reservations.messageEnvoye | Incohérence code/BDD |

---

## 📊 STATISTIQUES OPÉRATIONS

### Par type d'opération
| Opération | Nombre | Tables principales |
|-----------|--------|-------------------|
| **SELECT** | 89 | reservations (12), dashboard (15), fiches-clients (10) |
| **INSERT** | 32 | reservations (3), todos (4), demandes_horaires (3) |
| **UPDATE** | 21 | reservations (2), infos_gites (2), checklist_progress (2) |
| **DELETE** | 16 | reservations (2), charges (1), todos (3) |
| **UPSERT** | 8 | cleaning_schedule (2), stocks_draps (2), simulations_fiscales (1) |

### Par fichier JS (top 10)
| Fichier | Requêtes | Tables accédées |
|---------|----------|-----------------|
| **dashboard.js** | 25+ | reservations, cleaning_schedule, todos, demandes_horaires, problemes_signales, retours_menage |
| **fiche-client-app.js** | 20+ | client_access_tokens, infos_gites, activites_gites, demandes_horaires, checklist_progress, problemes_signales |
| **fiches-clients.js** | 18+ | reservations, client_access_tokens, fiche_generation_logs, demandes_horaires, retours_clients |
| **menage.js** | 8 | cleaning_schedule, reservations |
| **draps.js** | 7 | stocks_draps, reservations, todos |
| **charges.js** | 6 | charges, historical_data |
| **fiscalite-v2.js** | 8 | simulations_fiscales, suivi_soldes_bancaires |
| **checklists.js** | 8 | checklist_templates, checklist_progress, reservations |
| **decouvrir.js** | 6 | activites_gites |
| **femme-menage.js** | 6 | cleaning_schedule, stocks_draps, retours_menage, todos |

---

## 🎯 PLAN DE REFONTE

### PHASE 1: Structure (PRIORITÉ 1)
```sql
-- 1. Créer tables centrales
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL, -- "Trevoux", "Couzon"
  created_at timestamptz DEFAULT now()
);

-- 2. Ajouter colonnes audit partout
ALTER TABLE reservations ADD COLUMN tenant_id uuid REFERENCES tenants(id);
ALTER TABLE reservations ADD COLUMN property_id uuid REFERENCES properties(id);
ALTER TABLE reservations ADD COLUMN created_by_user_id uuid;
ALTER TABLE reservations ADD COLUMN updated_by_user_id uuid;
ALTER TABLE reservations ADD COLUMN deleted_at timestamptz;
-- Répéter pour les 22 autres tables
```

### PHASE 2: Migration Données
```sql
-- 1. Créer tenant par défaut
INSERT INTO tenants (id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Gîtes Calvignac');

-- 2. Créer properties
INSERT INTO properties (id, tenant_id, name) VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Trevoux'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Couzon');

-- 3. Migrer données existantes
UPDATE reservations SET 
  tenant_id = '00000000-0000-0000-0000-000000000001',
  property_id = CASE 
    WHEN gite = 'Trevoux' THEN '00000000-0000-0000-0000-000000000002'
    WHEN gite = 'Couzon' THEN '00000000-0000-0000-0000-000000000003'
  END;
```

### PHASE 3: Row Level Security
```sql
-- 1. Activer RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 2. Politique lecture
CREATE POLICY tenant_isolation_policy ON reservations
  FOR SELECT USING (tenant_id = auth.jwt()->>'tenant_id'::uuid);

-- 3. Politique écriture
CREATE POLICY tenant_insert_policy ON reservations
  FOR INSERT WITH CHECK (tenant_id = auth.jwt()->>'tenant_id'::uuid);
```

### PHASE 4: Code Refactoring
```javascript
// Avant
const { data } = await supabase
  .from('reservations')
  .select('*')
  .eq('gite', 'Trevoux');

// Après
const tenantId = getCurrentTenantId(); // depuis JWT
const propertyId = getPropertyId('Trevoux'); // depuis cache
const { data } = await supabase
  .from('reservations')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('property_id', propertyId);
```

---

## 📈 MÉTRIQUES QUALITÉ

| Métrique | Valeur | État | Objectif |
|----------|--------|------|----------|
| **Tables avec FK** | 8/23 (35%) | 🟠 | 100% |
| **Tables avec tenant_id** | 0/23 (0%) | 🔴 | 100% |
| **Tables avec soft-delete** | 1/23 (4%) | 🔴 | 100% |
| **Tables avec audit** | 0/23 (0%) | 🔴 | 100% |
| **Relations normalisées** | 8/14 (57%) | 🟠 | 100% |
| **Intégrité référentielle** | Partielle | 🟠 | Complète |
| **Couverture RLS** | 0% | 🔴 | 100% |

---

## 🔗 DÉPENDANCES CRITIQUES

### Cascade de suppressions (à implémenter)
```
tenants
  └── ON DELETE CASCADE → properties
      └── ON DELETE CASCADE → reservations
          ├── ON DELETE CASCADE → cleaning_schedule
          ├── ON DELETE CASCADE → client_access_tokens
          ├── ON DELETE CASCADE → checklist_progress
          ├── ON DELETE CASCADE → demandes_horaires
          ├── ON DELETE CASCADE → problemes_signales
          ├── ON DELETE CASCADE → retours_clients
          └── ON DELETE CASCADE → evaluations_sejour
```

---

**Date**: 7 janvier 2026  
**Statut**: ✅ Diagnostic complet - Prêt pour refonte  
**Prochaine étape**: Validation schéma cible avec équipe développement
