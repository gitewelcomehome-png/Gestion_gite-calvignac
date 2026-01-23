-- ================================================================
-- Vérifier les templates de checklist
-- ================================================================

-- 1. Lister tous les gîtes
SELECT id, name, slug FROM gites ORDER BY name;

-- 2. Compter les templates par gîte
SELECT 
    g.name as gite_name,
    ct.type,
    COUNT(*) as nombre_templates
FROM gites g
LEFT JOIN checklist_templates ct ON g.id = ct.gite_id
GROUP BY g.name, ct.type
ORDER BY g.name, ct.type;

-- 3. Détails des templates existants
SELECT 
    g.name as gite_name,
    ct.type,
    ct.ordre,
    ct.texte,
    ct.actif
FROM gites g
LEFT JOIN checklist_templates ct ON g.id = ct.gite_id
ORDER BY g.name, ct.type, ct.ordre;
