-- ============================================================================
-- PATCHES À APPLIQUER AU CODE JAVASCRIPT - 23 JANVIER 2026
-- ============================================================================
-- Ces modifications suppriment les appels aux 4 tables obsolètes supprimées
-- Tables concernées: retours_menage, demandes_horaires, problemes_signales, suivi_soldes_bancaires
--
-- STATISTIQUES:
--   - 26 références trouvées dans 4 fichiers
--   - dashboard.js: 12 références
--   - widget-horaires-clients.js: 1 référence
--   - fiches-clients.js: 5 références
--   - fiscalite-v2.js: 8 références
--
-- ============================================================================

/*
FICHIER: js/dashboard.js
MODIFICATIONS: 8 fonctions à désactiver

1. Dans updateDashboardAlerts() - Ligne ~133
   Commenter le bloc de chargement retours_menage

2. Dans afficherStatistiques() - Ligne ~1365
   Remplacer le chargement suivi_soldes_bancaires par: tresorerieEl.textContent = '-';

3. Dans afficherGraphiqueTresorerieDashboard() - Ligne ~1514
   Remplacer le chargement suivi_soldes_bancaires par: const soldes = null;

4. Fonction updateDemandesClients() - Ligne ~1648
   Ajouter en première ligne: return; // Table demandes_horaires supprimée

5. Fonction validerDemandeHoraire() - Ligne ~1740
   Ajouter en première ligne: return; // Table demandes_horaires supprimée

6. Fonction refuserDemandeHoraire() - Ligne ~1787
   Ajouter en première ligne: return; // Table demandes_horaires supprimée

7. Fonction updateProblemesClients() - Ligne ~1814
   Ajouter en première ligne: return; // Table problemes_signales supprimée

8. Fonction traiterProbleme() - Ligne ~2010
   Ajouter en première ligne: return; // Table problemes_signales supprimée

9. Fonction supprimerProbleme() - Ligne ~2029
   Ajouter en première ligne: return; // Table problemes_signales supprimée

10. Fonction afficherDetailsRetourMenage() - Ligne ~2271
    Ajouter en première ligne: return; // Table retours_menage supprimée

11. Fonction fermerEtValiderRetourMenage() - Ligne ~2351
    Ajouter en première ligne: return; // Table retours_menage supprimée

---

FICHIER: js/widget-horaires-clients.js
MODIFICATIONS: 1 fonction

1. Fonction afficherHorairesClients() - Ligne ~12
   Ajouter après la vérification du container:
   return; // Table demandes_horaires supprimée

---

FICHIER: js/fiches-clients.js
MODIFICATIONS: 5 fonctions

1. Fonction loadFichesStats() - Ligne ~105
   Commenter le bloc de comptage demandes_horaires
   Mettre: nbDemandes = 0;

2. Fonction loadFichesClientList() - Ligne ~144
   Retirer la jointure: demandes:demandes_horaires(id, status),
   Mettre: demandes:[]

3. Fonction loadDemandesHoraires() - Ligne ~403
   Ajouter en première ligne: return; // Table demandes_horaires supprimée

4. Fonction approuverDemande() - Ligne ~507
   Ajouter en première ligne: return; // Table demandes_horaires supprimée

5. Fonction refuserDemande() - Ligne ~578
   Ajouter en première ligne: return; // Table demandes_horaires supprimée

---

FICHIER: js/fiscalite-v2.js
MODIFICATIONS: 2 fonctions

1. Fonction chargerSoldesBancaires() - Ligne ~2830
   Ajouter après vérification année:
   return; // Table suivi_soldes_bancaires supprimée

2. Fonction sauvegarderSoldesBancaires() - Ligne ~2895
   Ajouter après vérification données:
   return; // Table suivi_soldes_bancaires supprimée

============================================================================
RÉSULTAT ATTENDU:
   ✅ Aucune erreur 404 en console
   ✅ Dashboard charge normalement (sans features obsolètes)
   ✅ Onglet Fiscalité fonctionne (sans suivi soldes)
   ✅ Page fiches clients accessible (sans demandes horaires)
============================================================================
*/
