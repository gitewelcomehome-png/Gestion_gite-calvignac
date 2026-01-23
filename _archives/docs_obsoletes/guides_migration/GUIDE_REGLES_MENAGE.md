# 🎯 Système de Règles de Ménage Configurables

## Vue d'ensemble

Le système de règles de ménage permet aux utilisateurs de configurer les règles métier qui déterminent automatiquement quand et comment planifier les ménages entre les réservations.

## Structure

### Table `cleaning_rules`

```sql
- id: UUID (clé primaire)
- rule_code: VARCHAR(50) UNIQUE (identifiant de la règle)
- rule_name: VARCHAR(255) (nom affiché)
- description: TEXT (description détaillée)
- is_enabled: BOOLEAN (règle active/inactive)
- priority: INTEGER (ordre d'application, 1 = plus prioritaire)
- config: JSONB (configuration spécifique)
- created_at, updated_at: TIMESTAMP
```

### Fichiers JavaScript

1. **`js/cleaning-rules.js`**
   - Chargement et affichage des règles
   - Activation/désactivation des règles
   - Modification des règles
   - Récupération des règles actives pour le calcul

2. **`js/cleaning-rules-modal.js`**
   - Modal de gestion des règles
   - Interface utilisateur

## Règles par défaut

### 1. Ménage après-midi par défaut (Priorité 10)
- Code: `default_afternoon`
- Le ménage est programmé l'après-midi (12h) par défaut

### 2. Éviter les jours fériés (Priorité 20)
- Code: `avoid_holidays`
- Reporter le ménage au jour ouvrable suivant si c'est un jour férié (sauf enchainement)

### 3. Ménage obligatoire entre deux réservations (Priorité 5)
- Code: `mandatory_between_bookings`
- Un ménage doit toujours être effectué entre deux réservations consécutives

### 4. Reporter les dimanches au lundi (Priorité 30)
- Code: `sunday_postpone`
- Reporter le ménage au lundi si départ un dimanche (sauf enchainement)

### 5. Samedi: reporter si pas de réservation week-end (Priorité 35)
- Code: `saturday_conditional`
- Reporter au lundi si pas de réservation samedi/dimanche, sinon ménage le samedi

### 6. Mercredi/Jeudi: reporter au vendredi si possible (Priorité 40)
- Code: `midweek_conditional`
- Reporter au vendredi si pas de réservation avant, sinon jour même

### 7. Enchainement: ménage le jour même (Priorité 1)
- Code: `same_day_checkin`
- Si une nouvelle réservation commence le jour du départ, faire le ménage entre les deux

### 8. Matin si arrivée le jour même (Priorité 15)
- Code: `morning_if_same_day`
- Programmer le ménage le matin (7h) si une nouvelle réservation arrive le jour du ménage

### 9. Éviter les week-ends (Priorité 50, désactivée par défaut)
- Code: `avoid_weekends`
- Reporter le ménage en semaine si départ un week-end et pas d'enchainement

## Utilisation

### Accès à l'interface

1. Aller dans l'onglet "Planning Ménages"
2. Cliquer sur le bouton "🎯 Règles de Ménage"
3. Consulter, activer/désactiver ou modifier les règles

### Modifier une règle

1. Cliquer sur "✏️ Modifier" sur la règle souhaitée
2. Modifier le nom, la description ou la priorité
3. Activer/désactiver la règle
4. Cliquer sur "💾 Enregistrer"

### Activer/Désactiver une règle

- Cliquer sur le bouton "✓ Activer" ou "○ Désactiver" directement sur la carte de la règle

## Configuration JSON (config)

Chaque règle peut avoir une configuration JSON spécifique :

```json
{
  "default_time": "afternoon",
  "default_hour": "12h00",
  "postpone_if_holiday": true,
  "unless_same_day_checkin": true,
  "morning_if_checkin": true
}
```

## Ordre d'application

Les règles sont appliquées par ordre de **priorité croissante** :
- Priorité 1 = règle la plus importante
- Priorité 50 = règle la moins importante

## Installation

```bash
# Exécuter le script SQL
psql -U [user] -d [database] -f sql/create_cleaning_rules_table.sql
```

## Prochaines évolutions

- [ ] Intégration du système de règles dans le calcul automatique des ménages
- [ ] Ajout de règles personnalisées par l'utilisateur
- [ ] Historique des modifications de règles
- [ ] Export/import de configurations de règles
- [ ] Règles conditionnelles par gîte
