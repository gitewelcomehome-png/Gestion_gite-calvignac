# 🔄 Système de Versioning CSS - Gestion Gîte Calvignac

## 📋 Objectif
Système de sauvegarde avec possibilité de rollback à chaque version validée.

## 🏷️ Convention de Nommage des Versions

### Format
```
V[MAJOR].[MINOR]_YYYYMMDD_HHMM
```

### Exemples
- `V1.0_20260125_1430` - Version initiale consolidée
- `V1.1_20260125_1500` - Première amélioration
- `V2.0_20260125_1530` - Changement majeur

## 📦 Structure des Sauvegardes

```
_versions/
├── V1.0_20260125_1430/
│   ├── css/
│   │   └── main.css
│   ├── CHANGELOG.md
│   └── ROLLBACK.md
├── V1.1_20260125_1500/
│   ├── css/
│   │   └── main.css
│   ├── CHANGELOG.md
│   └── ROLLBACK.md
└── CURRENT_VERSION.txt
```

## 🔄 Comment Revenir en Arrière

### 1. Identifier la version cible
```bash
cat _versions/CURRENT_VERSION.txt
ls _versions/
```

### 2. Copier la version souhaitée
```bash
cp _versions/V1.0_20260125_1430/css/main.css css/main.css
```

### 3. Mettre à jour la version actuelle
```bash
echo "V1.0_20260125_1430" > _versions/CURRENT_VERSION.txt
```

## ⏰ Planification
- **Sauvegarde automatique:** Toutes les 30 minutes de travail actif
- **Sauvegarde manuelle:** Sur demande avant modifications majeures
- **Nettoyage:** Garder les 10 dernières versions + versions majeures

## 📝 Checklist Avant Chaque Sauvegarde

- [ ] Code testé sans erreurs console
- [ ] Modifications documentées dans CHANGELOG
- [ ] Test visuel sur au moins 2 pages principales
- [ ] Validation que rien n'est cassé

## 🚀 Processus de Création de Version

1. Copilot propose une nouvelle version
2. Validation des changements
3. Création du dossier versionné
4. Documentation du CHANGELOG
5. Instructions de rollback
6. Mise à jour CURRENT_VERSION.txt

---

**Dernière mise à jour:** 25 janvier 2026
