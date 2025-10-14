Param(
    [string]$BaseUrl = "http://localhost:3001",
    [string]$Email = "user@example.com",
    [string]$Password = "password123"
)

Write-Output "[Seed] Iniciando seed com BaseUrl=$BaseUrl Email=$Email"

try {
    $loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
    $loginResponse = Invoke-RestMethod -Method Post -Uri "$BaseUrl/auth/login" -Body $loginBody -ContentType "application/json"
} catch {
    Write-Error "[Seed] Falha ao chamar /auth/login: $_"
    exit 1
}

$token = $loginResponse.token
if (-not $token) {
    Write-Error "[Seed] Login falhou: token não retornado"
    exit 1
}
$headers = @{ Authorization = "Bearer $token" }

try {
    $cards = Invoke-RestMethod -Method Get -Uri "$BaseUrl/creditCards" -Headers $headers
} catch {
    Write-Error "[Seed] Falha ao chamar /creditCards: $_"
    exit 1
}

if (-not $cards -or $cards.Count -eq 0) {
    Write-Output "[Seed] Nenhum cartão encontrado. Criando cartão de teste..."
    $cardBody = @{ bank = "Banco Teste"; brand = "Visa"; limit_value = 3000; due_day = 15; closing_day = 8; name = "Cartão Teste"; status = "ativa" } | ConvertTo-Json
    try {
        $newCard = Invoke-RestMethod -Method Post -Uri "$BaseUrl/creditCards" -Headers $headers -Body $cardBody -ContentType "application/json"
        Write-Output "[Seed] Cartão criado: $($newCard.id) - $($newCard.name)"
        $cards = @($newCard)
    } catch {
        Write-Error "[Seed] Falha ao criar cartão: $_"
        exit 1
    }
} else {
    Write-Output "[Seed] Cartões existentes: $($cards.Count). Usando o primeiro."
}

$card = $cards[0]
Write-Output "[Seed] Usando cartão id=$($card.id) name=$($card.name)"

# Obter período da fatura atual
try {
    $bill = Invoke-RestMethod -Method Get -Uri "$BaseUrl/creditCards/$($card.id)/bill" -Headers $headers
} catch {
    Write-Error "[Seed] Falha ao obter fatura do cartão: $_"
    exit 1
}

$startDate = $bill.periods.atual.start_date
$endDate = $bill.periods.atual.end_date
Write-Output "[Seed] Período atual: $startDate -> $endDate"

function AddDaysDateOnly([string]$dateOnly, [int]$days) {
    $dt = [DateTime]::ParseExact($dateOnly, 'yyyy-MM-dd', $null)
    return $dt.AddDays($days).ToString('yyyy-MM-dd')
}

$expense1Date = AddDaysDateOnly $startDate 3
$expense2Date = AddDaysDateOnly $startDate 5

$expensesToCreate = @(
    @{ type = 'cartao'; credit_card_id = "$($card.id)"; description = 'Compra Supermercado'; value = 123.45; due_date = $expense1Date; category = 'Mercado' },
    @{ type = 'cartao'; credit_card_id = "$($card.id)"; description = 'Combustível'; value = 75.60; due_date = $expense2Date; category = 'Transporte' }
)

foreach ($exp in $expensesToCreate) {
    $body = $exp | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Method Post -Uri "$BaseUrl/expenses" -Headers $headers -Body $body -ContentType "application/json"
        Write-Output "[Seed] Despesa criada: $($res.id) - $($exp.description) - R$ $($exp.value) em $($exp.due_date)"
    } catch {
        Write-Error "[Seed] Falha ao criar despesa '$($exp.description)': $_"
    }
}

Write-Output "[Seed] Seed concluído."