# ✅ Checklist Complète - Déploiement Fiches Clients

## 🎯 Objectif
Mettre en production le système de fiches clients interactives pour les gîtes Trévoux et Couzon.

---

## 📋 Phase 1 : Préparation (avant déploiement)

### Base de données Supabase
- [ ] Connexion à [Supabase Dashboard](https://supabase.com/dashboard)
- [ ] Ouverture SQL Editor
- [ ] Copie du fichier `sql/create_fiches_clients_tables.sql`
- [ ] Exécution du script SQL ▶️
- [ ] Vérification : 8 tables créées
  - [ ] `infos_gites`
  - [ ] `checklists`
  - [ ] `checklist_validations`
  - [ ] `demandes_horaires`
  - [ ] `retours_clients`
  - [ ] `client_access_tokens`
  - [ ] `fiche_generation_logs`
  - [ ] `activites_consultations`

### Configuration initiale des gîtes
- [ ] Ouvrir table `infos_gites` dans Supabase
- [ ] Ligne Trévoux :
  - [ ] `code_entree` complété
  - [ ] `adresse_complete` complétée
  - [ ] `latitude` / `longitude` complétées
  - [ ] `instructions_acces_fr` complétées
  - [ ] `instructions_acces_en` complétées
  - [ ] `wifi_ssid` complété
  - [ ] `wifi_password` complété
  - [ ] Horaires vérifiés/ajustés
- [ ] Ligne Couzon :
  - [ ] `code_entree` complété
  - [ ] `adresse_complete` complétée
  - [ ] `latitude` / `longitude` complétées
  - [ ] `instructions_acces_fr` complétées
  - [ ] `instructions_acces_en` complétées
  - [ ] `wifi_ssid` complété
  - [ ] `wifi_password` complété
  - [ ] Horaires vérifiés/ajustés

### QR Codes WiFi (optionnel mais recommandé)
- [ ] Aller sur [qifi.org](https://qifi.org)
- [ ] Générer QR Code Trévoux
  - [ ] Uploader sur hébergement
  - [ ] Copier URL dans `wifi_qr_code_url` (Trévoux)
- [ ] Générer QR Code Couzon
  - [ ] Uploader sur hébergement
  - [ ] Copier URL dans `wifi_qr_code_url` (Couzon)

---

## 🔧 Phase 2 : Intégration dans index.html

### Étape 1 : Ajouter le script
- [ ] Ouvrir `index.html`
- [ ] Chercher la section `<head>`
- [ ] Trouver la ligne `<script src="js/faq.js" type="module"></script>`
- [ ] Ajouter après : `<script src="js/fiches-clients.js"></script>`
- [ ] Sauvegarder

### Étape 2 : Ajouter le bouton tab
- [ ] Dans `index.html`, chercher `.nav-tabs`
- [ ] Trouver le dernier bouton tab (probablement FAQ)
- [ ] Ajouter ce code après :
```html
<button class="tab-btn" data-tab="fichesClients">
    <span class="tab-icon">📄</span>
    Fiches Clients
</button>
```
- [ ] Sauvegarder

### Étape 3 : Ajouter le contenu du tab
- [ ] Ouvrir `tabs/tab-fiches-clients.html`
- [ ] Copier TOUT son contenu
- [ ] Dans `index.html`, chercher le dernier `<div class="tab-content">`
- [ ] Coller le contenu après
- [ ] Vérifier que l'id est bien `fichesClientsContent`
- [ ] Sauvegarder

### Étape 4 : Initialiser le module
- [ ] Dans `index.html`, chercher la fonction `showTab()`
- [ ] Trouver les conditions `if (tabName === ...)`
- [ ] Avant le dernier `}` de la fonction, ajouter :
```javascript
else if (tabName === 'fichesClients') {
    document.getElementById('fichesClientsContent').style.display = 'block';
    initFichesClients();
}
```
- [ ] Sauvegarder

---

## 🧪 Phase 3 : Tests

### Test 1 : Chargement de l'interface
- [ ] Ouvrir `index.html` dans Chrome/Firefox
- [ ] Console ouverte (F12)
- [ ] Cliquer sur l'onglet "📄 Fiches Clients"
- [ ] Vérifications :
  - [ ] Le tab s'affiche sans erreur
  - [ ] Les statistiques montrent des chiffres (même 0)
  - [ ] La liste des réservations se charge
  - [ ] Les 5 sous-onglets sont visibles
  - [ ] Pas d'erreur dans la console

### Test 2 : Configuration d'un gîte (via UI)
- [ ] Cliquer sur "⚙️ Configuration gîtes"
- [ ] Cliquer sur "🏡 Configurer Trévoux"
- [ ] Modal s'ouvre avec formulaire
- [ ] Vérifier que les données sont pré-remplies
- [ ] Modifier un champ (ex: règlement intérieur)
- [ ] Cliquer "💾 Enregistrer"
- [ ] Notification de succès
- [ ] Rouvrir le modal → modification visible

### Test 3 : Génération d'une fiche
- [ ] Retour sur "📋 Liste des réservations"
- [ ] Sélectionner une réservation récente
- [ ] Cliquer "📄 Générer la fiche"
- [ ] Modal s'ouvre
- [ ] Cliquer "📄 Générer la fiche" (bouton dans modal)
- [ ] Attendre génération (1-2 secondes)
- [ ] Message de succès
- [ ] URL affichée dans le modal
- [ ] Cliquer "📋 Copier"
- [ ] URL copiée dans presse-papier

### Test 4 : Ouverture fiche client (desktop)
- [ ] Coller l'URL dans un nouvel onglet
- [ ] Écran de chargement apparaît brièvement
- [ ] Page se charge avec :
  - [ ] Nom du gîte en haut
  - [ ] Switch FR/EN visible
  - [ ] 4 onglets : Entrée/Pendant/Sortie/Activités
  - [ ] Onglet "Entrée" actif par défaut
- [ ] Vérifier contenu onglet Entrée :
  - [ ] Adresse visible
  - [ ] Bouton Google Maps cliquable
  - [ ] Horaire d'arrivée affiché
  - [ ] Code d'entrée en GROS
  - [ ] WiFi SSID et password visibles
  - [ ] Bouton copie WiFi fonctionne
  - [ ] Checklist d'entrée avec cases à cocher

### Test 5 : Interaction avec la checklist
- [ ] Cocher 2-3 items de la checklist d'entrée
- [ ] Vérifier que la barre de progression se met à jour
- [ ] Recharger la page (F5)
- [ ] Vérifier que les items cochés sont toujours cochés ✓
- [ ] Aller dans Supabase → table `checklist_validations`
- [ ] Vérifier que les validations sont enregistrées

### Test 6 : Demande horaire
- [ ] Cliquer sur "Demander une arrivée plus tôt"
- [ ] Formulaire s'affiche
- [ ] Saisir une heure (ex: 15:00)
- [ ] Ajouter un motif (ex: "Train arrive à 14h")
- [ ] Cliquer "Envoyer"
- [ ] Notification de succès
- [ ] Retour au dashboard admin
- [ ] Aller sur "⏰ Demandes horaires"
- [ ] La demande apparaît en "En attente"
- [ ] Cliquer "✅ Approuver"
- [ ] Demande passe en "Approuvées"

### Test 7 : Retour client
- [ ] Revenir sur la fiche client
- [ ] Aller dans l'onglet "Pendant"
- [ ] Remplir le formulaire retours :
  - [ ] Type : Problème
  - [ ] Sujet : "Eau chaude"
  - [ ] Description : "L'eau chaude met du temps"
  - [ ] Urgence : Normale
- [ ] Cliquer "Envoyer"
- [ ] Notification de succès
- [ ] Dashboard admin → "💬 Retours clients"
- [ ] Le retour apparaît
- [ ] Cliquer "✅ Marquer résolu"
- [ ] Ajouter une réponse
- [ ] Retour passe en "Résolu"

### Test 8 : Carte d'activités
- [ ] Sur la fiche client, aller dans "Activités"
- [ ] Carte se charge
- [ ] Marqueur rouge = gîte visible
- [ ] Autres marqueurs = activités visibles
- [ ] Cliquer sur un marqueur
- [ ] Popup s'affiche avec infos
- [ ] Scroller la liste en-dessous
- [ ] Cliquer sur "📍 Itinéraire"
- [ ] Google Maps s'ouvre dans nouvel onglet

### Test 9 : Multilingue
- [ ] Sur la fiche client, cliquer sur "EN" en haut à droite
- [ ] Tous les textes passent en anglais
- [ ] Vérifier quelques traductions clés
- [ ] Recliquer sur "FR"
- [ ] Retour au français

### Test 10 : Mobile (CRUCIAL)
- [ ] Ouvrir DevTools (F12)
- [ ] Mode responsive (Ctrl+Shift+M)
- [ ] Sélectionner iPhone ou Samsung
- [ ] Tester toute la navigation
- [ ] Vérifier que tout est lisible et cliquable
- [ ] OU : Envoyer l'URL par WhatsApp à votre téléphone
- [ ] Tester sur vrai mobile

### Test 11 : WhatsApp
- [ ] Dashboard admin → Liste réservations
- [ ] Sélectionner réservation avec téléphone
- [ ] Cliquer "💬 WhatsApp"
- [ ] WhatsApp Web/App s'ouvre
- [ ] Message pré-rempli avec le lien
- [ ] Vérifier le texte du message
- [ ] Envoyer (à vous-même pour tester)

### Test 12 : Expiration
- [ ] Aller dans Supabase → table `client_access_tokens`
- [ ] Trouver le token de test
- [ ] Noter la valeur `expires_at`
- [ ] C'est bien 7 jours après `date_fin` de la réservation ?
- [ ] Pour tester expiration : modifier manuellement `expires_at` à hier
- [ ] Essayer d'ouvrir la fiche
- [ ] Message "Ce lien a expiré" doit s'afficher

---

## 🎨 Phase 4 : Personnalisation (optionnel)

### Checklists personnalisées
- [ ] Dashboard → "✅ Checklists"
- [ ] Sélectionner Trévoux
- [ ] Colonne "Entrée" :
  - [ ] Supprimer les items exemples non pertinents
  - [ ] Cliquer "➕ Ajouter un item"
  - [ ] Texte FR : "Vérifier..."
  - [ ] Texte EN : "Check..."
  - [ ] Obligatoire ? Oui/Non
  - [ ] Répéter pour tous vos items
- [ ] Répéter pour colonne "Sortie"
- [ ] Répéter pour Couzon

### Équipements
- [ ] Aller dans Supabase → table `infos_gites`
- [ ] Ligne Trévoux → colonne `equipements`
- [ ] Éditer le JSON :
```json
[
  {"nom_fr": "Lave-vaisselle", "nom_en": "Dishwasher", "icone": "🍽️"},
  {"nom_fr": "Machine à laver", "nom_en": "Washing machine", "icone": "🧺"},
  {"nom_fr": "WiFi Fibre", "nom_en": "Fiber WiFi", "icone": "📶"},
  {"nom_fr": "Parking privé", "nom_en": "Private parking", "icone": "🅿️"}
]
```
- [ ] Sauvegarder
- [ ] Répéter pour Couzon
- [ ] Tester sur fiche client (onglet "Pendant")

### Contacts d'urgence
- [ ] Table `infos_gites` → colonne `contacts_urgence`
- [ ] Éditer le JSON :
```json
[
  {"nom": "Propriétaire", "telephone": "+33612345678", "type": "urgence"},
  {"nom": "Plombier local", "telephone": "+33612345679", "type": "service"},
  {"nom": "Médecin", "telephone": "15", "type": "urgence"}
]
```
- [ ] Tester sur fiche (onglet "Pendant")

### Règlement intérieur
- [ ] Configuration gîtes → Modal édition
- [ ] Remplir "Règlement intérieur (Français)"
- [ ] Remplir "Règlement intérieur (Anglais)"
- [ ] Sauvegarder
- [ ] Tester sur fiche (onglet "Pendant")

---

## 🚀 Phase 5 : Mise en production

### Déploiement Vercel
- [ ] Commit des modifications :
```bash
git add .
git commit -m "✨ Ajout système fiches clients interactives"
git push origin main
```
- [ ] Vercel détecte le push
- [ ] Build automatique
- [ ] Vérifier que le build réussit
- [ ] Tester sur l'URL de production

### Vérification production
- [ ] Ouvrir l'URL production
- [ ] Répéter Test 1 (chargement interface)
- [ ] Répéter Test 3 (génération fiche)
- [ ] Répéter Test 4 (ouverture fiche)
- [ ] Répéter Test 10 (mobile réel)

### Communication clients
- [ ] Préparer message type pour envoyer les fiches
- [ ] Tester envoi à 1-2 clients bêta
- [ ] Recueillir feedback
- [ ] Ajuster si nécessaire

---

## 📊 Phase 6 : Suivi & Maintenance

### Tableau de bord hebdomadaire
- [ ] Consulter "📊" statistiques fiches clients
- [ ] Nombre de fiches générées cette semaine ?
- [ ] Nombre d'ouvertures ?
- [ ] Demandes horaires en attente ?
- [ ] Retours clients non traités ?

### Actions régulières
- [ ] Traiter les demandes horaires (quotidien)
- [ ] Répondre aux retours clients (quotidien)
- [ ] Vérifier les tokens expirés (hebdomadaire)
- [ ] Exporter les stats (mensuel)
- [ ] Backup Supabase (mensuel)

### Optimisations futures
- [ ] Analyser les activités les plus consultées
- [ ] Ajuster les checklists selon retours
- [ ] Améliorer les traductions si nécessaire
- [ ] Ajouter de nouvelles fonctionnalités

---

## 🎓 Formation utilisateurs

### Pour vous (admin)
- [ ] Lire `README_FICHES_CLIENTS.md` en entier
- [ ] Suivre `GUIDE_DEMARRAGE_FICHES_CLIENTS.md`
- [ ] Pratiquer génération de 5-10 fiches
- [ ] Pratiquer validation demandes horaires
- [ ] Pratiquer traitement retours

### Pour clients (optionnel)
- [ ] Créer une vidéo de 2 min :
  - Comment ouvrir sa fiche
  - Comment cocher les checklists
  - Comment faire une demande horaire
  - Comment envoyer un retour
- [ ] Envoyer avec la première fiche

---

## ✅ Checklist finale avant production

- [ ] Toutes les tables SQL créées
- [ ] Infos des 2 gîtes complètes
- [ ] Module intégré dans index.html
- [ ] Tests 1 à 12 passés avec succès
- [ ] Au moins 1 fiche testée sur mobile réel
- [ ] WhatsApp testé et fonctionnel
- [ ] Checklists personnalisées
- [ ] Règlement intérieur rempli
- [ ] Contacts d'urgence renseignés
- [ ] Commit + push vers production
- [ ] Build Vercel réussi
- [ ] Test final en production

---

## 🎉 C'EST TERMINÉ !

Vous avez maintenant un système complet de fiches clients interactives !

**Prochaines réservations** : Générer automatiquement leur fiche et envoyer par WhatsApp.

**Temps total d'installation** : 30-45 minutes (avec personnalisation)  
**Temps par fiche** : 30 secondes (génération + envoi WhatsApp)  
**ROI** : Immédiat ! Moins de questions clients, meilleure expérience, avis positifs ++

---

## 📞 Support

En cas de problème, consulter dans l'ordre :
1. `GUIDE_DEMARRAGE_FICHES_CLIENTS.md` → Section "Dépannage"
2. `README_FICHES_CLIENTS.md` → Section "Debugging"
3. Console navigateur (F12) → Copier les erreurs
4. Supabase Dashboard → Vérifier les données

**Fichiers de référence créés :**
- `sql/create_fiches_clients_tables.sql` - Schéma BDD
- `fiche-client.html` - Page client
- `js/fiche-client-app.js` - Logique client  
- `tabs/tab-fiches-clients.html` - Interface admin
- `js/fiches-clients.js` - Logique admin
- `INTEGRATION_INDEX_HTML.js` - Instructions intégration
- Ce fichier checklist !

**Bon courage ! 🚀**
