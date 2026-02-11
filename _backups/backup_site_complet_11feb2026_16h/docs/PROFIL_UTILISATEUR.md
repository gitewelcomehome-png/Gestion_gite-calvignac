# 👤 Profil Utilisateur - Onboarding & Options

## 📋 Description

Les informations utilisateur sont maintenant collectées dès la **première inscription** via la page **Onboarding** ([pages/onboarding.html](../pages/onboarding.html)), puis modifiables à tout moment via la page **Options** ([pages/options.html](../pages/options.html)).

## 🎯 Collecte des informations

### ✅ Lors de l'inscription (onboarding.html)

**4 étapes de création de compte :**

#### Étape 0 : Création du compte
- Email
- Mot de passe
- Confirmation mot de passe

#### Étape 1 : Informations personnelles
- Prénom (obligatoire)
- Nom (obligatoire)
- Téléphone (obligatoire)
- Nom d'entreprise (optionnel)

#### Étape 2 : Adresse
- Adresse complète (obligatoire)
- Code postal (obligatoire)
- Ville (obligatoire)
- Pays (obligatoire - sélection liste)

#### Étape 3 : Confirmation
- Récapitulatif de toutes les informations
- Création du compte Supabase
- Enregistrement du profil complet
- Connexion automatique
- Redirection vers le dashboard

### 🔄 Modification ultérieure (options.html)

**Depuis le Dashboard** → Menu Options (⚙️) → Section "Mon Profil"

## 📝 Informations modifiables

### ✅ Champs obligatoires (marqués avec *)
- **Prénom**
- **Nom**
- **Téléphone**
- **Adresse**
- **Code postal**
- **Ville**
- **Pays** (sélection dans une liste)

### ⚪ Champs optionnels
- **Nom d'entreprise**

### 🔒 Champs non modifiables
- **Email** (géré par Supabase Auth)

## 💾 Fonctionnement

### 🆕 Lors de la première inscription (Onboarding)

1. L'utilisateur accède à [pages/onboarding.html](../pages/onboarding.html)
2. **Étape 0** : Saisie email + mot de passe (validation format + correspondance)
3. **Étape 1** : Saisie prénom, nom, téléphone, entreprise (optionnel)
4. **Étape 2** : Saisie adresse complète, code postal, ville, pays
5. **Étape 3** : Vérification du résumé
6. Clic sur "Créer mon compte" :
   - Création du compte Supabase Auth
   - Insertion dans la table `cm_clients` avec toutes les données
   - Connexion automatique
   - Redirection vers le dashboard

### ✏️ Modification dans Options

1. Accès via Dashboard → Options → Mon Profil
2. Les informations sont chargées automatiquement depuis `cm_clients`
- Un spinner s'affiche pendant le chargement
- Si une erreur survient, un message explicite est affiché

### Sauvegarde
1. Modification des champs souhaités
2. Clic sur "💾 Enregistrer le Profil"
3. Validation des champs obligatoires
4. Mise à jour en base de données
5. Message de confirmation

### Réinitialisation
- Bouton "🔄 Réinitialiser" pour annuler les modifications et recharger les données

## 🗄️ Base de données

### Table : `cm_clients`

Colonnes utilisées :
- `prenom_contact` TEXT
- `nom_contact` TEXT
- `email_principal` TEXT (lecture seule)
- `telephone` TEXT
- `nom_entreprise` TEXT
- `adresse` TEXT
- `code_postal` TEXT
- `ville` TEXT
- `pays` TEXT (default: 'France')

### Script SQL
Le fichier [sql/ADD_PROFILE_FIELDS_TO_CM_CLIENTS.sql](../sql/ADD_PROFILE_FIELDS_TO_CM_CLIENTS.sql) ajoute les colonnes manquantes si elles n'existent pas.

## 🎨 Design

- Interface responsive (3 colonnes sur grand écran, adaptée sur mobile)
- Thème clair/sombre automatique
- Validation visuelle des champs obligatoires
- Messages d'erreur clairs et explicites
- Champs désactivés (email) visuellement distincts

## ⚠️ Validations

- Tous les champs obligatoires doivent être remplis
- Message d'erreur si champs manquants
- Gestion des erreurs de connexion
- Gestion des erreurs de sauvegarde

## 🔧 Maintenance

### Fichiers modifiés
- ✅ [pages/onboarding.html](../pages/onboarding.html) - Ajout étape 0 (email/password) + collecte complète du profil
- ✅ [pages/options.html](../pages/options.html) - Ajout section profil pour modification
- ✅ [sql/ADD_PROFILE_FIELDS_TO_CM_CLIENTS.sql](../sql/ADD_PROFILE_FIELDS_TO_CM_CLIENTS.sql) - Colonnes BDD

### Dépendances
- Supabase Client (déjà inclus)
- shared-config.js (déjà inclus)
- table `cm_clients` (existante)

### Workflow complet
1. **Inscription** : [pages/onboarding.html](../pages/onboarding.html) collecte TOUTES les infos (4 étapes)
2. **Création compte** : Supabase Auth + enregistrement `cm_clients` 
3. **Connexion auto** : Redirection vers dashboard
4. **Modification** : [pages/options.html](../pages/options.html) permet de modifier le profil

## 📱 Responsive

- Desktop : 3 colonnes
- Tablet : 2 colonnes
- Mobile : 1 colonne

## ✨ Améliorations futures possibles

- [ ] Ajout photo de profil
- [ ] Changement de mot de passe
- [ ] Historique des modifications
- [ ] Validation du numéro de téléphone
- [ ] Autocomplétion adresse via API
