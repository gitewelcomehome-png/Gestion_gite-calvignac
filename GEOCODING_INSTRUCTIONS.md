# 🌍 GUIDE EXÉCUTION GÉOCODAGE - Copier-Coller

## 📝 Pour Utilisateurs Windows (CMD)

### Étape 1 : Préparez le dossier
```batch
# Téléchargez geocode_missing.js dans un dossier, par exemple : C:\gites-geocode\

# Ouvrez CMD dans ce dossier
# (Shift + Clic droit → Ouvrir la fenêtre PowerShell ici)
```

### Étape 2 : Exécutez
```batch
node geocode_missing.js
```

---

## 📝 Pour Utilisateurs Mac/Linux

### Étape 1 : Préparez le dossier
```bash
# Téléchargez geocode_missing.js
mkdir ~/gites-geocode
cd ~/gites-geocode
# Déplacez ou téléchargez geocode_missing.js ici
```

### Étape 2 : Exécutez
```bash
node geocode_missing.js
```

---

## 🔍 Qu'Attendre

### Sortie Console (Exemple)
```
🔍 Récupération des activités...

🔗 Test de connexion Supabase...
✅ Connexion Supabase OK

📊 Total activités: 45
✅ Avec coordonnées: 38 (84%)
❌ Sans coordonnées: 7 (16%)

🌍 Début du géocodage...

⏳ (1/7) Parachute Ascension...
   ✅ 45.8245, 4.8356

⏳ (2/7) Canoë Base Nautique...
   ✅ 45.7834, 4.7645

⏳ (3/7) Randonnée Sentier...
   ✅ 45.8102, 4.7823

⏳ (4/7) VTT Cross...
   ✅ 45.7956, 4.8234

⏳ (5/7) Équitation Ferme...
   ✅ 45.8312, 4.7912

⏳ (6/7) Piscine Camping...
   ✅ 45.8001, 4.8145

⏳ (7/7) Musée Local...
   ✅ 45.7834, 4.8067

==================================================
✅ GÉOCODAGE TERMINÉ !
==================================================
✅ Réussis: 7
❌ Échecs: 0
📊 Total traité: 7
==================================================

📄 Log complet: /chemin/vers/geocode_log.txt
```

### Durée Estimée
- ⏱️ ~1.1 secondes par activité
- 7 activités ≈ 8 secondes

---

## ✅ Après le Géocodage

### 1. Vérifiez le log
```bash
# Affichage du fichier log généré
cat geocode_log.txt

# Ou ouvrez-le directement dans un éditeur
```

### 2. Vérifiez dans Supabase
1. Allez sur https://app.supabase.com/
2. Sélectionnez votre projet
3. Table `activites_gites`
4. Colonnes `latitude` et `longitude`
5. Vérifiez que les valeurs sont remplies ✓

### 3. Testez sur le site
1. Allez sur votre site Vercel
2. Onglet "Activités"
3. Cherchez une activité
4. Vérifiez que les épingles s'affichent sur la carte 🗺️

---

## 🐛 Si Ça Ne Marche Pas

### Erreur: "command not found: node"
**Solution:**
1. Installez Node.js: https://nodejs.org/
2. Téléchargez la version LTS
3. Suivez l'installation
4. Redémarrez votre terminal
5. Relancez le script

### Erreur: "getaddrinfo ENOTFOUND"
**Solution:**
1. Vérifiez votre connexion internet
2. Essayez avec un autre réseau (hotspot téléphone?)
3. Attendez quelques minutes
4. Relancez le script

### Erreur: "Permission denied"
**Solution (Mac/Linux):**
```bash
chmod +x geocode_missing.js
node geocode_missing.js
```

### Certaines activités non géocodées
**Solution:**
1. C'est normal si l'adresse est invalide
2. Complétez-les manuellement dans Supabase
3. Ou corrigez l'adresse et relancez le script

---

## 💡 Tips Utiles

### Relancer le géocodage
```bash
# Le script ne code que les activités SANS coordonnées
# Vous pouvez le relancer plusieurs fois sans problème
# Les activités déjà géocodées ne seront pas touchées

node geocode_missing.js
```

### Réinitialiser (si nécessaire)
```javascript
// Si vous voulez recommencer de zéro, exécutez dans la console Supabase:
// UPDATE activites_gites SET latitude = NULL, longitude = NULL;

// Puis relancez le script
node geocode_missing.js
```

### Consulter le log en détail
```bash
# Afficher les 50 dernières lignes
tail -50 geocode_log.txt

# Afficher tout
cat geocode_log.txt

# Rechercher les erreurs
grep "❌" geocode_log.txt
```

---

## 📊 Résultat Attendu

Après exécution réussie:
- ✅ Toutes les activités ont des coordonnées
- ✅ La carte affiche les épingles
- ✅ Le filtre "Recherche par localisation" fonctionne
- ✅ Supabase à jour avec lat/lng

🎉 **C'est bon! Le géocodage est terminé!**
