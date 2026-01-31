# Instructions Copilot - Gestion Gîte Calvignac

## 🚨 Règles Critiques de Production

### Site en Production
- Ce site est **EN PRODUCTION** avec des clients réels
- Aucun hardcoding de valeurs
- Aucune action dangereuse ou risquée
- Toujours privilégier la sécurité et la stabilité

### 🚫 INTERDICTION ABSOLUE : Ne JAMAIS modifier index.html
- **index.html** = Page CLIENT (propriétaires de gîtes utilisant l'application)
- **pages/admin-channel-manager.html** = Page ADMIN (gestion des clients SaaS)
- **pages/admin-support.html** = Interface support ADMIN
- **pages/client-support.html** = Interface support CLIENT
- ⛔ Ne JAMAIS toucher à index.html sauf demande EXPLICITE de l'utilisateur
- Toujours confirmer quelle interface avant de modifier (ADMIN vs CLIENT)

### Ne JAMAIS demander
- Si le cache a été vidé
- Des confirmations évidentes pour des opérations standards

## 🎯 Méthodologie de Travail

### Principe de Base
- **Répondre UNIQUEMENT** à ce qui est demandé
- **PAS d'initiatives** sans accord explicite
- **ÉCOUTER** attentivement les instructions fournies
- **PRENDRE EN COMPTE** toutes les remarques avant d'agir
- **NE JAMAIS revenir** sur une information déjà donnée par l'utilisateur
- **NE PAS remettre en question** les affirmations de l'utilisateur

### En Cas de Blocage
- Après **2 tentatives infructueuses**, pousser les recherches plus loin
- Proposer des **solutions alternatives** sans jamais mettre en danger le site
- Être force de propositions tout en demandant validation

### Gestion des Erreurs
- **Zéro erreur console tolérée** en production
- Toujours trouver une solution pour chaque erreur
- Si erreurs non graves : les **catcher systématiquement**
- Ne jamais laisser passer une erreur non gérée

### Gestion des Logs
- **Nettoyer les logs inutiles** ou trop nombreux
- Éviter d'encombrer la console avec des logs de debug
- Garder uniquement les logs essentiels au fonctionnement
- Supprimer ou commenter les `console.log()` de développement

### Règles Réservations
- Un gîte ne peut avoir qu'**UNE réservation à la fois**
- Aucune réservation ne peut **démarrer le même jour** qu'une autre sur le même gîte
- En cas de conflit de dates : **garder la plus courte** en durée
- Vérifier systématiquement les chevauchements lors des imports iCal

## 🗄️ Gestion de la Base de Données

### Variables et Tables
- **TOUJOURS** vérifier les variables existantes avant d'en créer de nouvelles
- Les tables doivent être **liées entre elles** (relations FK)
- Éviter la multiplication de variables indépendantes
- Maintenir un schéma cohérent et référencé

### Documentation des Tables
- Maintenir à jour un fichier de référence avec l'ensemble des tables
- Se référer systématiquement à ce fichier avant toute modification
- Garantir la traçabilité du schéma de base de données

### Fichiers d'Architecture
- **ARCHITECTURE.md** : Documentation centrale de l'existant (structure, tables, fonctionnalités)
- **ERREURS_CRITIQUES.md** : Historique des bugs critiques et leurs solutions
- **TOUJOURS consulter ces fichiers** avant toute modification
- **Mettre à jour ces fichiers** après chaque changement important
- S'y référer systématiquement en cas de bug pour éviter les erreurs connues

## 🧹 Gestion des Fichiers

### Propreté du Projet
- **Supprimer ou archiver** les fichiers SQL devenus inutiles
- Maintenir le dossier **toujours propre**
- Archiver dans `_archives/` plutôt que de laisser traîner
- Nettoyer les fichiers temporaires ou de test après usage

## 📋 Checklist Avant Toute Action

1. ✅ Ai-je bien compris toutes les remarques ?
2. ✅ Ai-je vérifié les variables/tables existantes ?
3. ✅ Mon action est-elle sans risque pour la production ?
4. ✅ Ai-je l'accord explicite pour cette initiative ?
5. ✅ Toutes les erreurs sont-elles catchées ?

## 🚫 Interdictions Strictes

- ❌ Prendre des libertés sans accord
- ❌ Partir dans des recherches sans tenir compte des remarques
- ❌ Laisser des erreurs console non gérées
- ❌ Créer des variables sans vérifier l'existant
- ❌ Hardcoder des valeurs
- ❌ Effectuer des actions dangereuses

## ✅ Comportement Attendu

- ✅ Force de propositions
- ✅ Respect strict des instructions
- ✅ Validation avant initiative
- ✅ Solutions sûres et pérennes
- ✅ Code propre et sans erreur

