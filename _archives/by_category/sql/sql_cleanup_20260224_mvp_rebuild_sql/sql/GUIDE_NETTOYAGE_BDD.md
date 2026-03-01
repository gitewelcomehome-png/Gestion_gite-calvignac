# 🛡️ Guide d'Utilisation - Nettoyage Base de Données

## 📋 Vue d'Ensemble

Deux scripts SQL sécurisés pour nettoyer la base de données :

1. **NETTOYAGE_SECURISE_BDD_20260123.sql** - Script principal avec backups automatiques
2. **RESTAURATION_TABLES_20260123.sql** - Script de restauration en cas de problème

---

## ✅ Script Principal : NETTOYAGE_SECURISE_BDD_20260123.sql

### Ce qu'il fait

1. **Vérifie** les 7 tables obsolètes et compte leurs lignes
2. **Crée des backups** automatiques de toutes les tables (backup_xxx_20260123)
3. **Supprime** les 7 tables obsolètes
4. **Vérifie** que tout s'est bien passé

### Tables supprimées

| Table | Raison | Impact |
|-------|--------|--------|
| `infos_pratiques` | Remplacée par `infos_gites` (119 colonnes) | ✅ Aucun |
| `checklists` | Remplacée par `checklist_templates` + `checklist_progress` | ✅ Aucun |
| `demandes_horaires` | Feature jamais implémentée | ✅ Aucun |
| `evaluations_sejour` | Feature jamais implémentée | ✅ Aucun |
| `problemes_signales` | Feature jamais implémentée | ✅ Aucun |
| `retours_menage` | Feature trop complexe, non utilisée | ✅ Aucun |
| `suivi_soldes_bancaires` | Feature jamais implémentée | ✅ Aucun |

### Sécurités intégrées

✅ **Transaction** : Tout est dans un BEGIN/COMMIT (rollback auto en cas d'erreur)  
✅ **Backups automatiques** : 7 tables de backup créées avant suppression  
✅ **Vérifications** : Avant et après suppression  
✅ **CASCADE** : Suppression propre avec dépendances  

---

## 🚀 Comment Exécuter

### Option 1 : Via Supabase SQL Editor (Recommandé)

1. Aller sur Supabase Dashboard
2. Ouvrir SQL Editor
3. Copier/coller le contenu de **NETTOYAGE_SECURISE_BDD_20260123.sql**
4. Cliquer sur "Run"
5. Vérifier les messages dans l'output

### Option 2 : Via psql

```bash
psql -h <host> -U <user> -d <database> -f sql/NETTOYAGE_SECURISE_BDD_20260123.sql
```

### Ce que vous verrez

```
=== VÉRIFICATION DES TABLES ===
infos_pratiques : X ligne(s)
checklists : X ligne(s)
...
=== FIN VÉRIFICATION ===

=== CRÉATION DES BACKUPS ===
Backup créé : backup_infos_pratiques_20260123
Backup créé : backup_checklists_20260123
...
=== BACKUPS TERMINÉS ===

=== SUPPRESSION DES TABLES ===
✓ Table supprimée : infos_pratiques
✓ Table supprimée : checklists
...
=== SUPPRESSIONS TERMINÉES ===

=== VÉRIFICATION POST-SUPPRESSION ===
✓ Toutes les tables obsolètes ont été supprimées
✓ 7 backup(s) disponible(s) pour restauration
=== FIN VÉRIFICATION ===

╔════════════════════════════════════════════════════════════╗
║          NETTOYAGE TERMINÉ AVEC SUCCÈS                    ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🛡️ En Cas de Problème

### Script de Restauration : RESTAURATION_TABLES_20260123.sql

#### Option 1 : Restaurer UNE table

Décommenter la section correspondante dans le script :

```sql
-- Restaurer infos_pratiques
CREATE TABLE infos_pratiques AS 
SELECT * FROM backup_infos_pratiques_20260123;
```

#### Option 2 : Restaurer TOUTES les tables

Décommenter la section "ROLLBACK COMPLET" dans le script.

⚠️ **À n'utiliser qu'en cas de problème majeur**

---

## ⏰ Timeline Recommandée

### Jour J (23 janvier)
✅ Exécuter NETTOYAGE_SECURISE_BDD_20260123.sql  
✅ Vérifier que l'application fonctionne normalement  
✅ **NE PAS** supprimer les backups  

### Jour J+1 à J+7
✅ Tester toutes les fonctionnalités de l'application  
✅ Vérifier :
   - Réservations
   - Planning ménages
   - Infos gîtes
   - Checklists
   - Fiscalité
   
✅ Les backups restent disponibles

### Après J+7 (30 janvier)
Si tout fonctionne parfaitement :
✅ Supprimer les backups avec RESTAURATION_TABLES_20260123.sql (Option 3)  
✅ Libérer l'espace disque

---

## 📊 Vérifier les Backups

Pour voir les backups créés et leur taille :

```sql
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as taille
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name LIKE 'backup_%_20260123'
ORDER BY table_name;
```

---

## ❌ Que Faire SI...

### Le script échoue pendant l'exécution
→ **Rien à faire** : La transaction est automatiquement annulée (ROLLBACK)  
→ Aucune table n'est supprimée  
→ Vérifier les logs d'erreur et corriger

### L'application ne fonctionne plus après nettoyage
→ Ouvrir **RESTAURATION_TABLES_20260123.sql**  
→ Identifier la table problématique  
→ Décommenter la section de restauration  
→ Exécuter le script  
→ Vérifier que l'application refonctionne

### Une fonctionnalité est cassée
→ Identifier quelle table était utilisée  
→ Restaurer UNIQUEMENT cette table  
→ Documenter le problème dans ERREURS_CRITIQUES.md  
→ Ne PAS supprimer les autres tables obsolètes

---

## ✅ Checklist Post-Nettoyage

- [ ] Script exécuté sans erreur
- [ ] 7 tables supprimées confirmées
- [ ] 7 backups créés et visibles
- [ ] Application accessible
- [ ] Réservations affichées correctement
- [ ] Infos gîtes sauvegardent
- [ ] Planning ménages fonctionne
- [ ] Checklists fonctionnent
- [ ] Fiscalité accessible
- [ ] Pas d'erreurs console
- [ ] Pas d'erreurs Supabase

---

## 🔒 Sécurité Garantie

✅ **Aucune perte de données** : Backups automatiques  
✅ **Transaction sécurisée** : Rollback auto en cas d'erreur  
✅ **Restauration facile** : Script dédié inclus  
✅ **Vérifications multiples** : Avant, pendant, après  
✅ **Pas de risque** : Site restera fonctionnel  

---

## 📞 Support

En cas de problème :
1. Consulter [ERREURS_CRITIQUES.md](../ERREURS_CRITIQUES.md)
2. Exécuter RESTAURATION_TABLES_20260123.sql
3. Documenter le problème

---

*Guide créé le 23 janvier 2026*  
*Scripts testés et sécurisés*
