# 🚀 Guide d'Activation - Système de Fiches Clients

## ✅ État actuel

Le système de fiches clients est **entièrement intégré** dans votre application :

### Fichiers présents
- ✅ [index.html](index.html) - Tab configuré et chargé
- ✅ [js/fiche-client.js](js/fiche-client.js) - Génération et envoi WhatsApp
- ✅ [js/fiches-clients.js](js/fiches-clients.js) - Module admin complet
- ✅ [js/dashboard.js](js/dashboard.js) - Bouton "📄 Fiche Client" dans le dashboard
- ✅ [fiche-client.html](fiche-client.html) - Page client standalone
- ✅ [tabs/tab-fiches-clients.html](tabs/tab-fiches-clients.html) - Interface admin
- ✅ [sql/create_fiches_clients_tables.sql](sql/create_fiches_clients_tables.sql) - Script de création

### Fonctionnalités actives

#### 📊 Dans le Dashboard
- Bouton **"📄 Fiche Client"** sur chaque réservation à venir (J-3)
- Clic → Modal avec 3 options :
  - 🌐 **Ouvrir la fiche** - Nouvelle fenêtre
  - 💬 **Envoyer par WhatsApp** - Message pré-rempli
  - 📋 **Copier le lien** - Presse-papier

#### 📄 Dans l'onglet Fiches Clients
- Liste complète des réservations
- Génération/régénération de fiches
- Gestion des demandes horaires
- Suivi des retours clients
- Configuration des gîtes

---

## 🔧 Activation en 3 étapes

### Étape 1 : Créer les tables Supabase (5 min)

1. Ouvrir [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. Copier-coller le contenu de [sql/create_fiches_clients_tables.sql](sql/create_fiches_clients_tables.sql)
5. Cliquer sur **Run** ▶️

**8 tables seront créées :**
- `infos_gites` - Configuration des gîtes
- `checklists` - Items des checklists
- `checklist_validations` - Validations clients
- `demandes_horaires` - Demandes arrivée/départ
- `retours_clients` - Retours et demandes
- `client_access_tokens` - Tokens sécurisés
- `fiche_generation_logs` - Logs de génération
- `activites_consultations` - Stats activités

### Étape 2 : Désactiver le RLS (2 min)

⚠️ **Important** : Pour que l'accès public aux fiches fonctionne, désactivez le RLS :

1. Dans **SQL Editor** de Supabase
2. Copier-coller le contenu de [sql/force_disable_rls.sql](sql/force_disable_rls.sql)
3. Cliquer sur **Run** ▶️

### Étape 3 : Configurer les gîtes (5 min)

1. Ouvrir votre application
2. Aller dans l'onglet **📄 Fiches Clients**
3. Cliquer sur **⚙️ Configuration gîtes**
4. Pour chaque gîte (Trévoux et Couzon) :
   - 🔑 **Code d'entrée** (ex: A1234)
   - 📍 **Adresse complète**
   - 📶 **WiFi** (SSID et mot de passe)
   - 🕐 **Horaires** (arrivée/départ)
   - 📋 **Instructions d'accès** (FR et EN)
5. **💾 Enregistrer**

---

## 🧪 Test rapide (2 min)

### Test depuis le Dashboard

1. Ouvrir l'onglet **📊 Tableau de Bord**
2. Trouver une réservation à venir
3. Cliquer sur le bouton **📄 Fiche Client**
4. ✅ **Modal s'ouvre** avec 3 boutons
5. Cliquer sur **🌐 Ouvrir la fiche**
6. ✅ **Nouvelle fenêtre** avec la fiche client
7. Vérifier les 4 onglets : Entrée, Pendant, Sortie, Activités

### Test WhatsApp

1. Depuis le modal, cliquer sur **💬 Envoyer par WhatsApp**
2. ✅ **WhatsApp Web s'ouvre** avec un message pré-rempli :

```
Bonjour [Nom Client],

Voici votre guide personnalisé pour votre séjour :
https://votre-site.com/fiche-client.html?token=xxxxx

Vous y trouverez toutes les informations nécessaires 
(codes, WiFi, horaires, activités...).

À très bientôt ! 🏡
```

### Test sur mobile

1. Copier le lien de la fiche
2. Envoyer sur votre téléphone
3. Ouvrir dans le navigateur mobile
4. ✅ **Interface responsive** et fonctionnelle

---

## 🔍 Diagnostic des problèmes

### "Rien ne se passe" quand je clique sur Fiche Client

**Causes possibles :**

1. **Tables pas créées** → Console navigateur : `relation "client_access_tokens" does not exist`
   - 🔧 **Solution** : Exécuter [sql/create_fiches_clients_tables.sql](sql/create_fiches_clients_tables.sql)

2. **RLS actif** → Console : `new row violates row-level security policy`
   - 🔧 **Solution** : Exécuter [sql/force_disable_rls.sql](sql/force_disable_rls.sql)

3. **Fichier JS non chargé** → Console : `aperçuFicheClient is not defined`
   - 🔧 **Solution** : Vérifier que [js/fiche-client.js](js/fiche-client.js) est bien importé dans [index.html](index.html)

4. **Supabase non initialisé** → Console : `supabaseClient is undefined`
   - 🔧 **Solution** : Vérifier la configuration Supabase dans [js/shared-config.js](js/shared-config.js)

### Ouvrir la Console du navigateur

**Chrome/Edge/Firefox :**
- Windows : `F12` ou `Ctrl+Shift+I`
- Mac : `Cmd+Option+I`

Aller dans l'onglet **Console** et chercher les messages d'erreur en rouge.

---

## 📱 Fonctionnalités de la fiche client

### Pour les clients (Page fiche-client.html)

**4 onglets :**
1. **🏠 Entrée** - Code, adresse, WiFi, checklist
2. **🏡 Pendant** - Consignes, équipements, contacts
3. **🚪 Sortie** - Checklist départ, horaires
4. **🗺️ Activités** - Carte interactive avec lieux à découvrir

**Fonctionnalités :**
- 🌍 **Bilingue** FR/EN
- ✅ **Checklists interactives** avec sauvegarde
- ⏰ **Demandes horaires** (arrivée anticipée, départ tardif)
- 💬 **Formulaire retours** clients
- 📋 **Copie rapide** des codes WiFi
- 📍 **Carte activités** avec géolocalisation
- 🔒 **Accès sécurisé** par token unique
- ⏳ **Expiration automatique** 7 jours après départ

### Pour l'admin (Dashboard + Onglet dédié)

**Dashboard :**
- 📄 Bouton "Fiche Client" sur chaque réservation
- 💬 Envoi WhatsApp en 1 clic
- ⏰ Alerte J-3 pour envoyer la fiche

**Onglet Fiches Clients :**
- 📊 **Statistiques** en temps réel
- 📋 **Liste complète** des réservations
- ⏰ **Gestion demandes** horaires (approve/refuse)
- 💬 **Suivi retours** clients par urgence
- ⚙️ **Configuration gîtes** (CRUD)
- ✅ **Gestion checklists** (CRUD)
- 📈 **Logs de génération**

---

## 🎨 Personnalisation

### Modifier les messages WhatsApp

Fichier : [js/fiche-client.js](js/fiche-client.js#L147)

```javascript
function sendWhatsAppFiche(telephone, ficheUrl, nom) {
    const message = `Bonjour ${nom},

Voici votre guide personnalisé pour votre séjour :
${ficheUrl}

Vous y trouverez toutes les informations nécessaires...

À très bientôt ! 🏡`;
    
    // ... reste du code
}
```

### Modifier les horaires par défaut

Fichier : [sql/create_fiches_clients_tables.sql](sql/create_fiches_clients_tables.sql#L36)

```sql
-- Horaires
heure_arrivee_standard TIME DEFAULT '18:00',
heure_depart_standard TIME DEFAULT '10:00',
heure_arrivee_anticipee_min TIME DEFAULT '13:00',
heure_arrivee_avec_menage TIME DEFAULT '17:00',
heure_depart_semaine_max TIME DEFAULT '12:00',
heure_depart_dimanche_max TIME DEFAULT '17:00',
```

### Ajouter des checklists

1. Aller dans **📄 Fiches Clients** → **✅ Checklists**
2. Choisir le gîte et le type (entrée/sortie)
3. Ajouter l'item en français et anglais
4. Ordre d'affichage (1, 2, 3...)
5. Enregistrer

---

## 📚 Documentation complète

- [README_FICHES_CLIENTS.md](README_FICHES_CLIENTS.md) - Doc technique complète
- [IMPLEMENTATION_FICHES_CLIENTS.md](IMPLEMENTATION_FICHES_CLIENTS.md) - Récap implémentation
- [GUIDE_DEMARRAGE_FICHES_CLIENTS.md](GUIDE_DEMARRAGE_FICHES_CLIENTS.md) - Guide démarrage rapide

---

## ✅ Checklist finale

- [ ] Tables créées dans Supabase
- [ ] RLS désactivé
- [ ] Infos gîtes configurées (codes, WiFi, horaires)
- [ ] Test génération fiche depuis dashboard
- [ ] Test ouverture fiche
- [ ] Test envoi WhatsApp
- [ ] Test sur mobile
- [ ] Checklists personnalisées ajoutées

**Une fois cette checklist complète, le système est 100% opérationnel ! 🎉**
