# ✅ CHECKLIST - Activation Traduction Multilingue

## 📋 Étapes d'Activation

### 1️⃣ Migration Base de Données (5 min)

**Exécuter dans Supabase SQL Editor :**

```sql
-- Fichier principal qui fait tout
\i sql/MIGRATION_MULTILINGUE_FICHE_CLIENT.sql
```

**✅ Vérifications :**
```sql
-- Vérifier checklist_templates
SELECT COUNT(*) as total, 
       COUNT(texte_en) FILTER (WHERE texte_en IS NOT NULL) as traduits
FROM checklist_templates;

-- Vérifier FAQ
SELECT COUNT(*) as total, 
       COUNT(question_en) FILTER (WHERE question_en IS NOT NULL) as traduites
FROM faq;
```

---

### 2️⃣ Test Interface (2 min)

**Ouvrir une fiche client :**
```
https://votre-site.com/pages/fiche-client.html?token=XXX
```

**Tests à faire :**

1. ✅ Cliquer sur **EN** → Tout passe en anglais ?
2. ✅ Cliquer sur **FR** → Tout repasse en français ?
3. ✅ Aller sur onglet **Entrée** → Instructions traduites ?
4. ✅ Aller sur onglet **Pendant** → Équipements traduits ?
5. ✅ Aller sur onglet **Sortie** → Checklist traduite ?
6. ✅ Aller sur onglet **FAQ** → Questions traduites ?

---

### 3️⃣ Remplir les Traductions (30 min - 2h)

#### A. Checklists d'entrée/sortie

**Exemple SQL :**
```sql
UPDATE checklist_templates SET 
    texte_en = 'Check the lights',
    description_en = 'All bulbs should be working'
WHERE texte = 'Vérifier les lumières';

UPDATE checklist_templates SET 
    texte_en = 'Close the windows',
    description_en = 'Make sure all windows are properly closed'
WHERE texte = 'Fermer les fenêtres';
```

**Astuce :** Utiliser ChatGPT pour traduire en masse :
```
Traduis ces items en anglais :
- Vérifier les lumières
- Fermer les fenêtres
- Éteindre le chauffage
...
```

---

#### B. FAQ

**Exemple SQL :**
```sql
UPDATE faq SET 
    question_en = 'Where are the keys?',
    answer_en = 'The keys are in the lockbox on the left of the door'
WHERE question = 'Où sont les clés ?';

UPDATE faq SET 
    question_en = 'What time is check-in?',
    answer_en = 'Check-in is from 5pm. Earlier arrival possible upon request.'
WHERE question = 'À quelle heure puis-je arriver ?';
```

---

#### C. Infos Gîtes

**Colonnes à remplir :**

```sql
UPDATE infos_gites SET 
    -- Arrivée
    heure_arrivee_en = 'From 5pm',
    parking_details_en = '2 parking spaces available in front of the house',
    instructions_cles_en = 'The key is in the lockbox on the left of the door. Code: 1234',
    
    -- Logement
    chauffage_en = 'Electric heating with thermostat in each room',
    cuisine_details_en = 'Fully equipped: fridge, oven, microwave, dishwasher',
    
    -- Déchets
    instructions_tri_en = 'Yellow bin: plastic/cardboard. Green bin: glass. Black bin: regular waste',
    jours_collecte_en = 'Tuesday and Friday mornings',
    
    -- Sécurité
    consignes_urgence_en = 'In case of emergency, call the owner at 06 XX XX XX XX',
    
    -- Départ
    checklist_depart_en = 'Please turn off all lights, heating, and lock the door',
    restitution_cles_en = 'Leave the keys in the lockbox',
    
    -- Règlement
    tabac_en = 'Smoking is strictly prohibited inside the accommodation',
    animaux_en = 'Pets are not allowed',
    caution_en = '€300 deposit (released within 7 days)'
    
WHERE gite = 'trevoux';
```

---

### 4️⃣ Tests Finaux (5 min)

**Scénario complet :**

1. Ouvrir fiche client (langue FR par défaut)
2. Lire les infos en français ✅
3. Cliquer sur **EN** ✅
4. Vérifier que **TOUT** est en anglais :
   - Adresse, WiFi, horaires
   - Checklists entrée/sortie
   - FAQ
   - Règlement, contacts
5. Cocher un item de checklist ✅
6. Changer de langue → Item reste coché ✅
7. Chercher dans la FAQ en anglais → Résultats trouvés ✅

---

## 🐛 Problèmes Fréquents

### Problème 1 : Colonnes _en n'existent pas

**Erreur :**
```
column "texte_en" does not exist
```

**Solution :**
```sql
-- Réexécuter le SQL de migration
\i sql/MIGRATION_MULTILINGUE_FICHE_CLIENT.sql
```

---

### Problème 2 : Contenu reste en français

**Causes possibles :**

1. **Traduction non renseignée** → Fallback sur FR (normal)
   ```sql
   -- Vérifier si traduction existe
   SELECT texte, texte_en FROM checklist_templates WHERE texte_en IS NULL;
   ```

2. **Cache navigateur** → Vider cache (Ctrl+F5)

3. **Langue pas détectée** → Vérifier console JavaScript
   ```javascript
   console.log('currentLanguage:', currentLanguage); // Devrait afficher 'en'
   ```

---

### Problème 3 : FAQ ne se rafraîchit pas

**Solution :**

Recharger l'onglet FAQ :
1. Aller sur un autre onglet
2. Revenir sur FAQ
3. Changer de langue

---

## 📊 Suivi des Traductions

### Script de vérification

```sql
-- État des traductions
SELECT 
    'Checklists' as type,
    COUNT(*) as total,
    COUNT(texte_en) FILTER (WHERE texte_en IS NOT NULL) as traduites,
    ROUND(100.0 * COUNT(texte_en) FILTER (WHERE texte_en IS NOT NULL) / COUNT(*), 1) as pourcentage
FROM checklist_templates
UNION ALL
SELECT 
    'FAQ' as type,
    COUNT(*) as total,
    COUNT(question_en) FILTER (WHERE question_en IS NOT NULL) as traduites,
    ROUND(100.0 * COUNT(question_en) FILTER (WHERE question_en IS NOT NULL) / COUNT(*), 1) as pourcentage
FROM faq
UNION ALL
SELECT 
    'Infos Gîtes' as type,
    COUNT(*) as total,
    COUNT(adresse_en) FILTER (WHERE adresse_en IS NOT NULL) as traduites,
    ROUND(100.0 * COUNT(adresse_en) FILTER (WHERE adresse_en IS NOT NULL) / COUNT(*), 1) as pourcentage
FROM infos_gites;
```

---

## 🎯 Objectifs

### Phase 1 (Urgent) ✅
- [x] Migration SQL
- [x] Code JavaScript mis à jour
- [x] Tests de changement de langue

### Phase 2 (Important)
- [ ] Traduire toutes les checklists
- [ ] Traduire toutes les FAQ
- [ ] Traduire infos gîtes principales

### Phase 3 (Nice to have)
- [ ] Traduire activites_gites
- [ ] Ajouter d'autres langues (ES, DE, etc.)

---

## ✅ Validation Finale

**Tout fonctionne si :**

1. ✅ Les boutons FR/EN changent bien de couleur
2. ✅ Les contenus changent instantanément
3. ✅ Aucun rechargement de page nécessaire
4. ✅ Les checklists restent cochées après changement de langue
5. ✅ Si traduction manquante → Affiche FR (fallback)
6. ✅ Aucune erreur dans la console

---

## 📞 Support

En cas de problème :
1. Vérifier les logs console (F12)
2. Vérifier que les colonnes `*_en` existent
3. Vérifier que les traductions sont renseignées
4. Lire `docs/README_TRADUCTION_MULTILINGUE.md`
