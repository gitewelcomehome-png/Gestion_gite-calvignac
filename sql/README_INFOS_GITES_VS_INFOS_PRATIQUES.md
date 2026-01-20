# Clarification : infos_gites vs infos_pratiques

## 🚨 Attention : Deux tables distinctes !

### Table 1️⃣ : `infos_gites`
**Objectif** : Stocker toutes les informations détaillées et permanentes d'un gîte
**Utilisée par** : Interface d'administration, génération fiches clients
**Structure** : Une ligne par gîte avec ~100 colonnes détaillées

#### Contenu :
- Coordonnées (adresse, tel, GPS, email)
- WiFi (SSID, password, débit, localisation)
- Accès (codes porte/portail, instructions clés)
- Logement (chauffage, cuisine, équipements)
- Règlement (tabac, animaux, nb personnes, caution)
- Sécurité (extincteur, détecteurs, disjoncteur)
- Départ (heure, checklist, restitution clés)
- Déchets (tri, collecte)
- **Bilingue** (FR/EN avec colonnes `_en`)

#### Relations :
```sql
gite_id UUID → gites(id)  -- Lien vers le gîte
gite TEXT                 -- Nom dénormalisé (compatibilité)
owner_user_id UUID        -- Propriétaire
```

---

### Table 2️⃣ : `infos_pratiques`
**Objectif** : Stocker des informations dynamiques catégorisées pour les clients
**Utilisée par** : Génération de fiches clients, FAQ dynamique
**Structure** : Plusieurs lignes par gîte (une par info)

#### Contenu :
```sql
category: wifi | access | emergency | services | rules | equipment | other
title: Titre de l'info
content: Contenu texte
icon: Icône associée
priority: Ordre d'affichage
```

#### Exemple d'utilisation :
```javascript
// Info WiFi
{ category: 'wifi', title: 'Réseau WiFi', content: 'SSID: MonGite - Pass: 123456', icon: 'wifi' }

// Info Urgence
{ category: 'emergency', title: 'Numéros utiles', content: 'Pompiers: 18\nSAMU: 15', icon: 'phone' }
```

#### Relations :
```sql
gite_id UUID → gites(id)  -- Lien vers le gîte (NULL = toutes les gîtes)
owner_user_id UUID        -- Propriétaire
```

---

## 📊 Différences clés

| Critère | infos_gites | infos_pratiques |
|---------|-------------|-----------------|
| **Structure** | Colonnes fixes (~100 champs) | Lignes dynamiques (3 champs) |
| **Utilisation** | Infos complètes du gîte | Infos catégorisées clients |
| **Flexibilité** | Faible (schéma fixe) | Haute (ajout facile) |
| **Multilingue** | Oui (colonnes `_en`) | Non (géré côté app) |
| **1 ligne par** | Gîte | Info |
| **Code actuel** | ✅ Utilisée massivement | ⚠️ Peu utilisée |

---

## 🔧 Stratégie actuelle

### État actuel
- ✅ `infos_gites` : **Utilisée** par tout le code JS (fiches-clients.js, infos-gites.js, fiche-client-app.js)
- ⚠️ `infos_pratiques` : **Peu utilisée**, mais présente dans le schéma

### Action immédiate
1. ✅ Créer/compléter `infos_gites` avec toutes les colonnes nécessaires
2. ✅ S'assurer que le code JS correspond au schéma
3. ⏸️ Garder `infos_pratiques` pour usage futur (infos dynamiques)

### Évolution future (optionnel)
- Migrer certains champs de `infos_gites` vers `infos_pratiques` (plus flexible)
- Utiliser `infos_pratiques` pour des infos spécifiques par réservation
- Simplifier `infos_gites` en gardant uniquement les champs essentiels

---

## ⚠️ Pas de doublon !

Les deux tables sont **complémentaires**, pas **redondantes** :
- `infos_gites` = Référentiel permanent et détaillé
- `infos_pratiques` = Catalogue flexible d'informations

**Règle** : Ne jamais dupliquer les mêmes données dans les deux tables.
Si une info est dans `infos_gites`, elle ne doit pas être dans `infos_pratiques`.

---

## 🎯 Prochaines étapes

1. ✅ Exécuter `FIX_INFOS_GITES_COLONNES.sql` pour créer/compléter la table
2. ✅ Vérifier que le code JS fonctionne sans erreur
3. ✅ Tester la sauvegarde des infos gîtes
4. 📋 Documenter dans ARCHITECTURE.md
5. 📋 Décider si on migre progressivement vers `infos_pratiques`
