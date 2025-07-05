INSERT INTO expenses (user_id, credit_card_id, description, value, due_date, category, status, is_recurring, auto_debit, paid_at, installment_number, installment_total)
VALUES (1, 1, 'Compra parcelada (1/3)', 100.00, '2024-06-10', 'Compras', 'pendente', false, false, null, 1, 3),
       (1, 1, 'Compra parcelada (2/3)', 100.00, '2024-07-10', 'Compras', 'pendente', false, false, null, 2, 3),
       (1, 1, 'Compra parcelada (3/3)', 100.00, '2024-08-10', 'Compras', 'pendente', false, false, null, 3, 3),
       (1, 1, 'Compra à vista', 150.00, '2024-06-15', 'Alimentação', 'pendente', false, false, null, 1, 1); 