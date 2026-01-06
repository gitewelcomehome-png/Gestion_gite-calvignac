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
- **Action** : ✅ Déjà validé - NE PAS TOUCHER

#### 3. Charges Fiscalité (tabs/tab-fiscalite-v2.html #chargeForm)
- **Champs** : nom, montant
- **Validation actuelle** : ✅ ValidationUtils + temps réel (7 janv 2026)
- **Action** : ✅ Validé

#### 4. Infos Gîtes (tabs/tab-infos-gites.html)
- **Champs** : email, telephone, GPS, wifi, etc.
- **Validation actuelle** : ✅ ValidationUtils manuel dans sauvegarderDonneesInfos()
- **Action** : ✅ Déjà validé - Validation email/phone/GPS opérationnelle

#### 4. Infos Gîtes (tabs/tab-infos-gites.html)
- **Champs** : email, telephone, GPS, wifi, etc.
- **Validation actuelle** : ✅ ValidationUtils manuel dans sauvegarderDonneesInfos()
- **Action** : ✅ Déjà validé - Validation email/phone/GPS opérationnelle

#### 5. Fiches Clients - Édition Gîte (tabs/tab-fiches-clients.html #formEditGite)
- **Champs** : nom, adresse, description, équipements
- **Validation actuelle** : HTML5
- **Action** : ⏳ À valider

### 🟡 IMPORTANT (données métier)

#### 6. Todos Dashboard (tabs/tab-dashboard.html #addTodoForm)
- **Champs** : title (required), description, gite
- **Validation actuelle** : ✅ ValidationUtils + temps réel (7 janv 2026)
- **Action** : ✅ Validé

#### 7. Fiche Client - Horaires (fiche-client-app.js formArriveeAnticipee/formDepartTardif)
- **Champs** : heureArriveeDemandee, heureDepartDemandee
- **Validation actuelle** : ✅ ValidationUtils + temps réel (7 janv 2026)
- **Action** : ✅ Validé

#### 8. Fiche Client - Retours (fiche-client-app.js formRetours)
- **Champs** : sujetRetour, descriptionRetour
- **Validation actuelle** : ✅ ValidationUtils + temps réel (7 janv 2026)
- **Action** : ✅ Validé

#### 9. Femme de Ménage - Tâches (femme-menage.js)
- **Champs** : tache-achats-titre, tache-travaux-titre, retour-date
- **Validation actuelle** : ✅ ValidationUtils + temps réel (7 janv 2026)
- **Action** : ✅ Validé

#### 10. FAQ (tabs/tab-faq.html #form-question-faq)
- **Champs** : question, reponse, categorie, gite, ordre
- **Validation actuelle** : ❌ Aucune
- **Action** : ⏳ À valider (formulaire existe-t-il?)

#### 11. Activités Découvrir (tabs/tab-decouvrir.html #formDecouvrir)
- **Champs** : nom, description, adresse, categorie, coordonnées GPS
- **Validation actuelle** : ❌ Fonction ajouterActivite() INEXISTANTE
- **Action** : ⚠️ Bouton présent mais fonction manquante - À implémenter

### 🟢 SECONDAIRE (interfaces clients)

#### 12. Fiches Clients - Édition (tabs/tab-fiches-clients.html #formEditGite)
- **Champs** : nom, adresse, description
- **Validation actuelle** : ❌ Aucune
- **Action** : ⏳ À valider

## 🎯 Plan d'Action

### ✅ Étape 1 : Validation Inputs Critiques - COMPLÉTÉ (7 janv 2026)
**Fichiers modifiés** :
- ✅ js/charges.js - Validation chargeForm (nom, montant) + temps réel
- ✅ js/dashboard.js - Validation addTodoForm (title) + temps réel
- ✅ js/fiche-client-app.js - Validation horaires (hours) + retours (text) + temps réel
- ✅ femme-menage.js - Validation tâches (text) + retours (date) + temps réel

**7 formulaires validés en 1 session** 🎉

### ⏳ Étape 2 : Validation Secondaire (À faire)
**Fichiers restants** :
- js/fiches-clients.js - Valider édition gîtes (si formulaire existe)
- js/decouvrir.js - ⚠️ Implémenter fonction ajouterActivite() MANQUANTE
- js/faq.js - Vérifier si formulaire admin FAQ existe

**Pattern utilisé** :
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

