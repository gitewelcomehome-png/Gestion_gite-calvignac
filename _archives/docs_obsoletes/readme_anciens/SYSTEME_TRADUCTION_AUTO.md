# Système de Traduction Automatique FR→EN

> **Date de mise en place :** 23 janvier 2026  
> **Statut :** ✅ Opérationnel  
> **API utilisée :** MyMemory Translation API (gratuite)

---

## 🎯 Objectif

Permettre aux utilisateurs de créer du contenu en **français uniquement** dans le back-office, et générer automatiquement les **versions anglaises** pour les fiches clients bilingues.

---

## 📋 Tables Concernées

### 1. **faq** - Questions Fréquentes
- ✅ Traduction automatique activée
- **Colonnes :**
  - `question` → `question_en`
  - `answer` → `answer_en`
- **Fichier :** `js/faq.js`
- **SQL :** `sql/ADD_FAQ_TRANSLATIONS.sql`

### 2. **checklist_templates** - Checklists d'Arrivée/Départ
- ✅ Traduction automatique activée
- **Colonnes :**
  - `texte` → `texte_en`
  - `description` → `description_en`
- **Fichier :** `js/checklists.js`
- **SQL :** `sql/ADD_CHECKLIST_TRANSLATIONS.sql`

### 3. **infos_gites** - Informations des Gîtes
- ⚠️ Traduction manuelle (via formulaire back-office)
- **Raison :** Contenu trop spécifique nécessitant une traduction précise
- **Future évolution :** Traduction auto avec édition manuelle possible

---

## 🔧 Fonctionnement Technique

### API de Traduction
```javascript
/**
 * Traduit un texte du français vers l'anglais via l'API MyMemory
 * @param {string} text - Texte français à traduire
 * @returns {Promise<string>} - Texte traduit en anglais
 */
async function translateToEnglish(text) {
    if (!text || text.trim() === '') return '';
    
    try {
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=fr|en`
        );
        const data = await response.json();
        
        if (data.responseStatus === 200 && data.responseData) {
            return data.responseData.translatedText;
        }
        
        console.warn('⚠️ Traduction non disponible, texte original conservé');
        return text;
        
    } catch (error) {
        console.error('❌ Erreur traduction:', error);
        return text; // Fallback sur texte original
    }
}
```

### Workflow de Sauvegarde

#### Exemple FAQ (js/faq.js)
```javascript
async function sauvegarderQuestionFAQ() {
    const question = document.getElementById('faq-question').value.trim();
    const answer = document.getElementById('faq-answer').value.trim();
    
    // 🌍 TRADUCTION AUTOMATIQUE
    const [questionEn, answerEn] = await Promise.all([
        translateToEnglish(question),
        translateToEnglish(answer)
    ]);
    
    // INSERTION avec versions FR + EN
    const { error } = await supabaseClient
        .from('faq')
        .insert({
            question: question,           // FR
            question_en: questionEn,      // EN (auto)
            answer: answer,               // FR
            answer_en: answerEn,          // EN (auto)
            category: category,
            priority: priority,
            // ...
        });
}
```

#### Exemple Checklists (js/checklists.js)
```javascript
async function addChecklistItem() {
    const texte = document.getElementById('checklist-new-text').value.trim();
    const description = document.getElementById('checklist-new-description').value.trim() || null;
    
    // 🌍 TRADUCTION AUTOMATIQUE
    const [texteEn, descriptionEn] = await Promise.all([
        translateToEnglish(texte),
        description ? translateToEnglish(description) : Promise.resolve(null)
    ]);
    
    // INSERTION avec versions FR + EN
    const { error } = await supabaseClient
        .from('checklist_templates')
        .insert({
            texte: texte,                  // FR
            texte_en: texteEn,             // EN (auto)
            description: description,      // FR
            description_en: descriptionEn, // EN (auto)
            // ...
        });
}
```

---

## 🖥️ Affichage Côté Client

### Switch Langue Instantané
```javascript
// js/fiche-client-app.js
function renderClientChecklist(type, templates, progressMap) {
    templates.forEach(template => {
        // Traduction à la volée selon langue active
        const texte = currentLanguage === 'fr' 
            ? template.texte 
            : (template.texte_en || template.texte); // Fallback si traduction manquante
        
        const description = currentLanguage === 'fr' 
            ? template.description 
            : (template.description_en || template.description);
        
        // Affichage...
    });
}
```

### Fallback Automatique
- Si colonne `_en` est `NULL` ou vide → Affiche version française
- Garantit qu'aucun champ ne reste vide
- Performance optimale (pas de requête supplémentaire)

---

## 📊 Performances

### API MyMemory
- **Limite :** 10 000 requêtes/jour (gratuit)
- **Temps de réponse :** ~200-500ms par traduction
- **Parallélisation :** `Promise.all()` pour traductions multiples simultanées
- **Pas de clé API requise**

### Optimisations
- Traduction uniquement lors de la **création/modification** (pas à chaque affichage)
- Stockage en base de données (pas de re-traduction)
- Cache côté client pour changement de langue instantané

---

## 🔐 Sécurité

### Validation des Données
- Traduction = fallback en cas d'erreur (pas de blocage)
- Texte original toujours sauvegardé en priorité
- Pas de dépendance critique à l'API (site fonctionne même si API down)

### Gestion des Erreurs
```javascript
try {
    const translation = await translateToEnglish(text);
    return translation;
} catch (error) {
    console.error('❌ Erreur traduction:', error);
    return text; // ⚠️ IMPORTANT: Fallback sur texte original
}
```

---

## 📝 Installation des Colonnes

### Pour FAQ
```bash
# Exécuter dans Supabase SQL Editor
psql -U postgres -d gites_db -f sql/ADD_FAQ_TRANSLATIONS.sql
```

### Pour Checklists
```bash
# Exécuter dans Supabase SQL Editor
psql -U postgres -d gites_db -f sql/ADD_CHECKLIST_TRANSLATIONS.sql
```

### Scripts SQL
- `sql/ADD_FAQ_TRANSLATIONS.sql` : Ajoute `question_en`, `answer_en`, `category`, `priority`
- `sql/ADD_CHECKLIST_TRANSLATIONS.sql` : Ajoute `texte_en`, `description_en`

---

## 🧪 Tests

### Test Traduction API
```javascript
// Console navigateur
const test = await translateToEnglish("Bonjour, comment allez-vous ?");
console.log(test); // "Hello, how are you?"
```

### Test Sauvegarde FAQ
1. Créer une question en français
2. Vérifier console : logs `🌍 Traduction automatique...` et `✅ Traduction FAQ terminée`
3. Vérifier base : colonnes `question_en` et `answer_en` remplies
4. Switch langue client → Version anglaise affichée

### Test Sauvegarde Checklist
1. Créer un item de checklist en français
2. Vérifier base : colonnes `texte_en` et `description_en` remplies
3. Switch langue client → Version anglaise affichée

---

## 🚨 Erreurs Connues

### 1. Colonnes manquantes
**Erreur :** `column "question_en" does not exist`  
**Solution :** Exécuter le script SQL correspondant dans Supabase

### 2. API Rate Limit
**Erreur :** `Too many requests`  
**Impact :** Traduction non effectuée, texte français utilisé en fallback  
**Solution :** Attendre 24h ou passer à API payante

### 3. Traduction incohérente
**Symptôme :** Traduction de mauvaise qualité  
**Raison :** API MyMemory gratuite, qualité variable  
**Solution :** Éditer manuellement la colonne `_en` en base

---

## 🔄 Évolutions Futures

### Court terme
- ⬜ Bouton "Re-traduire" dans back-office
- ⬜ Édition manuelle des traductions auto-générées
- ⬜ Logs de traduction (traçabilité)

### Moyen terme
- ⬜ Support multilingue étendu (ES, IT, DE)
- ⬜ API premium pour meilleure qualité
- ⬜ Traduction automatique pour `infos_gites`

### Long terme
- ⬜ IA contextuelle (GPT-4) pour traductions précises
- ⬜ Détection automatique de la langue source
- ⬜ Interface d'édition bilingue côte à côte

---

## 📚 Références

- **ARCHITECTURE.md** : Documentation complète des tables
- **ERREURS_CRITIQUES.md** : Historique des bugs liés à la traduction
- **sql/ADD_FAQ_TRANSLATIONS.sql** : Script SQL FAQ
- **sql/ADD_CHECKLIST_TRANSLATIONS.sql** : Script SQL Checklists
- **js/faq.js** : Implémentation FAQ
- **js/checklists.js** : Implémentation Checklists
- **js/fiche-client-app.js** : Affichage client bilingue

---

## ✅ Checklist Activation

### FAQ
- [x] Créer colonnes `question_en`, `answer_en` en base
- [x] Ajouter fonction `translateToEnglish()` dans `js/faq.js`
- [x] Modifier `sauvegarderQuestionFAQ()` pour traduction auto
- [x] Tester affichage client bilingue
- [x] Documenter dans ARCHITECTURE.md

### Checklists
- [x] Créer colonnes `texte_en`, `description_en` en base
- [x] Ajouter fonction `translateToEnglish()` dans `js/checklists.js`
- [x] Modifier `addChecklistItem()` pour traduction auto
- [x] Vérifier affichage client (déjà compatible)
- [x] Documenter dans ARCHITECTURE.md

---

**⚠️ IMPORTANT :** Avant toute utilisation, exécuter les scripts SQL dans Supabase !
