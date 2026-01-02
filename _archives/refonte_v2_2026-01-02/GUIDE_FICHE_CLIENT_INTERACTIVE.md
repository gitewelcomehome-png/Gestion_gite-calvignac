# 🎯 GUIDE COMPLET - FICHE CLIENT INTERACTIVE

## 📋 Vue d'ensemble

Système complet de fiches clients personnalisées avec :
- ✅ Formulaire d'horaires interactif
- ✅ FAQ personnalisée par gîte
- ✅ Logique intelligente d'horaires (ménage, dimanche, etc.)
- ✅ Informations pratiques complètes
- ✅ Traçabilité des réponses clients

---

## 🗄️ Base de Données

### 1. Exécuter le script SQL

```bash
# Dans Supabase SQL Editor, exécuter :
sql/create_fiche_client_preferences.sql
sql/create_faq_table.sql
```

### Tables créées :

**`clients_preferences`** - Stocke les choix d'horaires des clients
- `reservation_id` : Lien avec la réservation
- `heure_arrivee` : Heure d'arrivée choisie
- `heure_depart` : Heure de départ choisie
- `commentaires` : Remarques du client
- `date_soumission` : Quand le client a rempli le formulaire

**`fiches_consultations`** - Trace les consultations
- `reservation_id` : Quelle réservation
- `date_consultation` : Quand
- `ip_address` : D'où (optionnel)
- `user_agent` : Quel navigateur

**`faq`** - Questions fréquentes
- `categorie` : arrivee, depart, equipements, localisation, tarifs, reglement, autre
- `gite` : tous, trevoux, calvignac
- `question` : La question
- `reponse` : La réponse (HTML autorisé)
- `visible` : Afficher dans fiche client ?
- `ordre` : Ordre d'affichage

---

## 🎨 Fonctionnalités

### 1. Logique d'horaires intelligente

#### **Arrivée :**
- ✅ Par défaut : **16h minimum**
- ⚠️ Si ménage prévu l'après-midi : **17h minimum**
- 📅 Proposé jusqu'à **22h**

#### **Départ :**
- ✅ Par défaut : **jusqu'à 12h**
- 🗓️ **Dimanche** sans ménage : **jusqu'à 17h**
- ⏰ Dès **8h le matin**

### 2. FAQ Personnalisée

- 📍 **Par gîte** : Questions spécifiques à chaque gîte
- 🏷️ **7 catégories** : Arrivée, Départ, Équipements, etc.
- ✏️ **Éditable** : Via l'onglet FAQ
- 📤 **Exportable** : Format HTML

### 3. Page HTML Complète

La fiche client générée contient :
- 📅 Dates du séjour
- 🏠 Adresse et GPS
- 🔑 Codes d'accès (clés, WiFi)
- ⏰ Formulaire horaires
- ❓ FAQ
- 🍽️ Restaurants recommandés
- 🎯 Activités à proximité
- 📞 Contacts d'urgence

---

## 🚀 Utilisation

### Pour vous (propriétaire) :

1. **Gérer la FAQ**
   - Aller dans l'onglet **❓ FAQ**
   - Cliquer **"Ajouter une Question"**
   - Remplir le formulaire
   - Choisir le gîte concerné
   - Enregistrer

2. **Envoyer une fiche client**
   - Aller dans **Dashboard** ou **Réservations**
   - Cliquer sur une réservation
   - Cliquer **"Fiche Client"**
   - Choisir **"✨ Fiche Interactive Client"**
   - Fichier HTML téléchargé automatiquement
   - **Envoyer le fichier au client par email**

### Pour le client :

1. **Recevoir** le fichier HTML par email
2. **Ouvrir** dans le navigateur (double-clic)
3. **Lire** toutes les informations
4. **Remplir** le formulaire d'horaires :
   - Heure d'arrivée souhaitée
   - Heure de départ souhaitée
   - Commentaires éventuels
5. **Envoyer** → Horaires sauvegardés automatiquement

---

## 📊 Voir les réponses clients

### Dans le Dashboard :

Un widget affichera les horaires confirmés pour chaque réservation :

```
📅 Semaine du 6 janvier 2026

🏡 Trévoux - Famille Dupont
   🔑 Arrivée : Lundi 6 jan à 18:00 ✅
   🚪 Départ : Dimanche 12 jan à 11:00 ✅
   💬 "Nous arriverons peut-être un peu plus tôt"
```

### Dans Supabase :

Requête pour voir toutes les préférences :

```sql
SELECT 
    r.nom,
    r.gite,
    r.date_debut,
    r.date_fin,
    cp.heure_arrivee,
    cp.heure_depart,
    cp.commentaires,
    cp.date_soumission
FROM clients_preferences cp
JOIN reservations r ON r.id = cp.reservation_id
ORDER BY r.date_debut DESC;
```

---

## 🎯 Distinction des gîtes

### FAQ :
- Chaque question peut être pour :
  - ✅ **Tous les gîtes**
  - 🏠 **Trévoux uniquement**
  - ⛰️ **Calvignac uniquement**

### Fiche client :
- Génère automatiquement selon le gîte de la réservation
- Affiche uniquement les questions pertinentes
- Utilise les infos pratiques du bon gîte

---

## 🔧 Personnalisation

### Modifier les horaires proposés :

Dans `js/fiche-client-interactive.js` :

```javascript
// Arrivée
const heureMin = bloqueAvant17h ? 17 : 16;  // ← Changer ici
const heureMax = 22;  // ← Et ici

// Départ
const heureMaxDepart = dimancheJusque17h ? 17 : 12;  // ← Et ici
```

### Ajouter une catégorie FAQ :

1. Modifier le SQL :
```sql
categorie VARCHAR(50) NOT NULL CHECK (
    categorie IN ('arrivee', 'depart', 'equipements', 
                  'localisation', 'tarifs', 'reglement', 
                  'autre', 'NOUVELLE_CATEGORIE')
)
```

2. Mettre à jour l'interface FAQ

---

## ✅ Checklist de déploiement

- [ ] Exécuter `create_faq_table.sql`
- [ ] Exécuter `create_fiche_client_preferences.sql`
- [ ] Remplir les infos pratiques (onglet Infos Pratiques)
- [ ] Personnaliser la FAQ (onglet FAQ)
- [ ] Tester avec une réservation :
  - [ ] Générer la fiche
  - [ ] Ouvrir le HTML
  - [ ] Remplir le formulaire
  - [ ] Vérifier dans Supabase
- [ ] Ajouter widget dashboard (prochaine étape)

---

## 🐛 Dépannage

### Le formulaire ne s'envoie pas :
- Vérifier que Supabase est bien configuré
- Vérifier les politiques RLS des tables
- Ouvrir la console navigateur (F12) pour voir les erreurs

### La FAQ ne s'affiche pas :
- Vérifier que les questions sont marquées `visible = true`
- Vérifier le champ `gite` (tous/trevoux/calvignac)

### Les horaires sont bloqués :
- C'est normal si un ménage est prévu
- Vérifier le planning ménage

---

## 📞 Support

Toutes les données sont dans Supabase :
- **Tables** : clients_preferences, fiches_consultations, faq
- **Interface** : Onglet FAQ pour gérer les questions
- **Bouton** : "✨ Fiche Interactive Client" dans fiche client

Le fichier HTML généré est **autonome** : le client peut l'ouvrir sans connexion Internet (sauf pour envoyer le formulaire).
