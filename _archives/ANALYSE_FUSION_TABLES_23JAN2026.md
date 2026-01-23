# 🔍 ANALYSE FUSION TABLES - 23 JANVIER 2026

## ⚠️ OBJECTIF
Déterminer si les tables `charges` et `fiscalite_amortissements` peuvent être :
- **SUPPRIMÉES** (inutilisées)
- **FUSIONNÉES** dans `fiscal_history.donnees_detaillees` (JSONB)
- **CONSERVÉES** (utilisées activement)

---

## 📊 TABLE: `charges`

### Utilisation Code

**Fichiers avec références** :
- ✅ `js/supabase-operations.js` (lignes 288, 313, 334) - Fonctions `addCharge()`, `getAllCharges()`, `deleteCharge()`
- ✅ `js/charges.js` (lignes 12, 71, 117) - Module gestion charges
- ⚠️ `js/dashboard.js` (ligne 1099) - **COMMENTÉ** : `// const charges = await getAllCharges();`

**Fonctions exposées** :
```javascript
window.addCharge = addCharge;
window.getAllCharges = getAllCharges;
window.deleteCharge = deleteCharge;
```

### Analyse Interface

**Tab charges** :
- `index.html` ligne 203 : `'tab-charges': 'tabs/tab-fiscalite-v2.html'`
- **CONCLUSION** : Le tab "charges" pointe vers `fiscalite-v2.html`, PAS vers un fichier tab-charges.html

**Module charges.js** :
- ❌ **NON CHARGÉ** dans `index.html` (grep "charges.js" = 0 résultats)
- ⚠️ Fichier existe mais n'est jamais importé/exécuté

### 🔴 VERDICT : CHARGES

**STATUS** : ⚠️ **MODULE OBSOLÈTE - MAIS ATTENTION**

**Raison** :
1. Le tab "charges" utilise maintenant `fiscalite-v2.html`
2. Le module `charges.js` n'est plus chargé
3. Les données charges sont maintenant dans `fiscal_history.donnees_detaillees.charges_gites` (JSONB)

**⚠️ RISQUE** :
- La table `charges` peut contenir des **DONNÉES HISTORIQUES** d'avant migration fiscalite-v2
- Des fonctions dans `supabase-operations.js` sont encore exposées (window.addCharge, etc.)

**💡 RECOMMANDATION** :

### OPTION 1 : SUPPRIMER (⚠️ RISQUE ÉLEVÉ)
- ❌ **NON RECOMMANDÉ** - Peut contenir données historiques

### OPTION 2 : ARCHIVER + MIGRATION ✅ RECOMMANDÉ
1. **Vérifier** si la table contient des données :
   ```sql
   SELECT COUNT(*) FROM charges;
   ```
2. Si OUI → **Migrer** vers `fiscal_history` :
   - Extraire charges existantes
   - Les intégrer dans `donnees_detaillees` de l'année correspondante
3. **Après migration** → Supprimer table
4. **Supprimer** code obsolète (`js/charges.js`, fonctions dans supabase-operations.js)

### OPTION 3 : CONSERVER (⚠️ DETTE TECHNIQUE)
- Garder la table mais la marquer comme obsolète
- **NON RECOMMANDÉ** - Maintien de code mort

---

## 📊 TABLE: `fiscalite_amortissements`

### Utilisation Code

**Fichiers avec références** :
- ✅ `js/fiscalite-v2.js` (lignes 3343, 3363) - Fonction `chargerAmortissementsAnnee()`

**Fonction principale** :
```javascript
async function chargerAmortissementsAnnee(annee) {
    const { data, error } = await window.supabaseClient
        .from('fiscalite_amortissements')
        .select('*')
        .eq('annee', annee);
    
    // Ajoute les lignes d'amortissement dans les listes correspondantes
    data.forEach(ligne => {
        if (ligne.type === 'travaux') { ... }
        else if (ligne.type === 'frais') { ... }
        else if (ligne.type === 'produits') { ... }
    });
}
```

### Analyse Fonctionnelle

**Objectif** :
- Gérer les amortissements **pluriannuels** (ex: travaux amortis sur 5-10 ans)
- Créer des lignes futures automatiquement lors de l'ajout d'un amortissement
- Charger les amortissements de l'année en cours au démarrage de fiscalite-v2

**Données stockées** :
- `annee` : Année concernée
- `type` : 'travaux', 'frais', 'produits'
- `description` : Libellé
- `gite` : Gîte concerné
- `montant` : Montant annuel
- `amortissement_origine` (JSONB) : Détails origine (durée, montant total, etc.)

### 🟡 VERDICT : FISCALITE_AMORTISSEMENTS

**STATUS** : 🟡 **UTILISÉE - MAIS REDONDANCE**

**Raison** :
1. ✅ Fonction `chargerAmortissementsAnnee()` est appelée dans `fiscalite-v2.js`
2. ✅ Gère les amortissements pluriannuels (feature utile)
3. ⚠️ **MAIS** : Redondance avec `fiscal_history.donnees_detaillees`

**💡 RECOMMANDATION** :

### OPTION 1 : FUSIONNER DANS fiscal_history ✅ RECOMMANDÉ
**Avantages** :
- ✅ Cohérence : toutes les données fiscales au même endroit
- ✅ Simplifie le schéma BDD
- ✅ Meilleure traçabilité (tout dans `donnees_detaillees` JSONB)

**Modifications requises** :
1. **Migration données** :
   ```sql
   -- Intégrer amortissements dans fiscal_history.donnees_detaillees
   UPDATE fiscal_history fh
   SET donnees_detaillees = jsonb_set(
       donnees_detaillees,
       '{amortissements}',
       (SELECT jsonb_agg(fa.*) 
        FROM fiscalite_amortissements fa 
        WHERE fa.annee = fh.year AND fa.user_id = fh.owner_user_id)
   );
   ```

2. **Modifier code** :
   - `fiscalite-v2.js` : Charger depuis `fiscal_history.donnees_detaillees.amortissements`
   - Adapter fonction `chargerAmortissementsAnnee()`

3. **Supprimer table** après validation

### OPTION 2 : CONSERVER ⚠️ DETTE TECHNIQUE
- Garder la table séparée pour les amortissements
- **RISQUE** : Deux sources de vérité (fiscal_history + fiscalite_amortissements)
- **NON RECOMMANDÉ** sauf si calendrier serré

---

## 📊 RÉSUMÉ & PLAN D'ACTION

### Tables à analyser/traiter :

| Table | Status | Action Recommandée | Priorité | Risque |
|-------|--------|-------------------|----------|--------|
| **charges** | ⚠️ OBSOLÈTE | Vérifier données → Migrer → Supprimer | 🔴 HAUTE | ÉLEVÉ |
| **fiscalite_amortissements** | 🟡 UTILISÉE | Fusionner dans fiscal_history | 🟡 MOYENNE | MOYEN |

### Plan d'exécution sécurisé :

#### PHASE 1 : AUDIT (SANS MODIFICATION)
1. ✅ Vérifier contenu table `charges` :
   ```sql
   SELECT COUNT(*), MIN(created_at), MAX(created_at) FROM charges;
   SELECT * FROM charges LIMIT 10;
   ```

2. ✅ Vérifier contenu table `fiscalite_amortissements` :
   ```sql
   SELECT COUNT(*), annee, type FROM fiscalite_amortissements GROUP BY annee, type;
   ```

#### PHASE 2 : BACKUP (SÉCURITÉ)
1. ✅ Exporter données :
   ```sql
   COPY (SELECT * FROM charges) TO '/tmp/backup_charges_23jan2026.csv' WITH CSV HEADER;
   COPY (SELECT * FROM fiscalite_amortissements) TO '/tmp/backup_amortissements_23jan2026.csv' WITH CSV HEADER;
   ```

2. ✅ Archiver structures (déjà fait dans `TABLES_SUPPRIMEES_23JAN2026.md`)

#### PHASE 3 : MIGRATION `charges` (SI DONNÉES PRÉSENTES)
1. ⚠️ Créer script migration :
   ```sql
   -- Migrer charges vers fiscal_history
   -- (script détaillé à créer selon structure données)
   ```

2. ✅ Tester migration sur copie BDD
3. ✅ Valider données migrées
4. ✅ Exécuter en production

#### PHASE 4 : FUSION `fiscalite_amortissements` (OPTIONNEL)
1. ⚠️ Modifier `fiscalite-v2.js` pour utiliser `fiscal_history`
2. ✅ Tester en DEV
3. ✅ Migrer données
4. ✅ Déployer code
5. ✅ Supprimer table après validation (1 semaine)

#### PHASE 5 : NETTOYAGE CODE
1. ✅ Supprimer `js/charges.js`
2. ✅ Supprimer fonctions charges dans `supabase-operations.js` (lignes 277-405)
3. ✅ Archiver dans `_archives/js_obsoletes/`

---

## 🚨 DÉCISION FINALE

### RECOMMANDATION IMMÉDIATE (AUJOURD'HUI) :

**✅ ACTIONS SÛRES** (pas de suppression) :
1. ✅ Créer SQL global de toutes les tables actives (SCHEMA_COMPLET_PRODUCTION.sql)
2. ✅ Archiver fichiers SQL obsolètes (migrations déjà exécutées)
3. ✅ Nettoyer documentations obsolètes
4. ✅ Auditer contenu tables `charges` et `fiscalite_amortissements`

**⏳ ACTIONS DIFFÉRÉES** (après audit) :
1. ⏳ Migration `charges` (si données présentes)
2. ⏳ Fusion `fiscalite_amortissements` (si calendrier permet)
3. ⏳ Suppression code obsolète charges.js

---

**Date analyse** : 23 janvier 2026  
**Responsable** : GitHub Copilot  
**Status** : ⏳ EN ATTENTE VALIDATION PROPRIÉTAIRE
