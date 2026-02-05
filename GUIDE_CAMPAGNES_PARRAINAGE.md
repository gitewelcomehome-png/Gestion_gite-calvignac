# 🎁 GUIDE SYSTÈME CAMPAGNES PARRAINAGE

## 📋 Vue d'ensemble

Le système de campagnes de parrainage permet de créer des **promotions temporaires** pour booster l'engagement des parrains. Vous pouvez moduler les récompenses (réductions ou points) pendant une période définie.

---

## 🚀 Installation

### 1. Créer les tables en base de données

```bash
# Exécuter dans l'ordre :
sql/parrainage_campaigns.sql
sql/parrainage_campaigns_test_data.sql  # Optionnel : données de test
```

### 2. Interface Admin

L'onglet **"Parrainage"** a été ajouté au menu Admin :
- Chemin : `pages/admin-parrainage.html`
- Accessible depuis : Admin Channel Manager > Parrainage

---

## 🎯 Types de Bonus Disponibles

### 1. **Réduction par filleul (discount_multiplier)**
**Modifie le taux de base.**
- Base normale : 5% par filleul
- Avec campagne : X% par filleul
- **Exemple :** `10%` → Le parrain gagne 10% au lieu de 5% par filleul actif

### 2. **Réduction fixe (discount_fixed)**
**Ajoute un bonus en plus.**
- Base : 5% par filleul (inchangé)
- Bonus : +X% fixe
- **Exemple :** `20%` → Si le parrain a 2 filleuls (= 10%), il obtient 10% + 20% = 30%

### 3. **Multiplicateur de points (points_multiplier)**
**Pour abonnés Gîtes de France.**
- Base : 100 points par filleul
- Multiplié par X
- **Exemple :** `3x` → 300 points au lieu de 100 par filleul

### 4. **Points bonus fixes (points_fixed)**
**Bonus fixe de points.**
- Base : 100 points par filleul (inchangé)
- Bonus : +X points
- **Exemple :** `500` → 100 + 500 = 600 points par filleul

---

## 📊 Interface Admin

### KPIs Disponibles
- **Campagnes actives** : Nombre de campagnes en cours
- **Participants totaux** : Nombre d'inscrits à toutes les campagnes
- **Filleuls générés** : Total de filleuls recrutés pendant les campagnes
- **Bonus distribués** : Montant total des réductions accordées (€)

### Statuts des Campagnes
- 🟢 **Active** : En cours et accepte encore des participants
- 🔵 **Programmée** : Commence dans le futur
- 🟡 **Complète** : Limite de participants atteinte
- ⚫ **Expirée** : Date de fin dépassée

### Actions Disponibles
- ➕ **Créer** une nouvelle campagne
- ✏️ **Modifier** une campagne existante
- 🗑️ **Supprimer** une campagne

---

## 🔧 Créer une Campagne

### Champs Obligatoires

1. **Nom de la campagne**
   - Exemple : "Double Bonus Février 2026"

2. **Code de la campagne**
   - Format : MAJUSCULES, unique
   - Exemple : `DOUBLE2026`
   - Utilisé pour l'inscription des utilisateurs

3. **Type de bonus**
   - Choisir parmi les 4 types (voir section ci-dessus)

4. **Valeur du bonus**
   - Dépend du type choisi

5. **Dates de début et fin**
   - Format : Date + Heure

### Champs Optionnels

- **Description** : Texte explicatif pour les utilisateurs
- **Participants max** : Limite d'inscriptions (laisser vide = illimité)
- **Min filleuls requis** : Nombre minimum de filleuls actifs pour participer
- **Type d'abonnés** : 
  - Tous
  - Standard uniquement
  - Gîtes de France uniquement

---

## 💡 Exemples de Campagnes

### Exemple 1 : Doublement des réductions
```
Nom          : Double Bonus Mars
Code         : DOUBLE2026
Type         : Réduction par filleul
Valeur       : 10%
Période      : 01/03/2026 - 31/03/2026
Max          : 100 participants
```
**Résultat :** Les parrains gagnent 10% au lieu de 5% par filleul

---

### Exemple 2 : Boost de lancement
```
Nom          : Boost Premier Filleul
Code         : BOOST20
Type         : Réduction fixe
Valeur       : 20%
Min filleuls : 1
Période      : 01/02/2026 - 28/02/2026
```
**Résultat :** Dès le 1er filleul, bonus de 20%

---

### Exemple 3 : Super Points
```
Nom          : Triple Points
Code         : TRIPLE3X
Type         : Multiplicateur de points
Valeur       : 3
Cible        : Gîtes de France
Période      : 01/04/2026 - 30/04/2026
```
**Résultat :** 300 points au lieu de 100 par filleul

---

## 🔄 Fonctionnement Technique

### Inscription à une Campagne

Les utilisateurs peuvent s'inscrire via :

```javascript
// Côté client (à implémenter dans l'onglet Parrainage)
const { data, error } = await supabase
  .rpc('enroll_in_campaign', {
    p_user_id: userId,
    p_campaign_code: 'DOUBLE2026'
  });
```

### Calcul des Récompenses

Le système recalcule automatiquement les récompenses mensuelles en tenant compte des campagnes actives :

```sql
-- Fonction à appeler mensuellement (ou via CRON)
SELECT calculate_monthly_referral_rewards_with_campaigns();
```

### Obtenir les Campagnes Disponibles

```javascript
const { data: campaigns } = await supabase
  .rpc('get_active_campaigns_for_user', {
    p_user_id: userId
  });
```

---

## 📈 Statistiques d'une Campagne

Pour obtenir les stats détaillées :

```sql
SELECT * FROM get_campaign_stats('campaign-uuid-here');
```

Retourne :
- Nombre de participants
- Taux d'occupation (si max défini)
- Total de filleuls générés
- Montant total des bonus distribués
- Jours restants

---

## ⚠️ Points d'Attention

### 1. Conflits de Campagnes
Si un utilisateur est inscrit à plusieurs campagnes, **seule la première active** est appliquée. Gérer les chevauchements intelligemment.

### 2. Désactivation Automatique
Les campagnes sont automatiquement désactivées à leur date de fin via un trigger SQL.

### 3. Limite de Participants
Une fois `max_uses` atteint, la campagne ne peut plus accepter de nouveaux participants.

### 4. Cohérence des Récompenses
Le système utilise `calculate_monthly_referral_rewards_with_campaigns()` qui **remplace** l'ancienne fonction. S'assurer d'appeler la bonne version.

---

## 🎨 Personnalisation

### Modifier l'Interface Admin

Fichiers à éditer :
- `pages/admin-parrainage.html` : Structure HTML
- `js/admin-parrainage.js` : Logique JavaScript
- `css/admin-dashboard.css` : Styles (styles intégrés dans le HTML)

### Ajouter des Types de Bonus

1. Modifier la table SQL :
```sql
ALTER TABLE referral_campaigns 
ADD COLUMN nouveau_bonus_field DECIMAL(5,2);
```

2. Adapter les fonctions de calcul

3. Mettre à jour l'interface

---

## 🔐 Sécurité & RLS

### Policies Définies

- **Campagnes** : Visibles par tous (actives uniquement)
- **Participations** : Chaque user voit ses propres inscriptions
- **Création/Modification** : Via l'interface admin uniquement

### Fonctions SECURITY DEFINER

Les fonctions suivantes s'exécutent avec les droits admin :
- `get_active_campaigns_for_user()`
- `enroll_in_campaign()`
- `calculate_monthly_referral_rewards_with_campaigns()`
- `get_campaign_stats()`

---

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs de la console navigateur
2. Consulter les erreurs Supabase
3. Vérifier que les tables sont bien créées
4. S'assurer que les RLS policies sont actives

---

## 🚀 Prochaines Étapes

### À Implémenter Côté Client

1. **Onglet Parrainage dans l'interface client** (index.html)
   - Afficher les campagnes disponibles
   - Bouton d'inscription
   - Affichage des bonus actuels

2. **Notifications**
   - Email lors d'une nouvelle campagne
   - Alerte quand une campagne se termine

3. **Tracking**
   - Analytics sur les performances des campagnes
   - A/B testing

---

## 📝 Checklist Lancement

- [ ] Tables SQL créées
- [ ] Données de test chargées
- [ ] Interface admin testée
- [ ] Créer une campagne de test
- [ ] Vérifier le calcul des récompenses
- [ ] Implémenter l'interface client
- [ ] Tester l'inscription d'un utilisateur
- [ ] Vérifier les KPIs

---

✅ **Système prêt à l'emploi !**
