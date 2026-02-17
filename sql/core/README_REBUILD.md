# 🔄 SQL Reconstruction Complète Base de Données

## 📋 Fichier de Reconstruction

### REBUILD_COMPLETE_DATABASE.sql + REBUILD_COMPLETE_DATABASE_PART2.sql

**Usage : Script de reconstruction complète de la base de données en cas de catastrophe**

#### Description
Ces deux fichiers SQL permettent de recréer **l'intégralité** de la base de données LiveOwnerUnit de zéro :
- ✅ 52 tables production
- ✅ Tous les indexes
- ✅ Triggers et functions
- ✅ Politiques RLS complètes
- ✅ Vues utiles

#### Quand l'utiliser ?
- 🚨 **Catastrophe majeure** (perte BDD complète)
- 🔄 **Reset complet** environnement de développement
- 📦 **Déploiement nouvelle instance** Supabase
- 🧪 **Création BDD test** identique à production

#### Comment l'utiliser ?

```bash
# 1. Connexion Supabase
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# 2. Exécution PARTIE 1
\i REBUILD_COMPLETE_DATABASE.sql

# 3. Exécution PARTIE 2
\i REBUILD_COMPLETE_DATABASE_PART2.sql
```

Ou via l'interface Supabase SQL Editor :
1. Copier le contenu de REBUILD_COMPLETE_DATABASE.sql
2. Exécuter dans SQL Editor
3. Copier le contenu de REBUILD_COMPLETE_DATABASE_PART2.sql
4. Exécuter dans SQL Editor

#### ⚠️ AVERTISSEMENTS

- ⛔ **DESTRUCTIF** : Supprime TOUTES les tables existantes
- ⛔ **PERTE DONNÉES** : Aucune donnée n'est conservée
- ⛔ **PRODUCTION INTERDITE** sauf catastrophe majeure validée
- ✅ **BACKUP OBLIGATOIRE** avant toute exécution

#### Structure 

**PARTIE 1** (REBUILD_COMPLETE_DATABASE.sql) :
- Extensions PostgreSQL
- Drop complet (44 tables)
- Groupe 1 : Core (gites, reservations)
- Groupe 2 : Fiches clients (infos_gites, checklist, faq, tokens, activites)
- Groupe 3 : Ménage (cleaning_schedule, rules, retours, problemes)
- Groupe 4 : Fiscalité (simulations, km_trajets, config, favoris)
- Groupe 5 : Stocks linge (linen_stocks, items, transactions)

**PARTIE 2** (REBUILD_COMPLETE_DATABASE_PART2.sql) :
- Groupe 6 : Channel Manager SaaS (15 tables)
- Groupe 7 : Support & Monitoring (5 tables)
- Groupe 8 : Divers (5 tables)
- Triggers & Functions
- RLS Policies complètes
- Vues utiles
- Validation finale

#### 📊 Temps d'exécution
- Durée estimée : **~30 secondes** sur Supabase
- Tables créées : **52**
- Indexes créés : **~120**
- Triggers : **5**
- Policies RLS : **~200**

#### 🗂️ Fichiers Archivés

Les anciens patches/fixes ponctuels ont été archivés dans :
- `_archives/sql_obsoletes_2026/`

Ces fichiers ne sont plus nécessaires car toutes les corrections sont maintenant intégrées dans le schéma REBUILD complet.

#### Maintenance

**Version** : 5.0 (Février 2026)
**Dernière mise à jour** : 11 février 2026
**Maintenu par** : GitéWelcomeHome

⚠️ **Ce fichier DOIT être mis à jour** à chaque modification du schéma de production
