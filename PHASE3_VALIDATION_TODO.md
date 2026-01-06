# Phase 3 - Validation Formulaires TODO

**Date** : 7 janvier 2026  
**Statut** : En cours

## ✅ Travaux Complétés

### Sécurisation innerHTML
- ✅ **63+ innerHTML sécurisés** avec SecurityUtils.setInnerHTML()
- ✅ faq.js, archives.js, reservations.js, dashboard.js
- ✅ fiche-activites-map.js, fiche-client-app.js
- ✅ fiche-client.js, menage.js
- ⚠️ **3 innerHTML restants** : États de boutons (texte statique, aucun risque XSS)

### ValidationUtils
- ✅ Système de validation existant dans `js/validation-utils.js`
- ✅ Validation temps réel pour formulaire d'édition réservations
- ✅ Règles configurées : email, phone, amount, integer, date, text, name, postalCode, hours, url

## 📋 Formulaires à Valider

### 🔴 CRITIQUE (données utilisateur sensibles)

#### 1. Login (login.html)
- **Champs** : email, password
- **Validation actuelle** : HTML5 (required, type="email")
- **Action** : ✅ Suffisant pour login (géré par Supabase Auth)

#### 2. Édition Réservations (index.html #editForm)
- **Champs** : nom, telephone, montant, acompte, nbPersonnes
- **Validation actuelle** : ✅ ValidationUtils attaché (init-validation.js)
- **Action** : ✅ Déjà validé

#### 3. Infos Gîtes (tabs/tab-infos-gites.html)
- **Champs** : wifi_ssid, wifi_password, parking, chauffage, cuisine, dechets, contacts_urgence
- **Validation actuelle** : HTML5 (required sur certains champs)
- **Action** : ⏳ Ajouter ValidationUtils pour texte

#### 4. Fiches Clients - Édition Gîte (tabs/tab-fiches-clients.html #formEditGite)
- **Champs** : nom, adresse, description, équipements
- **Validation actuelle** : HTML5
- **Action** : ⏳ Ajouter ValidationUtils

### 🟡 IMPORTANT (données métier)

#### 5. Todos Dashboard (tabs/tab-dashboard.html #addTodoForm)
- **Champs** : title (required), description, gite
- **Validation actuelle** : HTML5 (required)
- **Action** : ⏳ Ajouter ValidationUtils pour titre/description

#### 6. FAQ (tabs/tab-faq.html #form-question-faq)
- **Champs** : question, reponse, categorie, gite, ordre
- **Validation actuelle** : À vérifier
- **Action** : ⏳ Ajouter ValidationUtils

#### 7. Activités (tabs/tab-decouvrir.html #formDecouvrir)
- **Champs** : nom, description, adresse, categorie, coordonnées GPS
- **Validation actuelle** : À vérifier
- **Action** : ⏳ Ajouter ValidationUtils

#### 8. Charges (tabs/tab-fiscalite-v2.html #calculateur-lmp)
- **Champs** : montants financiers, dates
- **Validation actuelle** : À vérifier
- **Action** : ⏳ Ajouter ValidationUtils pour montants

### 🟢 FAIBLE PRIORITÉ (interfaces clients)

#### 9. Fiche Client - Demandes Horaires (fiche-client.html)
- **Champs** : heureArriveeDemandee, heureDepartDemandee
- **Validation actuelle** : HTML5 (select)
- **Action** : ✅ Suffisant (valeurs prédéfinies)

#### 10. Femme de Ménage - Tâches (femme-menage.html)
- **Champs** : titre, description, gite
- **Validation actuelle** : HTML5
- **Action** : ⏳ Ajouter ValidationUtils

#### 11. Femme de Ménage - Retours (femme-menage.html #form-retour-menage)
- **Champs** : probleme, commentaire, photo
- **Validation actuelle** : HTML5
- **Action** : ⏳ Ajouter ValidationUtils

## 🎯 Plan d'Action

### Étape 1 : Validation Inputs Critiques ⏳
**Fichiers** :
- js/infos-gites.js - Valider infos pratiques
- js/fiches-clients.js - Valider édition gîtes
- js/decouvrir.js - Valider activités

**Pattern à suivre** :
```javascript
// Dans le gestionnaire submit du formulaire
if (window.ValidationUtils) {
    const rules = {
        'nom': { type: 'name', required: true },
        'description': { type: 'text', required: false },
        'montant': { type: 'amount', required: true }
    };
    
    const validation = window.ValidationUtils.validateForm(form, rules);
    if (!validation.valid) {
        showErrors(validation.errors);
        return;
    }
}
```

### Étape 2 : Validation Temps Réel
**Fichiers modifiés** :
- js/init-validation.js - Ajouter attachRealtimeValidation pour nouveaux champs

**Code** :
```javascript
// Pour chaque input critique
window.ValidationUtils.attachRealtimeValidation('inputId', 'ruleType', { required: true });
```

### Étape 3 : Sanitization Outputs
**Déjà fait** : ✅ SecurityUtils.setInnerHTML() sur tous les innerHTML

### Étape 4 : CSP Headers
**Fichier** : vercel.json
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co"
        }
      ]
    }
  ]
}
```

## 📊 Métriques

- **Formulaires totaux** : 15+
- **Formulaires validés** : 2 (login, editForm)
- **Formulaires à valider** : 9 (prioritaires)
- **innerHTML sécurisés** : 63+
- **innerHTML restants** : 3 (boutons statiques)

## 🎓 Règles de Validation Disponibles

### ValidationRules (validation-utils.js)
- `email` : Email valide
- `phone` : Téléphone français (06 12 34 56 78)
- `amount` : Montant financier (150.50)
- `integer` : Nombre entier positif
- `date` : Date ISO (YYYY-MM-DD)
- `text` : Texte général (max 500 caractères)
- `name` : Nom personne/lieu (lettres, espaces, tirets)
- `postalCode` : Code postal français (5 chiffres)
- `hours` : Horaires flexibles
- `url` : URL valide

## 🚀 Prochaines Étapes

1. ⏳ Valider formulaires infos-gites
2. ⏳ Valider formulaires fiches-clients  
3. ⏳ Valider formulaires decouvrir
4. ⏳ Valider formulaires FAQ
5. ⏳ Valider formulaires femme-menage
6. ⏳ Ajouter CSP headers dans vercel.json
7. ⏳ Audit final sécurité

---

**Score Sécurité Actuel** : 7/10 → 8/10 (après validation complète)

