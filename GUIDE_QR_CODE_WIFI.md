# Guide : Ajouter un QR Code WiFi dans la Fiche Client

## 📱 Objectif
Permettre aux clients de se connecter au WiFi en scannant simplement un QR code avec leur smartphone, sans avoir à taper le mot de passe.

---

## 🔧 Étape 1 : Exécuter le script SQL

1. Connectez-vous à Supabase (https://supabase.com)
2. Ouvrez le SQL Editor
3. Exécutez le fichier `sql/add_wifi_qr_code_column.sql`

Cela ajoute la colonne `wifi_qr_code_url` à la table `infos_gites`.

---

## 🎨 Étape 2 : Générer le QR Code WiFi

### Option A : Utiliser QR Code Generator (Recommandé)

1. Allez sur https://www.qr-code-generator.com/
2. Sélectionnez **"WiFi"** dans le menu
3. Remplissez les champs :
   - **SSID** : Nom du réseau WiFi (ex: `WelcomeHome_Trevoux`)
   - **Password** : Mot de passe WiFi
   - **Encryption** : WPA/WPA2 (généralement)
4. Personnalisez le design si souhaité (couleurs, logo)
5. Téléchargez l'image en **PNG** (haute résolution)
6. Nommez le fichier : `qr-wifi-trevoux.png` ou `qr-wifi-calvignac.png`

### Option B : Utiliser un générateur en ligne gratuit

Alternatives :
- https://qifi.org/ (simple et rapide)
- https://qr.io/ (avec statistiques)

### Option C : Créer manuellement avec format texte

Format du contenu QR code :
```
WIFI:T:WPA;S:NomDuReseau;P:MotDePasse;;
```

Exemple réel :
```
WIFI:T:WPA;S:WelcomeHome_Trevoux;P:Bienvenue2024!;;
```

Ensuite, générez le QR code avec n'importe quel générateur.

---

## 📤 Étape 3 : Uploader l'image sur Supabase Storage

### 3.1 Créer un bucket (première fois uniquement)

1. Dans Supabase, allez dans **Storage**
2. Cliquez sur **New bucket**
3. Nom : `qr-codes-wifi`
4. **Public bucket** : ✅ OUI (pour que les clients puissent le voir)
5. Créer

### 3.2 Uploader le QR code

1. Ouvrez le bucket `qr-codes-wifi`
2. Cliquez sur **Upload file**
3. Sélectionnez votre image `qr-wifi-trevoux.png`
4. Cliquez sur le fichier uploadé
5. Copiez l'**URL publique** (elle ressemble à ça) :
   ```
   https://ivqiisnudabxemcxxyru.supabase.co/storage/v1/object/public/qr-codes-wifi/qr-wifi-trevoux.png
   ```

---

## 💾 Étape 4 : Enregistrer l'URL dans la base de données

### Via l'interface Supabase (Table Editor)

1. Allez dans **Table Editor**
2. Ouvrez la table `infos_gites`
3. Trouvez la ligne du gîte (ex: `trévoux`)
4. Modifiez le champ `wifi_qr_code_url`
5. Collez l'URL publique copiée à l'étape 3.2
6. Sauvegardez

### Via SQL (plus rapide)

```sql
UPDATE infos_gites
SET wifi_qr_code_url = 'https://ivqiisnudabxemcxxyru.supabase.co/storage/v1/object/public/qr-codes-wifi/qr-wifi-trevoux.png'
WHERE gite = 'trévoux';

UPDATE infos_gites
SET wifi_qr_code_url = 'https://ivqiisnudabxemcxxyru.supabase.co/storage/v1/object/public/qr-codes-wifi/qr-wifi-calvignac.png'
WHERE gite = 'calvignac';
```

---

## ✅ Étape 5 : Vérifier l'affichage

1. Ouvrez la fiche client d'un gîte : `fiche-client.html?gite=trévoux&id=<id_reservation>`
2. Allez dans l'onglet **"Entrée"**
3. Dans la section **WiFi**, vous devriez voir :
   - Le SSID et le mot de passe (avec boutons copier)
   - Le QR code avec le texte "📱 Scannez pour vous connecter"

Si le QR code n'apparaît pas :
- Vérifiez que l'URL dans la BDD est correcte et accessible
- Ouvrez l'URL directement dans un navigateur pour vérifier qu'elle affiche l'image
- Vérifiez la console du navigateur (F12) pour voir s'il y a des erreurs

---

## 📝 Notes importantes

### Sécurité
- ⚠️ **Le bucket doit être PUBLIC** sinon les clients ne pourront pas voir le QR code
- Les QR codes WiFi contiennent le mot de passe en clair, c'est normal (c'est le principe)
- Ne partagez pas publiquement l'URL du QR code en dehors des fiches clients

### Mise à jour du mot de passe WiFi
Si vous changez le mot de passe WiFi :
1. Générez un nouveau QR code avec le nouveau mot de passe
2. Uploadez-le dans Supabase Storage (écrasez l'ancien ou créez un nouveau fichier)
3. Mettez à jour `wifi_password` ET `wifi_qr_code_url` dans `infos_gites`

### Tester avec un smartphone
Pour tester que le QR code fonctionne :
1. Ouvrez l'appareil photo de votre iPhone/Android
2. Pointez vers le QR code affiché sur l'écran
3. Une notification devrait apparaître "Se connecter à [NomDuReseau]"
4. Tapez dessus → connexion automatique !

---

## 🎯 Résultat final

Vos clients pourront :
- Scanner le QR code dès leur arrivée
- Se connecter automatiquement sans taper le mot de passe
- Avoir une expérience fluide et moderne

---

## 🆘 Problèmes fréquents

### Le QR code ne s'affiche pas
✅ **Solution** : Vérifiez que `wifi_qr_code_url` contient bien une URL valide dans la table `infos_gites`

### Erreur 403 Forbidden
✅ **Solution** : Le bucket n'est pas public. Allez dans Storage > qr-codes-wifi > Settings > Public bucket = ON

### Le QR code ne fonctionne pas sur smartphone
✅ **Solution** : Vérifiez le format du contenu :
- Pas d'espaces dans le mot de passe
- Format exact : `WIFI:T:WPA;S:SSID;P:Password;;`
- Générez un nouveau QR code si nécessaire

### L'image est floue
✅ **Solution** : Régénérez le QR code en haute résolution (au moins 500x500px)

---

## 📚 Ressources utiles

- [QR Code Generator](https://www.qr-code-generator.com/) - Création de QR codes personnalisés
- [QiFi](https://qifi.org/) - Générateur simple et gratuit
- [Documentation Supabase Storage](https://supabase.com/docs/guides/storage) - Guide complet du stockage
- [Format WiFi QR](https://github.com/zxing/zxing/wiki/Barcode-Contents#wi-fi-network-config-android-ios-11) - Spécifications techniques

---

**Fait ! 🎉** Vos clients ont maintenant une expérience moderne pour se connecter au WiFi.
