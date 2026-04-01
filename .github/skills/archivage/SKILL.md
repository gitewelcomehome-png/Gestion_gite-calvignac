---
name: archivage
description: 'Archivage et nettoyage du projet Gestion Gîte Calvignac. Utiliser pour : nettoyer des fichiers SQL exécutés, archiver du code obsolète, vider le dossier tmp/, identifier les fichiers inutiles à la racine, organiser les backups, décider quoi garder vs archiver vs supprimer. Politique darchivage cohérente pour maintenir le projet propre en production.'
argument-hint: 'Décris ce que tu veux nettoyer ou archiver (ex: fichiers SQL exécutés, fichiers de debug, vieux backups)'
---

# Archivage — Gestion Gîte Calvignac

> Ne jamais supprimer définitivement sans archiver d'abord. Toujours utiliser `_archives/` comme filet de sécurité.

---

## Règle Fondamentale

**Supprimer = risque de data loss. Archiver = réversible.**

Avant toute suppression de fichier :
1. Vérifier que le fichier n'est référencé nulle part (`grep_search` sur le nom du fichier)
2. Déplacer dans `_archives/` avec sa date d'archivage
3. Confirmer que l'application fonctionne toujours
4. Supprimer définitivement seulement après validation en production

---

## Structure d'Archivage

```
_archives/
├── sql/          ← Fichiers SQL exécutés en production
├── js/           ← Anciens modules JS remplacés
├── css/          ← Anciens styles remplacés
├── api/          ← Anciennes routes API remplacées
└── pages/        ← Anciennes pages remplacées
```

---

## Quoi Archiver

### Fichiers SQL (`/sql/`)

**Archiver** après exécution confirmée en production :
- Fichiers de migration one-shot (`MIGRATION_xxx.sql`, `FIX_xxx.sql`)
- Fichiers de setup initial (`SETUP_xxx.sql`, `INSERT_xxx.sql`)
- Fichiers de diagnostic utilisés une seule fois

**Garder actif** :
- Scripts de rebuild (`sql/rebuild/`) — utilisés en cas de reconstruction complète
- Scripts de vérification récurrents (`sql/checks/`)
- Migrations de référence (`sql/core/`)

**Convention de nommage en archive** :
```
_archives/sql/MIGRATION_ABONNEMENTS_6_PLANS_2026-03-23.sql  ← date dans le nom
```

### Fichiers JS (`/js/`)

**Archiver** si :
- Un module a été remplacé par une version v2 (ex: `sync-ical.js` → `sync-ical-v2.js`)
- Un fichier de test ou de debug temporaire
- Du code expérimental qui n'est plus référencé dans aucun HTML

**Ne jamais supprimer sans grep** :
```
grep_search sur le nom du fichier dans tous les .html et .js
```

### Dossier `tmp/`

Vider à chaque nettoyage — ce dossier est destiné aux fichiers temporaires.
Ne rien laisser dans `tmp/` en production.

### Fichiers à la racine

Signaux d'alerte à investiguer :
- Fichiers `.sql` à la racine (doivent être dans `/sql/`)
- Fichiers `.txt` ou `.log` de debug
- Fichiers nommés `test_xxx`, `debug_xxx`, `temp_xxx`

---

## Workflow de Nettoyage

### 1. Inventaire

Lister les candidats à l'archivage :
- Fichiers SQL dans `/sql/` dont la date est > 30 jours et qui sont des `FIX_` ou `MIGRATION_`
- Fichiers dans `tmp/` (tout vider)
- Fichiers JS non référencés dans aucun HTML

### 2. Vérification des références

Pour chaque fichier candidat :
```
grep_search("[nom-du-fichier]") dans tout le projet
```
Si aucune référence → candidat confirmé pour archivage.

### 3. Archivage

```bash
# Déplacer vers _archives/ en conservant la structure
mv sql/FIX_xxx.sql _archives/sql/FIX_xxx.sql
```

### 4. Test post-nettoyage

Après archivage :
- Vérifier que l'application charge sans erreur
- Vérifier les routes API (`/api/`)
- Consulter la console navigateur : zéro erreur 404 sur des fichiers manquants

### 5. Documenter

Mettre à jour `docs/ARCHITECTURE.md` si une table ou fonctionnalité a été supprimée.

---

## Backups (`_backups/`)

Le dossier `_backups/` contient les snapshots de la base de données. Consulter `_backups/README_BACKUPS.md` pour la politique de rétention.

- Ne jamais supprimer un backup de moins de 90 jours
- Les backups avant une migration majeure sont à conserver indéfiniment
- Nommer les backups avec la date ISO : `backup_YYYY-MM-DD_description.sql`

---

## Ce que ce Skill ne Fait PAS

- Il ne supprime pas sans archiver d'abord
- Il ne touche pas aux fichiers de configuration Vercel/Supabase
- Il ne modifie pas `docs/ARCHITECTURE.md` sans avoir vérifié le schéma courant
