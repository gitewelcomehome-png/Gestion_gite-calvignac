# ✅ Installation Espace Femme de Ménage

## 🎯 Action requise

Pour activer complètement cette fonctionnalité, vous devez **exécuter le script SQL** :

### Étapes d'installation

1. **Ouvrez Supabase** : https://supabase.com/dashboard

2. **Allez dans SQL Editor**

3. **Exécutez ce script** :
   ```sql
   -- Copiez-collez le contenu de :
   sql/create_retours_menage.sql
   ```

4. **Cliquez sur "Run"**

## 🧪 Test

### 1. Accéder à la page femme de ménage
- Depuis l'onglet **Planning Ménage**
- Bouton vert : **🧹 Espace Femme de Ménage**
- Ou directement : `femme-menage.html`

### 2. Tester les fonctionnalités

#### Test 1 : Créer une tâche d'achat
1. Onglet "🛒 Achats & Courses"
2. Remplir le formulaire
3. Envoyer
4. **Vérifier** : La tâche apparaît dans votre Dashboard > Section Tâches

#### Test 2 : Créer une tâche de travaux
1. Onglet "🔧 Travaux & Maintenance"
2. Remplir avec priorité "Urgente"
3. Envoyer
4. **Vérifier** : La tâche apparaît avec 🚨 URGENT dans le Dashboard

#### Test 3 : Mettre à jour les stocks
1. Onglet "Trévoux" ou "Couzon"
2. Modifier quelques quantités
3. Sauvegarder
4. **Vérifier** : Aller dans **Gestion Draps** → Les quantités sont mises à jour

#### Test 4 : Envoyer un retour
1. Formulaire "Faire un Retour après Ménage"
2. Sélectionner gîte et date
3. Choisir état et déroulement
4. Envoyer
5. **Vérifier** : Une alerte apparaît en haut du Dashboard
6. **Cliquer** sur l'alerte → Modal avec détails
7. **Valider** le retour → L'alerte disparaît

## 📱 Partager avec votre femme de ménage

### Option 1 : Lien direct
Envoyez-lui l'URL :
```
https://votre-domaine.vercel.app/femme-menage.html
```

### Option 2 : QR Code
Générez un QR code de l'URL pour qu'elle puisse l'ajouter à ses favoris mobile.

### Option 3 : Favoris
Demandez-lui d'ajouter la page en favori sur son téléphone.

## 📋 Formation rapide

Dites-lui :
```
1. Tu vois ton planning dans la première section
2. Si besoin d'acheter quelque chose → créer une tâche achats
3. Si problème dans le gîte → créer une tâche travaux
4. Après chaque ménage :
   - Mettre à jour les draps utilisés
   - Faire un retour sur l'état et le déroulement
5. Je reçois tout en temps réel sur mon dashboard
```

## 🎨 Personnalisation (optionnel)

Si vous voulez personnaliser :
- Couleurs : `femme-menage.html` section `<style>`
- Textes : `femme-menage.html` dans le HTML
- Logique : `femme-menage.js`

## 📚 Documentation complète

Consultez `GUIDE_ESPACE_FEMME_MENAGE.md` pour tous les détails.

## ⚡ Résumé rapide

| Fonctionnalité | Fichier | Action |
|----------------|---------|--------|
| Page web | `femme-menage.html` | ✅ Créé |
| Logique JS | `femme-menage.js` | ✅ Créé |
| Table SQL | `sql/create_retours_menage.sql` | ⏳ **À exécuter** |
| Affichage retours | `js/dashboard.js` | ✅ Modifié |
| Bouton d'accès | `tabs/tab-menage.html` | ✅ Ajouté |

## 🆘 Problèmes courants

### Erreur "table retours_menage does not exist"
→ Vous n'avez pas exécuté le script SQL

### Les retours ne s'affichent pas
→ Rafraîchir le dashboard (Ctrl+Shift+R)

### Les stocks ne se sauvegardent pas
→ Vérifier que la table `stocks_draps` existe

---

**Installation estimée** : 5 minutes  
**Difficulté** : ⭐ Facile
