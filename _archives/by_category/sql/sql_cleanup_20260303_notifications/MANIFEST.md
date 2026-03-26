# Archive SQL - Nettoyage notifications (2026-03-03)

## Contexte
Nettoyage demandé pour intégrer les derniers SQL utiles au socle global et archiver les scripts one-shot/redondants.

## Fichiers archivés

- `insert_notification_preferences_owner.sql`
  - **Raison**: script one-shot avec user_id/email spécifiques (non canonique pour socle global).

- `diagnostic_triggers_notifications.sql`
  - **Raison**: script de diagnostic ponctuel avec payload de test et secret webhook en clair.

- `add_notify_retour_client.sql`
  - **Raison**: redondant avec la configuration consolidée de `email_notifications_webhooks.sql` (trigger retour client déjà présent).

## Remarques

- Les scripts structurels récents ont été intégrés dans le rebuild global:
  - `sql/create_communaute_artisans.sql`
  - `sql/migrations/ADD_NOTIFICATION_MENAGE_COMPANY_FIELDS_2026-03-03.sql`

- Script conservé hors archive:
  - `sql/add_notify_taches_menage.sql` (utile pour webhook tâches ménage/todos, non couvert par le rebuild canonique actuel).
