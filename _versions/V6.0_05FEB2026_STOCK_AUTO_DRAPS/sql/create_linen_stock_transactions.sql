-- Table pour tracker les réservations dont le stock a déjà été décrémenté
-- Cela évite de décrémenter plusieurs fois le même stock

CREATE TABLE IF NOT EXISTS linen_stock_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL,
    gite_id UUID NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_user_id, reservation_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_linen_stock_transactions_owner 
    ON linen_stock_transactions(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_linen_stock_transactions_reservation 
    ON linen_stock_transactions(reservation_id);

-- RLS (Row Level Security)
ALTER TABLE linen_stock_transactions ENABLE ROW LEVEL SECURITY;

-- Politique : les utilisateurs peuvent voir leurs propres transactions
CREATE POLICY "Users can view own transactions" 
    ON linen_stock_transactions
    FOR SELECT
    USING (auth.uid() = owner_user_id);

-- Politique : les utilisateurs peuvent insérer leurs propres transactions
CREATE POLICY "Users can insert own transactions" 
    ON linen_stock_transactions
    FOR INSERT
    WITH CHECK (auth.uid() = owner_user_id);

-- Commentaire
COMMENT ON TABLE linen_stock_transactions IS 
    'Track les réservations pour lesquelles le stock de linge a été automatiquement décrémenté après la sortie';
