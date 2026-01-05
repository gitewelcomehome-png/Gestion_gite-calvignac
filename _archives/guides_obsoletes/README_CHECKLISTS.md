# 📋 Système de Check-lists Entrée/Sortie

## Vue d'ensemble

Le système de check-lists permet de :
1. **Créer des templates de check-list** pour chaque gîte (Trevoux et Couzon)
2. **Séparer entrée et sortie** avec des items différents
3. **Suivre la progression** des clients en temps réel
4. **Afficher des indicateurs visuels** dans le dashboard (🔴🟠🟢)

---

## 📊 Structure de la base de données

### Table : `checklist_templates`

Templates d'items de checklist par gîte et type.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `bigint` | ID auto-incrémenté |
| `gite` | `text` | Gîte (Trevoux ou Couzon) avec CHECK |
| `type` | `text` | Type (entree ou sortie) avec CHECK |
| `ordre` | `integer` | Ordre d'affichage |
| `texte` | `text` | Texte principal de l'item |
| `description` | `text` | Description optionnelle |
| `actif` | `boolean` | Soft delete (défaut: true) |
| `created_at` | `timestamp` | Date de création |
| `updated_at` | `timestamp` | Dernière modification |

**Contraintes :**
- CHECK sur `gite`: valeurs autorisées = 'Trevoux', 'Couzon'
- CHECK sur `type`: valeurs autorisées = 'entree', 'sortie'

**Indexes :**
- `idx_checklist_templates_gite` sur `gite`
- `idx_checklist_templates_type` sur `type`
- `idx_checklist_templates_actif` sur `actif`

### Table : `checklist_progress`

Progression de chaque réservation sur les items de checklist.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `bigint` | ID auto-incrémenté |
| `reservation_id` | `bigint` | Référence à `reservations(id)` |
| `template_id` | `bigint` | Référence à `checklist_templates(id)` |
| `completed` | `boolean` | Item coché ou non (défaut: false) |
| `completed_at` | `timestamp` | Date de complétion |
| `created_at` | `timestamp` | Date de création |

**Contraintes :**
- UNIQUE sur `(reservation_id, template_id)` : un seul statut par item/réservation
- FK `template_id` → `checklist_templates(id)` ON DELETE CASCADE

**Indexes :**
- `idx_checklist_progress_reservation` sur `reservation_id`
- `idx_checklist_progress_template` sur `template_id`

---

## 🎨 Interface utilisateur

### 1. Onglet "Check-lists" (Admin)

**Section 1 : Réservations en cours**
- Liste toutes les réservations futures
- Affiche deux barres de progression :
  - 🚪 **Entrée** : X/Y items complétés
  - 🧳 **Sortie** : X/Y items complétés
- Voyant de couleur :
  - 🔴 **Rouge** : 0% (pas commencé)
  - 🟠 **Orange** : 1-99% (en cours)
  - 🟢 **Vert** : 100% (terminé)

**Section 2 : Création de templates**
- Sélection du gîte (Trevoux / Couzon)
- Sélection du type (Entrée / Sortie)
- Liste des items existants avec boutons :
  - ⬆️ **Monter** : réorganiser l'ordre
  - ⬇️ **Descendre** : réorganiser l'ordre
  - 🗑️ **Supprimer** : soft delete (actif = false)
- Formulaire d'ajout :
  - Texte de l'item (obligatoire)
  - Description (optionnel)
  - Bouton "➕ Ajouter l'item"

### 2. Dashboard

**Indicateurs dans les cartes de réservation :**
```
🚪 Entrée: 3/5 🟠 | 🧳 Sortie: 8/8 🟢
```

- Affichage compact avec fraction (complétées/total)
- Voyant de couleur à côté de chaque type
- Uniquement affiché si des templates existent

### 3. Fiche Client (À venir)

- Affichage de la checklist entrée au moment de l'arrivée
- Affichage de la checklist sortie au moment du départ
- Cases à cocher interactives
- Mise à jour en temps réel de `checklist_progress`

---

## 🔄 Logique de fonctionnement

### Création de templates

1. Admin sélectionne **Gîte** et **Type**
2. Liste des items existants chargée via :
   ```sql
   SELECT * FROM checklist_templates
   WHERE gite = ? AND type = ? AND actif = true
   ORDER BY ordre ASC
   ```
3. Admin ajoute un nouvel item :
   - Calcul du prochain ordre : `MAX(ordre) + 1`
   - INSERT dans `checklist_templates`
4. Admin peut réorganiser avec ⬆️⬇️ :
   - Échange des valeurs `ordre` entre deux items

### Progression client

1. Quand client accède à sa fiche (à implémenter) :
   ```sql
   SELECT t.* FROM checklist_templates t
   WHERE t.gite = ? AND t.type = ? AND t.actif = true
   ORDER BY t.ordre ASC
   ```
2. Pour chaque template, vérifier si déjà complété :
   ```sql
   SELECT * FROM checklist_progress
   WHERE reservation_id = ? AND template_id = ?
   ```
3. Quand client coche un item :
   ```sql
   INSERT INTO checklist_progress (reservation_id, template_id, completed, completed_at)
   VALUES (?, ?, true, NOW())
   ON CONFLICT (reservation_id, template_id)
   DO UPDATE SET completed = true, completed_at = NOW()
   ```

### Calcul de la progression (Dashboard)

```javascript
async function getReservationChecklistProgress(reservationId, gite) {
    // 1. Récupérer templates pour ce gîte
    const templates = await supabaseClient
        .from('checklist_templates')
        .select('id, type')
        .eq('gite', gite)
        .eq('actif', true);
    
    // 2. Séparer par type
    const templatesEntree = templates.filter(t => t.type === 'entree');
    const templatesSortie = templates.filter(t => t.type === 'sortie');
    
    // 3. Récupérer progression
    const progress = await supabaseClient
        .from('checklist_progress')
        .select('template_id, completed')
        .eq('reservation_id', reservationId);
    
    // 4. Compter les complétées
    const completedEntree = progress.filter(p => 
        p.completed && templatesEntree.some(t => t.id === p.template_id)
    ).length;
    
    const completedSortie = progress.filter(p => 
        p.completed && templatesSortie.some(t => t.id === p.template_id)
    ).length;
    
    return {
        entree: {
            total: templatesEntree.length,
            completed: completedEntree,
            percent: Math.round((completedEntree / templatesEntree.length) * 100)
        },
        sortie: {
            total: templatesSortie.length,
            completed: completedSortie,
            percent: Math.round((completedSortie / templatesSortie.length) * 100)
        }
    };
}
```

---

## 📝 Fichiers modifiés/créés

### Créés
- ✅ `sql/create_checklist_system.sql` (67 lignes) : Schéma SQL complet
- ✅ `tabs/tab-checklists.html` (98 lignes) : Interface admin
- ✅ `js/checklists.js` (347 lignes) : Logique business
- ✅ `README_CHECKLISTS.md` : Ce fichier

### Modifiés
- ✅ `index.html` : Ajout script checklists.js, onglet, tab container, switchTab
- ✅ `js/dashboard.js` : Ajout indicateurs checklist dans réservations

---

## 🚀 Installation

### 1. Exécuter le SQL

Dans l'éditeur SQL de Supabase :

```sql
-- Charger et exécuter sql/create_checklist_system.sql
```

Cela crée :
- Les deux tables avec contraintes
- 6 indexes pour performance
- 12 exemples de templates (6 Trevoux, 6 Couzon)

### 2. Vérification

```sql
-- Vérifier les tables
SELECT * FROM checklist_templates ORDER BY gite, type, ordre;
SELECT * FROM checklist_progress LIMIT 10;

-- Compter les templates
SELECT gite, type, COUNT(*) 
FROM checklist_templates 
WHERE actif = true 
GROUP BY gite, type;
```

Résultat attendu :
```
 gite    | type   | count 
---------|--------|-------
 Trevoux | entree | 3
 Trevoux | sortie | 3
 Couzon  | entree | 3
 Couzon  | sortie | 3
```

---

## 🎯 Utilisation

### Côté Admin

1. **Aller dans l'onglet "📋 Check-lists"**
2. **Section "Réservations en cours"** :
   - Voir la progression de chaque réservation
   - Identifier rapidement les checklists incomplètes (🔴🟠)
3. **Section "Création"** :
   - Choisir gîte et type
   - Ajouter de nouveaux items
   - Réorganiser l'ordre avec ⬆️⬇️
   - Supprimer les items obsolètes

### Côté Dashboard

- Les réservations affichent automatiquement :
  ```
  🚪 Entrée: 2/5 🟠  |  🧳 Sortie: 0/8 🔴
  ```
- Vue d'ensemble rapide sur l'avancement des clients

### Côté Client (à implémenter)

- Quand le client accède à sa fiche :
  - Section "Check-list d'arrivée" avec items à cocher
  - Section "Check-list de départ" avec items à cocher
- Les cases cochées sont sauvegardées en temps réel
- Le dashboard se met à jour automatiquement

---

## 🔧 Personnalisation

### Ajouter un nouveau gîte

1. Modifier la contrainte CHECK dans `checklist_templates` :
   ```sql
   ALTER TABLE checklist_templates DROP CONSTRAINT IF EXISTS checklist_templates_gite_check;
   ALTER TABLE checklist_templates ADD CONSTRAINT checklist_templates_gite_check 
   CHECK (gite IN ('Trevoux', 'Couzon', 'NouveauGite'));
   ```

2. Mettre à jour les sélecteurs dans `tab-checklists.html` :
   ```html
   <option value="NouveauGite">Nouveau Gîte</option>
   ```

### Ajouter un nouveau type

1. Modifier la contrainte CHECK :
   ```sql
   ALTER TABLE checklist_templates DROP CONSTRAINT IF EXISTS checklist_templates_type_check;
   ALTER TABLE checklist_templates ADD CONSTRAINT checklist_templates_type_check 
   CHECK (type IN ('entree', 'sortie', 'maintenance'));
   ```

2. Adapter l'interface HTML et JS

---

## 📊 Requêtes utiles

### Voir toutes les checklists d'une réservation

```sql
SELECT 
    t.gite,
    t.type,
    t.ordre,
    t.texte,
    COALESCE(p.completed, false) AS completed,
    p.completed_at
FROM checklist_templates t
LEFT JOIN checklist_progress p 
    ON t.id = p.template_id 
    AND p.reservation_id = 123
WHERE t.actif = true 
    AND t.gite = 'Trevoux'
ORDER BY t.type, t.ordre;
```

### Statistiques globales

```sql
SELECT 
    r.nom,
    r.gite,
    COUNT(t.id) FILTER (WHERE t.type = 'entree') AS total_entree,
    COUNT(p.id) FILTER (WHERE t.type = 'entree' AND p.completed) AS completed_entree,
    COUNT(t.id) FILTER (WHERE t.type = 'sortie') AS total_sortie,
    COUNT(p.id) FILTER (WHERE t.type = 'sortie' AND p.completed) AS completed_sortie
FROM reservations r
CROSS JOIN checklist_templates t
LEFT JOIN checklist_progress p 
    ON t.id = p.template_id 
    AND p.reservation_id = r.id
WHERE t.actif = true 
    AND t.gite = r.gite
    AND r.date_fin >= CURRENT_DATE
GROUP BY r.id, r.nom, r.gite
ORDER BY r.date_debut;
```

---

## 🐛 Débogage

### Les indicateurs ne s'affichent pas

1. Vérifier que les tables existent :
   ```sql
   SELECT * FROM checklist_templates LIMIT 1;
   SELECT * FROM checklist_progress LIMIT 1;
   ```

2. Vérifier la console navigateur :
   ```javascript
   // Dans la console DevTools
   await getReservationChecklistProgressDashboard(123, 'Trevoux');
   ```

### Les items ne se sauvegardent pas

1. Vérifier RLS (doit être désactivé) :
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
       AND tablename LIKE 'checklist%';
   ```

2. Vérifier les contraintes FK :
   ```sql
   SELECT * FROM information_schema.table_constraints 
   WHERE table_name LIKE 'checklist%';
   ```

---

## 🎉 Prochaines étapes

1. **Intégration fiche client** :
   - Charger checklist entrée/sortie selon la date
   - Cases à cocher interactives
   - Sauvegarde automatique

2. **Notifications** :
   - Alerte si checklist non commencée J-1
   - Badge avec compteur sur l'onglet Check-lists

3. **Export** :
   - PDF de la checklist complétée
   - Historique des complétion

4. **Analytics** :
   - Taux de complétion par gîte
   - Items les plus souvent oubliés
   - Temps moyen de complétion

---

**Auteur** : Système de gestion gîtes Calvignac  
**Version** : 1.0.0  
**Date** : Janvier 2025
