---
name: supabase-migration
description: 'Migrations SQL Supabase sécurisées pour le projet Gestion Gîte Calvignac. Utiliser pour : créer une nouvelle table, ajouter une colonne, modifier le schéma, configurer RLS, créer une RPC/fonction, nettoyer les fichiers SQL exécutés, débloquer une erreur de migration. Workflow écrire → valider → déployer → nettoyer.'
argument-hint: 'Décris la modification de schéma souhaitée (ex: ajouter une colonne statut à la table reservations, créer une table km_logs)'
---

# Supabase Migration — Gestion Gîte Calvignac

> Base de données en **production**. Toute migration mal écrite peut corrompre des données clients réels.

---

## Workflow Obligatoire

### Étape 1 — Analyser l'Existant

Avant d'écrire du SQL :
1. Consulter `docs/ARCHITECTURE.md` → section "Base de Données" pour le schéma actuel
2. Vérifier que la table/colonne n'existe pas déjà
3. Identifier les tables liées (FK potentielles)
4. Vérifier si une RLS (Row Level Security) existe déjà sur la table cible

### Étape 2 — Nommer le Fichier

Convention stricte :
```
sql/MIGRATION_[DESCRIPTION]_[YYYY-MM-DD].sql
```

Exemples :
```
sql/MIGRATION_ADD_STATUT_RESERVATIONS_2026-03-28.sql
sql/MIGRATION_CREATE_TABLE_KM_LOGS_2026-03-28.sql
sql/FIX_RLS_GITES_2026-03-28.sql
```

### Étape 3 — Écrire la Migration

Toujours écrire en mode **idempotent** (peut être rejoué sans erreur) :

```sql
-- ✅ Idempotent — ne plante pas si la colonne existe déjà
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS statut VARCHAR(50) DEFAULT 'confirmee';

-- ✅ Idempotent pour les tables
CREATE TABLE IF NOT EXISTS km_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  distance_km DECIMAL(8,2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ Idempotent pour les indexes
CREATE INDEX IF NOT EXISTS idx_km_logs_user_id ON km_logs(user_id);
```

### Étape 4 — Configurer RLS

**Toute nouvelle table doit avoir RLS activé et des politiques définies :**

```sql
-- Activer RLS
ALTER TABLE km_logs ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs ne voient que leurs propres lignes
CREATE POLICY "Users see own km_logs"
  ON km_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own km_logs"
  ON km_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Tables accessibles aux admins via service_role uniquement → pas de politique SELECT public.**

### Étape 5 — Exécuter

```bash
# Via psql
psql "$DATABASE_URL" -f sql/MIGRATION_XXX.sql

# Ou coller directement dans l'éditeur SQL Supabase Dashboard
```

### Étape 6 — Valider

Après exécution :
- [ ] La table/colonne apparaît bien dans le Dashboard Supabase
- [ ] Les politiques RLS sont actives (onglet "Authentication > Policies")
- [ ] Tester depuis l'application que les données sont accessibles/modifiables
- [ ] Vérifier qu'aucune requête existante n'est cassée

### Étape 7 — Mettre à Jour la Documentation ⚠️ OBLIGATOIRE

Ces mises à jour sont **non négociables** après chaque migration exécutée en production :

**`docs/ARCHITECTURE.md`** — section "Base de Données" :
- Nouvelle table : ajouter le bloc SQL complet (colonnes, types, indexes)
- Nouvelle colonne : mettre à jour le bloc SQL de la table concernée
- Suppression : retirer la ligne + noter dans "Bugs Connus & Solutions" si breaking change
- Nouvelle vue/RPC : ajouter dans la section correspondante
- Mettre à jour la version (`**Version :**`) et la `**Dernière MAJ :**`

**`docs/architecture/database-uml.md`** — diagramme Mermaid :
- Nouvelle table → ajouter l'entité dans le bon domaine (Core / E-Commerce / SaaS / Support / Owner / Ménage)
- Nouvelle FK → ajouter la relation `||--o{` entre les entités concernées
- Table supprimée → retirer l'entité et toutes ses relations
- Nouvelle vue → mettre à jour le tableau "Vues (Views)"
- Nouvelle règle métier → mettre à jour le tableau "Règles Métier Critiques"

**`docs/architecture/ERREURS_CRITIQUES.md`** (si applicable) :
- Si la migration corrige un bug connu → documenter la solution appliquée

### Étape 8 — Archiver le Fichier SQL

Une fois la migration exécutée et validée en production :
```
sql/ → _archives/sql/MIGRATION_XXX.sql
```
Garder uniquement les fichiers SQL de référence et les scripts de rebuild dans `sql/`.

---

## Patterns Courants

### Ajouter une colonne avec valeur par défaut
```sql
ALTER TABLE gites ADD COLUMN IF NOT EXISTS couleur VARCHAR(7) DEFAULT '#3B82F6';
```

### Créer une RPC (fonction PostgreSQL)
```sql
CREATE OR REPLACE FUNCTION get_reservations_count(p_gite_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM reservations WHERE gite_id = p_gite_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

### Ajouter un index de performance
```sql
CREATE INDEX IF NOT EXISTS idx_reservations_gite_dates
  ON reservations(gite_id, date_debut, date_fin);
```

---

## Règles Métier à Respecter

- Un gîte ne peut avoir qu'**une réservation active à la fois** → vérifier les contraintes existantes
- Ne jamais supprimer une colonne sans vérifier qu'elle n'est plus utilisée dans le code JS
- Les suppressions de données sont irréversibles → préférer un flag `archived_at` à un DELETE

---

## Débloquer une Erreur Courante

| Erreur | Cause | Solution |
|--------|-------|----------|
| `column already exists` | Migration non idempotente | Ajouter `IF NOT EXISTS` |
| `relation does not exist` | Mauvais ordre de création | Créer les tables dans l'ordre des dépendances FK |
| `permission denied` | RLS trop restrictif | Vérifier les politiques ou utiliser `service_role` |
| `violates foreign key constraint` | Données orphelines | Nettoyer les données avant d'ajouter la FK |
