# Brief Cowork — Audit état actuel avant Niveau 1

**Date :** 31 mars 2026  
**De :** Copilot  
**Pour :** Claude Cowork  
**Sujet :** État réel du projet avant de démarrer les améliorations du Niveau 1

---

## Contexte

Nous démarrons un plan d'améliorations en 4 niveaux (voir document principal).  
Avant de coder quoi que ce soit, j'ai audité l'existant pour **éviter de dupliquer des fonctions déjà présentes**.

---

## Ce qu'on a trouvé

### ✅ `js/utils.js` — existe déjà et est propre

Contient : `escapeHtml`, `debounce`, `throttle`, `formatCurrency`, `copyToClipboard`, `safeJSONParse`, `isNullOrEmpty`, `truncateText`  
Exposé via `window.Utils.*` avec alias globaux pour rétrocompatibilité.

### ✅ `js/shared-utils.js` — contient déjà `showToast`

Implémentation complète : toast inline dans l'onglet actif, couleurs par type (`success`, `error`, `info`), auto-fermeture.

### ⚠️ Problème identifié : `showToast` est dupliquée dans 14 fichiers

Au lieu d'utiliser `shared-utils.js`, chaque développeur a recopié `showToast` localement :

| Fichier | Ligne |
|---------|-------|
| `js/admin-finance.js` | 663 |
| `js/decouvrir.js` | 739 |
| `js/admin-content.js` | 630 |
| `js/admin-clients.js` | 930 |
| `js/admin-content-ai-strategy.js` | 1322 |
| `js/client-support.js` | 709 |
| `js/admin-promotions.js` | 641 |
| `js/femme-menage.js` | 102 |
| `js/infos-gites-photos.js` | 459 |
| `js/fiche-client-prestations.js` | 405 |
| `js/fiche-client-app.js` | 2838 |
| `pages/admin-prompt-editor.html` | 476 |
| `pages/validation.html` | 579 |

---

## Ce que Copilot va faire (Niveau 1.1 révisé)

La tâche 1.1 n'est **pas** "créer utils.js" (il existe déjà).  
La vraie tâche est : **supprimer les 14 copies locales de `showToast`** et utiliser `shared-utils.js` comme source unique.

Ensuite, ajouter dans `utils.js` les fonctions manquantes :
- `formatDate(date)` — format FR "31 mar 2026"
- `showLoading(show)` — spinner global `#global-loading`

---

## Ta mission avant qu'on commence les modifs

**Vérifier l'état actuel en prod pour avoir une baseline :**

1. Ouvrir `https://liveownerunit.fr/app.html` en étant connecté
2. Naviguer sur chaque onglet et noter si des toasts s'affichent correctement
3. Vérifier qu'il n'y a pas d'erreurs console actuellement (avant nos modifs)
4. Prendre un screenshot de chaque onglet principal

Cela nous permettra de comparer après la suppression des doublons et détecter toute régression.

---

## Onglets à tester (baseline)

| Onglet | Sélecteur | Action déclenchant un toast |
|--------|-----------|----------------------------|
| Réservations | `[data-tab='reservations']` | Modifier une réservation |
| Ménage | `[data-tab='menage']` | Valider une tâche |
| Infos Gîtes | `[data-tab='infos-gites']` | Sauvegarder une info |
| Finances | `[data-tab='fiscalite']` | Aucune action requise |
| Dashboard | `[data-tab='dashboard']` | Aucune action requise |

---

## Résultat attendu de ta mission

Un rapport simple :
- ✅ ou ❌ pour chaque onglet (pas d'erreur console)
- ✅ ou ❌ pour les toasts (s'affichent correctement ou pas)
- Screenshot si quelque chose cloche

Ce rapport servira de **baseline** pour valider que nos modifications n'ont rien cassé.
