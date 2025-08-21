# Deploy Financeiro com Docker Compose (Produção)

Guia para subir a aplicação em produção no LXC/servidor com Docker Compose, usando o frontend (Nginx) na porta 80 e proxy interno para o backend.

## Pré-requisitos
- Docker e Docker Compose (v2) instalados no LXC/servidor
- Git instalado
- Domínio opcional via Cloudflare (DNS proxied) ou Cloudflare Tunnel

## Variáveis de ambiente (obrigatórias/opcionais)
- `JWT_SECRET` (obrigatória): chave forte para assinar tokens JWT (256+ bits)
- `TZ` (opcional): fuso horário. Padrão: `America/Sao_Paulo`

Exemplo (bash):
```bash
export JWT_SECRET="sua-chave-super-secreta-256-bits"
export TZ="America/Sao_Paulo"  # opcional
```

## Passo a passo

1) Clone o repositório no LXC/servidor
```bash
git clone <seu-repo>
cd <seu-repo>
```

2) Configure o frontend para produção (consumir a API via /api)
```bash
echo "REACT_APP_API_URL=/api" > frontend/.env
```

3) Suba tudo com Docker Compose
```bash
docker compose up -d --build
```

4) Acesse
- Frontend (Nginx): http://<IP-do-servidor>/
- API pelo proxy do frontend: http://<IP-do-servidor>/api/
- Banco de dados (interno): porta 5432

Observações:
- O backend NÃO precisa estar exposto publicamente. O Nginx do frontend já faz proxy de /api para o backend dentro da rede Docker.
- O docker-compose publica a porta 80 do host: o site ficará disponível diretamente em http://<IP>.

## Usando domínio com Cloudflare
- DNS: aponte `seu.dominio.com` para o IP do servidor com proxy ativado (nuvem laranja)
- SSL/TLS no Cloudflare:
  - Recomendado: Full ou Full (strict) se tiver certificado válido no host
  - Para teste rápido sem TLS no host: Flexible (menos seguro)
- Importante: exponha a porta 80 do host (já configurado no docker compose como 80:80)

Teste:
```bash
# No servidor
curl -I http://localhost/
curl -I http://localhost/api/
# Externamente
curl -I https://seu.dominio.com/
curl -I https://seu.dominio.com/api/
```

Se receber 502 via domínio e 200 local:
- Verifique DNS proxied e modo SSL/TLS no Cloudflare
- Garanta que a porta 80 está publicada (80:80) e não 3000:80
- Confirme que o frontend aponta para /api (arquivo frontend/.env)

## Dicas para produção
- O frontend é servido por Nginx, estático, com proxy interno para `/api`.
- Não exponha o backend nem o banco de dados publicamente.
- Logs:
```bash
docker compose logs -f frontend
docker compose logs -f backend
```
- Atualização de versão:
```bash
git pull
docker compose up -d --build
```
- Rebuild seletivo:
```bash
docker compose build --no-cache frontend && docker compose up -d --no-deps frontend
docker compose build --no-cache backend && docker compose up -d backend
```

## Segurança
- Defina `JWT_SECRET` forte em produção (não comite em repositório)
- Altere senhas padrão do banco, se aplicável
- Restrinja acesso ao host e habilite firewall quando possível

## Usuários e Senhas

1) Criar/atualizar usuário administrador (produção)

- Por padrão, nenhum administrador é criado automaticamente no ambiente Docker. Para criar ou atualizar o admin, execute dentro do container do backend:

```bash
docker exec finance-backend node src/scripts/seedAdmin.js
```

- Para definir e-mail e senha do admin via variáveis de ambiente no momento da execução do script:

```bash
docker exec -e ADMIN_EMAIL=admin@seu-dominio.com -e "ADMIN_PASS=SuaSenhaForte!123" finance-backend node src/scripts/seedAdmin.js
```

- Dica: você também pode definir `ADMIN_EMAIL` e `ADMIN_PASS` na seção `environment` do serviço `backend` no arquivo `docker-compose.yml` para reutilizar os mesmos valores sempre que necessário.

2) Usuário de exemplo para desenvolvimento

- Existe um seeder opcional que cria o usuário `user@example.com` com a senha `password123`. Em produção via Docker esse seeder NÃO é executado automaticamente.
- Utilize apenas em ambientes de desenvolvimento quando necessário (não recomendado em produção).

3) Política de força de senha

- Mínimo de 8 caracteres
- Pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial
- Senhas fracas são rejeitadas com a mensagem de erro informando os requisitos faltantes

4) Armazenamento de senhas

- As senhas são armazenadas usando `bcryptjs` com fator de custo 10.

5) Segurança dos tokens após troca de senha

- O backend mantém o campo `password_changed_at` e invalida automaticamente tokens JWT emitidos antes da última alteração de senha. Após alterar a senha, faça login novamente para obter um novo token.

## Upgrade de versão / Rollback

### Upgrade seguro (com backup automático)
```bash
# 1. Backup automático do banco antes do upgrade
docker exec finance-db pg_dump -U finance finance > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull das novas alterações
git pull origin main

# 3. Rebuild e restart
docker compose down
docker compose up -d --build

# 4. Verificar logs e funcionamento
docker compose logs -f backend | head -20
curl -I http://localhost/
curl -I http://localhost/api/
```

### Rollback para versão anterior
```bash
# 1. Parar containers
docker compose down

# 2. Voltar para commit anterior
git log --oneline -5  # ver últimos commits
git checkout <commit-hash-anterior>

# 3. Rebuild com versão anterior
docker compose up -d --build

# 4. Restaurar backup do banco (se necessário)
# ATENÇÃO: isso apaga dados atuais
docker exec -i finance-db psql -U finance finance < backup_YYYYMMDD_HHMMSS.sql
```

### Upgrade apenas do frontend
```bash
git pull origin main
docker compose build --no-cache frontend
docker compose up -d --no-deps frontend
```

### Upgrade apenas do backend
```bash
git pull origin main
docker compose build --no-cache backend
docker compose up -d backend
```

### Verificação pós-upgrade
```bash
# Status dos containers
docker compose ps

# Logs dos serviços
docker compose logs backend | tail -10
docker compose logs frontend | tail -10

# Teste de conectividade
curl -I http://localhost/
curl -I http://localhost/api/users  # ou outra rota de teste

# Verificar versão/build (se houver endpoint)
curl http://localhost/api/health  # ou endpoint de status
```

## Checklist de Pós-instalação

- [ ] Porta 80 liberada no host (firewall/iptables)
- [ ] frontend/.env com REACT_APP_API_URL=/api
- [ ] Variáveis de ambiente definidas (JWT_SECRET, TZ opcional)
- [ ] Acesso local OK: curl -I http://localhost/ e /api
- [ ] DNS no Cloudflare apontando para o IP do host (proxied)
- [ ] SSL/TLS no Cloudflare configurado (Full/Full strict)
- [ ] Backups configurados (pg_dump agendado se possível)
- [ ] Logs monitorados (docker compose logs -f)
- [ ] Usuários/senhas padrão alterados quando aplicável

## Corrigindo colunas de timestamps no banco de dados

Se após atualizar o backend aparecerem erros de coluna `updated_at` não encontrada em alguma tabela, rode o script SQL disponível em `backend/scripts/add_updated_at_columns.sql` para corrigir rapidamente.

### Como rodar o script:

1. Entre no container do banco de dados:
```bash
docker exec -it finance-db psql -U finance -d finance
```

2. No prompt do psql, execute:
```sql
\i /app/scripts/add_updated_at_columns.sql
```
(O caminho `/app/scripts/` corresponde ao diretório dentro do container Docker.)

3. Pronto! As colunas serão criadas automaticamente se não existirem.

Se precisar rodar para outros bancos ou tabelas, adapte o script conforme necessário.

---

Qualquer dúvida, só chamar!