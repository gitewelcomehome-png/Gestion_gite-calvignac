# 📦 Archives - Fichiers Obsolètes

Ce dossier contient tous les fichiers qui ne sont plus utilisés dans l'application principale.

## 📁 Structure

### `js_obsoletes/`
- **sauvegarde.js** - Module de sauvegarde locale remplacé par Supabase

### `tabs_obsoletes/`
- **tab-sauvegarde.html** - Interface de sauvegarde locale obsolète

### `backups/`
- **index.html.backup** - Backup manuel de l'ancien index.html
- **index.html.backup_20251226_165941** - Backup automatique du 26/12/2025

### `scripts_obsoletes/`
Scripts Node.js utilisés pour l'initialisation unique des données :
- **check_coordinates.html** - Vérification coordonnées GPS
- **configure_gites.js** - Configuration initiale des gîtes
- **geocode_missing.js** - Géocodage automatique des activités
- **process_all.js** - Script d'exécution globale
- **search_pois.js** - Recherche POIs Google Places
- **insert_commit_log.js** - Injection logs de commits
- **log_commit.sh** - Script de logging Git
- Fichiers de logs : config_gites_log.txt, config_output.txt, geocode_log.txt

### `docs_obsoletes/`
Documentation de setup et guides d'installation (une fois terminé) :
- Guides de déploiement Vercel
- Instructions de géocodage
- Guides de finalisation
- Documentation structure SQL
- Système de logging commits
- Modifications et validations

## ⚠️ Important

Ces fichiers sont conservés pour référence historique mais ne sont plus utilisés dans l'application.
**Ne pas supprimer** sauf si vous êtes certain de ne plus en avoir besoin.

---

**Date d'archivage :** 26 décembre 2025  
**Raison :** Nettoyage après migration complète vers Supabase et modularisation du code
