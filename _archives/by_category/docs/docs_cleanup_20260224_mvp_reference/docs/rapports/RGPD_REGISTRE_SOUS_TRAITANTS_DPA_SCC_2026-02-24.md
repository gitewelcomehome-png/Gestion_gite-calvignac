# RGPD — Registre sous-traitants & DPA/SCC

**Projet :** Gestion Gîte Calvignac / LiveOwnerUnit  
**Version :** 1.1.0  
**Date :** 24/02/2026  
**Objet :** centraliser l’état des pièces contractuelles sous-traitants (DPA, SCC, localisation, mesures associées).

---

## 1) Registre des sous-traitants

| ID | Sous-traitant | Service rendu | Données concernées | Localisation | DPA | SCC/Transfert | Date de vérification | Responsable | Statut |
|---|---|---|---|---|---|---|---|---|---|
| ST-01 | Supabase | Base de données, auth, stockage | comptes, réservations, support | À confirmer | À rattacher | À rattacher | 24/02/2026 | Référent conformité interne | ⚠️ incomplet |
| ST-02 | Vercel | Hébergement applicatif/serverless | logs techniques, données applicatives | À confirmer | À rattacher | À rattacher | 24/02/2026 | Référent conformité interne | ⚠️ incomplet |
| ST-03 | OpenAI | Fonctionnalités IA (via backend) | prompts support, contenus techniques | À confirmer | À rattacher | À rattacher | 24/02/2026 | Référent conformité interne | ⚠️ incomplet |

---

## 2) Pièces attendues

- Contrat de sous-traitance / DPA signé
- Clauses SCC (si transfert hors UE)
- Description des mesures techniques et organisationnelles
- Localisation des données (primaire + backups)
- Contact sécurité/compliance du fournisseur

---

## 3) Règle de mise à jour

- Mettre à jour ce registre à chaque ajout/changement de fournisseur.
- Archiver la date de vérification et la source interne/externe de la preuve.
- Reporter les écarts dans le dossier central RGPD.
- Compléter en parallèle `docs/rapports/RGPD_ANNEXES_CONTRACTUELLES_2026-02-24.md` pour le rattachement des pièces signées.

---

## 4) Historique

- v1.1.0 (24/02/2026) : alignement avec le registre d’annexes contractuelles et le pilotage de clôture.
- v1.0.0 (24/02/2026) : création du registre opérationnel sous-traitants/DPA/SCC.
