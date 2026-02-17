# Système de Promotions Automatiques

## 📱 Application Mobile - Intégration des Promotions

### 🎯 Principe

Le calendrier mobile récupère **automatiquement** les promotions configurées dans l'interface web et les applique aux tarifs affichés.

### ✅ Types de Promotions Supportées

#### 1. **Last Minute** 🏃‍♂️
- S'applique automatiquement X jours avant l'arrivée
- Configuration : `regles_tarifs.promotions.last_minute`
  - `actif` : true/false
  - `pourcentage` : % de réduction (ex: 15)
  - `jours_avant` : nombre de jours (ex: 7)
- Affichage : "Last Minute -15%"
- **Priorité HAUTE** : écrase Early Bird

#### 2. **Early Bird** 🐦
- S'applique pour les réservations anticipées
- Configuration : `regles_tarifs.promotions.early_booking`
  - `actif` : true/false
  - `pourcentage` : % de réduction (ex: 10)
  - `jours_avant` : nombre de jours (ex: 30)
- Affichage : "Early Bird -10%"
- **Priorité BASSE** : annulée par Last Minute

#### 3. **Longue Durée** 📅
- S'applique pour séjours de X nuits minimum
- Configuration : `regles_tarifs.promotions.longue_duree`
  - `actif` : true/false
  - `pourcentage` : % de réduction
  - `nb_nuits_min` : nombre de nuits minimum
- ⚠️ **Non implémentée dans le calendrier** (uniquement simulation réservation)

---

## 🔧 Configuration dans l'Interface Web

### Emplacement
Page de gestion des tarifs → Section "Promotions"

### Exemple de Configuration

```json
{
  "prix_base": 210,
  "promotions": {
    "last_minute": {
      "actif": true,
      "pourcentage": 20,
      "jours_avant": 7
    },
    "early_booking": {
      "actif": true,
      "pourcentage": 10,
      "jours_avant": 30
    },
    "longue_duree": {
      "actif": false,
      "pourcentage": 15,
      "nb_nuits_min": 7
    }
  }
}
```

---

## 📱 Affichage Mobile

### Format d'Affichage

Pour un jour avec promotion :
```
[Prix original barré]  210€
[Prix promo en rouge]  168€  ← -20%
[Badge promo]          Last Minute -20%
```

### Règles d'Application

1. **Tarif manuel défini** → Aucune promo automatique
   - Si `tarifs_calendrier[date]` est un objet avec `{prix, promo, prixOriginal}`
   - La promo manuelle est conservée telle quelle

2. **Tarif simple (nombre)** → Promos automatiques appliquées
   - Si `tarifs_calendrier[date] = 210`
   - Les promos Last Minute/Early Bird s'appliquent automatiquement

3. **Aucun tarif** → Promos sur prix_base
   - Utilise `regles_tarifs.prix_base`
   - Applique les promos automatiques

---

## 🔄 Synchronisation Web ↔ Mobile

### Données Récupérées par l'App

À chaque chargement du calendrier :
```typescript
const { data } = await supabase
  .from('gites')
  .select('id, name, tarifs_calendrier, regles_tarifs')
```

### Calcul Automatique

```typescript
// Exemple : 15 janvier 2026, aujourd'hui = 10 janvier
const dateStr = "2026-01-15";
const prixBase = 210;
const joursAvant = 5; // Dans 5 jours

// Last Minute activé (7 jours ou moins)
if (promotions.last_minute.actif && joursAvant <= 7) {
  const reduction = 210 * (20 / 100); // -20%
  const prixFinal = 210 - 42; // = 168€
  // Badge: "Last Minute -20%"
}
```

---

## ⚙️ Configuration des Promotions

### Via l'Interface Web

1. Accéder à la page **Tarifs** du gîte
2. Section **"Promotions Automatiques"**
3. Activer/désactiver les promotions souhaitées
4. Définir les pourcentages et conditions
5. **Enregistrer** → Synchronisation automatique

### Via SQL (Avancé)

```sql
UPDATE gites
SET regles_tarifs = jsonb_set(
  regles_tarifs,
  '{promotions,last_minute}',
  '{"actif": true, "pourcentage": 20, "jours_avant": 7}'::jsonb
)
WHERE name = 'Trévoux';
```

---

## 🎨 Styles Mobile

### Couleurs Utilisées

- **Prix normal** : Cyan `#00D4FF`
- **Prix promo** : Rouge vif `#FF453A`
- **Prix original** : Gris `#8E8E93` (barré)
- **Badge promo** : Rouge `#FF453A`, gras

### Responsive

- Cases calendrier : 48px hauteur
- Prix : 11-12px
- Badge : 8px
- Tout s'adapte automatiquement

---

## 📊 Priorités des Promotions

```
1. Promo manuelle (tarifs_calendrier avec objet)
   ↓ écrase tout
   
2. Last Minute (si actif et conditions remplies)
   ↓ écrase
   
3. Early Bird (si actif et conditions remplies)
   ↓ si aucune autre promo
   
4. Prix normal
```

---

## ✅ Avantages du Système

1. **Aucune action manuelle** : Les promos s'appliquent automatiquement
2. **Synchronisation temps réel** : Modifications web → visibles immédiatement sur mobile
3. **Flexibilité** : Promos manuelles conservées si définies
4. **Clarté** : Type de promo affiché explicitement
5. **Performance** : Calcul côté client, pas de requête supplémentaire

---

## 🐛 Dépannage

### Les promos ne s'affichent pas

1. Vérifier que la promo est **activée** dans l'interface web
2. Vérifier les **conditions** (jours_avant, pourcentages)
3. Recharger l'app (shake → Reload)
4. Vérifier `regles_tarifs` en base :
   ```sql
   SELECT name, regles_tarifs->'promotions' 
   FROM gites WHERE name = 'Votre Gîte';
   ```

### Mauvais calcul de promo

- Vérifier la date du jour vs date de séjour
- Last Minute : `joursAvant <= jours_avant`
- Early Bird : `joursAvant >= jours_avant`

### Badge promo tronqué

- Normal sur petits écrans
- Le texte s'adapte automatiquement
- Priorité : afficher prix et réduction %

---

## 🔮 Évolutions Futures

- [ ] Promo longue durée dans le calendrier
- [ ] Promos par saison (été/hiver)
- [ ] Promos par jour de semaine
- [ ] Historique des promos appliquées
- [ ] Notifications promos actives

---

**📅 Dernière mise à jour** : 9 février 2026  
**📱 Compatible** : iOS/Android (Expo SDK 54)  
**🔗 Références** : 
- [calendrier-tarifs.js](../js/calendrier-tarifs.js) (web)
- [calendar.tsx](../ios_apple_app/app/(tabs)/calendar.tsx) (mobile)
