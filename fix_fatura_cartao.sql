-- ============================================================================
--  Correcao de cobranca indevida em faturas de cartao de credito
-- ----------------------------------------------------------------------------
--  Causa: os endpoints getBill/pay incluiam, indevidamente (clausula OR), as
--  compras feitas EXATAMENTE no dia do vencimento da fatura
--  (due_date = vencimento), quando elas pertencem a fatura SEGUINTE.
--
--  Este script:
--    1) Detecta automaticamente todos os pagamentos afetados (por cartao);
--    2) Reduz o valor de cada pagamento (remove o valor cobrado a mais);
--    3) Estorna o valor na conta debitada;
--    4) Reverte as despesas indevidas para 'pendente' (paid_at = NULL);
--    5) Registra log de auditoria em financial_audit_logs.
--
--  A deteccao NAO usa heuristica de data: para cada pagamento ela escolhe a
--  fatura cujo periodo de fechamento cobre a MAIORIA das despesas realmente
--  cobradas. Assim funciona tambem quando a fatura e paga alguns dias antes
--  do vencimento.
--
--  O script e IDEMPOTENTE: pode ser executado mais de uma vez sem efeito
--  duplicado (apos a correcao, a deteccao passa a retornar 0 linhas).
--
--  IMPORTANTE: faca backup antes.
--     pg_dump -U finance -h <host> finance > backup_antes.sql
--
--  Uso:
--     psql -U finance -h <host> -d finance -f fix_fatura_cartao.sql
-- ============================================================================

\echo '== Relatorio ANTES da correcao =='

BEGIN;

-- ---- Deteccao ---------------------------------------------------------------

-- Toda despesa de cartao realmente cobrada (status 'paga') e por qual pagamento
CREATE TEMP TABLE tmp_charged ON COMMIT DROP AS
SELECT
  p.id      AS payment_id,
  p.card_id,
  p.account_id,
  p.user_id,
  p.payment_date,
  p.value   AS payment_value,
  e.id      AS expense_id,
  e.due_date,
  e.value   AS expense_value
FROM credit_card_payments p
JOIN expenses e
  ON e.credit_card_id = p.card_id
 AND e.status = 'paga'
 AND (e.paid_at AT TIME ZONE 'America/Sao_Paulo')::date = p.payment_date;

-- Datas de vencimento mensais (ancoras) de cada cartao
CREATE TEMP TABLE tmp_anchors ON COMMIT DROP AS
SELECT
  c.id          AS card_id,
  c.bank,
  c.due_day,
  c.closing_day,
  (date_trunc('month', gs.m) + ((c.due_day - 1) || ' days')::interval)::date AS venc
FROM credit_cards c
CROSS JOIN LATERAL generate_series(
  date_trunc('month', (SELECT min(payment_date) FROM credit_card_payments WHERE card_id = c.id)) - INTERVAL '3 months',
  date_trunc('month', (SELECT max(payment_date) FROM credit_card_payments WHERE card_id = c.id)) + INTERVAL '1 month',
  INTERVAL '1 month'
) AS gs(m);

-- Periodo [inicio, fim] de cada fatura (replica getBillPeriodForMonth do backend)
CREATE TEMP TABLE tmp_periods ON COMMIT DROP AS
SELECT
  card_id,
  venc,
  CASE WHEN closing_day > due_day
    THEN (date_trunc('month', venc) - INTERVAL '2 months' + ((closing_day - 1) || ' days')::interval)::date
    ELSE (date_trunc('month', venc) - INTERVAL '1 month' + ((closing_day - 1) || ' days')::interval)::date
  END AS p_start,
  CASE WHEN closing_day > due_day
    THEN (date_trunc('month', venc) - INTERVAL '1 month' + ((closing_day - 2) || ' days')::interval)::date
    ELSE (date_trunc('month', venc) + ((closing_day - 2) || ' days')::interval)::date
  END AS p_end
FROM tmp_anchors;

-- Fatura de cada pagamento = a que cobre o maior numero de despesas cobradas
CREATE TEMP TABLE tmp_chosen ON COMMIT DROP AS
SELECT DISTINCT ON (x.payment_id) x.payment_id, x.venc
FROM (
  SELECT ch.payment_id,
         per.venc,
         count(*) AS inside,
         abs(per.venc - ch.payment_date) AS dist
  FROM tmp_charged ch
  JOIN tmp_periods per
    ON per.card_id = ch.card_id
   AND ch.due_date BETWEEN per.p_start AND per.p_end
  GROUP BY ch.payment_id, per.venc, ch.payment_date
) x
ORDER BY x.payment_id, x.inside DESC, x.dist ASC;

-- Despesas indevidas: due_date == vencimento da fatura paga
CREATE TEMP TABLE tmp_afetados ON COMMIT DROP AS
SELECT
  ch.payment_id, ch.card_id, ch.account_id, ch.user_id,
  ch.payment_date, ch.payment_value, ch.expense_id, ch.expense_value,
  k.venc
FROM tmp_charged ch
JOIN tmp_chosen k ON k.payment_id = ch.payment_id
WHERE ch.due_date = k.venc;

-- Totais por pagamento
CREATE TEMP TABLE tmp_totais ON COMMIT DROP AS
SELECT payment_id, account_id, user_id,
       count(*)           AS qtd,
       sum(expense_value) AS valor_indevido
FROM tmp_afetados
GROUP BY payment_id, account_id, user_id;

-- Relatorio
SELECT
  t.payment_id,
  cc.bank AS cartao,
  pa.payment_date AS data_pagamento,
  a.venc AS vencimento_fatura,
  pa.value AS valor_atual,
  t.valor_indevido AS valor_cobrado_a_mais,
  pa.value - t.valor_indevido AS valor_correto,
  t.qtd AS qtd_despesas
FROM tmp_totais t
JOIN credit_card_payments pa ON pa.id = t.payment_id
JOIN credit_cards cc ON cc.id = pa.card_id
JOIN tmp_chosen a ON a.payment_id = t.payment_id
ORDER BY cc.bank, t.payment_id;

\echo '== Aplicando correcao =='

-- ---- Correcao ---------------------------------------------------------------

-- 1) Reduz o valor de cada pagamento
UPDATE credit_card_payments p
   SET value = p.value - t.valor_indevido,
       updated_at = now()
FROM tmp_totais t
WHERE p.id = t.payment_id;

-- 2) Estorna o valor na conta debitada
UPDATE accounts a
   SET balance = a.balance + agg.valor,
       updated_at = now()
FROM (
  SELECT account_id, sum(valor_indevido) AS valor
  FROM tmp_totais
  GROUP BY account_id
) agg
WHERE a.id = agg.account_id;

-- 3) Reverte as despesas indevidas para 'pendente'
UPDATE expenses e
   SET status = 'pendente',
       paid_at = NULL,
       updated_at = now()
WHERE e.id IN (SELECT expense_id FROM tmp_afetados);

-- 4) Auditoria
INSERT INTO financial_audit_logs (user_id, action, entity_type, entity_id, details, created_at)
SELECT t.user_id, 'UPDATE', 'credit_card_payment', t.payment_id,
       'Correcao de cobranca indevida: valor reduzido em R$ '
       || to_char(t.valor_indevido, 'FM999999990.00')
       || ' (' || t.qtd || ' despesa(s) do dia do vencimento revertida(s)).',
       now()
FROM tmp_totais t;

INSERT INTO financial_audit_logs (user_id, action, entity_type, entity_id, details, created_at)
SELECT min(t.user_id), 'UPDATE', 'account', agg.account_id,
       'Estorno de R$ ' || to_char(agg.valor, 'FM999999990.00')
       || ' referente a cobranca indevida em faturas de cartao.',
       now()
FROM tmp_totais t
JOIN (SELECT account_id, sum(valor_indevido) AS valor
      FROM tmp_totais GROUP BY account_id) agg ON agg.account_id = t.account_id
GROUP BY agg.account_id, agg.valor;

INSERT INTO financial_audit_logs (user_id, action, entity_type, entity_id, details, created_at)
SELECT user_id, 'UPDATE', 'expenses', expense_id,
       'Revertida para pendente (pagamento ' || payment_id || '): despesa do dia do vencimento '
       || venc || ' pertencia a fatura seguinte.',
       now()
FROM tmp_afetados;

COMMIT;

\echo '== Verificacao final (deve retornar 0 linhas) =='

WITH charged AS (
  SELECT p.id AS payment_id, p.card_id, p.payment_date,
         e.id AS expense_id, e.due_date
  FROM credit_card_payments p
  JOIN expenses e
    ON e.credit_card_id = p.card_id
   AND e.status = 'paga'
   AND (e.paid_at AT TIME ZONE 'America/Sao_Paulo')::date = p.payment_date
),
anchors AS (
  SELECT c.id AS card_id, c.due_day, c.closing_day,
         (date_trunc('month', gs.m) + ((c.due_day - 1) || ' days')::interval)::date AS venc
  FROM credit_cards c
  CROSS JOIN LATERAL generate_series(
    date_trunc('month', (SELECT min(payment_date) FROM credit_card_payments WHERE card_id = c.id)) - INTERVAL '3 months',
    date_trunc('month', (SELECT max(payment_date) FROM credit_card_payments WHERE card_id = c.id)) + INTERVAL '1 month',
    INTERVAL '1 month'
  ) AS gs(m)
),
periods AS (
  SELECT card_id, venc,
    CASE WHEN closing_day > due_day
      THEN (date_trunc('month', venc) - INTERVAL '2 months' + ((closing_day - 1) || ' days')::interval)::date
      ELSE (date_trunc('month', venc) - INTERVAL '1 month' + ((closing_day - 1) || ' days')::interval)::date
    END AS p_start,
    CASE WHEN closing_day > due_day
      THEN (date_trunc('month', venc) - INTERVAL '1 month' + ((closing_day - 2) || ' days')::interval)::date
      ELSE (date_trunc('month', venc) + ((closing_day - 2) || ' days')::interval)::date
    END AS p_end
  FROM anchors
),
cov AS (
  SELECT ch.payment_id, per.venc, count(*) AS inside
  FROM charged ch
  JOIN periods per ON per.card_id = ch.card_id
   AND ch.due_date BETWEEN per.p_start AND per.p_end
  GROUP BY ch.payment_id, per.venc
),
chosen AS (
  SELECT DISTINCT ON (x.payment_id) x.payment_id, x.venc
  FROM (
    SELECT c.payment_id, c.venc, c.inside,
           abs(c.venc - (SELECT payment_date FROM credit_card_payments WHERE id = c.payment_id)) AS dist
    FROM cov c
  ) x
  ORDER BY x.payment_id, x.inside DESC, x.dist ASC
)
SELECT ch.payment_id, ch.expense_id, ch.due_date AS due_date_indevida, k.venc AS vencimento_fatura
FROM charged ch
JOIN chosen k ON k.payment_id = ch.payment_id
WHERE ch.due_date = k.venc;
