# 🏡 Gestion Gîte Calvignac - Application Multi-Tenant

Application web de gestion de gîtes et locations saisonnières.

## 🚀 Quick Start

### Développement local
```bash
python3 -m http.server 8080
# Accès : http://localhost:8080
```

### Comptes de test
- **Email** : stephanecalvignac@hotmail.fr
- **Organisation** : Mon Gîte

## �� Documentation

### Documents Essentiels
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture technique complète
- **[DESCRIPTION_COMPLETE_SITE.md](DESCRIPTION_COMPLETE_SITE.md)** - Documentation master
- **[ERREURS_CRITIQUES.md](ERREURS_CRITIQUES.md)** - Historique bugs et solutions
- **[STRUCTURE_PROJET.md](STRUCTURE_PROJET.md)** - Structure du projet
- **[MODULES_JAVASCRIPT.md](MODULES_JAVASCRIPT.md)** - Documentation JavaScript

### Documentation Complémentaire
- **[docs/](docs/)** - Guides, démos et documentation technique
- **[docs/guides/](docs/guides/)** - Guides de migration et intégration
- **[docs/demos/](docs/demos/)** - Fichiers de démonstration HTML

## 🏗️ Architecture

- **Frontend** : HTML/JS/CSS vanilla
- **Backend** : Supabase (PostgreSQL + Auth + RLS)
- **Hébergement** : Vercel
- **Schéma** : Multi-tenant (organizations → gites → reservations)

## 🔒 Sécurité

- Score actuel : 4/10
- RLS activé sur toutes les tables
- Auth Supabase en place

## 📞 Support

Voir documentation complète dans `README_DEV.md`.

---

**Version** : 2.1  
**Dernière mise à jour** : 25 janvier 2026  
**Nettoyage racine** : ✅ Organisé (25/01/2026)
