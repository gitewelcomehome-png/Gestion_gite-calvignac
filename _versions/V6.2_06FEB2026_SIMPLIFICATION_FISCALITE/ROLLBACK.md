# 🔄 ROLLBACK V6.2 → V6.1
**Version actuelle:** V6.2_06FEB2026_SIMPLIFICATION_FISCALITE  
**Version rollback:** V6.1_05FEB2026_AVANT_MIGRATION_ORDRE_AFFICHAGE

---

## ⚠️ Quand effectuer un Rollback ?

### Symptômes nécessitant un rollback
1. ❌ **Erreurs console JavaScript persistantes**
2. ❌ **Page fiscalité ne charge pas**
3. ❌ **Dashboard affiche 0€ pour tout**
4. ❌ **Calculs URSSAF incorrects**
5. ❌ **Sauvegarde BDD échoue**
6. ❌ **Fonction `window.calculerChargesParGiteSansAmortissement` introuvable**

---

## 🚨 Procédure de Rollback RAPIDE

### Option 1 : Script Automatique (Recommandé)
```bash
cd /workspaces/Gestion_gite-calvignac

# Restaurer tous les fichiers d'un coup
cp -r _versions/V6.1_05FEB2026_AVANT_MIGRATION_ORDRE_AFFICHAGE/js/* js/
cp -r _versions/V6.1_05FEB2026_AVANT_MIGRATION_ORDRE_AFFICHAGE/css/* css/
cp _versions/V6.1_05FEB2026_AVANT_MIGRATION_ORDRE_AFFICHAGE/index.html index.html

# Mettre à jour la version
echo "V6.1_05FEB2026_AVANT_MIGRATION_ORDRE_AFFICHAGE - Sauvegarde complète avant ajout colonne ordre_affichage dans table gites (ROLLBACK READY)" > _versions/CURRENT_VERSION.txt

# Vider le cache navigateur : Ctrl+Shift+R ou Cmd+Shift+R
```

### Option 2 : Manuel (Fichier par Fichier)
```bash
cd /workspaces/Gestion_gite-calvignac

# Restaurer JavaScript critique
cp _versions/V6.1_05FEB2026_AVANT_MIGRATION_ORDRE_AFFICHAGE/js/fiscalite-v2.js js/
cp _versions/V6.1_05FEB2026_AVANT_MIGRATION_ORDRE_AFFICHAGE/js/dashboard.js js/
cp _versions/V6.1_05FEB2026_AVANT_MIGRATION_ORDRE_AFFICHAGE/js/taux-fiscaux-config.js js/

# Restaurer HTML
cp _versions/V6.1_05FEB2026_AVANT_MIGRATION_ORDRE_AFFICHAGE/index.html index.html

# Mettre à jour version
echo "V6.1_05FEB2026_AVANT_MIGRATION_ORDRE_AFFICHAGE" > _versions/CURRENT_VERSION.txt
```

---

## 📋 Checklist Post-Rollback

### 1. Vérifications Navigateur
- [ ] Vider le cache : `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac)
- [ ] Ouvrir console développeur : `F12`
- [ ] Vérifier aucune erreur rouge

### 2. Tests Fonctionnels
- [ ] Page fiscalité charge correctement
- [ ] Dashboard affiche les bénéfices (pas 0€)
- [ ] Calculs URSSAF corrects (minimum 1200€)
- [ ] Sauvegarde fiscalité fonctionne
- [ ] Fonction `window.calculerChargesParGiteSansAmortissement` existe

### 3. Versions JS à Vérifier
```javascript
// Dans index.html (lignes ~167-170)
taux-fiscaux-config.js?v=1.0     // ✅ Ancienne version
fiscalite-v2.js?v=1738859000     // ✅ Ancienne version  
dashboard.js?v=12.10              // ✅ Ancienne version
```

---

## 🔍 Différences Clés V6.2 vs V6.1

### Changements dans V6.2 (qui seront annulés)
| Fichier | Changements V6.2 | Rollback V6.1 |
|---------|------------------|---------------|
| `fiscalite-v2.js` | Helpers ajoutés (lignes 12-71) | Pas de helpers |
| `fiscalite-v2.js` | Config centralisée | Quelques hardcodes restants |
| `dashboard.js` | Config URSSAF via getConfig() | Config inline |
| `taux-fiscaux-config.js` | MICRO_BIC ajouté | MICRO_BIC absent |
| `index.html` | Versions JS bumped | Versions anciennes |

---

## 📞 Support

### Si le Rollback Ne Résout Pas le Problème
1. Vérifier la base de données Supabase (pas affectée par rollback JS)
2. Vérifier les credentials API (fichier `config/supabase.js`)
3. Contacter le développeur avec :
   - Screenshot console erreurs
   - Version actuelle (`cat _versions/CURRENT_VERSION.txt`)
   - Description du problème

---

## ⏭️ Re-Upgrade Vers V6.2

Si le rollback était temporaire et que vous souhaitez revenir à V6.2 :
```bash
cd /workspaces/Gestion_gite-calvignac

# Restaurer V6.2
cp -r _versions/V6.2_06FEB2026_SIMPLIFICATION_FISCALITE/js/* js/
cp -r _versions/V6.2_06FEB2026_SIMPLIFICATION_FISCALITE/css/* css/
cp _versions/V6.2_06FEB2026_SIMPLIFICATION_FISCALITE/index.html index.html

# Mettre à jour version
echo "V6.2_06FEB2026_SIMPLIFICATION_FISCALITE - Simplification code fiscalité" > _versions/CURRENT_VERSION.txt

# Vider cache : Ctrl+Shift+R
```

---

## 📝 Historique Rollback
| Date | Effectué par | Raison | Résolution |
|------|--------------|--------|------------|
| - | - | - | - |

_(Remplir ce tableau si un rollback est effectué)_
