# 🔒 Tables UNRESTRICTED - Explication & Solution

## ❓ Qu'est-ce que "UNRESTRICTED" ?

**UNRESTRICTED** = Table sans RLS (Row Level Security) activé

- ✅ **Normal** pour : Tables de backup, tables système
- ❌ **Problématique** pour : Tables actives avec données utilisateurs

---

## 📦 Tables Identifiées

### Backups du Nettoyage (23 jan) - À SUPPRIMER après validation
```
backup_infos_pratiques_20260123      ← Backup temporaire
backup_checklists_20260123           ← Backup temporaire
backup_demandes_horaires_20260123    ← Backup temporaire
backup_evaluations_sejour_20260123   ← Backup temporaire
backup_problemes_signales_20260123   ← Backup temporaire
backup_retours_menage_20260123       ← Backup temporaire
backup_suivi_soldes_bancaires_20260123 ← Backup temporaire
```
**Action** : Supprimer après 7 jours (30 janvier) si tout fonctionne

### Table Active Sans RLS - À SÉCURISER
```
cleaning_rules                       ← ⚠️ Doit avoir RLS !
```
**Action** : Activer RLS immédiatement

### Ancien Backup - À VÉRIFIER
```
infos_gites_backup_trevoux          ← Backup ancien ?
```
**Action** : Vérifier utilité, supprimer si obsolète

---

## ✅ Solution

### 1. Sécuriser immédiatement (MAINTENANT)

Exécuter **PARTIE 1** de [SECURISATION_ET_NETTOYAGE_BACKUPS.sql](SECURISATION_ET_NETTOYAGE_BACKUPS.sql)

```sql
-- Active RLS sur cleaning_rules
-- Crée policies SELECT/INSERT/UPDATE/DELETE
```

### 2. Supprimer backups après validation (30 JANVIER)

Exécuter **PARTIE 2** de [SECURISATION_ET_NETTOYAGE_BACKUPS.sql](SECURISATION_ET_NETTOYAGE_BACKUPS.sql)

**Checklist avant suppression** :
- [ ] 7 jours écoulés depuis nettoyage
- [ ] Application fonctionne normalement
- [ ] Aucune erreur détectée
- [ ] Toutes les fonctionnalités testées
- [ ] Backups confirmés inutiles

---

## 🔍 Vérifier les Tables UNRESTRICTED

```sql
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false
ORDER BY tablename;
```

---

## ⚠️ Règles à Suivre

### Tables ACTIVES = RLS OBLIGATOIRE
Si la table contient des données utilisateurs multi-tenants :
- ✅ Activer RLS
- ✅ Créer policies avec `owner_user_id = auth.uid()`
- ✅ Tester l'accès

### Tables BACKUPS = RLS OPTIONNEL
- ✅ Pas de RLS nécessaire (tables temporaires)
- ✅ Supprimer après validation
- ❌ Ne pas garder indéfiniment

### Tables SYSTÈME = RLS OPTIONNEL
Tables sans données utilisateurs (ex: barèmes, références) :
- RLS optionnel si données publiques
- RLS obligatoire si données sensibles

---

## 📅 Timeline

**Aujourd'hui (23 jan)**
- ✅ Exécuter PARTIE 1 (sécurisation cleaning_rules)
- ✅ Vérifier que l'app fonctionne
- ✅ Tester toutes les fonctionnalités

**30 janvier (J+7)**
- ✅ Valider que tout fonctionne depuis 7 jours
- ✅ Exécuter PARTIE 2 (suppression backups)
- ✅ Vérifier plus aucune table UNRESTRICTED (sauf système)

---

## 🎯 Résultat Attendu

Après exécution complète :
```
✅ cleaning_rules          → RESTRICTED (RLS activé)
✅ Backups temporaires     → SUPPRIMÉS
✅ Base propre et sécurisée
```

---

*Guide créé le 23 janvier 2026*
