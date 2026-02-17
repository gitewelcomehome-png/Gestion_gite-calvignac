-- ================================================================
-- 🔧 AJOUT CHAMP author_role DANS cm_support_comments
-- ================================================================
-- Ce champ permet de différencier les messages admin des messages client
-- même si user_id est identique
-- ================================================================

-- Ajouter la colonne
ALTER TABLE cm_support_comments
ADD COLUMN IF NOT EXISTS author_role VARCHAR(20) DEFAULT 'client';

-- Créer un index pour performance
CREATE INDEX IF NOT EXISTS idx_comments_author_role 
ON cm_support_comments(author_role);

-- Commentaire
COMMENT ON COLUMN cm_support_comments.author_role IS 'Rôle de l''auteur: client, admin, system';

-- Note: Les futurs commentaires auront author_role correctement rempli par le code JavaScript
-- Les commentaires existants gardent 'client' par défaut

-- ================================================================
-- ✅ FIN DU SCRIPT
-- ================================================================
