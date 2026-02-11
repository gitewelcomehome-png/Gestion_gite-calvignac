# Structure du Site LiveOwnerUnit

## 📂 Architecture

```
/
├── commercial.html          → Page commerciale (landing page)
├── demo-site-commercial.html → Version démo (même contenu que commercial.html)
├── index.html               → Application client (propriétaires de gîtes)
└── vercel.json              → Configuration des routes
```

## 🌐 Routes Configurées (Vercel)

| URL | Fichier | Description |
|-----|---------|-------------|
| `/` | commercial.html | **Landing page commerciale** (page d'accueil publique) |
| `/app` | index.html | Application client (connexion propriétaires) |
| `/login` | index.html | Alias pour /app |
| `/commercial.html` | commercial.html | Accès direct à la landing |
| `/index.html` | index.html | Accès direct à l'app |

## 🎨 Pages

### 1. Page Commerciale (`commercial.html`)
**Objectif** : Présenter le produit aux prospects
- Design moderne avec logo intégré (SVG inline)
- Sections :
  - Hero avec CTA
  - Problèmes clients
  - Fonctionnalités détaillées
  - Tarifs avec/sans engagement
  - **Actualités & Ressources** (Blog, Vidéos, Veille réglementaire)
  - Comparaison vs gestion manuelle
  - Témoignages (section supprimée pour honnêteté)
  - CTA final
- **Bouton Connexion** → `/app`

### 2. Application Client (`index.html`)
**Objectif** : Interface pour les propriétaires de gîtes
- ⚠️ **PAGE PROTÉGÉE - NE PAS MODIFIER SANS DEMANDE EXPLICITE**
- Authentification requise
- Gestion des gîtes, calendriers, ménages, fiscalité
- Interface complète de l'application SaaS

## 🔗 Navigation

### Depuis la landing page (commercial.html)
- **"Connexion"** → `/app` (bouton header)
- **"Essai gratuit"** → Formulaire d'inscription (à implémenter)

### Depuis l'application (index.html)
- Une fois connecté, l'utilisateur reste dans `/app`
- Déconnexion → retour vers `/` (commercial.html)

## 🚀 Déploiement

### En production (Vercel)
- URL principale : `https://liveownerunit.fr/`
- Les rewrites Vercel gèrent automatiquement les routes
- `/` affiche commercial.html
- `/app` affiche index.html

### En local
```bash
# Utiliser un serveur HTTP
python -m http.server 8000
# ou
npx http-server
```
Puis accéder à :
- `http://localhost:8000/commercial.html` (landing)
- `http://localhost:8000/index.html` (app)

## 📝 Notes Importantes

1. **Logo** : Intégré en SVG inline dans commercial.html (pas de dépendance externe)
2. **Tarifs** : Options avec/sans engagement affichées
3. **Section Actualités** : Blog, tutoriels vidéo, veille réglementaire
4. **Honnêteté** : Tous les faux témoignages et statistiques gonflées supprimés
5. **Page CLIENT** : index.html est PROTÉGÉE - ne pas modifier sans demande explicite

## 🔧 Modifications Futures

Pour ajouter de nouvelles pages commerciales :
1. Créer le fichier HTML à la racine
2. Ajouter une route dans `vercel.json` si besoin
3. Créer des liens depuis commercial.html

Pour modifier l'application :
1. **Demander confirmation explicite**
2. Modifier index.html uniquement si autorisé
3. Tester en local avant déploiement
