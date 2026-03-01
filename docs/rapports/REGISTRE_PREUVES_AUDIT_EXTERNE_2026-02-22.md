# Registre des preuves — Audit externe Sécurité & RGPD

**Date :** 22/02/2026  
**Périmètre :** pièces documentaires et preuves techniques référencées  
**Objectif :** fournir un index unique des preuves à remettre en audit externe.

---

## 1) Preuves gouvernance RGPD

| ID | Preuve | Emplacement | Statut |
|---|---|---|---|
| RGPD-01 | Dossier central conformité | `docs/rapports/RGPD_DOSSIER_CONFORMITE_CENTRAL.md` | ✅ disponible |
| RGPD-02 | Matrice de conservation | `docs/rapports/RGPD_MATRICE_CONSERVATION_MODELE.md` | ✅ disponible (validation juridique en attente) |
| RGPD-03 | Registre DSAR | `docs/rapports/RGPD_REGISTRE_DSAR_MODELE.md` | ✅ disponible (mise en service réelle en attente) |
| RGPD-04 | Checklist prête audit | `docs/rapports/RGPD_DOSSIER_CONFORMITE_CENTRAL.md` (section 13) | ✅ disponible |
| RGPD-05 | Synthèse GO/NO GO | `docs/rapports/RGPD_DOSSIER_CONFORMITE_CENTRAL.md` (section 14) | ✅ disponible |
| RGPD-06 | Registre DSAR opérationnel | `docs/rapports/RGPD_REGISTRE_DSAR_OPERATIONNEL_2026-02-24.md` | ✅ disponible |
| RGPD-07 | Registre sous-traitants DPA/SCC | `docs/rapports/RGPD_REGISTRE_SOUS_TRAITANTS_DPA_SCC_2026-02-24.md` | ✅ disponible |
| RGPD-08 | Fiche collecte informations légales | `docs/rapports/RGPD_COLLECTE_INFOS_LEGALES_2026-02-24.md` | ✅ disponible |
| RGPD-09 | Fiche validation juridique textes | `docs/rapports/RGPD_VALIDATION_JURIDIQUE_TEXTES_2026-02-24.md` | ✅ disponible |
| RGPD-10 | Registre annexes contractuelles | `docs/rapports/RGPD_ANNEXES_CONTRACTUELLES_2026-02-24.md` | ✅ disponible |
| RGPD-11 | Fiche gouvernance nominative | `docs/rapports/RGPD_GOUVERNANCE_NOMINATIVE_2026-02-24.md` | ✅ disponible |
| RGPD-12 | Notation d’avancement RGPD | `docs/rapports/RGPD_NOTATION_AVANCEMENT_2026-02-24.md` | ✅ disponible |

---

## 2) Preuves audit sécurité

| ID | Preuve | Emplacement | Statut |
|---|---|---|---|
| SEC-01 | Rapport d’audit sécurité/RGPD | `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md` | ✅ disponible |
| SEC-02 | Addendum réévaluation documentaire 22/02 | `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md` (section 8) | ✅ disponible |
| SEC-03 | Historique incidents critiques | `docs/architecture/ERREURS_CRITIQUES.md` | ✅ disponible |
| SEC-04 | Architecture / changelog sécurité | `docs/ARCHITECTURE.md` | ✅ disponible |

---

## 3) Pièces juridiques à fournir (hors repo code)

| ID | Pièce | Source attendue | Statut |
|---|---|---|---|
| LEG-01 | Politique de confidentialité publiée (version provisoire) | `privacy.html` | ⚠️ publié provisoire, validation juridique finale à faire |
| LEG-02 | Mentions légales publiées (version provisoire) | `legal.html` | ⚠️ publié provisoire, validation juridique finale à faire |
| LEG-03 | CGU/CGV publiées (version provisoire) | `cgu-cgv.html` | ⚠️ publié provisoire, version contractuelle signée à rattacher |
| LEG-04 | DPA/SCC Supabase | Service juridique / achats | ⚠️ à fournir |
| LEG-05 | DPA/SCC Vercel | Service juridique / achats | ⚠️ à fournir |
| LEG-06 | DPA/SCC OpenAI | Service juridique / achats | ⚠️ à fournir |

---

## 4) Décision d’audit

- **Interne :** GO
- **Externe :** NO GO conditionnel (dépend des clôtures juridiques LEG-01/LEG-02/LEG-03 et des pièces LEG-04 → LEG-06)

---

## 5) Historique

- v1.3.0 (24/02/2026) : ajout des preuves de clôture interne des 5 sujets externes (collecte légale, validation juridique, annexes contractuelles, gouvernance nominative, notation d’avancement).
- v1.1.0 (24/02/2026) : publication des pages juridiques minimales `privacy.html`/`legal.html` en version provisoire et ajustement du statut de décision externe.
- v1.2.0 (24/02/2026) : ajout des preuves opérationnelles `cgu-cgv.html`, registre DSAR opérationnel et registre sous-traitants DPA/SCC.
- v1.0.0 (22/02/2026) : création du registre des preuves audit externe.
