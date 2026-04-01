---
name: bonnes-pratiques
description: 'Bonnes pratiques de développement pour le projet Gestion Gîte Calvignac. Utiliser pour : coder une nouvelle fonctionnalité, corriger un bug, modifier la base de données, créer des fichiers, gérer les erreurs, nettoyer des logs, respecter les règles métier réservations. Ce skill inclut un garde-fou qualité automatique activé à CHAQUE modification de fichier .html, .js ou .css : élimination du code dupliqué, mutualisation, simplification, performance. Utilise-le aussi quand on demande un audit, review, nettoyage, optimisation, refactoring ou simplification de code vanilla JS/HTML/CSS. IMPORTANT : impose la mise à jour des fichiers DOCUMENTATION_PAGES_*.md à chaque ajout/modification/suppression de page, bouton, formulaire ou fonction JS exposée.'
argument-hint: 'Décris la tâche à réaliser (ex: ajouter une colonne, corriger un bug, créer une fonction JS)'
---

# Bonnes Pratiques — Gestion Gîte Calvignac

## Checklist Obligatoire Avant Toute Action

1. ✅ Consulter **docs/ARCHITECTURE.md** pour comprendre l'existant
2. ✅ Consulter **docs/ERREURS_CRITIQUES.md** pour éviter les bugs connus
3. ✅ Vérifier les variables/tables existantes avant d'en créer de nouvelles
4. ✅ Confirmer quelle interface est concernée (ADMIN vs CLIENT)
5. ✅ S'assurer que l'action est sans risque pour la production

---

## Interfaces — Ne Jamais Confondre

| Fichier | Public | Rôle |
|---------|--------|------|
| `index.html` | Propriétaires de gîtes | Interface CLIENT principale — **NE JAMAIS modifier sans demande explicite** |
| `app.html` | Propriétaires connectés | Application principale |
| `pages/admin-channel-manager.html` | Admin SaaS | Gestion des clients |
| `pages/admin-support.html` | Admin | Interface support ADMIN |
| `pages/client-support.html` | Propriétaires | Interface support CLIENT |

---

## Règles Base de Données

- **Toujours** vérifier les tables et colonnes existantes avant d'en créer
- Maintenir les **relations FK** entre tables
- Se référer à `docs/ARCHITECTURE.md` → section "Base de Données"
- Après toute modification de schéma, mettre à jour `docs/ARCHITECTURE.md`
- Ne jamais hardcoder de valeurs : utiliser la table `system_config` pour les paramètres

---

## Règles Métier Réservations

- Un gîte ne peut avoir qu'**une seule réservation active à la fois**
- Aucune réservation ne peut **démarrer le même jour** qu'une autre sur le même gîte
- En cas de conflit de dates lors d'import iCal : **conserver la plus courte**
- Vérifier systématiquement les chevauchements lors des imports iCal

---

## Gestion des Erreurs

- **Zéro erreur console tolérée** en production
- Toujours catcher les erreurs avec `try/catch` ou `.catch()`
- Ne jamais laisser une `Promise` sans gestion d'erreur
- Pour les erreurs non critiques : les logger discrètement et continuer

```js
// ✅ Bon
try {
  const data = await fetchData();
} catch (error) {
  console.error('[Module] Erreur lors du chargement:', error.message);
}

// ❌ Mauvais
const data = await fetchData(); // Pas de gestion d'erreur
```

---

## Gestion des Logs

- Supprimer ou commenter les `console.log()` de développement avant de livrer
- Garder uniquement les logs essentiels au fonctionnement
- Format recommandé : `[NomModule] Message descriptif`
- Éviter les logs en boucle (ex: dans `setInterval` ou boucles `forEach`)

```js
// ✅ Log utile en production
console.error('[iCal] Import échoué pour le gîte', giteId, error.message);

// ❌ Log de debug à supprimer
console.log('data =>', data);
console.log('ici 2');
```

---

## Sécurité (OWASP)

- Jamais de construction HTML via concaténation de chaînes : utiliser `textContent` ou `createElement`
- Valider toutes les entrées utilisateur côté serveur (API Vercel) ET côté client
- Ne pas exposer de clés API dans le code front-end
- Utiliser les variables d'environnement Vercel pour les secrets
- Paramétrer toutes les requêtes SQL (pas d'interpolation directe)

```js
// ✅ Sécurisé
const el = document.createElement('span');
el.textContent = userInput;

// ❌ Vulnérable XSS
el.innerHTML = userInput;
```

---

## Gestion des Fichiers

- Archiver dans `_archives/` plutôt que supprimer des fichiers existants
- Nettoyer les fichiers SQL temporaires ou de test après usage
- Ne pas laisser de fichiers de debug à la racine du projet
- Maintenir `docs/ARCHITECTURE.md` et `docs/ERREURS_CRITIQUES.md` à jour après chaque changement important

---

## Code JavaScript

- Éviter les initialisations multiples de la même fonctionnalité
- Utiliser `const` par défaut, `let` si réassignation nécessaire, jamais `var`
- Pour les appels Supabase, toujours destructurer `{ data, error }` et vérifier `error`
- Préférer `async/await` aux `.then()` chaînés pour la lisibilité

```js
// ✅ Bon
const { data, error } = await supabase.from('reservations').select('*');
if (error) throw error;

// ❌ Mauvais
supabase.from('reservations').select('*').then(res => {
  // res.error non vérifié
  doSomething(res.data);
});
```

---

## Après Chaque Modification

1. Vérifier l'absence d'erreurs console
2. Tester le cas nominal ET le cas d'erreur
3. Nettoyer les logs de debug
4. Archiver les fichiers devenus inutiles dans `_archives/`

### Mise à Jour des Docs — Obligatoire selon le type de changement

| Type de changement | Documents à mettre à jour |
|--------------------|---------------------------|
| Nouvelle table / colonne / vue / RPC | `docs/ARCHITECTURE.md` + `docs/architecture/database-uml.md` |
| Suppression d'une table ou colonne | `docs/ARCHITECTURE.md` + `docs/architecture/database-uml.md` + `docs/architecture/ERREURS_CRITIQUES.md` |
| Correction d'un bug connu | `docs/architecture/ERREURS_CRITIQUES.md` |
| **Nouvelle page HTML créée** | `docs/ARCHITECTURE.md` → section "Structure Frontend" + **`docs/DOCUMENTATION_PAGES_3_ADMIN_CLIENT.md`** (pages admin/client) ou **`docs/DOCUMENTATION_PAGES_2_APP_ONGLETS.md`** (onglets/app) ou **`docs/DOCUMENTATION_PAGES_1_PUBLIC_AUTH.md`** (pages publiques/auth) selon la catégorie |
| **Ajout d'un bouton / formulaire / section dans une page** | Fichier de documentation correspondant à la page (voir tableau ci-dessous) |
| **Modification du comportement d'un bouton ou fonction JS** | Fichier de documentation correspondant à la page |
| **Suppression d'une page ou d'un onglet** | Retirer l'entrée dans le fichier de documentation + index dans `DOCUMENTATION_PAGES_3_ADMIN_CLIENT.md` |
| Changement de règle métier réservations | `docs/ARCHITECTURE.md` + `docs/architecture/database-uml.md` → "Règles Métier Critiques" |
| Mise à jour version de l'app | `docs/ARCHITECTURE.md` → `**Version :**` et `**Dernière MAJ :**` |

### Quel fichier de documentation mettre à jour ?

| Catégorie de page | Fichier de documentation |
|-------------------|--------------------------|
| Pages publiques marketing (`index.html`, `commercial.html`) | `docs/DOCUMENTATION_PAGES_1_PUBLIC_AUTH.md` |
| Pages légales (`cgu-cgv.html`, `legal.html`, `privacy.html`) | `docs/DOCUMENTATION_PAGES_1_PUBLIC_AUTH.md` |
| Pages auth (`login`, `logout`, `forgot-password`, `reset-password`, `onboarding`) | `docs/DOCUMENTATION_PAGES_1_PUBLIC_AUTH.md` |
| Pages utilitaires client (`options.html`, `validation.html`) | `docs/DOCUMENTATION_PAGES_1_PUBLIC_AUTH.md` |
| Shell app (`app.html`) + tous les onglets `tabs/tab-*.html` | `docs/DOCUMENTATION_PAGES_2_APP_ONGLETS.md` |
| Variantes Calou (`tabs/tab-*-calou.html`) | `docs/DOCUMENTATION_PAGES_2_APP_ONGLETS.md` |
| Pages admin (`pages/admin-*.html`) | `docs/DOCUMENTATION_PAGES_3_ADMIN_CLIENT.md` |
| Pages client/métier (`fiche-client.html`, `client-support.html`, `femme-menage.html`) | `docs/DOCUMENTATION_PAGES_3_ADMIN_CLIENT.md` |

---

## Code Quality Guard — Passe Obligatoire sur Tout Fichier .html/.js/.css

> **Ce workflow s'applique à chaque modification de code, même mineure. Il n'est pas optionnel.**

Philosophie : produire du code **le plus simple, le plus court, et le plus mutualisé possible**, tout en préservant le comportement existant.

### Étapes dans l'ordre

**1. Contexte** — Avant de coder, identifier les fonctions/styles existants réutilisables dans le projet. Ne jamais coder en isolation.

**2. Coder** — Appliquer la demande. Consulter [references/code-quality.md](./references/code-quality.md) pour les règles détaillées (DOM, événements, CSS, async).

**3. Mutualisation** — Après avoir codé :
- Scanner les doublons avec le reste du projet (fonctions identiques, blocs copiés-collés, sélecteurs CSS redondants)
- Extraire dans une fonction utilitaire partagée (`utils.js` ou existant équivalent)
- Pour CSS : créer des classes utilitaires ou des custom properties

**4. Performance** — Vérifier :
- DOM : cache les éléments, utilise `DocumentFragment` pour les insertions multiples, `textContent` si pas de HTML
- Événements : délégation sur le parent plutôt qu'un listener par élément
- Rendu : batch les modifications DOM, évite les reflows forcés
- Réseau : debounce les appels API, lazy-load les ressources non critiques

**5. Anti-patterns** — Si l'un des patterns listés dans [references/antipatterns.md](./references/antipatterns.md) est détecté, le corriger. Consulter aussi ce fichier avant d'écrire du code pour les éviter d'emblée.

**6. Rapport** — Si des améliorations qualité ont été appliquées, fournir un bref résumé (2-5 lignes max). Ex : *"Mutualisé la logique de validation dans `validateField()` — utilisé à 3 endroits"*. Rien si rien trouvé.

### Audit complet (si demandé explicitement)

Quand l'utilisateur demande un audit/review/nettoyage global : appliquer toutes les étapes ci-dessus **sur l'ensemble du fichier**, pas seulement sur le code modifié. Couvrir aussi l'accessibilité (attributs `aria-*`, labels, contrastes) et la sécurité (XSS, entrées non validées).
