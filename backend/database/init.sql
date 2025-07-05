CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    account_id INTEGER,
    credit_card_id INTEGER,
    installment_number INTEGER DEFAULT 1,
    installment_total INTEGER DEFAULT 1,
    description VARCHAR(255) NOT NULL,
    value DECIMAL(14,2) NOT NULL,
    due_date DATE NOT NULL,
    category VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pendente',
    is_recurring BOOLEAN DEFAULT FALSE,
    auto_debit BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 