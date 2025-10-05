# Changelog de Faturamento de Cartão de Crédito

## 2025-10-05 — Correção de Status da Fatura

- Correção: manter o status da fatura como "Fechada" do dia de fechamento até o dia de vencimento (inclusive). Caso não esteja paga, mudar para "Em atraso" a partir do dia seguinte ao vencimento.
- Contexto: havia um comportamento incorreto em que, no dia do vencimento, o status mudava para "Em aberto" mesmo sem pagamento.
- Arquivo alterado: `frontend/src/pages/CreditCards.js` (função `getBillStatus`).
- Impacto visual:
  - Coluna "Status" e coluna "Valor da Fatura" agora permanecem em "Fechada" até o vencimento.
  - A partir do dia seguinte ao vencimento, exibem "Em atraso" se o pagamento não foi realizado.
  - Cores mantidas conforme UI atual: verde para "Paga", laranja para "Fechada", vermelho para "Em aberto" e vermelho/alerta para "Em atraso".
- Compatibilidade: alteração somente no frontend; sem mudanças em API ou banco de dados.
- Como verificar:
  - Acesse a aba Cartões em `http://localhost/`.
  - Selecione um cartão cuja fatura esteja entre fechamento e vencimento: deve aparecer como "Fechada".
  - No dia seguinte ao vencimento, sem pagamento: deve aparecer como "Em atraso".

---

## 2025-10-05 — Consistência entre "Status" e "Valor da Fatura"

- Correção: a coluna "Valor da Fatura" passou a utilizar a mesma lógica da função `getBillStatus` para refletir corretamente os estados "Paga", "Fechada" e "Em aberto/Em atraso".
- Contexto: anteriormente, "Valor da Fatura" usava apenas a verificação de todas as despesas pagas, ignorando o estado "Fechada".
- Arquivo alterado: `frontend/src/pages/CreditCards.js`.
- Impacto visual: ambas as colunas mostram estados alinhados e cores consistentes.