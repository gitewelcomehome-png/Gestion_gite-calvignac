# Migration : Ajout colonnes Reste à Vivre

## Date
2 janvier 2026

## Description
Ajout des colonnes nécessaires pour sauvegarder les données de la section "Reste à vivre après crédits" dans la table `simulations_fiscales`.

## Nouvelles colonnes

### 1. Liste des crédits
- **credits_liste** (JSONB) : Stocke la liste des crédits avec description, mensualité et capital restant dû

### 2. Frais personnels mensuels
- **frais_perso_internet** (DECIMAL) : Frais internet mensuel
- **frais_perso_electricite** (DECIMAL) : Frais électricité mensuel
- **frais_perso_eau** (DECIMAL) : Frais eau mensuel
- **frais_perso_assurance** (DECIMAL) : Frais assurance mensuel
- **frais_perso_taxe** (DECIMAL) : Taxes annuelles (mensua lisées dans les calculs)
- **frais_perso_autres** (DECIMAL) : Autres frais personnels mensuels

## Application de la migration

### Via Supabase Dashboard
1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez-collez le contenu du fichier `sql/add_reste_a_vivre_columns.sql`
4. Exécutez la requête

### Via CLI Supabase
```bash
supabase db push sql/add_reste_a_vivre_columns.sql
```

### Via psql
```bash
psql -h YOUR_HOST -U postgres -d YOUR_DATABASE -f sql/add_reste_a_vivre_columns.sql
```

## Vérification
Pour vérifier que les colonnes ont bien été ajoutées :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'simulations_fiscales' 
  AND column_name LIKE 'frais_perso_%' 
   OR column_name = 'credits_liste'
ORDER BY column_name;
```

## Impact sur le code
Les fichiers suivants ont été mis à jour pour gérer ces nouvelles colonnes :

- **js/fiscalite-v2.js** :
  - Fonction `sauvegarderSimulation()` : Ajout des nouveaux champs dans l'objet de sauvegarde
  - Fonction `chargerDerniereSimulation()` : Ajout du chargement des nouveaux champs
  - Restauration de la liste des crédits

- **tabs/tab-fiscalite-v2.html** : 
  - Section "Reste à vivre après crédits" déjà présente avec tous les champs

## Notes
- Les colonnes utilisent `IF NOT EXISTS` pour éviter les erreurs en cas de double exécution
- Toutes les colonnes ont des valeurs par défaut (0 pour les DECIMAL, '[]' pour JSONB)
- Les commentaires SQL documentent l'usage de chaque colonne
