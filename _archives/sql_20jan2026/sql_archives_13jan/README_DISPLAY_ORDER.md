# 🔢 Ordre d'affichage des gîtes

## 📋 Fonctionnalité

Cette fonctionnalité permet de définir l'ordre d'affichage des gîtes dans toute l'application (réservations, statistiques, etc.).

---

## 🚀 Installation

### 1. Exécuter le script SQL

**Via Supabase Dashboard :**
1. Aller sur https://supabase.com/dashboard
2. SQL Editor → New query
3. Copier le contenu de `add_display_order_to_gites.sql`
4. Cliquer sur "Run"

**Ou via CLI :**
```bash
supabase db execute --file sql/add_display_order_to_gites.sql
```

### 2. Actualiser la page

Une fois le script exécuté, actualisez votre application. Les gîtes seront initialement triés par ordre alphabétique.

---

## 🎯 Utilisation

### Modifier l'ordre d'affichage

1. **Ouvrir la gestion des gîtes**
   - Cliquer sur l'onglet "Gestion"
   - Ou utiliser le bouton "Gérer mes gîtes"

2. **Réordonner les gîtes**
   - Chaque gîte affiche son numéro d'ordre actuel
   - Utiliser les boutons **▲** (haut) et **▼** (bas)
   - Les modifications sont immédiates

3. **Voir le résultat**
   - L'ordre est automatiquement appliqué partout :
     - Page Réservations (colonnes)
     - Statistiques
     - Tableaux de ménage
     - Tous les affichages de gîtes

---

## 📊 Détails techniques

### Champ ajouté

```sql
display_order INTEGER DEFAULT 0
```

- **Type :** Entier
- **Valeur par défaut :** 0
- **Index :** Oui (pour optimiser les performances)

### Tri

Les gîtes sont triés selon :
1. **Priorité 1** : `display_order` (ordre croissant)
2. **Priorité 2** : `name` (ordre alphabétique)

Cela signifie que si deux gîtes ont le même `display_order`, ils seront triés par nom.

### Initialisation

Lors de l'exécution du script :
- Les gîtes existants reçoivent automatiquement un numéro d'ordre
- L'ordre initial correspond à l'ordre alphabétique par nom
- Vous pouvez ensuite le modifier selon vos préférences

---

## 🔧 Fonctionnement

### Interface

Chaque gîte dans la liste affiche :
- **▲** : Déplacer vers le haut (ordre -1)
- **Numéro** : Position actuelle dans la liste
- **▼** : Déplacer vers le bas (ordre +1)

### Comportement

- Les boutons sont désactivés en première/dernière position
- Les modifications sont sauvegardées instantanément
- L'interface se rafraîchit automatiquement
- Les réservations s'actualisent pour refléter le nouvel ordre

---

## 💡 Exemples d'usage

### Cas d'usage 1 : Ordre de popularité
Mettre les gîtes les plus demandés en premier pour un accès rapide.

### Cas d'usage 2 : Ordre géographique
Ordonner selon l'emplacement (exemple : Trévoux, puis Couzon, puis autres).

### Cas d'usage 3 : Ordre de capacité
Trier du plus petit au plus grand (ou inversement).

---

## 🔍 Vérification

Pour vérifier l'ordre actuel de vos gîtes :

```sql
SELECT name, display_order
FROM gites
WHERE is_active = true
ORDER BY display_order, name;
```

---

## 🛠️ Maintenance

### Réinitialiser l'ordre alphabétique

```sql
WITH numbered_gites AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY name) as rn
    FROM gites
)
UPDATE gites
SET display_order = ng.rn
FROM numbered_gites ng
WHERE gites.id = ng.id;
```

### Définir un ordre manuel

```sql
UPDATE gites SET display_order = 1 WHERE name = 'Trévoux';
UPDATE gites SET display_order = 2 WHERE name = 'Couzon';
UPDATE gites SET display_order = 3 WHERE name = 'Le Relèvement';
-- etc.
```

---

**Date de création :** 10 janvier 2026  
**Version :** 1.0
