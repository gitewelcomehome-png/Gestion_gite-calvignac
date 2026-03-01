# Note de release sécurité — 23/02/2026

- Clôture du hardening RLS : `FORCE RLS` validé, policies anon fiche-client en `RESTRICTIVE`, helper admin durci effectif.
- Durcissement runtime : enforcement CORS par défaut sur `api/openai.js`, `api/send-email.js`, `api/cors-proxy.js`, `api/content-ai.js`.
- Réduction surface XSS : suppression de l’exécution automatique des scripts injectés dans `js/security-utils.js` (mode `trusted`).
- Clôture globale du lot XSS admin : suppression des handlers inline restants sur le périmètre actif (`admin-content`, `admin-clients`, `admin-emails`, `admin-parrainage`, `admin-promotions`, `admin-ticket-workflow` + reliquats), avec validation finale à `0` handlers inline sur `admin-*.html/js` (hors archives/backups).
- Scores officiels mis à jour : sécurité technique `98/100`, sécurité consolidée `99/100`, RGPD `86/100`, criticité `1 majeur`.
- Références alignées : `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`, `pages/admin-security-audit.html`, `docs/ARCHITECTURE.md`, `docs/architecture/ERREURS_CRITIQUES.md`.
