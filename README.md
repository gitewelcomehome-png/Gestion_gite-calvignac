# 🏡 Gestion Gîtes Calvignac

Application web de gestion complète pour locations de gîtes ruraux (Cottage, Barn, Shed).

## ✨ Fonctionnalités Principales

### 📊 Dashboard & Pilotage
- Vue d'ensemble temps réel avec indicateurs clés
- **Vision Globale** : CA mensuel/annuel, bénéfices, trésorerie
- Alertes : Ménages à valider, travaux urgents, échéances fiscales

### 📅 Réservations
- Synchronisation multi-plateformes (Booking, Airbnb, direct)
- Calendrier interactif avec sync iCal
- Gestion des arrivées/départs et taux d'occupation

### 🧹 Espace Femme de Ménage
- Interface dédiée pour retours d'intervention
- Photos et observations par gîte
- Validation propriétaire avec historique

### 💰 Gestion Financière
- Charges & revenus par gîte
- Fiscalité (URSSAF, IR) avec calculs automatiques
- Suivi trésorerie et soldes bancaires
- Statistiques détaillées (revenus, CA, taux occupation)

### 👥 Fiches Clients
- Historique complet des séjours
- Communications et transactions
- Notes et préférences personnalisées

### 📋 Tâches Récurrentes
- Travaux, entretien, échéances administratives
- Mode récurrent avec gestion intelligente
- Archive automatique des tâches validées

## 🚀 Installation & Configuration

### Prérequis
- Compte Supabase (base de données PostgreSQL)
- Hébergement web (Vercel recommandé)
- URLs iCal des calendriers Booking/Airbnb

### Étapes d'installation

1. **Cloner le projet**
```bash
git clone https://github.com/gitewelcomehome-png/Gestion_gite-calvignac.git
cd Gestion_gite-calvignac
```

2. **Configurer la base de données**
```bash
# Exécuter les scripts SQL dans l'ordre via Supabase Dashboard
# Voir documentation/INSTALLATION_*.md pour détails
cd sql/
```

3. **Configuration locale**
```bash
# Éditer js/shared-config.js avec vos clés Supabase et URLs iCal
# ⚠️ NE JAMAIS committer les vraies clés (voir documentation sécurité)
```

4. **Déploiement**
```bash
# Via Vercel
vercel --prod
```

## 📁 Structure du Projet

```
/
├── index.html                  # Page principale (dashboard)
├── femme-menage.html          # Interface femme de ménage
├── fiche-client.html          # PWA Fiches clients
│
├── js/                        # Scripts JavaScript
│   ├── shared-config.js       # Configuration centralisée
│   ├── dashboard.js           # Logique dashboard
│   ├── reservations.js        # Gestion réservations
│   ├── menage.js              # Espace ménage
│   ├── charges.js             # Gestion financière
│   ├── fiscalite-v2.js        # Calculs fiscaux
│   └── fiches-clients.js      # CRM clients
│
├── tabs/                      # Composants UI (onglets)
│   ├── tab-dashboard.html
│   ├── tab-reservations.html
│   └── tab-menage.html
│
├── sql/                       # Scripts base de données
│   ├── create_*.sql           # Création des tables
│   └── fix_*.sql              # Corrections RLS
│
├── documentation/             # 📚 Guides complets
│   ├── AUDIT_SECURITE.md      # ⚠️ Audit de sécurité
│   ├── PLAN_COMMERCIALISATION.md  # 🎯 Plan d'action
│   └── GUIDE_*.md             # Guides fonctionnels
│
└── _archives/                 # Fichiers obsolètes
```

## 🛠️ Technologies

- **Vanilla JavaScript** (ES6+)
- **Bootstrap 5.3** - Design responsive
- **Chart.js** - Graphiques
- **FullCalendar** - Calendrier interactif
- **Supabase** - Backend (PostgreSQL + Auth)
- **Vercel** - Hébergement

## 📖 Documentation

Consultez [documentation/](documentation/) pour les guides complets :
- [AUDIT_SECURITE.md](documentation/AUDIT_SECURITE.md) - Analyse sécurité
- [PLAN_COMMERCIALISATION.md](documentation/PLAN_COMMERCIALISATION.md) - Roadmap
- [GUIDE_COMPLET.md](documentation/GUIDE_COMPLET.md) - Guide utilisateur
- [GUIDE_ESPACE_FEMME_MENAGE.md](documentation/GUIDE_ESPACE_FEMME_MENAGE.md)

## 🔒 Sécurité

### ⚠️ État : NON commercialisable

**Score** : 3/10 (voir [AUDIT_SECURITE.md](documentation/AUDIT_SECURITE.md))

**Vulnérabilités critiques** :
- ❌ Clés API publiques
- ❌ RLS désactivé
- ❌ Pas d'authentification
- ❌ Vulnérabilités XSS

**Plan d'action** : 6-8 semaines, 4 phases
- Phase 1 : RLS + Auth → Score 5/10
- Phase 2 : Secrets → Score 6.5/10
- Phase 3 : XSS → Score 8/10
- Phase 4 : RGPD → Score 9/10

## 📊 Statistiques

- **Lignes de code** : ~15 000
- **Tables** : 15+
- **Modules** : 8
- **Version** : v5 (Jan 2026)

---

**Statut** : ✅ Fonctionnel | ⚠️ Sécurité en cours
