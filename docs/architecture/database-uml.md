# Diagramme UML — Base de Données Gestion Gîte Calvignac

**Version :** 2.13.46 — Dernière MAJ : 28 mars 2026  
**Source de vérité :** `docs/ARCHITECTURE.md`

> ⚠️ Ce fichier doit être mis à jour **à chaque modification de schéma**.  
> Tout ajout/suppression de table ou colonne FK doit être reflété ici.

---

## Domaine Core — Gîtes & Réservations

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
        string email
    }

    GITES {
        uuid id PK
        uuid owner_user_id FK
        string name
        string address
        string city
        string postal_code
        integer capacity
        integer bedrooms
        decimal price_per_night
        jsonb amenities
        jsonb images
        jsonb regles_tarifs
        jsonb ical_urls
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    RESERVATIONS {
        uuid id PK
        uuid owner_user_id FK
        uuid gite_id FK
        date check_in
        date check_out
        text client_name
        text client_email
        text client_phone
        text client_address
        integer guest_count
        integer nb_personnes
        text platform
        text plateforme
        text status
        numeric total_price
        numeric montant
        numeric acompte
        numeric restant
        text paiement
        text ical_uid
        boolean manual_override
        timestamp last_seen_in_ical
        text notes
        timestamp created_at
        timestamp updated_at
    }

    AUTH_USERS ||--o{ GITES : "possède"
    GITES ||--o{ RESERVATIONS : "contient"
    AUTH_USERS ||--o{ RESERVATIONS : "gère"
```

---

## Domaine E-Commerce — Prestations

```mermaid
erDiagram
    GITES {
        uuid id PK
        string name
    }

    RESERVATIONS {
        uuid id PK
        uuid gite_id FK
    }

    PRESTATIONS_CATALOGUE {
        uuid id PK
        uuid owner_user_id FK
        uuid gite_id FK
        text nom
        text nom_en
        text description
        text description_en
        numeric prix
        text categorie
        text icone
        text photo_url
        integer ordre
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    COMMANDES_PRESTATIONS {
        uuid id PK
        uuid reservation_id FK
        uuid gite_id FK
        text numero_commande
        numeric montant_prestations
        numeric montant_commission
        numeric montant_net_owner
        text statut
        text notes_client
        text notes_owner
        timestamp created_at
        timestamp updated_at
    }

    LIGNES_COMMANDE_PRESTATIONS {
        uuid id PK
        uuid commande_id FK
        text nom_prestation
        integer quantite
        numeric prix_unitaire
        numeric prix_total
        timestamp created_at
    }

    SYSTEM_CONFIG {
        bigint id PK
        string cle
        text valeur
        text description
    }

    GITES ||--o{ PRESTATIONS_CATALOGUE : "propose"
    RESERVATIONS ||--o{ COMMANDES_PRESTATIONS : "génère"
    GITES ||--o{ COMMANDES_PRESTATIONS : "facture"
    COMMANDES_PRESTATIONS ||--o{ LIGNES_COMMANDE_PRESTATIONS : "détaille"
    PRESTATIONS_CATALOGUE ||--o{ LIGNES_COMMANDE_PRESTATIONS : "snapshot nom au moment commande"
```

> Commission auto : `montant_commission = montant_prestations × taux` (taux dans `system_config.commission_prestations_percent`, défaut 5%)

---

## Domaine SaaS — Abonnements

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
        string email
    }

    CM_PRICING_PLANS {
        uuid id PK
        text name
        text slug
        text display_name
        text description
        numeric price_monthly
        numeric price_yearly
        jsonb features
        jsonb limits
        integer nb_gites_max
        integer level
        integer sort_order
        boolean is_active
    }

    USER_SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        uuid plan_id FK
        text status
        timestamptz current_period_start
        timestamptz current_period_end
        boolean cancel_at_period_end
        text stripe_subscription_id
        text billing_cycle
    }

    AUTH_USERS ||--o| USER_SUBSCRIPTIONS : "souscrit à"
    CM_PRICING_PLANS ||--o{ USER_SUBSCRIPTIONS : "associée à"
```

---

## Domaine Support & Monitoring

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
    }

    CM_SUPPORT_TICKETS {
        uuid id PK
        uuid client_id FK
        text title
        text description
        text category
        text priority
        text status
        text assigned_to
        text resolution_notes
        text resolution
        text source
        text error_signature
        uuid error_id
        jsonb tags
        jsonb metadata
        numeric csat_score
        text priorite
        text sujet
        text categorie
        text statut
        timestamptz resolved_at
        timestamptz closed_at
        timestamptz first_response_at
        timestamp created_at
        timestamp updated_at
    }

    CM_SUPPORT_TICKET_HISTORY {
        uuid id PK
        uuid ticket_id FK
        text action
        text description
        text created_by
        timestamp created_at
    }

    CM_SUPPORT_AI_USAGE_LOGS {
        uuid id PK
        text endpoint
        text request_source
        text origin
        text client_ip_hash
        uuid requester_user_id
        uuid requester_client_id
        uuid requester_ticket_id
        text model
        integer prompt_chars
        integer prompt_tokens
        integer completion_tokens
        integer total_tokens
        numeric estimated_cost_eur
        integer latency_ms
        integer status_code
        boolean success
        text error_code
        text error_signature
        uuid auto_ticket_id FK
        text auto_ticket_status
        text auto_ticket_note
        timestamptz auto_ticket_processed_at
        timestamptz created_at
    }

    CM_ERROR_CORRECTIONS {
        uuid id PK
        uuid error_id FK
        text file_path
        text old_code
        text new_code
        text description
        text applied_by
        timestamptz applied_at
        text test_status
        jsonb test_results
    }

    AUTH_USERS ||--o{ CM_SUPPORT_TICKETS : "client_id → ouvre"
    CM_SUPPORT_TICKETS ||--o{ CM_SUPPORT_TICKET_HISTORY : "historise"
    CM_SUPPORT_TICKETS ||--o{ CM_SUPPORT_AI_USAGE_LOGS : "génère"
```

---

## Domaine Owner — Outils & Préférences

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
    }

    GITES {
        uuid id PK
    }

    TODOS {
        uuid id PK
        uuid owner_user_id FK
        uuid gite_id FK
        text title
        text description
        text category
        text status
        boolean completed
        timestamp completed_at
        timestamp archived_at
        timestamp created_at
        timestamp updated_at
    }

    USER_SETTINGS {
        uuid id PK
        uuid user_id FK
        integer draps_alert_weekday
        integer draps_alert_days_before
        text subscription_type
        boolean fiscalite_options_perso
        timestamp created_at
        timestamp updated_at
    }

    FISCAL_HISTORY {
        uuid id PK
        uuid owner_user_id FK
        integer year
        text regime
        text gite
        numeric revenus
        numeric charges
        numeric resultat
        jsonb donnees_detaillees
        timestamp created_at
        timestamp updated_at
    }

    NOTIFICATION_PREFERENCES {
        uuid id PK
        uuid user_id FK
        boolean email_enabled
        text email_address
        boolean notify_reservations
        boolean notify_taches
        boolean notify_demandes
        boolean notify_commandes
        boolean notify_menage_modifications
        text menage_company_email
        text email_frequency
        boolean push_enabled
        boolean sms_enabled
        jsonb notification_types
    }

    KM_CONFIG_AUTO {
        uuid id PK
        uuid owner_user_id FK
        boolean auto_menage_entree
        boolean auto_menage_sortie
        boolean auto_courses
        boolean auto_maintenance
        boolean creer_trajets_par_defaut
    }

    KM_TRAJETS {
        uuid id PK
        uuid owner_user_id FK
        uuid gite_id FK
        date date_trajet
        integer annee_fiscale
        string motif
        string type_trajet
        decimal distance_aller
        boolean aller_retour
        decimal distance_totale
        boolean auto_genere
    }

    AUTH_USERS ||--o{ TODOS : "crée"
    GITES ||--o{ TODOS : "associé à"
    AUTH_USERS ||--o| USER_SETTINGS : "configure"
    AUTH_USERS ||--o{ FISCAL_HISTORY : "historise"
    AUTH_USERS ||--o| NOTIFICATION_PREFERENCES : "paramètre"
    AUTH_USERS ||--o{ KM_CONFIG_AUTO : "configure"
    AUTH_USERS ||--o{ KM_TRAJETS : "enregistre"
    GITES ||--o{ KM_TRAJETS : "lié à"
```

---

## Domaine Ménage — Linge & Planning

```mermaid
erDiagram
    GITES {
        uuid id PK
    }

    RESERVATIONS {
        uuid id PK
    }

    LINEN_NEEDS {
        uuid id PK
        uuid owner_user_id FK
        uuid gite_id FK
        text item_key
        text item_label
        integer quantity
        boolean is_custom
        timestamp created_at
        timestamp updated_at
    }

    LINEN_STOCK_TRANSACTIONS {
        uuid id PK
        uuid owner_user_id FK
        uuid reservation_id FK
        uuid gite_id FK
        timestamptz processed_at
        timestamptz created_at
    }

    CLEANING_SCHEDULE {
        uuid id PK
        uuid owner_user_id FK
        uuid gite_id FK
        uuid reservation_id FK
        date date
        date scheduled_date
        text type
        text status
        text assignee_email
        text proposed_by
        boolean validated_by_company
        uuid validated_by
        timestamptz validated_at
        date reservation_end
        date reservation_start_after
        jsonb photos
        timestamp created_at
        timestamp updated_at
    }

    GITES ||--o{ LINEN_NEEDS : "configure"
    GITES ||--o{ LINEN_STOCK_TRANSACTIONS : "stock de"
    GITES ||--o{ CLEANING_SCHEDULE : "planifie"
    RESERVATIONS ||--o{ CLEANING_SCHEDULE : "génère"
```

---

## Vues (Views)

| Vue | Source | Description |
|-----|--------|-------------|
| `v_ca_prestations_mensuel` | `commandes_prestations` + `gites` | CA prestations agrégé par mois |
| `v_ca_prestations_annuel` | `commandes_prestations` + `gites` | CA prestations agrégé par année |
| `user_notification_preferences` | `notification_preferences` | Alias de compatibilité |
| `admin_communications` | `notifications` | Alias pour l'interface admin |
| `subscriptions_plans` | `cm_pricing_plans` | Alias de compatibilité |

---

## Règles Métier Critiques

| Règle | Table | Vérification |
|-------|-------|-------------|
| Un gîte = une seule réservation active à la fois | `reservations` | `check-overlapping-reservations.js` |
| Deux réservations ne démarrent pas le même jour sur un gîte | `reservations` | Contrainte applicative |
| Commission = 5% (configurable) | `commandes_prestations` | `system_config.commission_prestations_percent` |
| Token client dans URL ≠ auth Supabase | `reservations` | RLS via `app.reservation_token` |
