# 🚀 Script de Correction Automatique des Coordonnées

## ⚡ Lancement Rapide

```bash
node corriger_coordonnees_auto.js
```

**Temps estimé** : ~15 minutes pour 772 activités  
**Coût** : Gratuit (utilise OpenStreetMap)

---

## 📋 Ce Que Fait le Script

1. ✅ Récupère toutes les activités avec coordonnées dupliquées (772 activités)
2. ✅ Pour chaque activité :
   - Géocode l'adresse avec Nominatim (OpenStreetMap)
   - Met à jour les coordonnées dans Supabase
   - Affiche la progression en temps réel
3. ✅ Génère un rapport final avec statistiques
4. ✅ Vérifie que tous les doublons ont été corrigés

---

## ⚙️ Configuration

**Aucune configuration nécessaire !**

Le script utilise :
- ✅ Nominatim (OpenStreetMap) - Gratuit, illimité
- ✅ Respect automatique de la limite (1 req/sec)
- ✅ Connexion Supabase déjà configurée

---

## 🎯 Exemple de Sortie

```
🚀 DÉMARRAGE DE LA CORRECTION AUTOMATIQUE DES COORDONNÉES

📡 Utilisation de Nominatim (OpenStreetMap - Gratuit)
⏱️  Limite: 1 requête/seconde (respectée automatiquement)

📊 772 activités à corriger

⏰ Temps estimé: 16 minutes

================================================================================

[1/772] (0%) Zoo du Parc de la Tête d'Or (Trévoux)
   ✅ Trouvé: 45.7744, 4.8559
   📍 Parc de la Tête d'Or, 69006 Lyon, France
   💾 Sauvegardé dans Supabase

[2/772] (0%) Parc des Oiseaux - Villars-les-Dombes (Trévoux)
   ✅ Trouvé: 45.9979, 5.0296
   📍 Parc des Oiseaux, Villars-les-Dombes, France
   💾 Sauvegardé dans Supabase

...

================================================================================

🎉 CORRECTION TERMINÉE !

📊 STATISTIQUES:
   Total traité:      772
   ✅ Corrigés:       745 (96%)
   ⚠️  Non trouvés:   24 (3%)
   ❌ Erreurs:        3 (1%)

📍 Doublons restants (>3): 2

⚠️  2 positions ont encore des doublons.
   💡 Conseil: Exécuter à nouveau le script ou corriger manuellement.
```

---

## 🛡️ Sécurité

### Délai d'Annulation
Le script attend **5 secondes** avant de démarrer.  
Appuyez sur `Ctrl+C` pour annuler si besoin.

### Sauvegarde Recommandée
Avant de lancer, faites un backup de votre table :

```sql
-- Dans Supabase SQL Editor
CREATE TABLE activites_gites_backup AS 
SELECT * FROM activites_gites;
```

### Restauration (si besoin)
```sql
-- Restaurer depuis le backup
UPDATE activites_gites 
SET latitude = backup.latitude, 
    longitude = backup.longitude
FROM activites_gites_backup backup
WHERE activites_gites.id = backup.id;
```

---

## 🔍 Que Faire Après ?

### 1. Vérifier les Résultats
```bash
# Voir le rapport complet
node diagnostic_doublons.js
```

### 2. Corriger les Non-Trouvés (si nécessaire)
Les activités non trouvées seront listées dans la console.  
Vous pouvez :
- Les corriger manuellement via Supabase
- Améliorer leurs adresses et relancer le script

### 3. Tester la Carte
1. Allez sur votre application
2. Onglet "Découvrir"
3. Sélectionnez "Trévoux"
4. Cliquez "🔄 Actualiser"
5. ✅ Vous devriez voir les points bien répartis !

---

## 🐛 Dépannage

### Erreur "Cannot find module @supabase/supabase-js"
```bash
npm install @supabase/supabase-js
```

### Erreur de connexion Nominatim
- Vérifiez votre connexion Internet
- Nominatim peut parfois être lent, patientez

### Script interrompu
Le script peut être relancé sans problème.  
Les activités déjà corrigées ne seront pas retraitées.

---

## 📈 Améliorations Possibles

### Option Premium : Google Maps Geocoding
Si les résultats de Nominatim ne sont pas satisfaisants :

1. Obtenir clé API : https://console.cloud.google.com
2. Activer "Geocoding API"
3. Créer `corriger_coordonnees_google.js` (je peux le faire)
4. Coût : ~$5 pour 772 requêtes
5. Précision : 99% vs 96%

---

## 📞 Support

**Questions ?** Demandez-moi :
- Comment vérifier les résultats
- Comment créer la version Google Maps
- Comment corriger manuellement les cas restants

---

**Créé le** : 28 décembre 2025  
**Auteur** : GitHub Copilot  
**Version** : 1.0.0
