Param(
    [string]$BaseUrl = "http://localhost:3001",
    [string]$Email = "user@example.com",
    [string]$Password = "password123"
)

try {
    $loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
    $loginResponse = Invoke-RestMethod -Method Post -Uri "$BaseUrl/auth/login" -Body $loginBody -ContentType "application/json"
} catch {
    Write-Error "Falha ao chamar /auth/login: $_"
    exit 1
}

$token = $loginResponse.token
if (-not $token) {
    Write-Error "Login falhou: token não retornado"
    exit 1
}

$headers = @{ Authorization = "Bearer $token" }

try {
    $resumo = Invoke-RestMethod -Method Get -Uri "$BaseUrl/resumo" -Headers $headers
} catch {
    Write-Error "Falha ao chamar /resumo: $_"
    exit 1
}

try {
    $cards = Invoke-RestMethod -Method Get -Uri "$BaseUrl/creditCards" -Headers $headers
} catch {
    Write-Error "Falha ao chamar /creditCards: $_"
    exit 1
}

Write-Output "Cards count: $($cards.Count)"
if (-not $cards -or $cards.Count -eq 0) {
    Write-Output "Sem cartões"
    exit 0
}

$totalAtualCartoes = 0.0
foreach ($c in $cards) {
    try {
        $bill = Invoke-RestMethod -Method Get -Uri "$BaseUrl/creditCards/$($c.id)/bill" -Headers $headers
    } catch {
        Write-Error "Falha ao chamar /creditCards/$($c.id)/bill: $_"
        continue
    }

    $sumAtual = 0.0
    foreach ($e in $bill.atual) {
        $sumAtual += [double]$e.value
    }
    $totalAtualCartoes += $sumAtual

    $entry = $null
    foreach ($g in $resumo.gastosPorCartao) {
        if ($g.nome -eq $c.name) { $entry = $g; break }
    }

    $entryTotal = if ($entry -and $entry.total) { [double]$entry.total } else { 0.0 }
    Write-Output ("Cartão: {0} | bill atual: {1} | resumo.gastosPorCartao: {2}" -f $c.name, [math]::Round($sumAtual, 2), [math]::Round($entryTotal, 2))
}

Write-Output ("Total faturas período atual (soma cards): {0}" -f [math]::Round($totalAtualCartoes, 2))
Write-Output ("Resumo despesasMes.faturasMesCorrente: {0}" -f [math]::Round([double]($resumo.despesasMes.faturasMesCorrente), 2))
Write-Output ("Resumo despesasMes.faturasProximoMes: {0}" -f [math]::Round([double]($resumo.despesasMes.faturasProximoMes), 2))