-- Adiciona a coluna updated_at se não existir em incomes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incomes' AND column_name='updated_at') THEN
        ALTER TABLE incomes ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END$$;

-- Adiciona a coluna updated_at se não existir em expenses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='updated_at') THEN
        ALTER TABLE expenses ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END$$;

-- Adiciona a coluna updated_at se não existir em budgets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budgets' AND column_name='updated_at') THEN
        ALTER TABLE budgets ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END$$;

-- Adiciona a coluna updated_at se não existir em credit_cards
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='credit_cards' AND column_name='updated_at') THEN
        ALTER TABLE credit_cards ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END$$; 