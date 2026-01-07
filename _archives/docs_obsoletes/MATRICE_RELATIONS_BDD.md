# 🔗 MATRICE DES RELATIONS - BASE DE DONNÉES

## 📊 GRAPHE VISUEL COMPLET

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARCHITECTURE ACTUELLE                               │
│                         (Single Tenant - Monolithique)                        │
└─────────────────────────────────────────────────────────────────────────────┘

                                ┌──────────────┐
                                │ reservations │ ◄─── TABLE RACINE
                                │  (23 cols)   │
                                └──────┬───────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
         ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐
         │ cleaning_      │  │ client_      │  │ checklist_      │
         │ schedule       │  │ access_      │  │ progress        │
         │                │  │ tokens       │  │                 │
         └────────────────┘  └──────┬───────┘  └────────┬────────┘
                                    │                   │
                                    ▼                   ▼
                            ┌───────────────┐  ┌───────────────┐
                            │ fiche_        │  │ checklist_    │
                            │ generation_   │  │ templates     │
                            │ logs          │  │               │
                            └───────────────┘  └───────────────┘

                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
         ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐
         │ demandes_      │  │ problemes_   │  │ retours_        │
         │ horaires       │  │ signales     │  │ clients         │
         └────────────────┘  └──────────────┘  └─────────────────┘

                    ┌──────────────────┴──────────────────┐
                    │                                     │
                    ▼                                     ▼
         ┌────────────────┐                    ┌─────────────────┐
         │ evaluations_   │                    │ activites_      │
         │ sejour         │                    │ consultations   │
         └────────────────┘                    └─────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                         DONNÉES PAR GÎTE (text)                              │
│                    ⚠️  Relations logiques sans FK                            │
└─────────────────────────────────────────────────────────────────────────────┘

                          gite: text ("Trevoux"/"Couzon")
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
         ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐
         │ infos_gites    │  │ stocks_draps │  │ activites_gites │
         │ (UNIQUE gite)  │  │ (UNIQUE gite)│  │                 │
         └────────────────┘  └──────────────┘  └─────────────────┘

                    ┌──────────────────┴──────────────────┐
                    │                                     │
                    ▼                                     ▼
         ┌────────────────┐                    ┌─────────────────┐
         │ retours_menage │                    │ checklist_      │
         │                │                    │ templates       │
         └────────────────┘                    └─────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                      DONNÉES INDÉPENDANTES                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ charges      │  │ historical_  │  │ simulations_ │  │ suivi_soldes │
    │              │  │ data         │  │ fiscales     │  │ bancaires    │
    └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘

    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ todos        │  │ faq          │  │ user_roles   │
    │              │  │              │  │              │
    └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🔍 MATRICE DE CONNEXIONS

| Table Source | Table Cible | Type Relation | Colonne FK | Cardinalité | Status |
|--------------|-------------|---------------|------------|-------------|--------|
| **reservations** | cleaning_schedule | FK explicite | reservation_id | 1:N | ✅ |
| **reservations** | client_access_tokens | FK explicite | reservation_id | 1:1 | ✅ |
| **reservations** | fiche_generation_logs | FK explicite | reservation_id | 1:N | ✅ |
| **reservations** | checklist_progress | FK explicite | reservation_id | 1:N | ✅ |
| **reservations** | demandes_horaires | FK explicite | reservation_id | 1:N | ✅ |
| **reservations** | problemes_signales | FK explicite | reservation_id | 1:N | ✅ |
| **reservations** | retours_clients | FK logique | reservation_id | 1:1 | ⚠️ |
| **reservations** | evaluations_sejour | FK logique | reservation_id | 1:1 | ⚠️ |
| **reservations** | activites_consultations | FK logique | reservation_id | 1:N | ⚠️ |
| **checklist_templates** | checklist_progress | FK explicite | template_id | 1:N | ✅ |
| **auth.users** | user_roles | FK explicite | user_id | 1:1 | ✅ |
| **(gite text)** | infos_gites | Logique text | gite | 1:1 | ❌ |
| **(gite text)** | stocks_draps | Logique text | gite | 1:1 | ❌ |
| **(gite text)** | activites_gites | Logique text | gite | 1:N | ❌ |
| **(gite text)** | retours_menage | Logique text | gite | 1:N | ❌ |
| **(gite text)** | checklist_templates | Logique text | gite | 1:N | ❌ |
| **(gite text)** | cleaning_schedule | Logique text | gite | 1:N | ❌ |

**Légende**:
- ✅ FK explicite avec contrainte base de données
- ⚠️ FK logique dans le code mais pas de contrainte BDD
- ❌ Relation par valeur text, aucune FK

---

## 📋 TABLES PAR NIVEAU DE DÉPENDANCE

### NIVEAU 0 - Tables racines (aucune dépendance)
```
┌─────────────────┐
│ reservations    │ ◄─── Point d'entrée principal
│ charges         │
│ historical_data │
│ simulations_    │
│   fiscales      │
│ suivi_soldes_   │
│   bancaires     │
│ todos           │
│ faq             │
│ infos_gites     │
│ stocks_draps    │
│ activites_gites │
│ retours_menage  │
│ checklist_      │
│   templates     │
│ auth.users      │
└─────────────────┘
```

### NIVEAU 1 - Dépend directement de reservations
```
┌──────────────────────┐
│ cleaning_schedule    │
│ client_access_tokens │
│ checklist_progress   │ ◄─── Dépend aussi de checklist_templates
│ demandes_horaires    │
│ problemes_signales   │
│ retours_clients      │
│ evaluations_sejour   │
│ activites_          │
│   consultations      │
│ user_roles          │ ◄─── Dépend de auth.users
└──────────────────────┘
```

### NIVEAU 2 - Dépend de niveau 1
```
┌──────────────────────┐
│ fiche_generation_   │ ◄─── Dépend de client_access_tokens
│   logs               │       et reservations
└──────────────────────┘
```

---

## 🎯 OBJECTIF ARCHITECTURE CIBLE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ARCHITECTURE MULTI-TENANT                             │
│                      (Isolation complète par tenant)                         │
└─────────────────────────────────────────────────────────────────────────────┘

                            ┌──────────────┐
                            │   tenants    │ ◄─── NOUVEAU
                            │              │
                            └──────┬───────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │  properties  │ ◄─── NOUVEAU
                            │ (ex: Trevoux)│
                            └──────┬───────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
         ┌────────────────┐ ┌─────────┐ ┌──────────────┐
         │ reservations   │ │ infos_  │ │ stocks_draps │
         │ +tenant_id     │ │ gites   │ │ +tenant_id   │
         │ +property_id   │ │ +tenant │ │ +property_id │
         └────────┬───────┘ │ +prop   │ └──────────────┘
                  │         └─────────┘
                  │
         [Toutes les relations existantes conservées]
                  │
                  ▼
         ┌────────────────┐
         │ +tenant_id sur │
         │ TOUTES tables  │
         └────────────────┘
```

---

## 🔐 RÈGLES RLS CIBLES

### Isolation par tenant
```sql
-- Toutes les tables auront cette politique
CREATE POLICY tenant_isolation ON [table_name]
  FOR ALL USING (
    tenant_id = (auth.jwt()->>'tenant_id')::uuid
  );
```

### Cascade de permissions
```
tenants (tenant_id)
  └─ properties (tenant_id + property_id)
      └─ reservations (tenant_id + property_id)
          └─ [toutes les tables liées]
```

---

## 📊 MATRICE DE TRANSFORMATION

| Table actuelle | Colonne à ajouter | Colonne à transformer | Migration |
|----------------|-------------------|----------------------|-----------|
| **reservations** | tenant_id, created_by, deleted_at | gite → property_id | 2500+ rows |
| **cleaning_schedule** | tenant_id, created_by, deleted_at | gite → property_id | 500+ rows |
| **stocks_draps** | tenant_id, created_by, deleted_at | gite → property_id | 2 rows |
| **infos_gites** | tenant_id, created_by, deleted_at | gite → property_id | 2 rows |
| **activites_gites** | tenant_id, created_by, deleted_at | gite → property_id | 50+ rows |
| **checklist_templates** | tenant_id, created_by, deleted_at | gite → property_id | 20+ rows |
| **charges** | tenant_id, created_by, deleted_at | gite → property_id | 100+ rows |
| **todos** | tenant_id, created_by | gite → property_id | 50+ rows |
| **retours_menage** | tenant_id, created_by, deleted_at | gite → property_id | 30+ rows |
| **client_access_tokens** | tenant_id, created_by, deleted_at | - | Via cascade |
| **fiche_generation_logs** | tenant_id, created_by, deleted_at | - | Via cascade |
| **checklist_progress** | tenant_id, created_by, deleted_at | - | Via cascade |
| **demandes_horaires** | tenant_id, created_by, deleted_at | - | Via cascade |
| **problemes_signales** | tenant_id, created_by, deleted_at | - | Via cascade |
| **retours_clients** | tenant_id, created_by, deleted_at | - | Via cascade |
| **evaluations_sejour** | tenant_id, created_by, deleted_at | - | Via cascade |
| **activites_consultations** | tenant_id, created_by, deleted_at | - | Via cascade |
| **historical_data** | tenant_id, created_by, deleted_at | gite → property_id | 10+ rows |
| **simulations_fiscales** | tenant_id, created_by, deleted_at | - | 5+ rows |
| **suivi_soldes_bancaires** | tenant_id, created_by, deleted_at | - | 12+ rows |
| **faq** | tenant_id, created_by, deleted_at | - | 20+ rows |
| **user_roles** | tenant_id | - | Via auth |

---

## 🚀 ORDRE D'IMPLÉMENTATION RECOMMANDÉ

### PHASE 1: Fondations (Semaine 1)
1. ✅ Créer table `tenants`
2. ✅ Créer table `properties`
3. ✅ Ajouter `tenant_id` + `property_id` à `reservations`
4. ✅ Migrer données existantes (tenant par défaut)

### PHASE 2: Tables liées réservations (Semaine 2)
5. ✅ Ajouter `tenant_id` à toutes les tables avec FK vers reservations
6. ✅ Propager tenant_id via CASCADE ou triggers

### PHASE 3: Tables par gîte (Semaine 3)
7. ✅ Transformer `gite: text` → `property_id: uuid` FK
8. ✅ Migrer données (infos_gites, stocks_draps, activites_gites, etc.)

### PHASE 4: Tables indépendantes (Semaine 4)
9. ✅ Ajouter `tenant_id` aux tables sans relation (charges, todos, faq, etc.)
10. ✅ Migrer données

### PHASE 5: RLS & Sécurité (Semaine 5)
11. ✅ Activer RLS sur toutes les tables
12. ✅ Créer politiques d'isolation par tenant
13. ✅ Tests de sécurité

### PHASE 6: Code Refactoring (Semaine 6-8)
14. ✅ Refactorer 20+ fichiers JS
15. ✅ Ajouter middleware tenant_id
16. ✅ Tests end-to-end

---

## 📈 IMPACT ESTIMATION

| Catégorie | Quantité | Effort (heures) |
|-----------|----------|-----------------|
| **Tables à modifier** | 23 | 46h (2h/table) |
| **Migrations SQL** | 23 | 23h (1h/table) |
| **Fichiers JS à refactorer** | 20+ | 80h (4h/fichier) |
| **Tests unitaires** | 50+ | 50h |
| **Tests intégration** | 20+ | 40h |
| **Documentation** | - | 20h |
| **Total estimé** | - | **259 heures** (~6-7 semaines) |

---

**Date**: 7 janvier 2026  
**Statut**: ✅ Architecture validée  
**Prochaine étape**: Démarrer PHASE 1 - Créer tenants & properties
