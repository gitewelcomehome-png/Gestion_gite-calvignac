# 🔄 ROLLBACK - Version 1.0

## Comment revenir à cette version

### Option 1 : Rollback Complet (Recommandé)

```bash
# Se placer à la racine
cd /workspaces/Gestion_gite-calvignac

# Copier le CSS de cette version
cp _versions/V1.0_20260125_1941/css/main.css css/main.css

# Mettre à jour la référence de version actuelle
echo "V1.0_20260125_1941" > _versions/CURRENT_VERSION.txt
```

### Option 2 : Restaurer TOUS les anciens CSS

Si besoin de revenir à l'ancienne structure (13 fichiers) :

```bash
# Restaurer depuis l'archive
cp -r _archives/css_20260125/* css/

# Remettre les anciennes références dans index.html
# Éditer manuellement index.html ligne 169 :
# <link rel="stylesheet" href="css/upstay-unique.css?v=3.2" />
```

### Option 3 : Rollback via Git (si commit)

```bash
# Voir l'historique
git log --oneline

# Revenir au commit avant la consolidation
git checkout <commit-hash-avant-consolidation>
```

## ⚠️ Attention

Cette version V1.0 est **STABLE** et **TESTÉE**.

Revenir en arrière n'est nécessaire que si :
- Bug critique non prévu
- Problème de compatibilité
- Régression fonctionnelle

## 📞 En Cas de Problème

1. Copier le CSS de cette version (voir Option 1)
2. Vérifier la console navigateur (F12)
3. Comparer avec l'archive `_archives/css_20260125/`

---

**Version :** V1.0_20260125_1941  
**Date :** 25 janvier 2026  
**Fichier principal :** css/main.css (50 Ko)
