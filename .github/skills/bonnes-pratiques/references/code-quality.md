# Code Quality — Règles Détaillées

Référence complète pour la passe qualité sur les fichiers `.html`, `.js`, `.css` du projet (vanilla JS / SPA sans bundler).

---

## JavaScript

### DOM

```js
// ✅ Cache les références DOM, ne les recalcule pas en boucle
const list = document.querySelector('#reservation-list');
items.forEach(item => {
  const el = document.createElement('li');
  el.textContent = item.label;
  list.appendChild(el);
});

// ✅ DocumentFragment pour les insertions multiples (un seul reflow)
const frag = document.createDocumentFragment();
items.forEach(item => {
  const el = document.createElement('li');
  el.textContent = item.label;
  frag.appendChild(el);
});
list.appendChild(frag);

// ❌ Recalcul DOM dans chaque itération
items.forEach(item => {
  document.querySelector('#reservation-list').innerHTML += `<li>${item.label}</li>`;
});
```

### Événements

```js
// ✅ Délégation : un seul listener sur le parent
document.querySelector('.actions-panel').addEventListener('click', (e) => {
  if (e.target.matches('.btn-delete')) handleDelete(e.target.dataset.id);
  if (e.target.matches('.btn-edit'))   handleEdit(e.target.dataset.id);
});

// ❌ Un listener par élément
document.querySelectorAll('.btn-delete').forEach(btn => {
  btn.addEventListener('click', () => handleDelete(btn.dataset.id));
});
```

### Async / Supabase

```js
// ✅ Toujours destructurer et vérifier l'erreur
const { data, error } = await supabase.from('reservations').select('*');
if (error) throw error;

// ✅ Wrapper utilitaire pour les appels fréquents
async function sbQuery(table, filters = {}) {
  let query = supabase.from(table).select('*');
  Object.entries(filters).forEach(([k, v]) => { query = query.eq(k, v); });
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
```

### Simplification

```js
// ✅ Optional chaining + nullish coalescing
const label = reservation?.gite?.nom ?? 'Sans nom';

// ✅ Ternaire pour les conditions simples
const cls = isActive ? 'active' : 'inactive';

// ✅ map/filter/reduce plutôt que boucles impératives
const total = reservations
  .filter(r => r.statut === 'confirmee')
  .reduce((sum, r) => sum + r.montant, 0);
```

---

## CSS

### Éviter la duplication

```css
/* ✅ Custom property centralisée */
:root {
  --border-radius-card: 12px;
  --shadow-card: 0 2px 8px rgba(0,0,0,.12);
}
.card, .modal, .dropdown {
  border-radius: var(--border-radius-card);
  box-shadow: var(--shadow-card);
}

/* ❌ Valeurs dupliquées à 5 endroits */
.card    { border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.12); }
.modal   { border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.12); }
.dropdown{ border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.12); }
```

### Performance

- Éviter les sélecteurs universels `*` dans des règles profondes
- Pas de `!important` sauf cas exceptional documenté
- Préférer `transform` + `opacity` aux propriétés qui triggent le layout (width, top, left)
- Utiliser `will-change: transform` avec parcimonie sur les éléments animés

---

## HTML

### Sécurité

```js
// ✅ textContent ou createElement pour le contenu dynamique
const el = document.createElement('p');
el.textContent = userProvidedValue;

// ❌ innerHTML avec valeur utilisateur — XSS garanti
el.innerHTML = userProvidedValue;
```

### Structure et accessibilité

- Toujours un `aria-label` ou `aria-labelledby` sur les éléments interactifs sans texte visible
- Les boutons doivent avoir un `type` explicite (`type="button"` pour éviter la soumission de formulaire)
- Les images doivent avoir un `alt` (vide `alt=""` si purement décoratif)
- Utiliser les balises sémantiques (`<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`) plutôt que des `<div>` génériques

---

## Mutualisation — Où Mettre le Code Partagé

| Type de code partagé | Fichier cible |
|----------------------|---------------|
| Fonctions JS utilitaires (format dates, montants, etc.) | `js/utils.js` (si existant) ou créer |
| Fonctions Supabase fréquentes | `js/supabase-operations.js` |
| Styles utilitaires CSS | `css/main.css` → section `:root` / utilitaires |
| Fonctions d'authentification | `js/auth.js` |

---

## Debounce pour les appels API

```js
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Usage sur une recherche
const searchInput = document.querySelector('#search');
searchInput.addEventListener('input', debounce(async (e) => {
  const results = await fetchSearch(e.target.value);
  renderResults(results);
}, 400));
```
