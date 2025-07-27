# Changelog - Correção da Lógica de Faturamento de Cartões de Crédito

## Data: 2024-01-XX

### Problema Identificado
A lógica de cálculo do período de fatura dos cartões de crédito estava incorreta, não considerando adequadamente o ciclo de faturamento onde:
- O período da fatura vai do dia de fechamento do mês anterior até o dia anterior ao fechamento do mês atual
- O vencimento ocorre após o fechamento

### Exemplo do Problema
Cartão com fechamento dia 28 e vencimento dia 5:
- **Antes:** Lógica incorreta que não considerava o período correto da fatura
- **Depois:** Compras de 28/jun até 27/jul → vence em 5/ago

### Mudanças Implementadas

#### Backend (`backend/src/controllers/creditCardController.js`)

1. **Função `getBillPeriods` corrigida:**
   - Agora calcula corretamente o período da fatura atual e próxima
   - Considera o fechamento da fatura baseado na data de referência
   - Período da fatura: do fechamento do mês anterior até o dia anterior ao fechamento atual

2. **Nova função `getBillPeriodForMonth`:**
   - Calcula o período da fatura para um mês específico
   - Útil para pagamento de faturas de meses anteriores

3. **Função `pay` atualizada:**
   - Usa a nova lógica de cálculo de período
   - Corrige o cálculo quando `bill_month` é fornecido

#### Frontend (`frontend/src/pages/CreditCards.js`)

1. **Função `getBillPeriod` corrigida:**
   - Alinhada com a lógica do backend
   - Calcula corretamente o período da fatura para validação de datas

### Testes

Criado script de teste (`backend/src/scripts/testBillPeriods.js`) que valida:
- Cálculo correto dos períodos de fatura
- Comportamento em diferentes datas de referência
- Cálculo para meses específicos

### Resultado

A lógica agora funciona corretamente:
- **Fatura de julho:** compras de 28/jun até 27/jul → vence em 5/ago
- **Fatura de agosto:** compras de 28/jul até 27/ago → vence em 5/set
- **Fatura de setembro:** compras de 28/ago até 27/set → vence em 5/out

### Impacto

- ✅ Correção da exibição de faturas de cartão
- ✅ Correção do cálculo de pagamentos de fatura
- ✅ Validação correta de datas de compra
- ✅ Melhoria na experiência do usuário ao cadastrar despesas de cartão 