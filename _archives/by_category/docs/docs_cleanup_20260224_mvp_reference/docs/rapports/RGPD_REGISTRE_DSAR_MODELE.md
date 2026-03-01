# RGPD — Registre DSAR (modèle opérationnel)

**Projet :** Gestion Gîte Calvignac / LiveOwnerUnit  
**Version :** 1.0.0  
**Date :** 22/02/2026  
**Objet :** tracer de façon standard les demandes d'exercice des droits RGPD.

---

## Procédure minimale

1. Réception de la demande (canal, date, identité déclarée) via support client ou canal dédié
2. Vérification d'identité (niveau de preuve adapté)
3. Qualification du droit exercé
4. Analyse de faisabilité et périmètre des données
5. Réponse formelle dans les délais légaux
6. Clôture et archivage de la preuve de traitement

**Canaux opérationnels actuels (22/02/2026)**
- Support client : `pages/client-support.html`
- Back-office support : `pages/admin-support.html`
- Adresse RGPD dédiée : à ouvrir et référencer dans le dossier central

---

## Registre des demandes

| ID DSAR | Date réception | Identité demandeur | Droit exercé | Canal | Statut | Date limite réponse | Date réponse | Décision | Responsable | Preuve |
|---|---|---|---|---|---|---|---|---|---|---|
| DSAR-2026-0001 | 2026-02-22 | Exemple interne (données masquées) | accès | ticket support | clôturé | 2026-03-22 | 2026-02-28 | Acceptée (exécution complète) | Référent support | Journal ticket + export de réponse |
| DSAR-2026-0002 | 2026-02-22 | Exemple interne (données masquées) | effacement | ticket support | en cours | 2026-03-22 | - | Analyse en cours | Référent conformité | Trace de vérification d'identité |

> Les lignes ci-dessus sont des exemples de format ; remplacer par les demandes réelles dès la première réception DSAR.

---

## Motifs standards de décision

- Acceptée (exécution complète)
- Partiellement acceptée (justification)
- Refusée (motif juridique documenté)
- Prolongation délai (motif + notification)

---

## KPI de pilotage DSAR

- Nombre de demandes reçues (mensuel)
- Délai moyen de réponse
- Taux de réponses dans le délai cible
- Typologie des droits exercés

---

## Historique

- v1.1.0 (22/02/2026) : préremplissage opérationnel (canaux et exemples) pour mise en service rapide.
- v1.0.0 (22/02/2026) : création du modèle de registre DSAR.
