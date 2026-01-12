# 🧹 Guide Espace Femme de Ménage

## 📋 Vue d'ensemble

La page **femme-menage.html** est une interface dédiée à votre femme de ménage pour :
- Voir ses interventions planifiées
- Créer des tâches pour vous (achats, travaux)
- Mettre à jour les stocks de draps
- Faire des retours après chaque ménage

## 🚀 Accès à la page

### Pour vous (propriétaire)
Dans l'onglet **Planning Ménage**, cliquez sur le bouton vert :
```
🧹 Espace Femme de Ménage
```

### Pour la femme de ménage
Donnez-lui directement l'URL :
```
https://votre-site.com/femme-menage.html
```

## 🎯 Fonctionnalités

### 1️⃣ Mes Interventions Prévues
- Affiche automatiquement tous les ménages planifiés et validés
- Triés par date (les prochains en premier)
- Informations affichées :
  * Date complète (jour, date, mois)
  * Gîte concerné (Trévoux ou Couzon)
  * Horaire proposé
  * Notes éventuelles

### 2️⃣ Créer une Tâche

#### Achats & Courses 🛒
La femme de ménage peut signaler des besoins :
- Titre : Description courte (ex: "Racheter du liquide vaisselle")
- Gîte : Trévoux, Couzon ou les deux
- Description : Détails optionnels

**Résultat** : La tâche apparaît immédiatement dans votre Dashboard, catégorie "Achats"

#### Travaux & Maintenance 🔧
Pour signaler des problèmes :
- Titre : Description du problème
- Gîte : Localisation
- Priorité : Normale ou Urgente (⚠️ préfixe "URGENT")
- Description : Détails du problème

**Résultat** : La tâche apparaît dans votre Dashboard, catégorie "Travaux"

### 3️⃣ Mettre à Jour les Stocks de Draps 🛏️

Deux onglets (Trévoux / Couzon) avec 7 articles chacun :
- Draps plats grands
- Draps plats petits
- Housses couette grandes
- Housses couette petites
- Taies d'oreillers
- Serviettes
- Tapis de bain

**Processus** :
1. Sélectionner le gîte (onglet)
2. Modifier les quantités
3. Cliquer sur "💾 Sauvegarder"

**Résultat** : Les stocks sont immédiatement mis à jour dans votre onglet **Gestion Draps**

### 4️⃣ Faire un Retour après Ménage 📝

Formulaire complet pour chaque intervention :

#### État de la maison à l'arrivée
- ✅ Propre
- 🧹 Sale (normal)
- ⚠️ Dégâts constatés
- ❓ Autre

**+ Détails optionnels** : Description libre

#### Déroulement du ménage
- ✅ Bien passé
- ⚠️ Problèmes rencontrés
- ❌ Difficultés importantes

**+ Détails** : Explications (temps insuffisant, matériel défectueux, etc.)

## 🔔 Notifications sur votre Dashboard

Quand la femme de ménage envoie un retour, **vous êtes notifié immédiatement** :

### Affichage en haut du Dashboard
Une alerte colorée apparaît automatiquement :
```
🧹 Retour ménage Trévoux du 5 janv. : ✅ ✅
```

Icônes :
- Premier symbole = État de la maison (✅🧹⚠️❓)
- Deuxième symbole = Déroulement (✅⚠️❌)

### Validation du retour

1. **Cliquez sur l'alerte** → Une modal s'ouvre avec tous les détails
2. Lisez les informations complètes :
   - Gîte et date
   - État constaté avec détails
   - Déroulement avec explications
3. **Cliquez sur "✅ Valider ce retour"**
4. L'alerte disparaît du dashboard

## 📊 Base de données

### Table : retours_menage

Structure :
```sql
- id
- gite (Trévoux/Couzon)
- date_menage
- etat_arrivee (propre/sale/dégâts/autre)
- details_etat (texte libre)
- deroulement (bien/problèmes/difficultés)
- details_deroulement (texte libre)
- validated (boolean)
- validated_at
- validated_by
- created_at
```

## 🎨 Interface

### Design
- Dégradé violet moderne (comme page validation société)
- Cards blanches avec ombres
- Boutons colorés par fonction :
  * Vert : Achats, sauvegarde
  * Orange : Travaux
  * Violet : Envoi retour

### Responsive
- Adapté mobile et desktop
- Grille de stocks : 2 colonnes sur mobile, flexible sur desktop

## ⚙️ Configuration requise

### Pour exécuter la page
1. **Créer la table SQL** :
   ```bash
   Exécutez : sql/create_retours_menage.sql dans Supabase
   ```

2. **Vérifier les tables existantes** :
   - `cleaning_schedule` (interventions)
   - `todos` (tâches)
   - `stocks_draps` (stocks de draps)
   - `retours_menage` (nouveau)

### Permissions Supabase
Toutes les tables ont **RLS désactivé** pour simplifier l'accès.

## 🔒 Sécurité

**⚠️ Important** : Cette page utilise la même clé API Supabase que votre interface principale.

Si vous voulez restreindre l'accès :
1. Créez un utilisateur dédié dans Supabase
2. Configurez des RLS (Row Level Security) spécifiques
3. Donnez uniquement les permissions nécessaires

## 📱 Utilisation mobile

La femme de ménage peut utiliser cette page sur son téléphone :
- Interface tactile optimisée
- Formulaires adaptatifs
- Boutons larges et accessibles

## 🎓 Formation

### Pour la femme de ménage
Expliquez-lui :
1. **Avant de partir** : Noter les stocks utilisés
2. **À la fin du ménage** : 
   - Mettre à jour les stocks
   - Faire un retour sur l'état et le déroulement
3. **Si problème** : Créer une tâche urgente (travaux)
4. **Si besoin d'achats** : Créer une tâche achats

### Routine suggérée
```
1. Arriver → Constater l'état
2. Faire le ménage
3. Mettre à jour les stocks de draps
4. Faire le retour complet
5. Si nécessaire : créer des tâches
```

## 📈 Avantages

### Pour vous (propriétaire)
- ✅ Visibilité complète sur l'état des maisons
- ✅ Stocks toujours à jour
- ✅ Remontée des problèmes en temps réel
- ✅ Historique des interventions
- ✅ Moins de communication téléphonique/SMS

### Pour la femme de ménage
- ✅ Interface simple et claire
- ✅ Tout au même endroit
- ✅ Pas besoin de vous appeler pour chaque détail
- ✅ Vision de son planning
- ✅ Traçabilité de ses interventions

## 🐛 Dépannage

### "Aucune intervention prévue"
→ Vérifiez que les ménages sont **validés** dans la page validation société

### "Erreur lors de la sauvegarde"
→ Vérifiez que la table `retours_menage` existe dans Supabase

### Les retours n'apparaissent pas sur le dashboard
→ Rafraîchissez la page (Ctrl+Shift+R)

### Les stocks ne se mettent pas à jour
→ Vérifiez que la table `stocks_draps` existe et contient les deux gîtes

## 🔄 Mises à jour futures

Améliorations possibles :
- 📸 Upload de photos pour les dégâts
- 📊 Statistiques des interventions
- ⏱️ Temps passé par ménage
- 📧 Notifications email automatiques
- 🗓️ Calendrier intégré

## 📞 Support

En cas de problème :
1. Vérifier la console du navigateur (F12)
2. Vérifier les logs Supabase
3. Tester avec des données fictives

---

**Version** : 1.0.0  
**Dernière mise à jour** : 5 janvier 2026  
**Fichiers** : femme-menage.html, femme-menage.js, create_retours_menage.sql
