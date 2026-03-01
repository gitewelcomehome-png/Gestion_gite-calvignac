# Plan d’action non-prod — Sécurité & RGPD (22/02/2026)

**Périmètre :** documentation, gouvernance, traçabilité (zéro modification runtime)  
**Objectif :** accélérer le passage de 77/100 sécurité consolidée et 74/100 RGPD vers un niveau “audit externe prêt”.

---

## 1) Cibles et critères de fin

- **Cible RGPD court terme :** 80+/100
- **Cible sécurité consolidée court terme :** 78+/100
- **Critère de fin principal :** fermeture des 5 points ⚠️ du dossier central RGPD.

---

## 2) Backlog priorisé (documentaire uniquement)

| Priorité | Action | Livrable attendu | Dépendance |
|---|---|---|---|
| P0 | Publier les pages juridiques validées (confidentialité, mentions) | Références publiques stables + version interne archivée | Validation juridique |
| P0 | Raccorder CGU/CGV contractuelles | Annexe contractuelle ajoutée au dossier central | Validation juridique |
| P0 | Centraliser DPA/SCC fournisseurs | Dossier fournisseurs (Supabase/Vercel/OpenAI) référencé | Juridique + achats |
| P1 | Nommer le responsable de traitement et le contact DSAR dédié | Identité nominative intégrée au dossier central | Gouvernance interne |
| P1 | Finaliser juridiquement la matrice de conservation | Durées et bases légales validées ligne par ligne | Juridique |
| P2 | Mettre en service le registre DSAR réel | 1er registre opérationnel avec statut et SLA | Support + conformité |

---

## 3) Plan d’exécution 15 jours (sans impact prod)

### Jours 1–3
- figer la version juridique de la politique confidentialité et des mentions légales ;
- préparer les références de publication à injecter dans le dossier central.

### Jours 4–7
- intégrer les CGU/CGV signées en annexe ;
- consolider DPA/SCC des sous-traitants identifiés ;
- compléter le bloc gouvernance (responsable traitement + contact DSAR).

### Jours 8–12
- valider juridiquement les durées de conservation ;
- convertir le registre DSAR modèle en registre réel exploitable.

### Jours 13–15
- contrôle croisé final (dossier RGPD ↔ audit ↔ architecture) ;
- émission d’une synthèse “GO/NO GO externe” mise à jour.

---

## 4) KPI de pilotage non-prod

- **KPI-1** : % des pièces juridiques obligatoires rattachées (objectif 100%)
- **KPI-2** : % des lignes matrice conservation validées juridiquement (objectif 100%)
- **KPI-3** : % des demandes DSAR tracées dans le registre (objectif 100% des demandes reçues)
- **KPI-4** : nombre de points ⚠️ ouverts en checklist prête audit (objectif 0)

---

## 5) Sorties attendues

1. Dossier RGPD central en statut “prêt audit externe”.
2. Cohérence complète entre :
   - `docs/rapports/RGPD_DOSSIER_CONFORMITE_CENTRAL.md`
   - `docs/rapports/AUDIT_SECURITE_RGPD_2026-02-21.md`
   - `docs/ARCHITECTURE.md`
3. Justificatifs documentaires exploitables sans modification applicative.
