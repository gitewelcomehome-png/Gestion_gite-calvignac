# 📂 Scripts SQL - Gestion Gîtes

## 🎯 Fichiers Essentiels (dans l'ordre)

### 1️⃣ CRÉATION COMPLÈTE DE LA BDD
**Fichier** : `SCHEMA_COMPLET_FINAL_2026.sql`  
**Usage** : Créer TOUTE la base de données from scratch (tables, RLS, policies, functions)  
**Quand** : Nouveau projet Supabase ou réinitialisation totale

---

### 2️⃣ MAINTENANCE COURANTE

#### 📊 Comptage
**Fichier** : `COMPTE_RESERVATIONS.sql`  
Compter le nombre total de réservations

#### 🧹 Nettoyage
**Fichier** : `NETTOYAGE_COMPLET_RESA.sql`  
Supprimer les BLOCKED / Not available / Indisponible

---

## 📁 Archives

Tous les anciens scripts (migrations, diagnostics, fixes) sont dans :  
`../sql_archives_13jan/`

---

## ⚠️ Règles d'Utilisation

1. **Toujours exécuter dans le SQL Editor** de Supabase (pas Table Editor)
2. **Lire les commentaires** avant d'exécuter
3. **Backup avant toute modification** destructive
4. Les scripts respectent les **RLS** et **organization_id**
