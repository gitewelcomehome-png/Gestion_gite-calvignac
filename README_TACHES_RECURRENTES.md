# 🛠️ Guide d'activation des tâches récurrentes

## ⚠️ Important : SQL requis

Les tâches récurrentes ne fonctionneront **PAS** tant que vous n'aurez pas exécuté le script SQL dans Supabase.

## 📋 Étapes d'activation

### 1. Ouvrir Supabase Dashboard

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Cliquer sur "SQL Editor" dans le menu de gauche

### 2. Copier le script SQL

Le fichier `sql/add_recurrent_to_todos.sql` contient toutes les colonnes nécessaires.

**Copiez-collez ce script complet :**

```sql
-- Ajouter les colonnes pour gérer la récurrence directement dans todos
ALTER TABLE todos ADD COLUMN IF NOT EXISTS is_recurrent BOOLEAN DEFAULT false;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS frequency VARCHAR(20); -- 'weekly', 'biweekly', 'monthly'
ALTER TABLE todos ADD COLUMN IF NOT EXISTS frequency_detail JSONB; -- ex: {"day_of_week": 1} pour lundi
ALTER TABLE todos ADD COLUMN IF NOT EXISTS next_occurrence TIMESTAMP WITH TIME ZONE;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS last_generated TIMESTAMP WITH TIME ZONE;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_todos_recurrent ON todos(is_recurrent);
CREATE INDEX IF NOT EXISTS idx_todos_next_occurrence ON todos(next_occurrence);

-- Commentaires pour documentation
COMMENT ON COLUMN todos.is_recurrent IS 'Indique si cette tâche doit se régénérer automatiquement';
COMMENT ON COLUMN todos.frequency IS 'Fréquence de récurrence: weekly, biweekly, monthly';
COMMENT ON COLUMN todos.frequency_detail IS 'Détails de la fréquence (jour de la semaine, etc.)';
COMMENT ON COLUMN todos.next_occurrence IS 'Date de la prochaine génération automatique';
COMMENT ON COLUMN todos.last_generated IS 'Date de la dernière génération automatique';
```

### 3. Exécuter le script

1. Coller le script dans l'éditeur SQL
2. Cliquer sur "Run" (ou Ctrl+Enter)
3. Attendre le message de succès

### 4. Vérifier que ça fonctionne

1. Aller dans le Dashboard
2. Cliquer sur "+" dans n'importe quelle catégorie de tâches
3. Saisir un titre
4. **Une popup devrait apparaître : "Cette tâche doit-elle se répéter automatiquement ?"**
5. Cliquer "OK"
6. Choisir la fréquence (1/2/3)
7. Si hebdomadaire, choisir le jour

✅ Si vous voyez ces popups, **c'est bon !**

## 🎯 Comment utiliser les tâches récurrentes

### Exemple 1 : Vérifier les réservations tous les lundis

1. Dashboard → Réservations → "+"
2. Titre : "Vérifier réservations de la semaine"
3. Description : "Contrôler paiements et envoyer fiches"
4. Récurrent ? → **OUI**
5. Fréquence → **1** (hebdo)
6. Jour → **1** (lundi)

→ Badge 🔁 Récurrent + "Hebdo" apparaît sur la tâche

### Exemple 2 : Inventaire produits toutes les 2 semaines

1. Dashboard → Achats → "+"
2. Titre : "Inventaire produits d'entretien"
3. Récurrent ? → **OUI**
4. Fréquence → **2** (bi-hebdo)

### Exemple 3 : Contrôle qualité mensuel

1. Dashboard → Travaux → "+"
2. Titre : "Contrôle qualité gîte"
3. Gîte → **1** (Trévoux)
4. Récurrent ? → **OUI**
5. Fréquence → **3** (mensuel)
6. Jour du mois → **1** (premier du mois)

## 🔄 Comment ça fonctionne ?

### Quand vous cochez une tâche récurrente :

1. ✅ La tâche actuelle est **archivée** (date + heure)
2. ➕ Une **nouvelle tâche identique** est créée automatiquement
3. 📅 La nouvelle tâche est programmée pour la prochaine occurrence
4. 🔁 Le badge "Récurrent" reste visible

### Cycle de vie :

```
Tâche créée
    ↓
Badge 🔁 visible
    ↓
Vous cochez ✅
    ↓
Archive + Nouvelle tâche créée
    ↓
Recommence le cycle
```

## 🎨 Badges visuels

- **🔁 Récurrent** : Badge violet, indique que la tâche se régénère
- **Hebdo / Bi-hebdo / Mensuel** : Tag de fréquence (fond mauve clair)

## ❓ FAQ

### Q: Pourquoi je ne vois pas la popup "récurrent" ?

**R:** Le script SQL n'a pas été exécuté. Les colonnes `is_recurrent`, `frequency`, etc. n'existent pas encore dans la table `todos`.

→ **Solution :** Exécuter le script SQL ci-dessus

### Q: La tâche ne se régénère pas quand je la coche

**R:** Deux possibilités :
1. Le script SQL n'a pas été exécuté
2. La tâche n'a pas été créée comme récurrente (le badge 🔁 n'apparaît pas)

→ **Solution :** Supprimer la tâche et la recréer en choisissant "récurrent"

### Q: Je veux modifier la fréquence d'une tâche récurrente

**R:** Actuellement, il faut :
1. Supprimer l'ancienne tâche
2. En créer une nouvelle avec la nouvelle fréquence

### Q: La tâche apparaît en double

**R:** C'est normal si vous avez coché la tâche ! La logique est :
- Tâche cochée = archivée (va dans Archives)
- Nouvelle tâche créée = visible dans Dashboard

Les deux tâches existent bien, mais seule la nouvelle est active.

## 🔍 Vérifier l'état des colonnes SQL

Si vous avez un doute, vous pouvez vérifier dans Supabase :

```sql
-- Vérifier les colonnes de la table todos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'todos'
ORDER BY ordinal_position;
```

Vous devriez voir :
- `is_recurrent` (boolean)
- `frequency` (character varying)
- `frequency_detail` (jsonb)
- `next_occurrence` (timestamp with time zone)
- `last_generated` (timestamp with time zone)

## 🚀 Prêt à tester ?

1. ✅ Script SQL exécuté ?
2. ✅ Dashboard ouvert ?
3. ✅ Cliquer sur "+" dans une catégorie
4. ✅ Tester la création d'une tâche récurrente

Si vous ne voyez pas la popup récurrent, c'est que le SQL n'est pas exécuté ! 😉
