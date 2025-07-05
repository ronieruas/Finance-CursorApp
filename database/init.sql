-- Criação das tabelas principais para o sistema financeiro

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    bank VARCHAR(100),
    type VARCHAR(30) NOT NULL, -- corrente, poupanca, investimento
    balance NUMERIC(14,2) DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    status VARCHAR(20) DEFAULT 'ativa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incomes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    account_id INTEGER REFERENCES accounts(id),
    description VARCHAR(255) NOT NULL,
    value NUMERIC(14,2) NOT NULL,
    date DATE NOT NULL,
    category VARCHAR(50),
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    account_id INTEGER REFERENCES accounts(id),
    description VARCHAR(255) NOT NULL,
    value NUMERIC(14,2) NOT NULL,
    due_date DATE NOT NULL,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pendente', -- paga, pendente, atrasada
    is_recurring BOOLEAN DEFAULT FALSE,
    auto_debit BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    bank VARCHAR(100),
    brand VARCHAR(30),
    limit_value NUMERIC(14,2) NOT NULL,
    due_day INTEGER NOT NULL,
    closing_day INTEGER NOT NULL,
    name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ativa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_card_transactions (
    id SERIAL PRIMARY KEY,
    card_id INTEGER REFERENCES credit_cards(id),
    user_id INTEGER REFERENCES users(id),
    description VARCHAR(255) NOT NULL,
    value NUMERIC(14,2) NOT NULL,
    date DATE NOT NULL,
    category VARCHAR(50),
    installment_number INTEGER DEFAULT 1,
    installment_total INTEGER DEFAULT 1,
    family_member VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL, -- geral, cartao
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    planned_value NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 