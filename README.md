# Finance App - Sistema de Gestão Financeira Pessoal

Sistema completo de gestão financeira pessoal com dashboard, controle de receitas, despesas, cartões de crédito e relatórios.

## 🚀 Instalação Rápida

### Desenvolvimento Local

```bash
# Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd finance

# Configurar variáveis de ambiente para desenvolvimento
export JWT_SECRET="your-super-strong-jwt-secret-here"
export TZ="America/Sao_Paulo"  # opcional

# Executar com Docker Compose
docker compose up -d --build
```

**Acesso**: http://localhost/ (porta 80)

### Produção com Domínio Próprio

```bash
# Clone o repositório no servidor
git clone <URL_DO_REPOSITORIO>
cd finance

# Configurar variáveis de ambiente obrigatórias
export JWT_SECRET="your-production-jwt-secret-256-bits"
export TZ="America/Sao_Paulo"  # opcional, padrão: America/Sao_Paulo

# Ajustar frontend para usar domínio próprio
echo "REACT_APP_API_URL=/api" > frontend/.env

# Executar em produção
docker compose up -d --build
```

**Configuração DNS/Proxy**:
- Cloudflare: DNS proxied (nuvem laranja) → IP do servidor porta 80
- SSL/TLS: Full ou Full (strict) no Cloudflare

## ⚙️ Variáveis de Ambiente Obrigatórias

### Para Produção

| Variável | Obrigatória | Descrição | Exemplo |
|----------|-------------|-----------|---------|
| `JWT_SECRET` | ✅ Sim | Chave secreta para tokens JWT (256+ bits) | `"abcd1234...256chars"` |
| `TZ` | ❌ Não | Fuso horário do servidor | `"America/Sao_Paulo"` |

### Configuração Frontend

Arquivo: `frontend/.env`

```bash
# Para desenvolvimento local
REACT_APP_API_URL=http://localhost:3001

# Para produção com domínio próprio
REACT_APP_API_URL=/api
```

## 🔧 Pré-requisitos

- **Docker** 20.10+ e **Docker Compose** 2.0+
- **Git** instalado
- **2GB** de espaço livre em disco
- **1GB RAM** disponível

### Verificar Pré-requisitos

```bash
docker --version          # Docker 20.10+
docker compose version    # Docker Compose 2.0+
git --version            # Git instalado
df -h                    # Espaço em disco
free -h                  # Memória disponível
```

## 🎯 Acesso à Aplicação

### Desenvolvimento
- **Frontend**: http://localhost/
- **API Backend**: http://localhost/api/
- **Backend Direto**: http://localhost:3001 (debug)
- **Banco de dados**: localhost:5432

### Produção
- **Site**: https://seudominio.com/
- **API**: https://seudominio.com/api/

### 📊 Credenciais Padrão

- **Usuário**: admin@finance.com
- **Senha**: admin123

**⚠️ IMPORTANTE**: Altere essas credenciais após primeiro login em produção!

## 🔧 Comandos Úteis

### Gerenciamento de Containers

```bash
# Parar todos os serviços
docker compose down

# Parar e remover volumes (cuidado: apaga dados)
docker compose down -v

# Reiniciar serviços
docker compose restart

# Ver logs em tempo real
docker compose logs -f
```

### Rebuild e Atualizações

```bash
# Rebuild completo (recomendado após mudanças)
docker compose down
docker compose build --no-cache
docker compose up -d

# Rebuild apenas backend
docker compose build --no-cache backend
docker compose up -d backend

# Rebuild apenas frontend
docker compose build --no-cache frontend
docker compose up -d --no-deps frontend
```

### Limpeza de Sistema

```bash
# Limpar containers não utilizados
docker container prune

# Limpar imagens não utilizadas
docker image prune

# Limpeza completa do Docker
docker system prune -a

# Limpar volumes (cuidado: apaga dados)
docker volume prune
```

### Scripts de Emergência

```bash
# Script de limpeza e rebuild otimizado
chmod +x backend/scripts/clean_and_build.sh
./backend/scripts/clean_and_build.sh

# Script de emergência para espaço limitado
chmod +x backend/scripts/emergency_build.sh
./backend/scripts/emergency_build.sh
```

## 💾 Backup e Restauração de Dados

Para garantir a segurança dos seus dados, foram criados scripts para backup e restauração do banco de dados.

### Fazer Backup

Execute o comando abaixo na raiz do projeto. O backup será salvo na pasta `database/backups`.

```bash
# Dentro da pasta 'backend'
cd backend

npm run db:backup
```

### Restaurar Backup

Este comando irá apagar o banco de dados atual e restaurar o último backup encontrado.

```bash
# Dentro da pasta 'backend'
cd backend

npm run db:restore
```

**Atenção**: A restauração é um processo destrutivo. Tenha certeza de que deseja substituir os dados atuais.

## 🏗️ Arquitetura

### Serviços Docker

- **frontend**: React.js (porta 3000)
- **backend**: Node.js + Express (porta 3001)
- **db**: PostgreSQL (porta 5432)

### Estrutura do Projeto

```
finance/
├── frontend/          # Aplicação React
├── backend/           # API Node.js
├── database/          # Scripts de banco
├── docker-compose.yml # Configuração Docker
└── README.md
```

## 🔍 Troubleshooting

### Problema: "no space left on device"
```bash
# Solução 1: Limpeza básica
docker system prune -a

# Solução 2: Script otimizado
./backend/scripts/clean_and_build.sh

# Solução 3: Emergência
./backend/scripts/emergency_build.sh
```

### Problema: Containers não iniciam
```bash
# Verificar logs
docker compose logs

# Verificar espaço em disco
df -h

# Verificar recursos do sistema
docker system df
```

### Problema: Banco não conecta
```bash
# Verificar se o banco está rodando
docker compose ps db

# Verificar logs do banco
docker compose logs db

# Testar conexão
docker exec finance-db pg_isready -U finance
```

### Problema: Migrações não executam
```bash
# Executar migrações manualmente
docker exec finance-backend npx sequelize db:migrate

# Verificar status das migrações
docker exec finance-backend npx sequelize db:migrate:status
```

### Problema: 502 Bad Gateway no domínio (Cloudflare)
```bash
# Teste local no host
curl -I http://localhost/
curl -I http://localhost/api/

# Se local OK (200) e domínio 502, verifique no Cloudflare:
# - DNS proxied (nuvem laranja) -> IP do host
# - SSL/TLS: Full ou Full (strict)
# - Exponha a porta 80 no host (docker compose publica 80:80)
```

## 📝 Logs Importantes

### Backend
- Migrações executadas
- Conexão com banco estabelecida
- Scripts de seed executados
- Servidor rodando na porta 3001

### Frontend
- Build concluído
- Servidor rodando na porta 3000

### Database
- PostgreSQL iniciado
- Banco 'finance' criado
- Usuário 'finance' configurado

## 🔄 Atualizações

### Atualizar código
```bash
# 1. Parar serviços
docker-compose down

# 2. Pull das mudanças
git pull origin main

# 3. Rebuild
docker-compose build --no-cache

# 4. Iniciar
docker-compose up -d
```

### Backup do banco
```bash
# Backup
docker exec finance-db pg_dump -U finance finance > backup.sql

# Restore
docker exec -i finance-db psql -U finance finance < backup.sql
```

## 🚨 Importante

- **Sempre use `docker-compose down` antes de rebuild**
- **Para produção, configure variáveis de ambiente**
- **Mantenha backups regulares do banco**
- **Monitore o espaço em disco**

## 📞 Suporte

Para problemas específicos, verifique:
1. Logs dos containers
2. Espaço em disco disponível
3. Recursos do sistema (CPU/RAM)
4. Configurações de firewall/portas

---

**Desenvolvido com ❤️ para gestão financeira pessoal**
