-- ================================================================
-- 📝 TABLE CONTENU GÉNÉRÉ PAR IA
-- ================================================================

CREATE TABLE IF NOT EXISTS cm_content_generated (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('post', 'email', 'blog', 'newsletter')),
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    tone VARCHAR(50),
    statut VARCHAR(50) DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'publie', 'planifie')),
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_content_type ON cm_content_generated(type);
CREATE INDEX IF NOT EXISTS idx_content_statut ON cm_content_generated(statut);
CREATE INDEX IF NOT EXISTS idx_content_created ON cm_content_generated(created_at DESC);

-- ================================================================
-- ✅ TABLE CRÉÉE
-- ================================================================
