# 🧹 NETTOYAGE PHASE 2 - Analyse de sécurité

## ✅ FICHIERS OBSOLÈTES (200% sûr - peuvent être supprimés)

### 1. **config.js** (racine)
- **Remplacé par** : js/shared-config.js
- **Recherche** : Aucune référence dans le code actif
- **Verdict** : ✅ SUPPRIMER

### 2. **GUIDE_CONFIG_VERCEL.md** (racine)
- **Contenu** : Instructions anciennes pour variables Vercel (approche abandonnée)
- **Note** : Contient les secrets Supabase en clair (déjà exposés publiquement)
- **Verdict** : ✅ SUPPRIMER (approche changée, config maintenant dans shared-config.js)

### 3. **Fichiers de test** (racine)
- test_date_debug.html
- test_fiscalite_debug.html
- test_recent_resa.html
- test-fiches-clients.html
- validation.html
- **Verdict** : ⚠️ À VÉRIFIER si utilisés pour debug

## 📁 ARCHITECTURE FINALE

### Configuration (après nettoyage)
```
js/shared-config.js          ← Configuration principale (APP_CONFIG)
config.local.js              ← Override local optionnel (gitignored)
.gitignore                   ← Protège config.local.js
```

### Fichiers gardés (essentiels)
- index.html
- login.html
- femme-menage.html
- fiche-client.html
- js/ (tous les scripts)
- sql/ (requêtes)
- tabs/ (onglets)

## 🗑️ ACTIONS DE NETTOYAGE

### Action 1 : Supprimer fichiers obsolètes
```bash
rm config.js
rm GUIDE_CONFIG_VERCEL.md
```

### Action 2 : Nettoyer archives (optionnel)
Les fichiers dans `_archives/` sont déjà archivés :
- Documentation obsolète
- Scripts obsolètes
- Anciennes versions
→ **Déjà sécurisé dans _archives/**, pas besoin de supprimer

## ⚠️ À NE PAS TOUCHER

### Fichiers critiques à garder :
- ✅ js/shared-config.js (configuration active)
- ✅ config.local.js (override local)
- ✅ .gitignore (sécurité)
- ✅ Tous les fichiers js/ actifs
- ✅ index.html et pages principales

## 📊 RÉSULTAT

**Avant nettoyage** :
- config.js (doublon obsolète)
- GUIDE_CONFIG_VERCEL.md (approche abandonnée)

**Après nettoyage** :
- Architecture propre
- Un seul système de config (shared-config.js)
- Pas de confusion
