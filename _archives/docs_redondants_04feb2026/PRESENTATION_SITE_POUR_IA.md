# 🏠 Présentation du Site - Gestion Gîtes Calvignac

## 📌 Contexte Général

### Deux Activités Distinctes

**Propriétaire** : Stéphane Calvignac (stephanecalvignac@hotmail.fr)

1. **Activité de Location de Gîtes** (usage personnel)
   - Gestion de ses propres gîtes
   - Réservations, calendriers, ménages
   - Synchronisation iCal avec plateformes (Airbnb, Booking, etc.)

2. **Activité de Channel Manager** (service B2B)
   - Plateforme SaaS pour d'autres propriétaires de gîtes
   - Les **clients** = propriétaires qui utilisent le service
   - Abonnements payants (Basic, Pro, Premium)
   - **Page Admin dédiée** pour gérer cette activité

---

## 🏗️ Architecture Technique

### Stack Technologique
- **Frontend** : HTML5, CSS3 (Custom), JavaScript Vanilla
- **Backend** : Supabase (PostgreSQL + Auth)
- **Hébergement** : Vercel
- **Authentification** : Supabase Auth
- **Sécurité** : Row Level Security (RLS) sur toutes les tables

### Fichiers Principaux
```
/index.html                    # Page principale avec onglets
/pages/admin.html              # Page administration Channel Manager
/css/main.css                  # Styles principaux
/js/shared-config.js           # Configuration Supabase globale
/sql/                          # Scripts SQL de structure
```

---

## 📊 Base de Données Supabase

### Tables Principales (Activité Gîtes)

#### 1. `gites`
```sql
- id (UUID, PK)
- nom (TEXT) - Nom du gîte
- capacite (INT) - Nombre de personnes max
- adresse (TEXT)
- code_postal (TEXT)
- ville (TEXT)
- couleur_calendrier (TEXT) - Couleur hex pour calendrier
- ical_url (TEXT) - URL de synchro iCal
- user_id (UUID, FK) - Propriétaire du gîte
```

#### 2. `reservations`
```sql
- id (UUID, PK)
- gite_id (UUID, FK)
- date_debut (DATE)
- date_fin (DATE)
- nom_client (TEXT)
- email_client (TEXT)
- telephone_client (TEXT)
- nb_personnes (INT)
- montant (DECIMAL)
- statut (TEXT) - confirmée, en_attente, annulée
- source (TEXT) - airbnb, booking, direct, etc.
- user_id (UUID, FK)
```

**Règle Critique** : 
- Un gîte ne peut avoir qu'**UNE réservation à la fois**
- Aucune réservation ne peut **démarrer le même jour** qu'une autre
- En cas de conflit : **garder la plus courte**

#### 3. `cleaning_schedule`
```sql
- id (UUID, PK)
- gite_id (UUID, FK)
- date_menage (DATE)
- heure_debut (TIME)
- duree_estimee (INT) - en minutes
- statut (TEXT) - planifié, en_cours, terminé
- femme_menage_id (UUID, FK) - Référence à user_roles
- notes (TEXT)
- user_id (UUID, FK)
```

#### 4. `clients_gites`
```sql
- id (UUID, PK)
- nom (TEXT)
- prenom (TEXT)
- email (TEXT)
- telephone (TEXT)
- adresse (TEXT)
- date_naissance (DATE)
- preferences (JSONB)
- user_id (UUID, FK)
```

### Tables Système

#### 5. `user_roles`
```sql
- id (UUID, PK)
- user_id (UUID, FK auth.users)
- role (TEXT) - owner, admin, cleaner, viewer
```
Rôles :
- **owner** : Propriétaire total (Stéphane)
- **admin** : Administrateur
- **cleaner** : Femme de ménage (accès planning)
- **viewer** : Lecture seule

---

## 🎨 Fonctionnalités Existantes (Activité Gîtes)

### Onglets Principaux (index.html)

1. **📅 Calendrier**
   - Vue mensuelle multi-gîtes
   - Synchronisation iCal automatique
   - Gestion des disponibilités
   - Couleurs par gîte

2. **🏠 Mes Gîtes**
   - Liste des gîtes
   - CRUD complet (Créer, Lire, Modifier, Supprimer)
   - Configuration iCal par gîte

3. **📋 Réservations**
   - Liste chronologique
   - Filtres par gîte/statut/période
   - Détails des réservations
   - Gestion des conflits

4. **🧹 Ménages**
   - Planning des ménages
   - Attribution aux femmes de ménage
   - Suivi des statuts

5. **👥 Clients**
   - Annuaire des clients
   - Historique des séjours
   - Coordonnées et préférences

6. **🌐 Découvrir**
   - Présentation des résidences
   - Page vitrine publique

7. **📊 Statistiques**
   - Taux d'occupation
   - Revenus
   - Analyses diverses

---

## 🚀 Besoin : Page Administration Channel Manager

### Objectif
Créer une interface d'administration pour gérer l'**activité de Channel Manager** (service B2B)

### Statistiques à Afficher
1. **Clients actifs** - Nombre de propriétaires utilisant le service
2. **Connexions ce mois** - Nombre de connexions des clients
3. **Synchronisations actives** - Nombre de synchros iCal en cours
4. **CA du mois** - Chiffre d'affaires du service Channel Manager

### Sections Nécessaires

#### 1. Gestion des Clients
**Table des clients du Channel Manager** (pas les gîtes)
- Email du client propriétaire
- Nom/Prénom
- Type d'abonnement (Basic, Pro, Premium)
- Nombre de gîtes gérés par ce client
- Statut (actif, suspendu, résilié)
- Actions : Voir détails, Modifier, Suspendre

#### 2. Abonnements & Facturation
- Répartition des abonnements (Basic/Pro/Premium)
- Revenus récurrents mensuels (MRR)
- Factures en attente
- Historique des paiements

#### 3. Activité de la Plateforme
- Logs de connexion des clients
- Synchronisations iCal par client
- Erreurs éventuelles
- Utilisation des ressources

#### 4. Support Client
- Tickets ouverts
- Demandes d'assistance
- Statut des résolutions

---

## 🔐 Sécurité & Accès

### Accès Page Admin
- **Méthode primaire** : Vérification email `stephanecalvignac@hotmail.fr`
- **Méthode secondaire** : Rôle `owner` ou `admin` en BDD
- Si aucun accès : redirection vers `index.html`

### RLS (Row Level Security)
- Activé sur **toutes les tables**
- Chaque utilisateur ne voit que ses données (`user_id = auth.uid()`)
- L'admin voit toutes les données

---

## 📦 Structure Proposée BDD (Channel Manager)

### Nouvelles Tables à Créer

#### `cm_clients` (Channel Manager Clients)
```sql
- id (UUID, PK)
- user_id (UUID, FK auth.users) - Compte Supabase du client
- nom_entreprise (TEXT)
- nom_contact (TEXT)
- prenom_contact (TEXT)
- email_principal (TEXT)
- telephone (TEXT)
- type_abonnement (TEXT) - basic, pro, premium
- statut (TEXT) - actif, suspendu, resilié
- date_inscription (TIMESTAMPTZ)
- date_fin_abonnement (TIMESTAMPTZ)
- montant_mensuel (DECIMAL)
- nb_gites_max (INT) - Limite selon abonnement
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### `cm_subscriptions` (Historique des abonnements)
```sql
- id (UUID, PK)
- client_id (UUID, FK cm_clients)
- type_abonnement (TEXT)
- montant (DECIMAL)
- date_debut (TIMESTAMPTZ)
- date_fin (TIMESTAMPTZ)
- statut (TEXT) - actif, annulé, expiré
- mode_paiement (TEXT)
```

#### `cm_invoices` (Factures)
```sql
- id (UUID, PK)
- client_id (UUID, FK cm_clients)
- numero_facture (TEXT)
- montant_ht (DECIMAL)
- montant_ttc (DECIMAL)
- tva (DECIMAL)
- date_emission (DATE)
- date_echeance (DATE)
- statut (TEXT) - payée, en_attente, en_retard
- pdf_url (TEXT)
```

#### `cm_activity_logs` (Logs d'activité)
```sql
- id (UUID, PK)
- client_id (UUID, FK cm_clients)
- type_activite (TEXT) - connexion, sync_ical, modification, etc.
- details (JSONB)
- ip_address (INET)
- user_agent (TEXT)
- created_at (TIMESTAMPTZ)
```

#### `cm_support_tickets` (Tickets support)
```sql
- id (UUID, PK)
- client_id (UUID, FK cm_clients)
- sujet (TEXT)
- description (TEXT)
- statut (TEXT) - ouvert, en_cours, résolu, fermé
- priorite (TEXT) - basse, normale, haute, urgente
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- resolved_at (TIMESTAMPTZ)
```

---

## 🎯 Règles de Développement

### Impératif
- ❌ **Aucun hardcoding** de valeurs
- ❌ **Aucune action dangereuse** en production
- ✅ **Zéro erreur console** tolérée
- ✅ Toujours **vérifier les variables existantes** en BDD avant d'en créer
- ✅ **Catcher toutes les erreurs** systématiquement
- ✅ Maintenir les fichiers **ARCHITECTURE.md** et **ERREURS_CRITIQUES.md** à jour

### Méthodologie
1. Répondre **UNIQUEMENT** à ce qui est demandé
2. **PAS d'initiatives** sans accord explicite
3. **ÉCOUTER** attentivement les instructions
4. En cas de blocage après 2 tentatives : proposer alternatives
5. Nettoyer les logs inutiles

---

## 📝 État Actuel

### Fichiers Actifs
- ✅ `index.html` - Page principale fonctionnelle
- ✅ `pages/admin.html` - Page admin (en cours de refonte)
- ✅ `sql/create_user_roles.sql` - Table des rôles créée
- ✅ `js/shared-config.js` - Configuration Supabase opérationnelle

### Problèmes Résolus
- ✅ Erreur config.js → shared-config.js
- ✅ Accès admin via email fallback
- ✅ Client Supabase initialisé correctement

### À Faire
- 🔄 Refonte complète page admin pour Channel Manager
- 🔄 Création tables BDD Channel Manager
- 🔄 Statistiques et KPIs Channel Manager
- 🔄 Gestion clients et abonnements

---

## 🔍 Points Importants pour une IA

1. **Deux contextes distincts** : Ne jamais mélanger activité gîtes personnelle et activité Channel Manager
2. **Sécurité critique** : Site en production avec clients réels
3. **Base de données** : Toujours vérifier les tables existantes avant modification
4. **Pas d'initiatives** : Demander validation avant toute action non explicitement demandée
5. **Conventions de nommage** :
   - Tables gîtes personnels : `gites`, `reservations`, `cleaning_schedule`, etc.
   - Tables Channel Manager : préfixe `cm_` (ex: `cm_clients`, `cm_subscriptions`)
6. **Email propriétaire** : `stephanecalvignac@hotmail.fr` (accès admin garanti)

---

## 📞 Contact
**Propriétaire** : Stéphane Calvignac  
**Email** : stephanecalvignac@hotmail.fr  
**Date document** : 29 janvier 2026
