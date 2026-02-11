# Nettoyage du Projet - 10 Février 2026

## Objectif
Nettoyage des fichiers temporaires, de test et de debug pour maintenir la propreté du projet en production.

## Fichiers Archivés

### SQL (15 fichiers)
Fichiers de test, debug, diagnostic et vérification qui ne sont plus nécessaires :
- `diagnostic_promotions_trevoux.sql` - Diagnostic promotions spécifique
- `inspect_tarifs_format.sql` - Inspection format tarifs
- `verify_and_load_tarifs.sql` - Vérification et chargement tarifs
- `parrainage_test_data.sql` - Données de test parrainage
- `verify_shopping_tables.sql` - Vérification tables shopping
- `parrainage_campaigns_test_data.sql` - Données de test campagnes
- `debug_auth.sql` - Debug authentification
- `DIAGNOSTIC_IA.sql` - Diagnostic IA
- `DEBUG_STRUCTURE_DEMANDES_28JAN2026.sql` - Debug structure demandes
- `TEST_CHANNEL_MANAGER_TABLES.sql` - Test tables channel manager
- `TEST_CREATE_TICKET.sql` - Test création tickets
- `VERIFY_CLIENT_POLICIES.sql` - Vérification policies clients
- `verifier_promotions_existantes.sql` - Vérification promotions
- `requetes_fiscal_history.sql` - Requêtes historique fiscal
- `log_correction_07feb2026.sql` - Log correction temporaire

### HTML (1 fichier)
- `pages/test-auth-shopping.html` - Page de test authentification shopping

### Markdown (1 fichier)
- `CORRECTION_ERREURS_CONSOLE_06FEB2026.md` - Document temporaire de corrections

### Dossiers Supprimés
- `_archives/sql_20jan2026/` - SQL redondants déjà sauvegardés dans _backups

## Fichiers Conservés

### SQL Utiles (Conservés dans sql/)
- Scripts de création de tables principales (CREATE_*)
- Scripts de migration (patches/)
- Scripts de sécurité (securite/)
- Scripts de système de parrainage (parrainage_system.sql, etc.)
- Scripts de fix RLS et permissions
- Scripts de restauration

### Documents MD Utiles (Conservés à la racine)
- `README.md` - Documentation principale
- `GUIDE_COMPLET_FONCTIONNALITES.md` - Guide des fonctionnalités
- `DOCUMENTATION_SYSTEME_PARRAINAGE.md` - Documentation système parrainage
- `GUIDE_MONITORING_TICKETS.md` - Guide monitoring tickets
- `REFERENCE_TECHNIQUE_APPLICATION_MOBILE.md` - Référence technique app mobile
- `SPECIFICATIONS_APPLICATION_APPLE.md` - Spécifications app Apple
- `SYSTEME_ANTI_DOUBLONS.md` - Documentation anti-doublons

## Raison du Nettoyage
Suite aux instructions Copilot :
> Maintenir le dossier **toujours propre**  
> Archiver dans `_archives/` plutôt que de laisser traîner  
> Nettoyer les fichiers temporaires ou de test après usage

## Restauration
En cas de besoin, tous les fichiers archivés sont disponibles dans :
```
_archives/nettoyage_10feb2026/
├── sql/      (15 fichiers)
├── html/     (1 fichier)
└── md/       (1 fichier)
```

## Prochaines Actions
- Continuer à archiver les fichiers temporaires après usage
- Supprimer les logs et fichiers de debug obsolètes
- Maintenir uniquement les SQL de production dans sql/
