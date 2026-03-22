# Changelog — LiveOwnerUnit (Gestion_gite-calvignac)

Toutes les modifications notables sont documentées ici.
Format: [Semantic Versioning](https://semver.org/) — `vMAJOR.MINOR.PATCH`

---

## [v6.4.0] — 2026-03-22 (actuel)
### Added
- IA tarifaire sans ancrage prix — analyse concurrence pure
- Fonctions Supabase: confirm-commande-prestations, notify-cleaning-planning-change
- Migrations SQL: catégories hébergement, notifications ménage, RLS sécurité fiche client

### Fixed
- fiche-client: RPCs complets (gite info, demandes, checklist, retours) + policies anon read
- fiche-client: RPC SECURITY DEFINER (contourne Kong/PostgREST)
- fiche-client: split requête token/réservation (contourne RLS embedded join)
- Guardrails IA prixBase — fourchette basée capacité, zéro hallucination prix
- fallback plancher absolu prixBase (faible-1.00, standard-1.10)

---

## [v6.2.0-rollback] — 2026-02
### Notes
- Rollback suite à instabilité détectée en production

---

## [v5.2.0-security-phase2] — 2026-01
### Security
- Phase 2 sécurité RLS — durcissement tables channel manager

---

## [v5.1.0-security-phase1] — 2025-12
### Security
- Phase 1 sécurité RLS — authentification et autorisation

---

## [v3.0-phase3-complete] — 2025-10
### Added
- Phase 3 complète — fonctionnalités avancées de gestion

---

## [v1.0.0-stable] — 2025-06
### Added
- Version stable initiale — 4 gîtes (Trévoux, Couzon, 3ème, 4ème)
- Dashboard, Réservations, Tâches Kanban, Stats, Prestations
- Intégration Airbnb, fiscal, ménage, draps, communauté

