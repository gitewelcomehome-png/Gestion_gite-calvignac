# ⚠️ IMPORTANT : Installation requise

## Système de gestion des kilomètres

Ce script doit être exécuté dans **Supabase SQL Editor** avant d'utiliser la fonctionnalité kilomètres.

---

## 📋 Étapes d'installation

### 1. Ouvrir Supabase
- Se connecter à [https://supabase.com](https://supabase.com)
- Sélectionner votre projet

### 2. Ouvrir le SQL Editor
- Menu de gauche → **SQL Editor**
- Cliquer sur **New query**

### 3. Copier/Coller ce fichier
- Sélectionner tout le contenu de `create_km_management.sql`
- Copier (Ctrl+C)
- Coller dans l'éditeur SQL de Supabase

### 4. Exécuter
- Cliquer sur **Run** ou appuyer sur **Ctrl+Enter**
- Attendre la fin de l'exécution (quelques secondes)

### 5. Vérifier
Vous devriez voir :
```
✅ Système de gestion des kilomètres créé avec succès !
```

---

## ✅ Ce qui est créé

- ✅ **3 nouvelles tables** :
  - `km_trajets` - Historique des trajets
  - `km_config_auto` - Configuration automatisation
  - `km_lieux_favoris` - Lieux favoris (magasins)

- ✅ **Modification table gites** :
  - Ajout colonne `distance_km`

- ✅ **Sécurité (RLS)** :
  - Politiques de sécurité configurées
  - Isolation des données par utilisateur

---

## 🚀 Après installation

1. **Rafraîchir l'application** (Ctrl+Shift+R)
2. **Onglet Fiscalité** → Section "🚗 Frais de véhicule"
3. **Configurer distances** pour chaque gîte
4. **Configurer automatisation** via bouton "⚙️ Configurer"

---

## 📖 Documentation complète

- Guide complet : `docs/GUIDE_KILOMETRES.md`
- Synthèse : `docs/IMPLEMENTATION_KILOMETRES.md`

---

**Date création :** 19 janvier 2026  
**Version :** 1.0
