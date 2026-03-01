# RGPD — Matrice de conservation (modèle opérationnel)

**Projet :** Gestion Gîte Calvignac / LiveOwnerUnit  
**Version :** 1.0.0  
**Date :** 22/02/2026  
**Objet :** fournir un modèle standard de durées de conservation, suppression et responsabilité.

---

## Mode d'emploi

- Compléter chaque ligne avec les durées réellement validées juridiquement.
- Référencer les politiques internes et obligations légales applicables.
- Conserver l'historique des changements de durées en fin de document.

---

## Matrice

| Catégorie de données | Exemple de champs | Finalité | Base légale | Durée active | Archivage | Suppression / anonymisation | Responsable |
|---|---|---|---|---|---|---|---|
| Comptes utilisateurs | email, user_id, rôles | authentification, accès | exécution contractuelle | durée du compte actif | 12 mois après clôture | suppression ou anonymisation irréversible en fin d'archivage | Référent produit + admin technique |
| Réservations | nom client, email, téléphone, dates séjour | gestion opérationnelle des séjours | exécution contractuelle | 36 mois après fin de séjour | 24 mois (historique minimisé) | anonymisation des données client, conservation agrégée | Référent exploitation |
| Support client | tickets, échanges, statuts | traitement demandes et incidents | intérêt légitime / contrat | 24 mois après clôture ticket | 12 mois | purge des contenus identifiants, conservation KPI agrégés | Équipe support |
| Logs sécurité | journaux erreur, événements auth, traces API | sécurité, détection incident, audit | intérêt légitime | 6 mois | 6 mois (incidents critiques uniquement) | purge automatique, conservation ciblée des preuves d'incident | Référent sécurité |
| Données financières | éléments facturation, historiques abonnements | obligations comptables et pilotage | obligation légale | 10 ans | non applicable (durée légale directe) | suppression à échéance légale + conservation des agrégats non personnels | Référent administratif |
| Données ménage/exploitation | planning, validations, signalements | exécution opérationnelle du service | exécution contractuelle | 24 mois | 12 mois | anonymisation des personnes, conservation des métriques opérationnelles | Référent exploitation |
| Contenu voyageur | FAQ, infos séjour, contenus diffusés | information des voyageurs | intérêt légitime / contrat | tant que publié | versions historisées internes (12 mois) | suppression des versions obsolètes, anonymisation si donnée perso incluse | Owner / gestionnaire gîte |

> Valeurs préremplies en base opérationnelle au 22/02/2026 ; validation juridique finale requise avant opposabilité.

---

## Contrôles périodiques

- Revue trimestrielle des durées et des volumes conservés.
- Vérification mensuelle de la suppression/anonymisation effective.
- Revue annuelle conjointe sécurité + conformité.

---

## Historique

- v1.1.0 (22/02/2026) : préremplissage opérationnel des durées et règles de suppression, en attente validation juridique.
- v1.0.0 (22/02/2026) : création du modèle de matrice de conservation.
