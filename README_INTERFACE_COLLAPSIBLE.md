# Interface Collapsible - Calculateur Fiscal LMP

## ✅ Modifications effectuées

### 1. **Tous les blocs sont maintenant collapsibles**
   - 10 sections peuvent être réduites/élargies en cliquant sur le titre
   - Icône ▼ qui tourne à 90° quand le bloc est réduit
   - Animation fluide de transition (0.3s)

### 2. **Sections disponibles (dans l'ordre)**
   1. 📊 Chiffre d'affaires
   2. 🏠 Charges COUZON (100% déductibles)
   3. 🏠 Charges TRÉVOUX (100% déductibles)
   4. 🔨 Travaux (Liste dynamique)
   5. 📝 Frais divers (Liste dynamique)
   6. 🧴 Produits d'accueil (Liste dynamique)
   7. 🏡 Charges résidence principale (Bureau)
   8. 💼 Frais professionnels (100% déductibles)
   9. 🚗 Frais de véhicule
   10. 🧾 **Calcul Impôt sur le Revenu (IR)** ⭐ *Déplacé à la fin*

### 3. **Section IR repositionnée**
   - La section "Calcul Impôt sur le Revenu" est maintenant **à la fin** du formulaire
   - Elle apparaît après la section véhicule et avant le panneau d'estimation URSSAF
   - Le champ "Revenu LMP" se remplit automatiquement avec le reste après URSSAF
   - Le champ "Reste après IR" affiche maintenant le **reste réel** (revenu total - impôt total)

### 4. **Structure HTML corrigée**
   - Tous les blocs ont maintenant la structure correcte :
     ```html
     <div class="fiscal-bloc collapsible">
         <h3 class="fiscal-bloc-title" onclick="toggleBloc(this)">
             <span class="toggle-icon">▼</span> Titre
         </h3>
         <div class="bloc-content">
             <!-- Contenu du bloc -->
         </div>
     </div>
     ```

## 📝 Comment ça fonctionne

### Réduire/Élargir un bloc
- Cliquez sur le titre (h3) d'une section
- L'icône ▼ tourne à -90° quand réduit
- Le contenu s'affiche/se cache avec animation

### Calcul IR automatique
- Remplissez les salaires (Madame + Monsieur)
- Le "Revenu LMP" se remplit automatiquement avec le reste après URSSAF
- Sélectionnez le nombre d'enfants
- Le calcul IR se fait en temps réel avec :
  - Revenu imposable total (salaires + LMP)
  - Nombre de parts fiscales
  - Quotient familial
  - **Impôt sur le revenu** (barème progressif 2024)
  - **Reste après IR** (ce qui reste réellement dans le foyer)

### Panneau d'estimation URSSAF
- Toujours visible en haut (non collapsible)
- Affiche en temps réel :
  - Bénéfice imposable
  - Cotisations URSSAF
  - Reste avant IR
- ⚠️ Alerte si bénéfice < 7 046 € (trimestres retraite non validés)

## 🔧 Fichiers modifiés

- **tabs/tab-fiscalite-v2.html** : Structure HTML avec blocs collapsibles
- **js/fiscalite-v2.js** : Fonction `toggleBloc()` et calcul IR corrigé
- **CSS inline** : Styles pour `.collapsible`, `.toggle-icon`, `.bloc-content`

## 📦 Sauvegarde

Une sauvegarde a été créée avant modifications :
- `tabs/tab-fiscalite-v2.html.backup_collapse`

## 🎯 Prochaines étapes

- [ ] Tester l'interface complète
- [ ] Vérifier que tous les blocs se réduisent/élargissent correctement
- [ ] Tester le calcul IR avec différentes configurations
- [ ] Implémenter `chargerDerniereSimulation()` complète

## ✨ Commit effectué

```
feat: tous les blocs fiscalité sont maintenant collapsibles + section IR déplacée à la fin
- 10 sections avec toggle fonctionnel
- Animation rotation icône ▼
- Section IR repositionnée après véhicule
- Structure HTML corrigée pour tous les blocs
```
