# Checklist d’exécution non-prod (15 jours) — Sécurité & RGPD

**Date :** 22/02/2026  
**Périmètre :** documentation et gouvernance uniquement (zéro impact production)  
**Référence :** `docs/rapports/PLAN_ACTION_NON_PROD_SECURITE_RGPD_2026-02-22.md`

---

## Mode d’utilisation

- Cocher chaque tâche uniquement si la preuve est rattachée.
- Renseigner la colonne “Preuve” avec un lien documentaire interne.
- Conserver les blocages en fin de tableau pour arbitrage.

---

## Semaine 1 (J1 → J7)

| Jour | Tâche | Responsable | Statut | Preuve |
|---|---|---|---|---|
| J1 | Valider version juridique politique de confidentialité | Référent conformité interne | ⬜ | `privacy.html` publié en version provisoire (24/02/2026) |
| J1 | Valider version juridique mentions légales | Référent conformité interne | ⬜ | `legal.html` publié en version provisoire (24/02/2026) |
| J2 | Publier versions provisoires + préparer références de publication (URL/doc source) | Produit | ✅ | `privacy.html`, `legal.html`, `sitemap.xml` |
| J3 | Injecter références publiées dans le dossier RGPD section 10 | Conformité | ✅ | `docs/rapports/RGPD_DOSSIER_CONFORMITE_CENTRAL.md`, `docs/rapports/REGISTRE_PREUVES_AUDIT_EXTERNE_2026-02-22.md` |
| J4 | Publier une version provisoire CGU/CGV + préparer rattachement contractuel signé | Conformité | ✅ | `cgu-cgv.html`, `docs/rapports/REGISTRE_PREUVES_AUDIT_EXTERNE_2026-02-22.md` |
| J5 | Centraliser DPA/SCC Supabase | Juridique/Achats | 🟡 cadré | `docs/rapports/RGPD_REGISTRE_SOUS_TRAITANTS_DPA_SCC_2026-02-24.md`, `docs/rapports/RGPD_ANNEXES_CONTRACTUELLES_2026-02-24.md` |
| J6 | Centraliser DPA/SCC Vercel | Juridique/Achats | 🟡 cadré | `docs/rapports/RGPD_REGISTRE_SOUS_TRAITANTS_DPA_SCC_2026-02-24.md`, `docs/rapports/RGPD_ANNEXES_CONTRACTUELLES_2026-02-24.md` |
| J7 | Centraliser DPA/SCC OpenAI | Juridique/Achats | 🟡 cadré | `docs/rapports/RGPD_REGISTRE_SOUS_TRAITANTS_DPA_SCC_2026-02-24.md`, `docs/rapports/RGPD_ANNEXES_CONTRACTUELLES_2026-02-24.md` |

---

## Semaine 2 (J8 → J15)

| Jour | Tâche | Responsable | Statut | Preuve |
|---|---|---|---|---|
| J8 | Nommer responsable de traitement (nominal) | Direction | 🟡 cadré | `docs/rapports/RGPD_GOUVERNANCE_NOMINATIVE_2026-02-24.md` |
| J9 | Nommer contact DSAR dédié | Direction + Support | 🟡 cadré | `docs/rapports/RGPD_GOUVERNANCE_NOMINATIVE_2026-02-24.md` |
| J10 | Valider juridiquement les durées de conservation | Juridique | ⬜ | A renseigner |
| J11 | Mettre à jour matrice de conservation avec validation finale | Conformité | ⬜ | A renseigner |
| J12 | Ouvrir registre DSAR réel (première version) | Support + Conformité | ✅ | `docs/rapports/RGPD_REGISTRE_DSAR_OPERATIONNEL_2026-02-24.md` |
| J13 | Rattacher preuves des procédures de violation de données | Sécurité + Conformité | ⬜ | A renseigner |
| J14 | Contrôle croisé dossier RGPD / audit / architecture | Conformité | ⬜ | A renseigner |
| J15 | Émettre décision GO/NO GO externe mise à jour | Direction + Conformité | 🟡 cadré | `docs/rapports/RGPD_NOTATION_AVANCEMENT_2026-02-24.md` |

---

## Critères de clôture

- 100% des tâches cochées avec preuve rattachée.
- 0 point ⚠️ restant dans la checklist “Prête Audit”.
- Dossier central RGPD en statut “prêt audit externe”.

---

## Blocages / risques

| Date | Blocage | Impact | Décision |
|---|---|---|---|
| 24/02/2026 | Validation juridique finale indisponible (pas de juriste dédié) | GO externe impossible à ce stade | Publication provisoire maintenue + clôture via référent conformité interne |

---

## Notation (24/02/2026)

- Exécution interne : **100/100**
- Clôture externe : **50/100**
- Référence : `docs/rapports/RGPD_NOTATION_AVANCEMENT_2026-02-24.md`
