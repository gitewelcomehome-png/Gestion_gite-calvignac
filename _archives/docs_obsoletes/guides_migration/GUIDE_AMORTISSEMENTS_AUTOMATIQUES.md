# 📊 Système d'Amortissement Automatique - Gestion Fiscale

## 🎯 Vue d'ensemble

Le système détecte automatiquement les dépenses amortissables selon la législation française LMNP et crée les lignes d'amortissement pour les années futures.

## 📋 Règles d'amortissement (Législation française)

### Seuil minimum
- **< 720€ TTC (600€ HT)** : Déductible immédiatement
- **≥ 720€ TTC** : Amortissable sur plusieurs années

### Catégories et durées

| Catégorie | Mots-clés détectés | Durée | Exemples |
|-----------|-------------------|-------|----------|
| **Informatique** | ordinateur, portable, pc, laptop, tablette, ipad, macbook, smartphone | **3 ans** | MacBook Pro, iPad, serveur NAS |
| **Électroménager** | lave-linge, lave-vaisselle, réfrigérateur, four, micro-ondes, climatisation | **5 ans** | Lave-linge, climatiseur |
| **Mobilier** | canapé, lit, matelas, armoire, table, chaise, meuble | **10 ans** | Canapé cuir, lit king-size |
| **Audiovisuel** | tv, télévision, sono, hifi, enceinte, projecteur | **5 ans** | Smart TV 55", sono |
| **Rénovation légère** | peinture, parquet, carrelage, plomberie, électricité, menuiserie | **10 ans** | Réfection salle de bain |
| **Gros travaux** | toiture, charpente, façade, isolation, extension | **20 ans** | Réfection toiture |
| **Par défaut** | Autre dépense > 720€ | **5 ans** | Toute dépense non catégorisée |

## 🔄 Fonctionnement

### 1. Détection automatique

Lorsqu'un utilisateur ajoute une dépense (travaux ou frais divers) :

```javascript
// La fonction detecterAmortissement() analyse :
1. Le montant (vérifie le seuil de 720€)
2. La description (recherche de mots-clés)
3. Détermine la catégorie et la durée
```

### 2. Affichage du message

Si la dépense est amortissable, un message s'affiche :

```
⏳ Matériel informatique - Amortissable sur 3 ans jusqu'en 2028
💶 666.67€/an • Création automatique des lignes futures
```

### 3. Création des lignes futures

À la validation de la dépense, le système crée automatiquement les lignes pour les années futures :

**Exemple** : MacBook Pro 2000€ acheté en 2026
- **2026** : 666.67€ (année d'achat - saisie manuelle)
- **2027** : 666.67€ (créé automatiquement)
- **2028** : 666.67€ (créé automatiquement)

### 4. Chargement automatique

Lorsque l'utilisateur ouvre l'année 2027 ou 2028, les lignes d'amortissement sont :
- Chargées automatiquement depuis la base
- Affichées en **lecture seule** (non modifiables)
- Identifiées avec un badge bleu "📊 Amortissement issu de 2026"

## 🗄️ Structure de la base de données

### Table : `fiscalite_amortissements`

```sql
CREATE TABLE fiscalite_amortissements (
    id UUID PRIMARY KEY,
    annee INTEGER NOT NULL,                    -- Année concernée
    type TEXT NOT NULL,                        -- 'travaux' ou 'frais'
    description TEXT NOT NULL,                 -- Description avec mention amortissement
    gite TEXT NOT NULL,                        -- Gîte concerné
    montant NUMERIC(10,2) NOT NULL,           -- Montant annuel
    user_id UUID,                              -- Propriétaire
    amortissement_origine JSONB,              -- Traçabilité
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Structure du JSONB `amortissement_origine`

```json
{
  "annee_origine": 2026,
  "duree": 3,
  "montant_total": 2000
}
```

## 🎨 Interface utilisateur

### Messages d'alerte

**Pendant la saisie** (fond jaune/orange) :
```
⏳ Matériel informatique - Amortissable sur 3 ans jusqu'en 2028
💶 666.67€/an • Création automatique des lignes futures
```

**Lignes automatiques** (fond bleu) :
```
📊 Amortissement issu de 2026 (666.67€/an sur 3 ans)
```

### États des lignes

- **Éditable** : Dépense de l'année en cours (non encore validée)
- **Lecture seule** : 
  - Dépense validée de l'année en cours
  - Lignes d'amortissement des années futures

## 📝 Fichiers modifiés

### JavaScript
- `/js/fiscalite-v2.js`
  - `detecterAmortissement()` : Détection des règles
  - `verifierAmortissement()` : Affichage du message
  - `creerLignesAmortissementFutures()` : Création en base
  - `chargerAmortissementsAnnee()` : Chargement au démarrage
  - Modification de `ajouterTravaux()` et `ajouterFraisDivers()`
  - Modification de `toggleEdit()` pour déclencher la création
  - Modification de `chargerAnnee()` pour charger les amortissements

### CSS
- `/css/fiscalite-neo.css`
  - Styles pour `.amortissement-info`
  - Animation `slideDown`

### SQL
- `/sql/create_fiscalite_amortissements.sql`
  - Création de la table
  - Policies RLS
  - Indexes

## 🔐 Sécurité (RLS)

Chaque utilisateur ne voit que ses propres amortissements :

```sql
-- Policies appliquées
- SELECT : user_id = auth.uid()
- INSERT : user_id = auth.uid()
- UPDATE : user_id = auth.uid()
- DELETE : user_id = auth.uid()
```

## 🚀 Utilisation

### Pour l'utilisateur

1. **Ajouter une dépense** (travaux ou frais divers)
2. **Remplir la description** : "MacBook Pro 16 pouces"
3. **Saisir le montant** : 2000€
4. **Message apparaît** : "Informatique - 3 ans"
5. **Valider** : Les lignes 2027-2028 sont créées automatiquement

### Années futures

1. **Ouvrir l'année 2027**
2. **Les amortissements apparaissent** automatiquement
3. **Lecture seule** : Non modifiables, avec badge bleu

## ⚠️ Points importants

- Les amortissements sont **liés au user_id**
- Les lignes futures sont **en lecture seule**
- La détection se fait **par mots-clés** dans la description
- Le seuil de **720€ TTC** est appliqué automatiquement
- Les montants annuels sont **arrondis à 2 décimales**

## 🔧 Maintenance

Pour ajouter une nouvelle catégorie :

```javascript
// Dans REGLES_AMORTISSEMENT.categories
{
    id: 'nouvelle_categorie',
    keywords: ['mot1', 'mot2', 'mot3'],
    duree: 5,
    label: 'Nom de la catégorie'
}
```

## 📊 Exemple complet

**Année 2026** - Achat MacBook Pro :
```
Description: MacBook Pro 16 pouces
Montant: 2400€
→ Détecté: Informatique (3 ans)
→ Créé: 800€/an en 2027 et 2028
```

**Année 2027** - Chargement automatique :
```
MacBook Pro 16 pouces (amortissement 2/3)
800€
[Lecture seule] 📊 Amortissement issu de 2026
```

**Année 2028** - Chargement automatique :
```
MacBook Pro 16 pouces (amortissement 3/3)
800€
[Lecture seule] 📊 Amortissement issu de 2026
```
