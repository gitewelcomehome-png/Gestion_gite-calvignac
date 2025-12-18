# Modifications - Validation Automatique des Ménages

## 🎯 Objectif
Système intelligent de proposition automatique de dates de ménage avec détection de conflits et workflow d'approbation bidirectionnel (société ⇄ propriétaire).

---

## ✅ Modifications Effectuées

### 1. **validation.html** - Interface Société de Ménage

#### Proposition Automatique de Date/Moment
- **Ligne ~273-293**: Logique automatique qui propose:
  - **Par défaut**: Jour du départ, après-midi
  - **Si conflit (même jour)**: Jour de l'arrivée suivante, matin
  
```javascript
// Si réservation le jour même du départ, proposer le matin de l'arrivée
if (reservationStartAfter) {
    const daysDiff = Math.floor((reservationStartAfter - reservationEndBefore) / (1000 * 60 * 60 * 24));
    if (daysDiff === 0) {
        suggestedDate = reservationStartAfter;
        suggestedTime = 'morning';
    }
}
```

#### Détection de Conflits
- **Variable**: `hasConflict` détecte si départ et arrivée sont dans un délai ≤ 1 jour
- Affiche une alerte visuelle orange avec choix rapide

#### Interface Améliorée
- **Badges de statut** mis à jour:
  - ✓ Validé (status: validated)
  - ⏳ En attente propriétaire (status: proposed)
  - À valider (status: pending)

- **Boutons rapides en cas de conflit**:
  ```html
  📅 Départ (après-midi)
  📅 Avant arrivée (matin)
  ```

#### Fonction selectQuickDate
- **Ligne ~389**: Sélection rapide qui remplit automatiquement date + moment
- Propose directement la modification à la base de données

---

### 2. **index.html** - Interface Propriétaire

#### Badge de Notification
- **Ligne ~245**: Badge rouge sur l'onglet "Planning Ménage"
- Affiche le nombre de modifications en attente (status: proposed)
- Mis à jour automatiquement à chaque chargement du planning

#### Affichage des Modifications Proposées
- **Ligne ~4295-4352**: Carte de ménage avec alerte jaune si `status === 'proposed'`
- Affiche:
  - Date et moment proposés par la société
  - Boutons **Approuver** / **Refuser**
  - Bordure orange sur la carte pour visibilité

#### Fonctions d'Approbation
- **approveModification(reservationId)** (ligne ~4394):
  - Met `status = 'validated'` et `validated_by_company = true`
  - Recharge le planning

- **rejectModification(reservationId)** (ligne ~4408):
  - Restore la date d'origine (jour du départ)
  - Remet `status = 'pending'` et `validated_by_company = false`
  - Supprime `proposed_date`

---

## 🔄 Workflow Complet

### Scénario 1: Validation Simple
1. Société voit la date proposée automatiquement
2. Société clique "Valider cette date"
3. Status: `validated` ✓
4. Propriétaire voit badge vert "Validé"

### Scénario 2: Proposition de Modification
1. Société détecte un conflit ou préfère une autre date
2. Société choisit nouvelle date (ou bouton rapide)
3. Société clique "Proposer cette nouvelle date"
4. Status: `proposed` ⏳
5. **Badge rouge apparaît** sur onglet Planning Ménage du propriétaire
6. Propriétaire voit **alerte jaune** avec nouvelle date
7. Propriétaire clique:
   - **Approuver** → Status devient `validated` ✓
   - **Refuser** → Status revient à `pending`, date restaurée

### Scénario 3: Conflit Détecté
1. Départ et arrivée le même jour
2. Alerte orange s'affiche automatiquement
3. Société a 2 boutons rapides:
   - 📅 Départ (après-midi)
   - 📅 Avant arrivée (matin)
4. Un clic → date + moment remplis + proposition envoyée
5. Propriétaire reçoit notification

---

## 📊 États de la Base de Données

### Table: `cleaning_schedule`

| Colonne | Description |
|---------|-------------|
| `status` | `pending`, `proposed`, `validated` |
| `validated_by_company` | `true` si société a validé |
| `scheduled_date` | Date effective du ménage |
| `proposed_date` | Date proposée (si différente) |
| `time_of_day` | `morning` ou `afternoon` |

---

## 🎨 Visuels

### Badges de Statut
- **Validé** (vert): ✓ Validé
- **En attente** (orange): ⏳ En attente propriétaire
- **Pending** (gris): À valider

### Alertes
- **Conflit** (orange): ⚠️ ATTENTION: Départ et arrivée le même jour!
- **Modification** (jaune): ⚠️ Modification proposée par la société de ménage

### Badge Notification
- Cercle rouge sur "🧹 Planning Ménage"
- Nombre de modifications en attente

---

## 🚀 Prochaines Améliorations Possibles

1. **Email/SMS de notification** au propriétaire quand modification proposée
2. **Historique des modifications** (qui a proposé quoi, quand)
3. **Commentaires** sur les propositions
4. **Blocage des dates** (propriétaire peut bloquer certaines dates)
5. **Calcul automatique du temps de ménage** (3h standard, 4h si ménage complet)

---

## 📝 Notes Techniques

- Utilise `localStorage` pour sauvegarder les préférences matin/après-midi
- Badge mis à jour à chaque appel de `afficherPlanningParSemaine()`
- Fonction `getWeekNumber()` pour numéros de semaine ISO (S1-S52)
- Filtre automatique: seulement dates futures (`dateFin >= now`)

---

**Dernière modification**: $(date +%Y-%m-%d)
**Version**: 2.0 - Validation Automatique Intelligente
