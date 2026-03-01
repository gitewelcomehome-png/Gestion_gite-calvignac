-- ================================================================
-- TABLE linen_stock_transactions
-- Wrapper racine maintenu pour exécution simple en prod/préprod
-- ================================================================

CREATE TABLE IF NOT EXISTS public.linen_stock_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reservation_id UUID NOT NULL,
    gite_id UUID NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_user_id, reservation_id)
);

CREATE INDEX IF NOT EXISTS idx_linen_stock_transactions_owner
    ON public.linen_stock_transactions(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_linen_stock_transactions_reservation
    ON public.linen_stock_transactions(reservation_id);

ALTER TABLE public.linen_stock_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.linen_stock_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.linen_stock_transactions;

CREATE POLICY "Users can view own transactions"
    ON public.linen_stock_transactions
    FOR SELECT
    USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can insert own transactions"
    ON public.linen_stock_transactions
    FOR INSERT
    WITH CHECK (auth.uid() = owner_user_id);
