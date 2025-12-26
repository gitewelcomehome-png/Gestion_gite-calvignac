# 📝 Système de Logging des Commits

## Vue d'ensemble

Ce système enregistre automatiquement chaque commit dans Supabase et affiche le dernier commit sur l'interface web.

## Composants

### 1. Table Supabase : `commits_log`
```sql
CREATE TABLE commits_log (
    id SERIAL PRIMARY KEY,
    commit_ref VARCHAR(40) NOT NULL,
    commit_date TIMESTAMP NOT NULL DEFAULT NOW(),
    resume TEXT NOT NULL
);
```

### 2. Script Node.js : `insert_commit_log.js`
Enregistre un commit dans Supabase via l'API REST.

**Usage :**
```bash
node insert_commit_log.js <ref> <message>
```

**Exemple :**
```bash
node insert_commit_log.js abc1234 "Ajout de nouvelles fonctionnalités"
```

### 3. Script Bash : `log_commit.sh`
Wrapper pratique pour enregistrer le dernier commit.

**Usage :**
```bash
./log_commit.sh "Message personnalisé"
# ou
./log_commit.sh  # utilise le message du dernier commit
```

### 4. Hook Git : `.git/hooks/post-commit`
S'exécute **automatiquement** après chaque `git commit` pour enregistrer dans Supabase.

### 5. Interface Web : Bouton "📝 Dernier commit"
- Positionné en haut à gauche de la page
- Charge dynamiquement le dernier commit depuis Supabase
- Affiche au survol :
  - Référence du commit
  - Date et heure
  - Résumé/message

## Installation

### Créer la table dans Supabase
Exécutez le fichier SQL :
```bash
# Via l'interface Supabase SQL Editor
sql/create_commits_log_table.sql
```

### Rendre les scripts exécutables
```bash
chmod +x log_commit.sh
chmod +x .git/hooks/post-commit
```

## Utilisation

### Enregistrement Automatique
Rien à faire ! Chaque `git commit` enregistre automatiquement dans Supabase.

```bash
git add fichier.js
git commit -m "Ajout d'une fonctionnalité"
# ✅ Automatiquement enregistré dans Supabase !
```

### Enregistrement Manuel
Si besoin d'enregistrer un commit spécifique :

```bash
./log_commit.sh "Description du changement"
```

### Vérification sur l'interface
1. Ouvrez l'application web
2. Survolez le bouton "📝 Dernier commit" en haut à gauche
3. Visualisez les informations du dernier commit

## Dépannage

### Le bouton affiche "Erreur de chargement"
- Vérifiez que la table `commits_log` existe dans Supabase
- Vérifiez les credentials Supabase dans `index.html`

### Le hook ne s'exécute pas
```bash
# Vérifier que le hook est exécutable
chmod +x .git/hooks/post-commit

# Tester manuellement
.git/hooks/post-commit
```

### Erreur réseau
Vérifiez votre connexion internet et que l'URL Supabase est correcte.

## Architecture

```
┌─────────────────┐
│   git commit    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  post-commit    │ (hook Git)
│      hook       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ insert_commit   │
│    _log.js      │ (Script Node.js)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Supabase     │
│  commits_log    │ (Table)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   index.html    │ (Affichage web)
│  Bouton commit  │
└─────────────────┘
```

## Exemples de commits enregistrés

| Ref     | Date                | Résumé                                    |
|---------|---------------------|-------------------------------------------|
| f8f95d1 | 2025-12-26 14:30:00 | Fix: Correction structure HTML            |
| abc1234 | 2025-12-26 15:45:00 | Feat: Ajout système de logging            |
| def5678 | 2025-12-26 16:20:00 | Docs: Mise à jour de la documentation    |

## Notes

- Le système utilise **Supabase** (pas de PostgreSQL local)
- Les commits sont enregistrés avec leur **hash court** (7 caractères)
- La **date est automatique** (heure du serveur Node.js)
- Le **message complet** du commit est enregistré (multiligne supporté)
