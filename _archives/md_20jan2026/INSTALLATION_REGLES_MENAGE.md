# ✅ Système de Règles de Ménage - Installation et Utilisation

## 📝 Ce qui a été créé

### 1. **Base de données**
- ✅ Table `cleaning_rules` pour stocker les règles configurables
- ✅ 9 règles par défaut pré-configurées
- ✅ Système de priorité et activation/désactivation

### 2. **Interface utilisateur**
- ✅ Bouton "🎯 Règles de Ménage" dans l'onglet Planning Ménages
- ✅ Modal de gestion avec liste des règles
- ✅ Possibilité d'activer/désactiver chaque règle
- ✅ Possibilité de modifier nom, description et priorité
- ✅ Design néo-brutalisme cohérent avec le reste de l'app

### 3. **Fichiers créés**
- ✅ `sql/create_cleaning_rules_table.sql` - Création de la table
- ✅ `sql/migration_add_cleaning_rules.sql` - Script de migration
- ✅ `js/cleaning-rules.js` - Logique de gestion des règles
- ✅ `js/cleaning-rules-modal.js` - Interface modal
- ✅ `docs/GUIDE_REGLES_MENAGE.md` - Documentation complète

---

## 🚀 Installation

### Étape 1: Exécuter le script SQL

Connectez-vous à votre base Supabase et exécutez :

```sql
-- Copier-coller le contenu de sql/create_cleaning_rules_table.sql
-- dans l'éditeur SQL de Supabase
```

Ou via ligne de commande :
```bash
psql -U [user] -d [database] -f sql/create_cleaning_rules_table.sql
```

### Étape 2: Vider le cache navigateur

Videz le cache de votre navigateur pour charger les nouveaux scripts JS.

### Étape 3: Tester

1. Allez dans l'onglet "Planning Ménages"
2. Cliquez sur "🎯 Règles de Ménage"
3. Vous devriez voir les 9 règles par défaut

---

## 📋 Règles disponibles

### Règles actives par défaut :

1. **Enchainement: ménage le jour même** (Priorité 1)
   - Si nouvelle réservation le jour du départ → ménage entre les deux

2. **Ménage obligatoire entre deux réservations** (Priorité 5)
   - Toujours faire un ménage entre 2 réservations consécutives

3. **Ménage après-midi par défaut** (Priorité 10)
   - Ménage programmé à 12h par défaut

4. **Matin si arrivée le jour même** (Priorité 15)
   - Ménage à 7h si nouvelle réservation arrive le jour du ménage

5. **Éviter les jours fériés** (Priorité 20)
   - Reporter au jour ouvrable suivant (sauf enchainement)

6. **Reporter les dimanches au lundi** (Priorité 30)
   - Sauf si enchainement

7. **Samedi: reporter si pas de réservation week-end** (Priorité 35)
   - Reporter au lundi si pas de résa samedi/dimanche

8. **Mercredi/Jeudi: reporter au vendredi si possible** (Priorité 40)
   - Sauf si réservation avant

### Règle inactive par défaut :

9. **Éviter les week-ends** (Priorité 50, désactivée)
   - Reporter en semaine si départ week-end sans enchainement

---

## 🎯 Comment utiliser

### Activer/Désactiver une règle

1. Ouvrir "🎯 Règles de Ménage"
2. Cliquer sur "✓ Activer" ou "○ Désactiver" sur la règle
3. Les changements sont immédiats

### Modifier une règle

1. Cliquer sur "✏️ Modifier"
2. Changer le nom, description ou priorité
3. Activer/désactiver via la checkbox
4. Cliquer "💾 Enregistrer"

### Ordre de priorité

- **Plus le nombre est petit, plus la règle est prioritaire**
- Priorité 1 = appliquée en premier
- Priorité 50 = appliquée en dernier

---

## 🔧 Personnalisation

Vous pouvez :
- ✅ Activer/désactiver les règles existantes
- ✅ Modifier les priorités pour changer l'ordre d'application
- ✅ Modifier les descriptions pour les clarifier
- 🔜 Créer de nouvelles règles personnalisées (prochaine version)

---

## 🐛 Résolution de problèmes

### Le bouton "Règles de Ménage" ne s'affiche pas
→ Videz le cache du navigateur (Ctrl+Shift+R)

### "Erreur lors du chargement des règles"
→ Vérifiez que la table `cleaning_rules` existe dans Supabase
→ Vérifiez les permissions RLS

### Les règles ne se sauvegardent pas
→ Vérifiez la console navigateur (F12) pour les erreurs
→ Vérifiez les permissions d'écriture dans Supabase

---

## 📚 Documentation complète

Voir [docs/GUIDE_REGLES_MENAGE.md](docs/GUIDE_REGLES_MENAGE.md) pour :
- Structure technique détaillée
- Configuration JSON des règles
- Évolutions futures
- API JavaScript

---

## ⚠️ Important

- **Site EN PRODUCTION** : Les modifications sont immédiates
- **Testez avant** : Désactivez les règles progressivement pour voir l'impact
- **Priorités** : Ne créez pas de doublons de priorité, cela pourrait causer des conflits
- **Sauvegarde** : Notez vos configurations avant modifications majeures

---

## 🎉 Prochaines étapes

1. ⬜ Intégrer les règles dans le calcul automatique des ménages (`js/menage.js`)
2. ⬜ Ajouter la possibilité de créer des règles personnalisées
3. ⬜ Historique des modifications de règles
4. ⬜ Export/import de configurations
5. ⬜ Règles spécifiques par gîte

---

**Date de création:** 15 janvier 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready
