# Guide d'activation des onglets Problème et Évaluation

## 📋 Étape 1 : Créer les tables Supabase

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez-collez tout le contenu du fichier `sql/create_problemes_evaluations.sql`
4. Cliquez sur **Run** pour exécuter le script

### Vérification
Après exécution, vous devriez voir deux nouvelles tables :
- ✅ `problemes_signales` (9 colonnes)
- ✅ `evaluations_sejour` (15 colonnes)

## 📱 Étape 2 : Test des nouveaux onglets

1. Ouvrez une fiche client : `fiche-client.html?token=VOTRE_TOKEN`
2. Vérifiez que deux nouveaux onglets apparaissent :
   - ⚠️ **Problème**
   - ⭐ **Évaluation**

### Test de signalement de problème :
1. Cliquez sur l'onglet **Problème**
2. Remplissez le formulaire :
   - Type de problème (ex: Équipement défaillant)
   - Urgence (Faible/Moyenne/Haute)
   - Description détaillée
   - Téléphone (optionnel)
3. Cliquez sur **Envoyer le signalement**
4. Vérifiez que le message de confirmation apparaît

### Test d'évaluation :
1. Cliquez sur l'onglet **Évaluation**
2. Cliquez sur les étoiles pour la note globale (elles deviennent dorées)
3. Remplissez les notes détaillées (Propreté, Confort, etc.)
4. Ajoutez un commentaire
5. Cliquez sur **Envoyer mon évaluation**
6. Vérifiez que le message de remerciement apparaît

## 🔍 Étape 3 : Vérifier les données dans Supabase

### Problèmes signalés :
1. Allez dans **Table Editor** > `problemes_signales`
2. Vérifiez que votre signalement apparaît avec :
   - Type, urgence, description
   - `statut = 'nouveau'`
   - `created_at` avec la date/heure actuelle

### Évaluations :
1. Allez dans **Table Editor** > `evaluations_sejour`
2. Vérifiez que votre évaluation apparaît avec :
   - Toutes les notes (1-5)
   - Commentaires
   - Recommandation
   - `publie = false` (par défaut)

## 🎯 Étape 4 : Créer un onglet admin (optionnel)

Pour consulter et traiter les problèmes/évaluations depuis l'interface admin, vous pouvez créer deux nouveaux onglets dans `index.html` :

### Onglet "Problèmes signalés" :
- Liste des problèmes avec filtres (urgence, statut, gîte)
- Boutons : Traiter / Résoudre / Clôturer
- Ajout de commentaires admin

### Onglet "Évaluations" :
- Liste des avis clients avec notes
- Filtres par gîte et note globale
- Bouton Publier/Masquer
- Statistiques moyennes

## 📊 Colonnes importantes

### problemes_signales
- `type` : equipement, proprete, chauffage, eau, electricite, wifi, nuisance, securite, autre
- `urgence` : faible, moyenne, haute
- `statut` : nouveau, en_cours, resolu, cloture

### evaluations_sejour
- `note_globale` : 1-5 (requis)
- `note_proprete`, `note_confort`, etc. : 1-5 (requis)
- `recommandation` : oui, peut-etre, non
- `publie` : true/false (pour affichage public)

## ⚠️ Points d'attention

1. **UNIQUE constraint** : Un client ne peut laisser qu'une seule évaluation par réservation
2. **CHECK constraints** : Les notes doivent être entre 1 et 5
3. **Indexes** : Optimisent les requêtes par gîte, statut, urgence
4. **Triggers** : `updated_at` se met à jour automatiquement

## 🚀 Prochaines étapes possibles

- [ ] Webhook/notification email quand problème urgent signalé
- [ ] Interface admin pour gérer les signalements
- [ ] Export des évaluations pour analyse
- [ ] Affichage public des avis (filtrés et modérés)
- [ ] Upload de photos pour les problèmes signalés
- [ ] Statistiques par type de problème et période
