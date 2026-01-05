# 🚀 Guide de Démarrage Rapide - Fiches Clients

## ⏱️ Installation en 10 minutes

### Étape 1 : Créer les tables dans Supabase (2 min)

1. Ouvrir [Supabase Dashboard](https://supabase.com/dashboard)
2. Aller dans **SQL Editor**
3. Copier-coller le contenu de `sql/create_fiches_clients_tables.sql`
4. Cliquer sur **Run** ▶️
5. ✅ Vérifier que 8 tables ont été créées

### Étape 2 : Configurer les gîtes (3 min)

1. Toujours dans Supabase, aller dans **Table Editor**
2. Ouvrir la table `infos_gites`
3. Vous verrez 2 lignes (Trévoux et Couzon) pré-remplies
4. Cliquer sur **Edit** pour chaque ligne et compléter :
   - `code_entree` : Le vrai code d'accès
   - `adresse_complete` : L'adresse complète
   - `instructions_acces_fr` : Instructions détaillées
   - `wifi_ssid` et `wifi_password` : Les vrais identifiants WiFi
   - Les horaires (laisser par défaut ou ajuster)

> **Astuce** : Vous pourrez aussi le faire depuis le dashboard admin après intégration

### Étape 3 : Intégrer dans index.html (3 min)

#### A. Ajouter le script

Dans `index.html`, dans la section `<head>`, après les autres scripts, ajouter :

```html
<script src="js/fiches-clients.js"></script>
```

#### B. Ajouter le bouton tab

Dans `index.html`, chercher la section `.nav-tabs` et ajouter :

```html
<button class="tab-btn" data-tab="fichesClients">
    📄 Fiches Clients
</button>
```

#### C. Ajouter le contenu du tab

Dans `index.html`, après les autres `<div class="tab-content">`, copier-coller **tout** le contenu de :
```
tabs/tab-fiches-clients.html
```

#### D. Initialiser le module

Dans `index.html`, chercher la fonction `showTab()` et ajouter :

```javascript
function showTab(tabName) {
    // ... code existant ...
    
    // Ajouter cette condition
    if (tabName === 'fichesClients') {
        initFichesClients();
    }
    
    // ... suite du code ...
}
```

### Étape 4 : Tester (2 min)

1. Ouvrir `index.html` dans le navigateur
2. Cliquer sur l'onglet **📄 Fiches Clients**
3. Vous devriez voir :
   - Les statistiques (0 partout au début)
   - La liste des réservations
   - Les sous-onglets

4. Tester la configuration :
   - Cliquer sur **⚙️ Configuration gîtes**
   - Cliquer sur **🏡 Configurer Trévoux**
   - Compléter/vérifier les infos
   - **💾 Enregistrer**

### Étape 5 : Générer votre première fiche (1 min)

1. Revenir sur **📋 Liste des réservations**
2. Choisir une réservation active
3. Cliquer sur **📄 Générer la fiche**
4. Copier l'URL générée
5. Ouvrir l'URL dans un nouvel onglet (ou sur mobile)
6. 🎉 **Votre première fiche est prête !**

## 📱 Test sur mobile

1. Copier l'URL de la fiche
2. Envoyer sur votre téléphone (WhatsApp, email, etc.)
3. Ouvrir sur mobile
4. Tester :
   - Navigation entre les onglets
   - Switch de langue FR/EN
   - Cocher des items de checklist
   - Faire une demande horaire
   - Envoyer un retour

## ✅ Checklist de configuration

- [ ] Tables créées dans Supabase
- [ ] Informations Trévoux complétées
- [ ] Informations Couzon complétées
- [ ] Script intégré dans index.html
- [ ] Bouton tab ajouté
- [ ] Contenu tab ajouté
- [ ] Initialisation ajoutée dans showTab()
- [ ] Test génération d'une fiche
- [ ] Test ouverture sur mobile

## 🎯 Prochaines étapes

1. **Compléter les checklists**
   - Aller dans **✅ Checklists**
   - Personnaliser les items d'entrée et sortie pour chaque gîte

2. **Générer un QR Code WiFi**
   - Aller sur [qifi.org](https://qifi.org)
   - Entrer SSID et mot de passe
   - Télécharger le QR Code
   - Uploader sur votre hébergement ou Supabase Storage
   - Copier l'URL dans la config du gîte

3. **Tester le workflow complet**
   - Générer une fiche pour une vraie réservation
   - Envoyer par WhatsApp au client
   - Demander au client de tester
   - Recevoir une demande horaire
   - Approuver/refuser depuis le dashboard

4. **Personnaliser les traductions**
   - Éditer `js/fiche-client-app.js`
   - Modifier l'objet `translations`
   - Adapter à votre ton

## 🐛 Dépannage rapide

### "Token manquant" à l'ouverture de la fiche
➡️ Vérifier que l'URL contient bien `?token=xxxxx`

### Les checklists ne se sauvent pas
➡️ Ouvrir la console (F12) et vérifier les erreurs  
➡️ Vérifier la connexion Supabase

### Le dashboard ne charge pas
➡️ Vérifier que `js/fiches-clients.js` est bien chargé  
➡️ Console : vérifier qu'il n'y a pas d'erreur JavaScript

### Les statistiques sont à 0
➡️ C'est normal au début !  
➡️ Générez quelques fiches et elles vont augmenter

## 💡 Astuces pro

### URL courte pour WhatsApp
Utilisez un raccourcisseur d'URL comme [Bitly](https://bitly.com) pour rendre les liens plus courts :
```
https://bit.ly/gite-dupont-jan2026
```

### QR Code pour impression
Générez un QR Code de la fiche et imprimez-le :
- Mettre dans le gîte (sur le frigo, table)
- Le client scanne = accès direct à sa fiche

### Notification d'expiration
Créez un système pour prévenir quand une fiche va expirer :
- Requête SQL pour lister les tokens expirant bientôt
- Email automatique pour régénérer si nécessaire

### Backup des retours clients
Exportez régulièrement les retours depuis Supabase :
```sql
SELECT * FROM retours_clients 
WHERE created_at > '2026-01-01'
ORDER BY created_at DESC;
```

## 📞 Besoin d'aide ?

- **Documentation complète** : `README_FICHES_CLIENTS.md`
- **Structure SQL** : `sql/create_fiches_clients_tables.sql`
- **Code source client** : `js/fiche-client-app.js`
- **Code source admin** : `js/fiches-clients.js`

## 🎬 Vidéo tutoriel

> TODO : Créer une vidéo de 5 min montrant :
> - La génération d'une fiche
> - L'ouverture sur mobile
> - La validation d'une checklist
> - La gestion d'une demande horaire

---

**Temps total d'installation : 10 minutes**  
**Niveau requis : Débutant**  
**Difficulté : ⭐⭐☆☆☆**

🎉 **Vous êtes prêt ! Bonne utilisation !**
