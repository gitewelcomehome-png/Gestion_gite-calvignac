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

- **[README_DEV.md](README_DEV.md)** : Guide technique complet
- **[STATUS_PROJET.md](STATUS_PROJET.md)** : État d'avancement détaillé

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

**Version** : 2.0  
**Dernière mise à jour** : 8 janvier 2026
