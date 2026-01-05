# 📄 Système de Fiches Clients Interactives

## Vue d'ensemble

Système complet pour générer des fiches personnalisées par réservation, permettant aux clients d'accéder à toutes les informations de leur séjour via un lien unique et sécurisé.

## 🎯 Fonctionnalités principales

### Pour les clients (Page fiche-client.html)
- **4 onglets interactifs** : Entrée, Pendant, Sortie, Activités
- **Bilingue** : Français / Anglais avec switch en haut
- **Responsive mobile-first** : Optimisé pour smartphones
- **Checklists interactives** : Validation en temps réel des items d'entrée/sortie
- **Demandes horaires** : Formulaires pour arrivée anticipée ou départ tardif
- **Formulaire retours** : Demandes, retours, améliorations, problèmes
- **Carte activités** : Réutilisation de la carte existante avec tracking
- **Accès sécurisé** : Token unique avec expiration 7 jours après départ

### Pour les admins (Dashboard)
- **Génération de fiches** : Créer automatiquement une fiche pour chaque réservation
- **Envoi WhatsApp** : Lien direct pour envoyer la fiche via WhatsApp
- **Gestion demandes horaires** : Approuver/refuser avec notifications
- **Suivi retours clients** : Visualiser et traiter les retours
- **Configuration gîtes** : CRUD des informations (codes, WiFi, horaires, etc.)
- **Gestion checklists** : CRUD des items de checklist par gîte
- **Statistiques** : Nombre de fiches, ouvertures, demandes, retours

## 📦 Installation

### 1. Créer les tables dans Supabase

Exécutez le fichier SQL dans l'éditeur SQL de Supabase :

\`\`\`bash
sql/create_fiches_clients_tables.sql
\`\`\`

Ce script va créer :
- `infos_gites` : Informations et configuration par gîte
- `checklists` : Items des checklists entrée/sortie
- `checklist_validations` : Validations par réservation
- `demandes_horaires` : Demandes d'arrivée/départ
- `retours_clients` : Retours et demandes des clients
- `client_access_tokens` : Tokens d'accès sécurisés
- `fiche_generation_logs` : Logs de génération
- `activites_consultations` : Statistiques activités

### 2. Intégrer dans index.html

Ajoutez dans `<head>` de index.html :

\`\`\`html
<script src="js/fiches-clients.js"></script>
\`\`\`

Ajoutez dans les onglets (après les autres tabs) :

\`\`\`html
<button class="tab-btn" data-tab="fichesClients">
    📄 Fiches Clients
</button>
\`\`\`

Ajoutez le contenu du tab (dans le main) :

\`\`\`html
<!-- Insérer le contenu de tabs/tab-fiches-clients.html -->
\`\`\`

### 3. Initialiser au chargement

Dans votre fonction d'initialisation principale (probablement dans index.html) :

\`\`\`javascript
// Dans la fonction qui gère le switch des tabs
if (tabName === 'fichesClients') {
    initFichesClients();
}
\`\`\`

## 🚀 Utilisation

### Générer une fiche client

1. Aller dans l'onglet **Fiches Clients**
2. Trouver la réservation dans la liste
3. Cliquer sur **📄 Générer la fiche**
4. Le système génère automatiquement :
   - Un token unique et sécurisé
   - Une URL d'accès : `https://votresite.com/fiche-client.html?token=xxxxx`
   - Date d'expiration : 7 jours après la date de départ

### Envoyer par WhatsApp

1. Après génération (ou pour une fiche existante)
2. Cliquer sur **💬 WhatsApp**
3. Un message pré-rempli s'ouvre avec le lien de la fiche
4. Envoyer directement au client

### Gérer les demandes horaires

1. Aller dans le sous-onglet **⏰ Demandes horaires**
2. Voir toutes les demandes (arrivée anticipée / départ tardif)
3. Le système indique si la demande est auto-approuvable
4. Cliquer sur **✅ Approuver** ou **❌ Refuser** (avec motif)

### Gérer les retours clients

1. Aller dans le sous-onglet **💬 Retours clients**
2. Voir tous les retours par type et urgence
3. Cliquer sur **✅ Marquer résolu** quand traité
4. Option **📞 Contacter** pour répondre via WhatsApp

### Configurer un gîte

1. Aller dans le sous-onglet **⚙️ Configuration gîtes**
2. Cliquer sur **🏡 Configurer Trévoux** ou **Couzon**
3. Remplir tous les champs :
   - Code d'entrée
   - Adresse et coordonnées GPS
   - Instructions d'accès (FR et EN)
   - WiFi (SSID, mot de passe, QR Code)
   - Horaires (arrivée/départ standard et limites)
   - Règlement intérieur (FR et EN)
4. **💾 Enregistrer**

### Gérer les checklists

1. Aller dans le sous-onglet **✅ Checklists**
2. Sélectionner le gîte
3. Deux colonnes : Entrée / Sortie
4. **➕ Ajouter un item** : Texte FR, texte EN, obligatoire ?
5. Modifier ou supprimer les items existants

## 🗺️ Logique métier des horaires

### Arrivée anticipée

- **Sans ménage l'après-midi** : Arrivée possible dès **13h**
- **Avec ménage l'après-midi** : Arrivée possible à partir de **17h**
- Le système calcule automatiquement selon le `cleaning_schedule`

### Départ tardif

- **En semaine** : Départ jusqu'à **12h** (nécessite validation manuelle)
- **Dimanche sans ménage** : Départ jusqu'à **17h** (auto-approuvable)
- **Dimanche avec ménage** : Départ à **10h** (règle standard)

## 📱 Expérience client

Quand le client ouvre sa fiche :

1. **Écran de chargement** avec validation du token
2. **Header fixe** avec nom du gîte et switch langue FR/EN
3. **Navigation tabs mobile** : 4 onglets avec icônes
4. **Contenu scrollable** adapté au mobile

### Onglet Entrée

- Adresse avec bouton Google Maps
- Horaire d'arrivée standard + formulaire demande anticipée
- Code d'entrée en GROS
- Instructions d'accès (accordion)
- WiFi avec copie rapide + QR Code
- Checklist d'arrivée avec progression

### Onglet Pendant

- Liste des équipements
- Règlement intérieur
- Contacts d'urgence avec bouton appel
- Formulaire retours/demandes avec types et urgence

### Onglet Sortie

- Horaire de départ + formulaire départ tardif
- Instructions de sortie
- Checklist de départ avec progression

### Onglet Activités

- Carte interactive (Leaflet) avec gîte + activités
- Liste scrollable des activités
- Boutons : Itinéraire, Site web, Appeler
- Tracking automatique des consultations

## 📊 Base de données

### Relations clés

\`\`\`
reservations (existante)
    ↓
client_access_tokens (token unique)
    ↓
checklist_validations
demandes_horaires
retours_clients
fiche_generation_logs
\`\`\`

### Colonnes importantes

**infos_gites**
- `gite` : 'Trévoux' | 'Couzon' (UNIQUE)
- `code_entree` : Code d'accès
- `wifi_ssid`, `wifi_password`, `wifi_qr_code_url`
- Horaires : `heure_arrivee_standard`, `heure_depart_standard`, etc.
- Textes bilingues : `*_fr`, `*_en`
- JSON : `equipements`, `contacts_urgence`

**client_access_tokens**
- `token` : Chaîne hexadécimale 64 caractères (UNIQUE)
- `reservation_id` : Lien vers la réservation
- `expires_at` : Date d'expiration (7 jours après départ)
- `access_count` : Nombre d'ouvertures

**demandes_horaires**
- `type` : 'arrivee_anticipee' | 'depart_tardif'
- `status` : 'pending' | 'approved' | 'refused'
- `automatiquement_approuvable` : Calculé par le système

**retours_clients**
- `type` : 'demande' | 'retour' | 'amelioration' | 'probleme'
- `urgence` : 'basse' | 'normale' | 'haute'
- `status` : 'nouveau' | 'en_cours' | 'resolu' | 'archive'

## 🔒 Sécurité

- **Tokens uniques** : 64 caractères hexadécimaux cryptographiquement sécurisés
- **Expiration automatique** : 7 jours après date de départ
- **Pas d'authentification requise** : Mais token obligatoire
- **Tracking d'accès** : Compteur + dernière ouverture

## 🎨 Personnalisation

### Modifier les couleurs

Dans `fiche-client.html`, section `<style>` :

\`\`\`css
:root {
    --primary: #3b82f6;  /* Bleu principal */
    --success: #10b981;   /* Vert */
    --danger: #ef4444;    /* Rouge */
    --warning: #f59e0b;   /* Orange */
}
\`\`\`

### Ajouter des traductions

Dans `js/fiche-client-app.js`, objet `translations` :

\`\`\`javascript
const translations = {
    fr: {
        nouvelle_cle: 'Texte en français',
        // ...
    },
    en: {
        nouvelle_cle: 'Text in English',
        // ...
    }
};
\`\`\`

### Ajouter des équipements

Dans Supabase, table `infos_gites`, colonne `equipements` (JSONB) :

\`\`\`json
[
    {
        "nom_fr": "Lave-vaisselle",
        "nom_en": "Dishwasher",
        "icone": "🍽️"
    },
    {
        "nom_fr": "Netflix",
        "nom_en": "Netflix",
        "icone": "📺"
    }
]
\`\`\`

## 📝 Fichiers créés

\`\`\`
sql/
    create_fiches_clients_tables.sql      # Création tables

fiche-client.html                          # Page client standalone

js/
    fiche-client-app.js                    # Logique côté client
    fiches-clients.js                      # Logique admin dashboard

tabs/
    tab-fiches-clients.html                # Interface admin
\`\`\`

## 🚧 À intégrer dans index.html

1. Ajouter le script dans `<head>` :
   \`\`\`html
   <script src="js/fiches-clients.js"></script>
   \`\`\`

2. Ajouter le bouton tab dans la navigation

3. Insérer le contenu de `tabs/tab-fiches-clients.html`

4. Appeler `initFichesClients()` au switch du tab

## 🔄 Workflow complet

1. **Admin** : Génère la fiche depuis le dashboard
2. **Système** : Crée token + URL, log la génération
3. **Admin** : Envoie l'URL par WhatsApp au client
4. **Client** : Ouvre l'URL sur son mobile
5. **Client** : Consulte les infos, valide les checklists
6. **Client** : Fait une demande horaire → notif admin
7. **Admin** : Approuve/refuse la demande
8. **Client** : Envoie un retour → notif admin
9. **Admin** : Marque le retour comme résolu
10. **Système** : Tracking des consultations d'activités

## 🐛 Debugging

### Token invalide ou expiré

- Vérifier que le token existe dans `client_access_tokens`
- Vérifier la date d'expiration (`expires_at`)
- Régénérer une nouvelle fiche si nécessaire

### Checklist ne se sauvegarde pas

- Vérifier la connexion Supabase
- Console du navigateur pour voir les erreurs
- Vérifier que `reservation_id` est valide

### Carte d'activités ne s'affiche pas

- Vérifier que les activités ont `latitude` et `longitude`
- Vérifier que Leaflet.js est chargé
- Console pour erreurs JavaScript

## 📞 Support

Pour toute question ou problème, créer une issue sur GitHub avec :
- Description du problème
- Navigateur et version
- Console JavaScript (F12)
- Étapes pour reproduire

## 🎉 Améliorations futures

- [ ] PWA avec mode hors-ligne
- [ ] Notifications push pour demandes
- [ ] Widget météo dans "Pendant"
- [ ] Galerie photos du gîte
- [ ] Export PDF de la fiche
- [ ] Chat intégré
- [ ] Support multilingue (ES, IT, DE)
- [ ] QR Code unique par réservation
- [ ] Recommandations d'activités personnalisées

## 📄 Licence

Propriété de Gestion Gîtes Calvignac - Usage interne uniquement
