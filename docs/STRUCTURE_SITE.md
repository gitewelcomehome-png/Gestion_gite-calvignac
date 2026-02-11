# Structure du Site LiveOwnerUnit

## 📂 Architecture

```
/
├── index.html              → Page commerciale (landing page) 🌟
├── app.html                → Application client (propriétaires de gîtes)
└── vercel.json             → Configuration des routes
```

## 🌐 Routes Configurées (Vercel)

| URL | Fichier | Description |
|-----|---------|-------------|
| `/` | index.html | **Landing page commerciale** (page d'accueil publique) |
| `/app` | app.html | Application client (connexion propriétaires) |
| `/login` | app.html | Alias pour /app |

## 🎨 Pages

### 1. Page Commerciale (`index.html`)
**Objectif** : Présenter le produit aux prospects
- Design moderne avec logo intégré (SVG inline)
- Sections :
  - Hero avec CTA
  - Problèmes clients
  - Fonctionnalités détaillées
  - Tarifs avec/sans engagement
  - **Actualités & Ressources** (Blog, Vidéos, Veille réglementaire)
  - Comparaison vs gestion manuelle
  - CTA final
- **Bouton Connexion** → `/app`

### 2. Application Client (`app.html`)
**Objectif** : Interface pour les propriétaires de gîtes
- ⚠️ **PAGE PROTÉGÉE - NE PAS MODIFIER SANS DEMANDE EXPLICITE**
- Authentification requise
- Gestion des gîtes, calendriers, ménages, fiscalité
- Interface complète de l'application SaaS

## 🔗 Navigation

### Depuis la landing page (index.html)
- **"Connexion"** → `/app` (bouton header)
- **"Essai gratuit"** → Formulaire d'inscription (à implémenter)

### Depuis l'application (app.html)
- Une fois connecté, l'utilisateur reste dans `/app`
- Déconnexion → retour vers `/` (index.html)

## 🚀 Déploiement

### En production (Vercel)
- URL principale : `https://www.liveownerunit.fr/`
- Les rewrites Vercel gèrent automatiquement les routes
- `/` affiche index.html (commercial)
- `/app` affiche app.html (application)

### En local
Pour tester la page commerciale, accéder directement à `index.html` :
- Clic droit sur `index.html` → "Open with Live Server"
- Ou : `http://localhost:5500/index.html`

Pour tester l'application :
- Accéder à : `http://localhost:5500/app.html`

## 📝 Notes Importantes

1. **Logo** : Intégré en SVG inline dans index.html (pas de dépendance externe)
2. **Tarifs** : Options avec/sans engagement affichées
3. **Section Actualités** : Blog, tutoriels vidéo, veille réglementaire
4. **Honnêteté** : Tous les faux témoignages et statistiques gonflées supprimés
5. **Page CLIENT** : app.html est PROTÉGÉE - ne pas modifier sans demande explicite

## 🔧 Modifications Futures

Pour ajouter de nouvelles pages commerciales :
1. Créer le fichier HTML à la racine
2. Ajouter une route dans `vercel.json` si besoin
3. Créer des liens depuis index.html

Pour modifier l'application :
1. **Demander confirmation explicite**
2. Modifier app.html uniquement si autorisé
3. Tester en local avant déploiement
