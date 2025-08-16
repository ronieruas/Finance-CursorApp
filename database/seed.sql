-- Dados iniciais para o sistema financeiro

-- Usuários padrão
INSERT INTO users (name, email, password, role) VALUES
  ('Admin', 'admin@admin.com', '$2b$10$hashdeexemplo', 'admin'),
  ('Default User', 'user@example.com', '$2a$10$hashdeexemplo', 'user')
ON CONFLICT (email) DO NOTHING;

-- Contas exemplo
INSERT INTO accounts (user_id, name, bank, type, balance, currency, status) VALUES
  (1, 'Conta Corrente', 'Banco Exemplo', 'corrente', 1000.00, 'BRL', 'ativa'),
  (1, 'Poupança', 'Banco Exemplo', 'poupanca', 5000.00, 'BRL', 'ativa')
ON CONFLICT DO NOTHING;

-- Categorias de receitas
INSERT INTO incomes (user_id, account_id, description, value, date, category) VALUES
  (1, 1, 'Salário', 3000.00, CURRENT_DATE, 'Salário'),
  (1, 1, 'Freelance', 800.00, CURRENT_DATE, 'Freelance')
ON CONFLICT DO NOTHING;

-- Categorias de despesas
INSERT INTO expenses (user_id, account_id, description, value, due_date, category, status) VALUES
  (1, 1, 'Aluguel', 1200.00, CURRENT_DATE + INTERVAL '5 days', 'Moradia', 'pendente'),
  (1, 1, 'Internet', 100.00, CURRENT_DATE + INTERVAL '2 days', 'Utilidades', 'pendente')
ON CONFLICT DO NOTHING;

-- Cartão de crédito exemplo
INSERT INTO credit_cards (user_id, bank, brand, limit_value, due_day, closing_day, name, status) VALUES
  (1, 'Banco Exemplo', 'Visa', 5000.00, 10, 1, 'Cartão Principal', 'ativa')
ON CONFLICT DO NOTHING;

-- Orçamento exemplo
INSERT INTO budgets (user_id, name, type, period_start, period_end, planned_value) VALUES
  (1, 'Orçamento Mensal', 'geral', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 4000.00)
ON CONFLICT DO NOTHING;