-- Script para corrigir a estrutura da tabela transfers
-- Permitir NULL no campo from_account_id

-- Verificar se a coluna existe e se permite NULL
DO $$
BEGIN
    -- Verificar se a coluna from_account_id existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transfers' 
        AND column_name = 'from_account_id'
    ) THEN
        -- Alterar a coluna para permitir NULL
        ALTER TABLE transfers ALTER COLUMN from_account_id DROP NOT NULL;
        RAISE NOTICE 'Coluna from_account_id alterada para permitir NULL';
    ELSE
        RAISE NOTICE 'Coluna from_account_id não encontrada';
    END IF;
END $$; 