# Dashboard de Resumo - Changelog

## Nova Funcionalidade: Dashboard de Resumo

### Descrição
Foi criado um novo dashboard chamado "Resumo" que apresenta informações financeiras organizadas em 9 quadros específicos, seguindo o layout da imagem de referência.

### Funcionalidades Implementadas

#### 1. Receitas do Mês
- Exibe o total de receitas recebidas no mês atual
- Formatação em moeda brasileira (R$)
- Ícone de seta para cima (verde) indicando entrada

#### 2. Saldo por Conta
- Apresenta o saldo disponível de cada conta cadastrada
- Filtra apenas contas ativas em reais (BRL)
- Lista organizada com nome da conta e saldo

#### 3. Receitas e Saldos (Últimos 6 Meses)
- Gráfico de barras mostrando receitas e saldos dos últimos 6 meses
- Receitas em verde, saldos finais em azul claro
- Eixo Y com valores em moeda brasileira

#### 4. Despesas do Mês
- Total de despesas do mês atual
- Divisão entre Despesas Gerais e Faturas de Cartão
- Ícone de seta para baixo (vermelho) indicando saída

#### 5. Total de Despesas (Últimos 6 Meses)
- Gráfico de linha mostrando evolução das despesas
- Linha vermelha com pontos para melhor visualização
- Período dos últimos 6 meses

#### 6. Gastos por Cartão de Crédito
- Mostra total de cada fatura aberta dos cartões
- Data de fechamento da fatura
- Ícone de calendário para indicar datas

#### 7. Orçamento vs. Gasto por Cartão
- Compara orçamento planejado com gastos reais
- Gráfico de barras horizontais
- Barras vermelhas para gastos atuais, azuis para orçamento

#### 8. Próximos Vencimentos
- Lista contas e faturas com vencimento próximo (15 dias)
- Inclui descrição, prazo em dias e valor
- Ícone de alerta (⚠) para indicar urgência

#### 9. Despesas Parceladas
- Detalha despesas pagas em parcelas
- Inclui item, cartão usado e status da parcela
- Formato: "Item (Parcela X/Y), Cartão: R$ Valor"

### Arquivos Criados/Modificados

#### Frontend
- `frontend/src/pages/Resumo.js` - Nova página do dashboard
- `frontend/src/App.js` - Adicionada rota `/resumo`
- `frontend/src/components/Sidebar.js` - Adicionado item de menu "Resumo"

#### Backend
- `backend/src/controllers/resumoController.js` - Controller com lógica de negócio
- `backend/src/routes/resumo.js` - Rotas para o resumo
- `backend/src/routes/index.js` - Registrada nova rota `/api/resumo`

### Layout
- Grid 3x3 responsivo
- Cards com gradientes coloridos diferentes para cada seção
- Animações de entrada com Framer Motion
- Design moderno e limpo seguindo o padrão da aplicação

### Tecnologias Utilizadas
- **Frontend**: React, Recharts (gráficos), Framer Motion (animações)
- **Backend**: Node.js, Express, Sequelize, PostgreSQL
- **Estilização**: CSS inline com gradientes e sombras

### API Endpoint
- `GET /api/resumo` - Retorna todos os dados necessários para o dashboard

### Dados Retornados pela API
```json
{
  "receitasMes": 7500.00,
  "saldoPorConta": [
    { "nome": "Conta Corrente", "saldo": 4250.50 },
    { "nome": "Poupança", "saldo": 10100.00 }
  ],
  "receitasSaldoUltimos6Meses": [
    { "mes": "Fev", "receitas": 6000, "saldoFinal": 4000 }
  ],
  "despesasMes": {
    "gerais": 2150.00,
    "cartao": 2700.00,
    "total": 4850.00
  },
  "totalDespesasUltimos6Meses": [
    { "mes": "Fev", "total": 4500 }
  ],
  "gastosPorCartao": [
    { "nome": "Cartão C6", "total": 1550.20, "fechamento": "2024-07-25" }
  ],
  "orcamentoVsGasto": [
    { "cartao": "Cartão C6", "orcamento": 2000, "gastoAtual": 1550.20 }
  ],
  "proximosVencimentos": [
    { "descricao": "Conta de Luz", "valor": 180.45, "vencimento": "2024-07-20" }
  ],
  "despesasParceladas": [
    { "item": "Notebook", "cartao": "Nubank", "parcelaAtual": 5, "totalParcelas": 12, "valor": 450.00 }
  ]
}
```

### Como Acessar
1. Faça login na aplicação
2. No menu lateral, clique em "Resumo"
3. O dashboard será carregado automaticamente

### Responsividade
- Layout adaptável para diferentes tamanhos de tela
- Grid responsivo que se ajusta automaticamente
- Cards com tamanhos flexíveis

### Performance
- Dados carregados em uma única requisição
- Cache de dados no frontend
- Otimização de consultas no backend 