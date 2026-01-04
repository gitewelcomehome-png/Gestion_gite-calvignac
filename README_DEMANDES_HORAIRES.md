# 📋 Système de Demandes d'Horaires

## 🎯 Fonctionnalité

Permet aux clients de demander des horaires d'arrivée/départ flexibles depuis leur fiche client. Les gestionnaires peuvent valider ou refuser ces demandes depuis le dashboard.

## 🗄️ Structure de la table

### `demandes_horaires`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | BIGSERIAL | Identifiant unique |
| `reservation_id` | BIGINT | Lien vers la réservation |
| `client_nom` | TEXT | Nom du client |
| `client_prenom` | TEXT | Prénom du client |
| `gite` | TEXT | Nom du gîte |
| `type` | TEXT | `arrivee` ou `depart` |
| `heure_demandee` | TIME | Heure souhaitée par le client |
| `heure_validee` | TIME | Heure finale validée (peut différer) |
| `statut` | TEXT | `en_attente`, `validee`, `refusee` |
| `raison_refus` | TEXT | Raison du refus (si applicable) |
| `date_debut` | DATE | Date de début de la réservation |
| `date_fin` | DATE | Date de fin de la réservation |
| `created_at` | TIMESTAMPTZ | Date de création |
| `validated_at` | TIMESTAMPTZ | Date de validation/refus |
| `validated_by` | TEXT | Nom du gestionnaire |

## 📱 Côté Client (fiche-client.html)

### Formulaires de demande

**Arrivée anticipée :**
- Bouton "⏰ Demander une arrivée plus tôt"
- Sélection d'heure
- Message explicatif : "Les horaires d'arrivée plus tôt dépendent du ménage avant vous"
- Soumission → statut `en_attente`

**Départ tardif :**
- Bouton "⏰ Demander un départ plus tard"
- Sélection d'heure
- Message explicatif : "Les horaires de départ plus tard dépendent du ménage après vous"
- Soumission → statut `en_attente`

## 🖥️ Côté Gestionnaire (Dashboard)

### Section "Demandes en attente"

Affichée en haut du dashboard si des demandes existent :
- Badge avec nombre de demandes
- Liste des demandes avec :
  - Type (📥 Arrivée / 📤 Départ)
  - Nom client
  - Gîte
  - Dates réservation
  - Heure demandée
- Boutons actions :
  - ✓ **Valider** : passe à statut `validee`, enregistre `heure_validee`
  - ✗ **Refuser** : passe à statut `refusee`, demande raison

### Affichage horaires validées

**Dashboard :**
```
📅 15/01/2026 ⏰ 15:00 → 18/01/2026 ⏰ 12:00 (3 nuits)
```

**Planning réservations :**
```
📅 15/01/2026 ⏰ 15:00 → 18/01/2026 ⏰ 12:00
```

**Horaires par défaut :**
- Arrivée : `17:00`
- Départ : `10:00`

## 🔄 Workflow

```
1. Client fait une demande
   ↓
2. Statut = 'en_attente'
   ↓
3. Gestionnaire voit la demande dans le dashboard
   ↓
4. Validation OU Refus
   ↓
5. Si validée:
   - heure_validee enregistrée
   - affichée sur toutes les vues réservations
   Si refusée:
   - raison_refus enregistrée
   - client peut être notifié (à implémenter)
```

## 🚀 Installation

1. **Exécuter le script SQL :**
   ```sql
   -- Dans l'éditeur SQL Supabase
   \i sql/create_demandes_horaires_table.sql
   ```

2. **Vérifier la table :**
   ```sql
   SELECT * FROM demandes_horaires;
   ```

3. **Les fichiers modifiés :**
   - `tabs/tab-dashboard.html` - Section demandes
   - `js/dashboard.js` - Fonctions validation/refus
   - `js/fiche-client-app.js` - Soumission demandes
   - `js/reservations.js` - Affichage horaires
   - `fiche-client.html` - Messages explicatifs

## 🎨 Design

- **Badge orange** : nombre de demandes en attente
- **Carte jaune** : bordure gauche orange pour visibilité
- **Boutons verts/rouges** : validation/refus clairs
- **Horaires en couleur** :
  - 🟢 Vert : heure arrivée
  - 🔴 Rouge : heure départ

## 📊 Statistiques possibles (future)

- Taux d'acceptation des demandes
- Horaires les plus demandés
- Gîte avec le plus de demandes flexibles
- Temps moyen de réponse aux demandes

## ⚙️ Configuration

Aucune configuration nécessaire. Le système utilise les horaires par défaut si aucune demande validée n'existe.

## 🔍 Debugging

```javascript
// Voir toutes les demandes
const { data } = await supabaseClient
    .from('demandes_horaires')
    .select('*');
console.log(data);

// Voir horaires d'une réservation
const { data: horaires } = await supabaseClient
    .from('demandes_horaires')
    .select('*')
    .eq('reservation_id', 123)
    .eq('statut', 'validee');
```

---

**Auteur :** GitHub Copilot  
**Date :** Janvier 2026  
**Version :** 1.0
