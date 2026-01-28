# 🗑️ TABLES SUPPRIMÉES - 23 JANVIER 2026

## ⚠️ ARCHIVE DES STRUCTURES SUPPRIMÉES

Ce fichier contient les structures complètes des tables supprimées de la base de données.
**CONSERVATION** : Pour restauration éventuelle ou référence historique.

---

## 🔴 TABLES OBSOLÈTES SUPPRIMÉES (2 tables)

### 1. **infos_pratiques** ⚠️ OBSOLÈTE

**Raison suppression** : Remplacée par `infos_gites` (119 colonnes fixes bilingues)

**Structure complète** :
```sql
CREATE TABLE public.infos_pratiques (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  gite_id UUID NULL,
  info_type TEXT NULL,
  title TEXT NOT NULL,
  content TEXT NULL,
  icon TEXT NULL,
  display_order INTEGER NULL DEFAULT 0,
  is_active BOOLEAN NULL DEFAULT true,
  language TEXT NULL DEFAULT 'fr'::text,
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  
  CONSTRAINT infos_pratiques_pkey PRIMARY KEY (id),
  CONSTRAINT infos_pratiques_owner_user_id_fkey 
    FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT infos_pratiques_gite_id_fkey 
    FOREIGN KEY (gite_id) REFERENCES gites(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX idx_infos_pratiques_owner ON public.infos_pratiques USING btree (owner_user_id);
CREATE INDEX idx_infos_pratiques_gite ON public.infos_pratiques USING btree (gite_id);
CREATE INDEX idx_infos_pratiques_type ON public.infos_pratiques USING btree (info_type);
CREATE INDEX idx_infos_pratiques_language ON public.infos_pratiques USING btree (language);
```

**Dernière utilisation** : Avant migration vers infos_gites structurée (119 champs)

---

### 2. **checklists** ⚠️ OBSOLÈTE

**Raison suppression** : Remplacée par `checklist_templates` + `checklist_progress`

**Structure complète** :
```sql
CREATE TABLE public.checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  gite_id UUID NOT NULL,
  nom TEXT NOT NULL,
  items JSONB NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  
  CONSTRAINT checklists_pkey PRIMARY KEY (id),
  CONSTRAINT checklists_owner_user_id_fkey 
    FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT checklists_gite_id_fkey 
    FOREIGN KEY (gite_id) REFERENCES gites(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX idx_checklists_owner ON public.checklists USING btree (owner_user_id);
CREATE INDEX idx_checklists_gite ON public.checklists USING btree (gite_id);
```

**Dernière utilisation** : Avant refonte système checklists bilingues avec templates

---

## 🔴 FEATURES NON IMPLÉMENTÉES (7 tables)

### 3. **demandes_horaires** ⚠️ ERREUR - FEATURE ACTIVE

**⚠️ CORRECTION 28/01/2026** : Cette table a été supprimée PAR ERREUR !
La feature ÉTAIT implémentée et fonctionnelle dans :
- `pages/fiche-client.html` - Formulaires clients
- `js/fiche-client-app.js` (lignes 1550-1690)
- Utilisée par les clients en production

**RESTAURÉE le 28/01/2026** via `sql/RESTAURATION_URGENTE_28JAN2026.sql`

**Raison suppression ERRONÉE** : Feature jamais implémentée dans l'interface ← FAUX

**Structure complète** :
```sql
CREATE TABLE public.demandes_horaires (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  reservation_id UUID NOT NULL,
  type TEXT NOT NULL, -- CHECK IN ('checkin', 'checkout')
  heure_demandee TIME NOT NULL,
  motif TEXT NULL,
  statut TEXT NULL DEFAULT 'en_attente'::text, -- 'en_attente', 'acceptee', 'refusee'
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  
  CONSTRAINT demandes_horaires_pkey PRIMARY KEY (id),
  CONSTRAINT demandes_horaires_owner_user_id_fkey 
    FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT demandes_horaires_reservation_id_fkey 
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  CONSTRAINT demandes_horaires_type_check 
    CHECK (type = ANY(ARRAY['checkin'::text, 'checkout'::text])),
  CONSTRAINT demandes_horaires_statut_check 
    CHECK (statut = ANY(ARRAY['en_attente'::text, 'acceptee'::text, 'refusee'::text]))
) TABLESPACE pg_default;

CREATE INDEX idx_demandes_owner ON public.demandes_horaires USING btree (owner_user_id);
CREATE INDEX idx_demandes_resa ON public.demandes_horaires USING btree (reservation_id);
CREATE INDEX idx_demandes_statut ON public.demandes_horaires USING btree (statut);
```

**Raison non-implémentation** : Complexité vs besoin réel - Gestion manuelle suffisante

---

### 4. **evaluations_sejour** 🔴 FEATURE NON DÉVELOPPÉE

**Raison suppression** : Système d'évaluation jamais implémenté

**Structure complète** :
```sql
CREATE TABLE public.evaluations_sejour (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  reservation_id UUID NOT NULL,
  note_proprete INTEGER NULL, -- 1-5
  note_equipement INTEGER NULL, -- 1-5
  note_emplacement INTEGER NULL, -- 1-5
  note_communication INTEGER NULL, -- 1-5
  note_globale NUMERIC(2,1) NULL, -- Moyenne calculée
  commentaire TEXT NULL,
  recommande BOOLEAN NULL DEFAULT true,
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  
  CONSTRAINT evaluations_sejour_pkey PRIMARY KEY (id),
  CONSTRAINT evaluations_sejour_owner_user_id_fkey 
    FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT evaluations_sejour_reservation_id_fkey 
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  CONSTRAINT evaluations_sejour_note_proprete_check 
    CHECK (note_proprete >= 1 AND note_proprete <= 5),
  CONSTRAINT evaluations_sejour_note_equipement_check 
    CHECK (note_equipement >= 1 AND note_equipement <= 5),
  CONSTRAINT evaluations_sejour_note_emplacement_check 
    CHECK (note_emplacement >= 1 AND note_emplacement <= 5),
  CONSTRAINT evaluations_sejour_note_communication_check 
    CHECK (note_communication >= 1 AND note_communication <= 5)
) TABLESPACE pg_default;

CREATE INDEX idx_evaluations_owner ON public.evaluations_sejour USING btree (owner_user_id);
CREATE INDEX idx_evaluations_reservation ON public.evaluations_sejour USING btree (reservation_id);
```

**Raison non-implémentation** : Feature complexe, les avis plateformes suffisent

---

### 5. **problemes_signales** ⚠️ ERREUR - FEATURE ACTIVE

**⚠️ CORRECTION 28/01/2026** : Cette table a été supprimée PAR ERREUR !
La feature ÉTAIT implémentée et fonctionnelle dans :
- `pages/fiche-client.html` - Formulaires clients
- `js/fiche-client-app.js` (lignes 2585-2660)
- Utilisée par les clients en production
- Permet signalement problèmes, demandes, retours, améliorations

**RESTAURÉE le 28/01/2026** via `sql/RESTAURATION_URGENTE_28JAN2026.sql`

**Raison suppression ERRONÉE** : Feature jamais implémentée ← FAUX

**Structure complète** :
```sql
CREATE TABLE public.problemes_signales (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  gite_id UUID NOT NULL,
  gite TEXT NULL, -- Alias
  description TEXT NOT NULL,
  categorie TEXT NULL, -- 'plomberie', 'electricite', 'equipement', 'autre'
  priorite TEXT NULL DEFAULT 'normale'::text, -- 'basse', 'normale', 'haute', 'urgente'
  resolu BOOLEAN NULL DEFAULT false,
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  
  CONSTRAINT problemes_signales_pkey PRIMARY KEY (id),
  CONSTRAINT problemes_signales_owner_user_id_fkey 
    FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT problemes_signales_gite_id_fkey 
    FOREIGN KEY (gite_id) REFERENCES gites(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX idx_problemes_owner ON public.problemes_signales USING btree (owner_user_id);
CREATE INDEX idx_problemes_gite ON public.problemes_signales USING btree (gite_id);
CREATE INDEX idx_problemes_resolu ON public.problemes_signales USING btree (resolu);
```

**Raison non-implémentation** : Communication directe plus efficace

---

### 6. **retours_menage** 🔴 FEATURE NON DÉVELOPPÉE

**Raison suppression** : Feature trop complexe, non utilisée

**Structure complète** :
```sql
CREATE TABLE public.retours_menage (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  gite_id UUID NOT NULL,
  gite TEXT NULL, -- Alias
  date_menage DATE NOT NULL,
  date DATE NULL, -- Alias
  reported_by UUID NULL, -- FK vers auth.users
  tasks_completed JSONB NULL DEFAULT '[]'::jsonb,
  issues_found JSONB NULL DEFAULT '[]'::jsonb,
  supplies_needed JSONB NULL DEFAULT '[]'::jsonb,
  urgent_repairs JSONB NULL DEFAULT '[]'::jsonb,
  produits_manquants JSONB NULL DEFAULT '[]'::jsonb,
  problemes_signales JSONB NULL DEFAULT '[]'::jsonb,
  duration_minutes INTEGER NULL,
  duree_minutes INTEGER NULL, -- Alias
  heure_arrivee TIME NULL,
  heure_depart TIME NULL,
  notes TEXT NULL,
  commentaire TEXT NULL, -- Alias
  commentaires TEXT NULL, -- Alias
  photos JSONB NULL DEFAULT '[]'::jsonb,
  validated BOOLEAN NULL DEFAULT false,
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  
  CONSTRAINT retours_menage_pkey PRIMARY KEY (id),
  CONSTRAINT retours_menage_owner_user_id_fkey 
    FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT retours_menage_gite_id_fkey 
    FOREIGN KEY (gite_id) REFERENCES gites(id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX idx_retours_menage_owner ON public.retours_menage USING btree (owner_user_id);
CREATE INDEX idx_retours_menage_gite ON public.retours_menage USING btree (gite_id);
CREATE INDEX idx_retours_menage_date ON public.retours_menage USING btree (date_menage);
CREATE INDEX idx_retours_menage_validated ON public.retours_menage USING btree (validated);
```

**Raison non-implémentation** : Système trop complexe, `cleaning_schedule` suffit

---

### 7. **suivi_soldes_bancaires** 🔴 FEATURE NON DÉVELOPPÉE

**Raison suppression** : Feature jamais implémentée

**Structure complète** :
```sql
CREATE TABLE public.suivi_soldes_bancaires (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  annee INTEGER NOT NULL,
  mois INTEGER NOT NULL, -- 1-12
  solde NUMERIC(10,2) NULL,
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  
  CONSTRAINT suivi_soldes_bancaires_pkey PRIMARY KEY (id),
  CONSTRAINT suivi_soldes_bancaires_owner_user_id_annee_mois_key 
    UNIQUE (owner_user_id, annee, mois),
  CONSTRAINT suivi_soldes_bancaires_owner_user_id_fkey 
    FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT suivi_soldes_bancaires_mois_check 
    CHECK (mois >= 1 AND mois <= 12)
) TABLESPACE pg_default;

CREATE INDEX idx_soldes_owner ON public.suivi_soldes_bancaires USING btree (owner_user_id);
CREATE INDEX idx_soldes_annee ON public.suivi_soldes_bancaires USING btree (annee);
```

**Raison non-implémentation** : Feature comptabilité avancée non prioritaire

---

## 🟡 TABLES OPTIONNELLES CONSERVÉES (3 tables)

### 8. **activites_consultations** 🟡 ANALYTICS

**Statut** : **CONSERVÉE** - Analytics consultations activités

**Raison conservation** : Données statistiques potentiellement utiles

---

### 9. **fiche_generation_logs** 🟡 AUDIT

**Statut** : **CONSERVÉE** - Logs génération fiches clients

**Raison conservation** : Traçabilité et audit

---

### 10. **historical_data** 🟡 AUDIT TRAIL

**Statut** : **CONSERVÉE** - Audit trail complet toutes modifications

**Raison conservation** : Conformité, sécurité, traçabilité complète

---

## ⚠️ SCRIPT DE SUPPRESSION

**Fichier** : `sql/CLEANUP_TABLES_OBSOLETES_23JAN2026.sql`

**ATTENTION** : Exécuter uniquement après sauvegarde complète de la base !

---

## 📊 RÉSUMÉ SUPPRESSION

- **Tables obsolètes** : 2 (infos_pratiques, checklists)
- **Features non implémentées** : 5 (demandes_horaires, evaluations_sejour, problemes_signales, retours_menage, suivi_soldes_bancaires)
- **Total supprimé** : 7 tables
- **Tables actives conservées** : 19 tables
- **Tables optionnelles conservées** : 3 tables (analytics/audit)

---

**Date suppression** : 23 janvier 2026  
**Raison** : Nettoyage base de données - Suppression tables inutilisées  
**Responsable** : GitHub Copilot + Validation propriétaire
