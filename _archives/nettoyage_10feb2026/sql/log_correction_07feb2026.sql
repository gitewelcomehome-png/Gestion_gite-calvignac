-- ===============================================
-- 🔧 ENREGISTREMENT DES CORRECTIONS - 07/02/2026
-- Script d'enregistrement des corrections dans la BDD
-- ===============================================

-- PRÉREQUIS: La table cm_error_corrections doit exister
-- Si erreur "table not found", exécuter d'abord: create_error_corrections_table.sql

-- Insérer la correction pour l'erreur SecurityUtils.escapeHTML dans js/menage.js
-- Note: error_id NULL car l'erreur peut ne pas être dans cm_error_logs
INSERT INTO cm_error_corrections (
    error_id,
    file_path,
    old_code,
    new_code,
    description,
    applied_at
) VALUES (
    NULL,
    'js/menage.js',
    'window.SecurityUtils.escapeHTML',
    'window.SecurityUtils.sanitizeText',
    'Remplacement de escapeHTML par sanitizeText - Correction TypeError: window.SecurityUtils.escapeHTML is not a function. La méthode correcte est sanitizeText pour échapper le HTML. 2 occurrences corrigées (lignes 934 et 952).',
    NOW()
);

-- Insérer la correction préventive dans js/femme-menage.js
INSERT INTO cm_error_corrections (
    error_id,
    file_path,
    old_code,
    new_code,
    description,
    applied_at
) VALUES (
    NULL,
    'js/femme-menage.js',
    'window.SecurityUtils.escapeHTML',
    'window.SecurityUtils.sanitizeText',
    'Correction préventive: même erreur potentielle détectée dans femme-menage.js. 2 occurrences corrigées (lignes 680 et 691) pour éviter la même erreur TypeError.',
    NOW()
);

-- Mettre à jour le statut des erreurs correspondantes si elles existent
UPDATE cm_error_logs 
SET 
    resolved = true,
    resolved_at = NOW()
WHERE message LIKE '%SecurityUtils.escapeHTML%'
  AND resolved = false;

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Corrections enregistrées avec succès';
    RAISE NOTICE '✅ Erreurs correspondantes marquées comme résolues';
    RAISE NOTICE '';
    RAISE NOTICE '📝 FICHIERS CORRIGÉS:';
    RAISE NOTICE '   ✓ js/menage.js - 2 occurrences:';
    RAISE NOTICE '      - Ligne 934: giteName';
    RAISE NOTICE '      - Ligne 952: retour.commentaires';
    RAISE NOTICE '   ✓ js/femme-menage.js - 2 occurrences (correction préventive):';
    RAISE NOTICE '      - Ligne 680: giteName';
    RAISE NOTICE '      - Ligne 691: retour.commentaires';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 TOTAL: 4 occurrences corrigées dans 2 fichiers';
    RAISE NOTICE '✅ Toutes les références à SecurityUtils.escapeHTML ont été remplacées par sanitizeText';
END $$;
