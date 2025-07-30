-- Verificar estrutura da tabela transfers
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transfers' 
ORDER BY ordinal_position; 