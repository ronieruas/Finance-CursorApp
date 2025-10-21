# Finance App - Guia de Deployment

## 🚀 Melhorias Implementadas

### Segurança e Hardening
- ✅ **Rate Limiting**: Proteção contra ataques DDoS e brute force
- ✅ **Headers de Segurança**: CSP, HSTS, X-Frame-Options, etc.
- ✅ **Secrets Management**: Variáveis de ambiente centralizadas
- ✅ **Networks Isoladas**: Separação entre backend e frontend
- ✅ **Resource Limits**: Controle de CPU e memória por container

### Observabilidade
- ✅ **Uptime Kuma**: Monitoramento de disponibilidade
- ✅ **Prometheus**: Coleta de métricas
- ✅ **Grafana**: Dashboards e visualizações
- ✅ **Loki + Promtail**: Agregação de logs
- ✅ **Cloudflare Access**: Proteção das rotas administrativas

### Backup e Validação
- ✅ **Script de Validação**: Testa integridade dos backups
- ✅ **Smoke Tests**: Validação automática de funcionalidades
- ✅ **Health Checks**: Monitoramento de saúde dos containers

## 📋 Pré-requisitos

1. **Arquivo de Secrets**: Copie `.env.example` para `.env` e configure:
   ```bash
   cp secrets/.env.example secrets/.env
   ```

2. **Configurar Variáveis**:
   ```env
   # Database
   POSTGRES_USER=finance
   POSTGRES_PASSWORD=sua_senha_segura
   POSTGRES_DB=finance
   
   # JWT
   JWT_SECRET=seu_jwt_secret_muito_seguro
   
   # Monitoring
   GRAFANA_ADMIN_PASSWORD=senha_grafana_segura
   
   # Timezone
   TZ=America/Sao_Paulo
   ```

## 🔧 Deploy em Desenvolvimento

```bash
# 1. Parar containers existentes
docker-compose down

# 2. Subir aplicação principal
docker-compose up -d

# 3. Subir stack de observabilidade
docker-compose -f docker-compose.observability.yml up -d

# 4. Verificar status
docker-compose ps
docker-compose -f docker-compose.observability.yml ps
```

## 🔧 Deploy em Produção

```bash
# 1. Fazer backup antes do deploy
./backup.sh

# 2. Validar backup
./scripts/validate-backup.sh

# 3. Atualizar código
git pull origin main

# 4. Rebuild e deploy
docker-compose down
docker-compose up -d --build

# 5. Subir observabilidade
docker-compose -f docker-compose.observability.yml up -d --build

# 6. Executar smoke tests
./scripts/smoke-tests.sh

# 7. Verificar logs
docker-compose logs -f
```

## 🌐 URLs de Acesso

### Aplicação Principal
- **Frontend**: `https://seu-dominio.com`
- **API**: `https://seu-dominio.com/api`

### Monitoramento (via Cloudflare Access)
- **Uptime Kuma**: `https://seu-dominio.com/uptime-kuma`
- **Grafana**: `https://seu-dominio.com/grafana`
- **Prometheus**: `https://seu-dominio.com/prometheus` (debug apenas)

## 🔍 Validação Pós-Deploy

### 1. Smoke Tests Automáticos
```bash
# Testes completos
./scripts/smoke-tests.sh full

# Apenas testes críticos
./scripts/smoke-tests.sh critical

# Testes rápidos
./scripts/smoke-tests.sh quick
```

### 2. Validação Manual
- [ ] Frontend carrega corretamente
- [ ] Login funciona
- [ ] API responde
- [ ] Transações são listadas
- [ ] Backup automático funcionando
- [ ] Monitoramento acessível

### 3. Verificar Logs
```bash
# Logs da aplicação
docker-compose logs -f backend frontend

# Logs de monitoramento
docker-compose -f docker-compose.observability.yml logs -f

# Logs do Caddy (proxy)
docker-compose logs -f caddy
```

## 🛠️ Troubleshooting

### Problemas Comuns

1. **Containers não sobem**:
   ```bash
   docker-compose down -v
   docker system prune -f
   docker-compose up -d
   ```

2. **Erro de permissão nos scripts**:
   ```bash
   # No Linux/Mac
   chmod +x scripts/*.sh
   
   # No Windows (WSL)
   wsl chmod +x scripts/*.sh
   ```

3. **Problemas de rede**:
   ```bash
   docker network ls
   docker network prune
   ```

4. **Banco de dados corrompido**:
   ```bash
   # Restaurar último backup
   ./restore.sh
   ```

### Logs Importantes

```bash
# Verificar saúde dos containers
docker-compose ps

# Logs específicos por serviço
docker-compose logs backend
docker-compose logs db
docker-compose logs caddy

# Monitorar em tempo real
docker-compose logs -f --tail=100
```

## 📊 Monitoramento

### Métricas Importantes
- **CPU/Memória**: Via Prometheus + Grafana
- **Disponibilidade**: Via Uptime Kuma
- **Logs de Erro**: Via Loki + Grafana
- **Tempo de Resposta**: Via smoke tests

### Alertas Recomendados
- CPU > 80% por 5 minutos
- Memória > 90% por 5 minutos
- Aplicação indisponível por 2 minutos
- Falha nos backups
- Falha nos smoke tests

## 🔐 Configuração do Cloudflare Access

1. **Criar Aplicação no Cloudflare**:
   - Nome: Finance App Monitoring
   - Domínio: `seu-dominio.com`
   - Paths: `/uptime-kuma/*`, `/grafana/*`

2. **Configurar Políticas**:
   - Permitir apenas emails autorizados
   - Exigir autenticação por email

3. **Testar Acesso**:
   - Acessar `https://seu-dominio.com/grafana`
   - Verificar redirecionamento para Cloudflare
   - Confirmar acesso após autenticação

## 📱 Próximos Passos - Mobile App

1. **Configurar Firebase Project**
2. **Implementar FCM para notificações**
3. **Configurar Crashlytics**
4. **Implementar Analytics**
5. **Criar esqueleto Android com login JWT**

## 🔄 Rotina de Manutenção

### Diária
- [ ] Verificar smoke tests automáticos
- [ ] Revisar logs de erro
- [ ] Confirmar backups

### Semanal
- [ ] Validar backups completos
- [ ] Revisar métricas de performance
- [ ] Atualizar dependências (se necessário)

### Mensal
- [ ] Revisar configurações de segurança
- [ ] Testar procedimento de restore
- [ ] Analisar tendências de uso