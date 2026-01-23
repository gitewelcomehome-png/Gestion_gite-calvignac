# 🌍 Système de Traduction Multilingue - Fiche Client

> **Date de mise en place:** 23 janvier 2026  
> **Langues supportées:** FR (défaut) / EN

---

## 🎯 Vue d'ensemble

Le système de traduction permet de basculer **à la volée** entre français et anglais dans l'application fiche client, sans rechargement de page.

### Fonctionnement

1. **L'utilisateur clique sur FR ou EN** (boutons en haut à droite)
2. **Tous les contenus sont automatiquement traduits** :
   - Labels et textes fixes (via `data-i18n`)
   - Checklists d'entrée/sortie
   - Informations du gîte (WiFi, arrivée, équipements, etc.)
   - FAQ
   - Messages dynamiques (horaires, ménages, etc.)

---

## 📊 Tables Concernées

### 1. **checklist_templates** ✅ ACTIVÉ

**Colonnes multilingues :**
- `texte` / `texte_en`
- `description` / `description_en`

**Utilisation :**
```sql
INSERT INTO checklist_templates (texte, texte_en, description, description_en) VALUES
('Vérifier les lumières', 'Check the lights', 'Toutes les ampoules fonctionnent', 'All bulbs are working');
```

---

### 2. **infos_gites** ✅ DÉJÀ EN PLACE

**Colonnes multilingues (119 colonnes dont ~60 _en) :**

#### Sections FR/EN :
1. **Base :** `adresse` / `adresse_en`, `telephone` / `telephone_en`, `email` / `email_en`
2. **WiFi :** `wifi_ssid` / `wifi_ssid_en`, `wifi_password` / `wifi_password_en`, etc.
3. **Arrivée :** `heure_arrivee` / `heure_arrivee_en`, `parking_details` / `parking_details_en`, etc.
4. **Logement :** `chauffage` / `chauffage_en`, `cuisine_details` / `cuisine_details_en`, etc.
5. **Déchets :** `instructions_tri` / `instructions_tri_en`, `jours_collecte` / `jours_collecte_en`, etc.
6. **Sécurité :** `consignes_urgence` / `consignes_urgence_en`, etc.
7. **Départ :** `checklist_depart` / `checklist_depart_en`, `restitution_cles` / `restitution_cles_en`, etc.
8. **Règlement :** `tabac` / `tabac_en`, `animaux` / `animaux_en`, `caution` / `caution_en`, etc.

**Exemple :**
```sql
UPDATE infos_gites SET 
    instructions_cles_en = 'The key is in the lockbox on the left of the door'
WHERE gite = 'trevoux';
```

---

### 3. **faq** ✅ ACTIVÉ

**Colonnes multilingues :**
- `question` / `question_en`
- `answer` / `answer_en` (ou `reponse` pour rétrocompatibilité)

**Utilisation :**
```sql
INSERT INTO faq (question, question_en, answer, answer_en, category) VALUES
('Où sont les clés ?', 'Where are the keys?', 
 'Les clés sont dans le boîtier à gauche de la porte', 
 'The keys are in the lockbox on the left of the door',
 'arrivee');
```

---

### 4. **activites_gites** ⚠️ NON SUPPORTÉ POUR L'INSTANT

Les activités ne sont **pas encore traduites**. Affichage uniquement en français.

**Future implémentation possible :**
```sql
ALTER TABLE activites_gites 
ADD COLUMN nom_en TEXT,
ADD COLUMN description_en TEXT,
ADD COLUMN categorie_en TEXT;
```

---

## 💻 Implémentation JavaScript

### Fonctions clés

#### 1. **Détection de langue**
```javascript
let currentLanguage = 'fr'; // Par défaut

// Changement via boutons FR/EN
document.querySelectorAll('.language-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentLanguage = btn.dataset.lang;
        // Recharger tous les contenus
        initializeUI();
        reloadClientChecklists();
        reloadFaqData();
    });
});
```

#### 2. **Traduction des checklists**
```javascript
const texte = currentLanguage === 'fr' 
    ? template.texte 
    : (template.texte_en || template.texte);
```

#### 3. **Traduction des infos gîtes**
```javascript
const adresse = currentLanguage === 'fr' 
    ? giteInfo.adresse 
    : (giteInfo.adresse_en || giteInfo.adresse);
```

#### 4. **Traduction de la FAQ**
```javascript
const question = currentLanguage === 'fr' 
    ? faq.question 
    : (faq.question_en || faq.question);
```

### Fallback automatique

Si une traduction anglaise manque (`*_en` est NULL), le système **affiche automatiquement la version française**.

**Exemple :**
```javascript
// Si texte_en est NULL, affiche texte (FR)
const texte = currentLanguage === 'fr' 
    ? template.texte 
    : (template.texte_en || template.texte);
```

---

## 🚀 Migration SQL

### Étapes d'activation

1. **Exécuter le SQL de migration :**
```bash
sql/MIGRATION_MULTILINGUE_FICHE_CLIENT.sql
```

2. **Vérifier l'activation :**
```sql
-- Vérifier checklist_templates
SELECT column_name FROM information_schema.columns
WHERE table_name = 'checklist_templates' AND column_name LIKE '%_en';

-- Vérifier FAQ
SELECT column_name FROM information_schema.columns
WHERE table_name = 'faq' AND column_name LIKE '%_en';
```

3. **Remplir les traductions :**
```sql
-- Checklists
UPDATE checklist_templates SET 
    texte_en = 'English translation here',
    description_en = 'English description here'
WHERE id = 'xxx';

-- FAQ
UPDATE faq SET 
    question_en = 'English question here',
    answer_en = 'English answer here'
WHERE id = 'xxx';
```

---

## ✅ Checklist Post-Migration

- [x] Colonnes `*_en` ajoutées dans `checklist_templates`
- [x] Colonnes `*_en` ajoutées dans `faq`
- [x] Code JavaScript mis à jour pour détecter la langue
- [x] Fallback automatique si traduction manquante
- [x] Rechargement des contenus lors du changement de langue
- [ ] **TODO: Remplir les traductions anglaises dans la base**

---

## 🎨 Interface Utilisateur

### Boutons de langue

```html
<div class="language-switcher">
    <button class="language-btn active" data-lang="fr">FR</button>
    <button class="language-btn" data-lang="en">EN</button>
</div>
```

### Classes CSS

```css
.language-btn.active {
    background: var(--primary);
    color: white;
}
```

---

## 🔧 Maintenance

### Ajouter une nouvelle traduction

1. **Dans la base :**
```sql
UPDATE checklist_templates SET texte_en = 'New translation' WHERE id = 'xxx';
```

2. **Pas de code à modifier** : La traduction apparaîtra automatiquement !

### Ajouter une nouvelle table multilingue

1. **SQL :**
```sql
ALTER TABLE ma_table 
ADD COLUMN champ_en TEXT;
```

2. **JavaScript :**
```javascript
const champ = currentLanguage === 'fr' 
    ? data.champ 
    : (data.champ_en || data.champ);
```

---

## 📝 Notes Importantes

### Rétrocompatibilité

Le système gère l'ancien format de la table `faq` :
- Ancienne colonne : `reponse`
- Nouvelle colonne : `answer`
- Le SQL migre automatiquement `reponse` → `answer`

### Performance

Les traductions sont **chargées une seule fois** au démarrage, puis mises en cache :
- `cachedTemplatesEntree` / `cachedTemplatesSortie`
- `cachedFaqs`
- Pas de rechargement base lors du changement de langue

---

## 🐛 Dépannage

### Problème : Traduction ne s'affiche pas

**Solution :**
1. Vérifier que les colonnes `*_en` existent :
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'checklist_templates' AND column_name LIKE '%_en';
```

2. Vérifier que les traductions sont renseignées :
```sql
SELECT id, texte, texte_en FROM checklist_templates 
WHERE texte_en IS NULL;
```

### Problème : Contenu reste en français

**Solution :**
1. Vérifier que `currentLanguage` est bien à `'en'`
2. Vider le cache du navigateur (Ctrl+F5)
3. Vérifier les logs console pour erreurs

---

## 📚 Fichiers Concernés

### SQL
- `sql/add_i18n_checklist_templates.sql`
- `sql/add_i18n_faq.sql`
- `sql/MIGRATION_MULTILINGUE_FICHE_CLIENT.sql` (fichier principal)

### JavaScript
- `js/fiche-client-app.js` (modifications dans 6 fonctions)

### Documentation
- `ARCHITECTURE.md` (section infos_gites)
- Ce fichier (`README_TRADUCTION_MULTILINGUE.md`)

---

## ✅ Validation

### Tests à effectuer

1. **Tester le changement de langue :**
   - Cliquer sur EN → Tout doit passer en anglais
   - Cliquer sur FR → Tout doit repasser en français

2. **Tester les fallbacks :**
   - Ajouter un item sans `texte_en` → Doit afficher `texte` (FR)

3. **Tester les checklists :**
   - Cocher un item → Progression mise à jour
   - Changer de langue → Item reste coché

4. **Tester la FAQ :**
   - Chercher un mot en français → Résultats trouvés
   - Passer en anglais → Recherche fonctionne en anglais

---

## 🎉 Résultat Final

✅ **Traduction complète FR/EN à la volée**  
✅ **Aucun rechargement de page nécessaire**  
✅ **Fallback automatique si traduction manquante**  
✅ **Performance optimale (mise en cache)**  
✅ **Facile à maintenir et étendre**
