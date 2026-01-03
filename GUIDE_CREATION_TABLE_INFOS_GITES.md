# 🔧 Guide : Créer la table infos_gites dans Supabase

## Problème identifié
La table `infos_gites` n'existe pas dans votre base Supabase, c'est pourquoi les données ne peuvent pas être sauvegardées.

## Solution : Exécuter le script SQL

### Étape 1 : Accéder à Supabase
1. Allez sur https://supabase.com
2. Connectez-vous à votre compte
3. Ouvrez votre projet `ivqiisnudabxemcxxyru`

### Étape 2 : Ouvrir l'éditeur SQL
1. Dans le menu de gauche, cliquez sur **"SQL Editor"** (icône 📝)
2. Cliquez sur **"New query"** en haut à droite

### Étape 3 : Copier-coller le script
1. Ouvrez le fichier `sql/create_infos_gites_table.sql` de ce projet
2. **Copiez TOUT le contenu** du fichier (190 lignes)
3. **Collez-le** dans l'éditeur SQL de Supabase

### Étape 4 : Exécuter le script
1. Cliquez sur le bouton **"Run"** (ou Ctrl+Entrée) en bas à droite
2. Attendez quelques secondes
3. Vous devriez voir : ✅ **"Success. No rows returned"**

### Étape 5 : Vérifier la création
1. Dans le menu de gauche, cliquez sur **"Table Editor"**
2. Vous devriez voir la table **`infos_gites`** dans la liste
3. Cliquez dessus pour voir 2 lignes :
   - Une ligne avec `gite = 'trevoux'`
   - Une ligne avec `gite = 'couzon'`

## ✅ Une fois terminé
Retournez sur votre application et testez à nouveau :
- La page back-office "Infos Pratiques" devrait pouvoir sauvegarder
- La page client devrait charger les données
- Le test https://gestion-gite-calvignac.vercel.app/test_save_infos.html devrait fonctionner

## 📝 Note importante
Cette table stocke TOUTES les informations pratiques des gîtes (adresse, WiFi, instructions, etc.) en français ET en anglais. Une fois créée, elle sera automatiquement synchronisée entre le back-office et les pages clients.
