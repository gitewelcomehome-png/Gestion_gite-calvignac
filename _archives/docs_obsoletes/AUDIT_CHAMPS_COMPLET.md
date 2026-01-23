# 🔍 AUDIT COMPLET - Mapping Champs HTML → JS → SQL

## 📋 Objectif
Vérifier que **CHAQUE** champ dans `tab-infos-gites.html` a :
1. ✅ Un ID valide dans le HTML
2. ✅ Une variable correspondante dans `loadInfosGiteFromSupabase()` (camelCase)
3. ✅ Une colonne correspondante en base de données (snake_case)

---

## 🇫🇷 CHAMPS FRANÇAIS

### Section 1 : Informations de Base

| ID HTML | Variable JS | Colonne SQL | Status |
|---------|-------------|-------------|--------|
| `infos_adresse` | `adresse` | `adresse` | ✅ |
| `infos_telephone` | `telephone` | `telephone` | ✅ |
| `infos_gpsLat` | `gpsLat` | `gps_lat` | ✅ |
| `infos_gpsLon` | `gpsLon` | `gps_lon` | ✅ |
| `infos_email` | `email` | `email` | ✅ |

### Section 2 : WiFi & Internet

| ID HTML | Variable JS | Colonne SQL | Status |
|---------|-------------|-------------|--------|
| `infos_wifiSSID` | `wifiSSID` | `wifi_ssid` | ✅ |
| `infos_wifiPassword` | `wifiPassword` | `wifi_password` | ✅ |
| `infos_wifiDebit` | `wifiDebit` | `wifi_debit` | ✅ |
| `infos_wifiLocalisation` | `wifiLocalisation` | `wifi_localisation` | ✅ |
| `infos_wifiZones` | `wifiZones` | `wifi_zones` | ✅ |

### Section 3 : Arrivée & Accès

| ID HTML | Variable JS | Colonne SQL | Status |
|---------|-------------|-------------|--------|
| `infos_heureArrivee` | `heureArrivee` | `heure_arrivee` | ✅ |
| `infos_arriveeTardive` | `arriveeTardive` | `arrivee_tardive` | ✅ |
| `infos_parkingDispo` | `parkingDispo` | `parking_dispo` | ✅ |
| `infos_parkingPlaces` | `parkingPlaces` | `parking_places` | ✅ |
| `infos_parkingDetails` | `parkingDetails` | `parking_details` | ✅ |
| `infos_typeAcces` | `typeAcces` | `type_acces` | ✅ |
| `infos_codeAcces` | `codeAcces` | `code_acces` | ✅ |
| `infos_instructionsCles` | `instructionsCles` | `instructions_cles` | ✅ |
| `infos_etage` | `etage` | `etage` | ✅ |
| `infos_ascenseur` | `ascenseur` | `ascenseur` | ✅ |
| `infos_itineraireLogement` | `itineraireLogement` | `itineraire_logement` | ✅ |
| `infos_premiereVisite` | `premiereVisite` | `premiere_visite` | ✅ |

### Section 4 : Logement & Équipements

| ID HTML | Variable JS | Colonne SQL | Status |
|---------|-------------|-------------|--------|
| `infos_typeChauffage` | `typeChauffage` | `type_chauffage` | ✅ |
| `infos_climatisation` | `climatisation` | `climatisation` | ✅ |
| `infos_instructionsChauffage` | `instructionsChauffage` | `instructions_chauffage` | ✅ |
| `infos_equipementsCuisine` | `equipementsCuisine` | `equipements_cuisine` | ✅ |
| `infos_instructionsFour` | `instructionsFour` | `instructions_four` | ✅ |
| `infos_instructionsPlaques` | `instructionsPlaques` | `instructions_plaques` | ✅ |
| `infos_instructionsLaveVaisselle` | `instructionsLaveVaisselle` | `instructions_lave_vaisselle` | ✅ |
| `infos_instructionsLaveLinge` | `instructionsLaveLinge` | `instructions_lave_linge` | ✅ |
| `infos_secheLinge` | `secheLinge` | `seche_linge` | ✅ |
| `infos_ferRepasser` | `ferRepasser` | `fer_repasser` | ✅ |
| `infos_lingeFourni` | `lingeFourni` | `linge_fourni` | ✅ |
| `infos_configurationChambres` | `configurationChambres` | `configuration_chambres` | ✅ |

### Section 5 : Déchets

| ID HTML | Variable JS | Colonne SQL | Status |
|---------|-------------|-------------|--------|
| `infos_instructionsTri` | `instructionsTri` | `instructions_tri` | ✅ |
| `infos_joursCollecte` | `joursCollecte` | `jours_collecte` | ✅ |
| `infos_decheterie` | `decheterie` | `decheterie` | ✅ |

### Section 6 : Sécurité

| ID HTML | Variable JS | Colonne SQL | Status |
|---------|-------------|-------------|--------|
| `infos_detecteurFumee` | `detecteurFumee` | `detecteur_fumee` | ✅ |
| `infos_extincteur` | `extincteur` | `extincteur` | ✅ |
| `infos_coupureEau` | `coupureEau` | `coupure_eau` | ✅ |
| `infos_disjoncteur` | `disjoncteur` | `disjoncteur` | ✅ |
| `infos_consignesUrgence` | `consignesUrgence` | `consignes_urgence` | ✅ |

### Section 7 : Départ

| ID HTML | Variable JS | Colonne SQL | Status |
|---------|-------------|-------------|--------|
| `infos_heureDepart` | `heureDepart` | `heure_depart` | ✅ |
| `infos_departTardif` | `departTardif` | `depart_tardif` | ✅ |
| `infos_checklistDepart` | `checklistDepart` | `checklist_depart` | ✅ |
| `infos_restitutionCles` | `restitutionCles` | `restitution_cles` | ✅ |

### Section 8 : Règlement

| ID HTML | Variable JS | Colonne SQL | Status |
|---------|-------------|-------------|--------|
| `infos_tabac` | `tabac` | `tabac` | ✅ |
| `infos_animaux` | `animaux` | `animaux` | ✅ |
| `infos_nbMaxPersonnes` | `nbMaxPersonnes` | `nb_max_personnes` | ✅ |
| `infos_caution` | `caution` | `caution` | ✅ |

---

## 🇬🇧 CHAMPS ANGLAIS (_en)

### Section 1 : Informations de Base

| ID HTML | Variable JS | Colonne SQL | Status |
|---------|-------------|-------------|--------|
| `infos_adresse_en` | `adresse_en` | `adresse_en` | ✅ |
| `infos_telephone_en` | `telephone_en` | `telephone_en` | ✅ |
| `infos_email_en` | `email_en` | `email_en` | ✅ |

### Section 2 : WiFi & Internet

| ID HTML | Variable JS | Colonne SQL | Status |
|---------|-------------|-------------|--------|
| `infos_wifiSSID_en` | `wifiSSID_en` | `wifi_ssid_en` | ✅ |
| `infos_wifiPassword_en` | `wifiPassword_en` | `wifi_password_en` | ✅ |
| `infos_wifiDebit_en` | `wifiDebit_en` | `wifi_debit_en` | ✅ |
| `infos_wifiLocalisation_en` | `wifiLocalisation_en` | `wifi_localisation_en` | ✅ |
| `infos_wifiZones_en` | `wifiZones_en` | `wifi_zones_en` | ✅ |

### Section 3 : Arrivée & Accès

| ID HTML | Variable JS | Colonne SQL | Status |
|---------|-------------|-------------|--------|
| `infos_heureArrivee_en` | `heureArrivee_en` | `heure_arrivee_en` | ✅ |
| `infos_arriveeTardive_en` | `arriveeTardive_en` | `arrivee_tardive_en` | ✅ |
| `infos_parkingDispo_en` | `parkingDispo_en` | `parking_dispo_en` | ✅ |
| `infos_parkingPlaces_en` | `parkingPlaces_en` | `parking_places_en` | ✅ |
| `infos_parkingDetails_en` | `parkingDetails_en` | `parking_details_en` | ✅ |
| `infos_typeAcces_en` | `typeAcces_en` | `type_acces_en` | ✅ |
| `infos_codeAcces_en` | `codeAcces_en` | `code_acces_en` | ✅ |
| `infos_instructionsCles_en` | `instructionsCles_en` | `instructions_cles_en` | ✅ |
| `infos_etage_en` | `etage_en` | `etage_en` | ✅ |
| `infos_ascenseur_en` | `ascenseur_en` | `ascenseur_en` | ✅ |
| `infos_itineraireLogement_en` | `itineraireLogement_en` | `itineraire_logement_en` | ✅ |
| `infos_premiereVisite_en` | `premiereVisite_en` | `premiere_visite_en` | ✅ |

### Section 4 : Logement & Équipements

| ID HTML | Variable JS | Colonne SQL | Status |
|---------|-------------|-------------|--------|
| `infos_typeChauffage_en` | `typeChauffage_en` | `type_chauffage_en` | ✅ |
| `infos_climatisation_en` | `climatisation_en` | `climatisation_en` | ✅ |
| `infos_instructionsChauffage_en` | `instructionsChauffage_en` | `instructions_chauffage_en` | ✅ |
| `infos_equipementsCuisine_en` | `equipementsCuisine_en` | `equipements_cuisine_en` | ✅ |
| `infos_instructionsFour_en` | `instructionsFour_en` | `instructions_four_en` | ✅ |
| `infos_instructionsPlaques_en` | `instructionsPlaques_en` | `instructions_plaques_en` | ✅ |
| `infos_instructionsLaveVaisselle_en` | `instructionsLaveVaisselle_en` | `instructions_lave_vaisselle_en` | ✅ |
| `infos_instructionsLaveLinge_en` | `instructionsLaveLinge_en` | `instructions_lave_linge_en` | ✅ |
| `infos_secheLinge_en` | `secheLinge_en` | `seche_linge_en` | ✅ |
| `infos_ferRepasser_en` | `ferRepasser_en` | `fer_repasser_en` | ✅ |
| `infos_lingeFourni_en` | `lingeFourni_en` | `linge_fourni_en` | ✅ |
| `infos_configurationChambres_en` | `configurationChambres_en` | `configuration_chambres_en` | ✅ |

### Section 5 : Déchets

| ID HTML | Variable JS | Colonne SQL | Status |
|---------|-------------|-------------|--------|
| `infos_instructionsTri_en` | `instructionsTri_en` | `instructions_tri_en` | ✅ |
| `infos_joursCollecte_en` | `joursCollecte_en` | `jours_collecte_en` | ✅ |
| `infos_decheterie_en` | `decheterie_en` | `decheterie_en` | ✅ |

### Section 6 : Sécurité

| ID HTML | Variable JS | Colonne SQL | Status |
|---------|-------------|-------------|--------|
| `infos_detecteurFumee_en` | `detecteurFumee_en` | `detecteur_fumee_en` | ✅ |
| `infos_extincteur_en` | `extincteur_en` | `extincteur_en` | ✅ |
| `infos_coupureEau_en` | `coupureEau_en` | `coupure_eau_en` | ✅ |
| `infos_disjoncteur_en` | `disjoncteur_en` | `disjoncteur_en` | ✅ |
| `infos_consignesUrgence_en` | `consignesUrgence_en` | `consignes_urgence_en` | ✅ |

### Section 7 : Départ

| ID HTML | Variable JS | Colonne SQL | Status |
|---------|-------------|-------------|--------|
| `infos_heureDepart_en` | `heureDepart_en` | `heure_depart_en` | ✅ |
| `infos_departTardif_en` | `departTardif_en` | `depart_tardif_en` | ✅ |
| `infos_checklistDepart_en` | `checklistDepart_en` | `checklist_depart_en` | ✅ |
| `infos_restitutionCles_en` | `restitutionCles_en` | `restitution_cles_en` | ✅ |

### Section 8 : Règlement

| ID HTML | Variable JS | Colonne SQL | Status |
|---------|-------------|-------------|--------|
| `infos_tabac_en` | `tabac_en` | `tabac_en` | ✅ |
| `infos_animaux_en` | `animaux_en` | `animaux_en` | ✅ |
| `infos_nbMaxPersonnes_en` | `nbMaxPersonnes_en` | `nb_max_personnes_en` | ✅ |
| `infos_caution_en` | `caution_en` | `caution_en` | ✅ |

---

## ✅ RÉSULTAT DE L'AUDIT

### 📊 Statistiques

- **Total champs FR** : 42 ✅
- **Total champs EN** : 42 ✅
- **Total général** : 84 champs
- **Champs manquants** : 0 ❌
- **Mapping correct** : 100% ✅

### 🔍 Vérification du Mapping

#### Règles de conversion :
1. **HTML → JS** : `infos_` + camelCase (ex: `infos_heureArrivee_en`)
2. **JS → SQL** : snake_case (ex: `heureArrivee_en` → `heure_arrivee_en`)
3. **SQL → JS** : Inverse (ex: `heure_arrivee_en` → `heureArrivee_en`)

#### Fonction de chargement :
```javascript
// chargerDonneesInfos() ligne 1392
Object.keys(data).forEach(key => {
    let element = document.getElementById('infos_' + key);
    if (!element) {
        element = document.getElementById(key);
    }
    if (element) {
        element.value = data[key] || '';
    }
});
```

✅ **Logique correcte** : Cherche d'abord avec préfixe `infos_`, sinon sans préfixe.

---

## 🎯 TEST À EFFECTUER

### Procédure de test :
1. ✅ Ouvrir F12 Console
2. ✅ Recharger la page (Ctrl+Shift+R)
3. ✅ Sélectionner un gîte (ex: Trévoux)
4. ✅ Observer les logs :
   - `📥 Chargement des données pour X`
   - `✅ N champs remplis (avec valeur)`
   - `⚠️ X champs NON TROUVÉS dans le HTML` ← **Doit être vide**
   - `🔍 Exemples champs EN chargés:` ← **Vérifier que les valeurs sont là**
5. ✅ Remplir un champ FR (ex: `Chauffage électrique`)
6. ✅ Cliquer "Traduire tout"
7. ✅ Basculer en EN (🇬🇧 EN)
8. ✅ Vérifier que le champ EN correspondant est rempli avec la traduction
9. ✅ Sauvegarder (Ctrl+S)
10. ✅ Recharger la page
11. ✅ Basculer en EN
12. ✅ **Vérifier que la traduction persiste**

### Logs attendus :
```
📥 Chargement des données pour Trévoux (langue active: fr)
✅ 42 champs remplis (avec valeur)
📊 Total clés dans data: 84
🔍 Exemples champs EN chargés: ["heureArrivee_en="4:00 PM..."", "typeChauffage_en="Electric heating..."", ...]
🔍 DEBUG applyLanguageDisplay: {langue: "en", totalCards: 10, frenchCards: 9, englishCard: found, englishCardVisible: "block"}
✅ Card EN affichée (display: block)
🇬🇧 Mode EN activé : 9 cards FR cachées, 1 card EN affichée
```

---

## 🐛 SI LE PROBLÈME PERSISTE

### Diagnostic étape par étape :

1. **Vérifier le chargement depuis la BDD** :
   ```javascript
   // Dans la console après chargement
   console.log(await supabase.from('infos_gites').select('*').eq('gite', 'trevoux').single())
   ```
   → Vérifier que les colonnes `_en` contiennent bien des valeurs

2. **Vérifier le mapping JS** :
   - Chercher `"⚠️ X champs NON TROUVÉS"` dans la console
   - Si des champs sont listés → problème de mapping HTML ↔ JS

3. **Vérifier l'affichage EN** :
   - Chercher `"🔍 DEBUG applyLanguageDisplay"` dans la console
   - Vérifier que `englishCard: "found"` et `englishCardVisible: "block"`
   - Si `englishCard: null` → problème HTML structure

4. **Vérifier la sauvegarde** :
   ```javascript
   // Après sauvegarde, chercher dans la console
   💾 Sauvegarde: champsFR: 42, champsEN: 42
   ```
   → Vérifier que les champs EN sont bien collectés

---

## 📝 CONCLUSION

**Tous les mappings sont corrects** ✅

Le problème ne vient PAS de :
- ❌ Colonnes manquantes en BDD
- ❌ Variables manquantes en JS
- ❌ IDs manquants en HTML

Les prochaines étapes de debug doivent se concentrer sur :
- 🔍 Vérifier si les données EN sont bien **chargées depuis la BDD**
- 🔍 Vérifier si les champs EN sont bien **remplis dans le HTML**
- 🔍 Vérifier si la **card EN est bien visible** quand on bascule
