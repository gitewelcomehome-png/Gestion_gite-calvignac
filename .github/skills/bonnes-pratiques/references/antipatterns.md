# Anti-patterns à Bannir

Si tu vois l'un de ces patterns dans du code existant, corrige-le. Si tu es en train de l'écrire, arrête-toi et refactorise.

---

## JavaScript

### ❌ `innerHTML` avec données dynamiques (XSS)
```js
// ❌
container.innerHTML = `<li>${user.nom}</li>`;

// ✅
const li = document.createElement('li');
li.textContent = user.nom;
container.appendChild(li);
```

### ❌ `var` au lieu de `const`/`let`
```js
// ❌
var total = 0;

// ✅
let total = 0;         // si réassigné
const MAX = 100;       // si constant
```

### ❌ Promesses sans gestion d'erreur
```js
// ❌
const data = await supabase.from('gites').select('*');

// ✅
const { data, error } = await supabase.from('gites').select('*');
if (error) throw error;
```

### ❌ `console.log` de debug laissés en production
```js
// ❌
console.log('ici', data);
console.log('test 2');

// ✅ Supprimer, ou utiliser un niveau adapté
console.error('[Module] Erreur inattendue:', error.message);
```

### ❌ Un event listener par élément généré dynamiquement
```js
// ❌ — Performance : N listeners créés pour N éléments
items.forEach(item => {
  item.addEventListener('click', handler);
});

// ✅ — Délégation : 1 seul listener sur le parent
parent.addEventListener('click', (e) => {
  if (e.target.matches('.item')) handler(e.target);
});
```

### ❌ Accès DOM répété dans une boucle
```js
// ❌
for (let i = 0; i < 100; i++) {
  document.querySelector('#list').innerHTML += `<li>${i}</li>`;
}

// ✅
const list = document.querySelector('#list');
const frag = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
  const li = document.createElement('li');
  li.textContent = i;
  frag.appendChild(li);
}
list.appendChild(frag);
```

### ❌ Clé API hardcodée dans le code front
```js
// ❌
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// ✅ Variable d'environnement Vercel ou config centralisée non commitée
```

### ❌ `setInterval` sans `clearInterval`
```js
// ❌ Fuite mémoire si l'élément est détruit
setInterval(refresh, 5000);

// ✅
const timer = setInterval(refresh, 5000);
// puis lors du teardown :
clearInterval(timer);
```

### ❌ Logique dupliquée entre plusieurs fichiers
Même bloc de code copié-collé dans plusieurs fichiers → extraire dans `js/utils.js` ou `js/supabase-operations.js`.

---

## CSS

### ❌ Valeurs magiques répétées
```css
/* ❌ */
.card   { border-radius: 12px; }
.modal  { border-radius: 12px; }
.badge  { border-radius: 12px; }

/* ✅ */
:root { --radius: 12px; }
.card, .modal, .badge { border-radius: var(--radius); }
```

### ❌ `!important` en cascade
Chaque `!important` comme solution à un problème de spécificité en cache un autre. Corriger la spécificité plutôt que d'empiler les `!important`.

### ❌ Animations via `top`/`left`/`width` (reflow)
```css
/* ❌ — Force un reflow complet */
.el { transition: left 0.3s; }

/* ✅ — GPU compositing, pas de reflow */
.el { transition: transform 0.3s; }
```

---

## HTML

### ❌ Bouton sans `type` dans un formulaire
```html
<!-- ❌ — Soumet le formulaire par défaut -->
<button onclick="cancel()">Annuler</button>

<!-- ✅ -->
<button type="button" onclick="cancel()">Annuler</button>
```

### ❌ Image sans `alt`
```html
<!-- ❌ -->
<img src="photo.jpg">

<!-- ✅ -->
<img src="photo.jpg" alt="Vue du gîte">
<!-- ou si décoratif : -->
<img src="decor.svg" alt="">
```

### ❌ Icône cliquable sans label accessible
```html
<!-- ❌ — Incompréhensible pour les lecteurs d'écran -->
<button onclick="deleteReservation()">🗑</button>

<!-- ✅ -->
<button type="button" aria-label="Supprimer la réservation" onclick="deleteReservation()">🗑</button>
```
