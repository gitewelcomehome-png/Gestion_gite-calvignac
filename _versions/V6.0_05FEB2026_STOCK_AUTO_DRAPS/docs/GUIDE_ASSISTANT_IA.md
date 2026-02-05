# ✨ Assistant IA - Guide d'utilisation

## 🎯 Description

L'Assistant IA utilise l'API OpenAI (GPT-4o-mini) pour générer automatiquement du contenu professionnel à partir de quelques mots-clés. Cela vous fait gagner un temps précieux lors du remplissage des informations de vos gîtes.

## 🔑 Configuration initiale

### 1. Obtenir une clé API OpenAI

1. Créez un compte sur [OpenAI Platform](https://platform.openai.com/)
2. Ajoutez un moyen de paiement (facturation à l'usage)
3. Générez une clé API dans [API Keys](https://platform.openai.com/api-keys)
4. Copiez la clé (format : `sk-...`)

### 2. Configurer la clé dans l'application

**Méthode 1 : Bouton dans l'interface**
- Allez dans **Infos Pratiques**
- Cliquez sur le bouton **✨ Assistant IA** en haut à droite
- Collez votre clé API
- Cliquez sur **💾 Enregistrer**

**Méthode 2 : Lors de la première utilisation**
- Cliquez sur un bouton **✨** à côté d'un champ
- Une fenêtre vous demandera automatiquement votre clé API
- Collez votre clé et enregistrez

**La clé est stockée localement dans votre navigateur** (localStorage) et n'est jamais partagée.

## 🚀 Utilisation

### Champs équipés de l'IA

Les boutons **✨** apparaissent à côté de ces champs :

1. **Instructions pour récupérer les clés**
   - Exemple de mots-clés : `boîte à clés code 1234 devant la porte`
   - L'IA génère des instructions détaillées numérotées

2. **Description du linge fourni**
   - Exemple : `draps, serviettes, torchons fournis`
   - L'IA génère une liste complète avec détails

3. **Instructions lave-linge**
   - Exemple : `Samsung 8kg, lessive fournie, placard entrée`
   - L'IA génère un mode d'emploi clair

4. **Configuration des chambres**
   - Exemple : `2 chambres, lit double, 2 lits simples`
   - L'IA génère une description structurée

### Mode d'emploi

1. Cliquez sur le bouton **✨** à côté du champ
2. Entrez quelques mots-clés dans le champ
3. Cliquez sur **✨ Générer**
4. Patientez 2-3 secondes
5. Le texte généré remplit automatiquement le champ
6. Modifiez si besoin et sauvegardez

## 💡 Conseils pour de meilleurs résultats

### ✅ Bons exemples de mots-clés

**Pour les clés :**
```
boîte sécurisée code 1234, mur gauche entrée principale, tourner molette 3 fois
```

**Pour le linge :**
```
draps fournis lits faits, 2 serviettes par personne, torchons cuisine
```

**Pour les équipements :**
```
lave-linge Bosch 9kg, lessive liquide placard, programme court 30 minutes
```

### ❌ À éviter

- Mots-clés trop vagues : `clés`, `linge`
- Trop de détails techniques : `modèle WAT28411FF 1400tr/min A+++`
- Informations contradictoires

### 💰 Coût estimé

Le modèle **GPT-4o-mini** est très économique :
- ~0,15€ pour 1000 générations
- Une génération = 1 champ rempli
- **Budget indicatif** : ~5€/mois pour usage intensif

## 🔧 Dépannage

### "Clé API OpenAI manquante"
→ Configurez votre clé via le bouton **✨ Assistant IA**

### "Erreur API OpenAI"
- Vérifiez que votre clé est valide
- Vérifiez votre crédit OpenAI restant
- Essayez de régénérer la clé

### "Aucun contenu généré"
- Essayez avec des mots-clés plus précis
- Vérifiez votre connexion internet

### Le bouton ✨ ne fait rien
- Rafraîchissez la page (F5)
- Vérifiez la console (F12) pour les erreurs

## 🛡️ Sécurité

- ✅ La clé API est stockée uniquement dans **votre navigateur**
- ✅ Elle n'est **jamais envoyée** à notre serveur
- ✅ Elle est utilisée uniquement pour appeler l'API OpenAI
- ✅ Vous pouvez la supprimer à tout moment (vider cache navigateur)

## 📊 Modèle utilisé

- **Modèle** : GPT-4o-mini
- **Fournisseur** : OpenAI
- **Optimisé pour** : Génération de texte rapide et économique
- **Langue** : Français

## 🆘 Support

En cas de problème :
1. Vérifiez ce guide
2. Consultez les logs console (F12)
3. Contactez le support technique

---

**Date de création** : 28 Janvier 2026
**Version** : 1.0.0
