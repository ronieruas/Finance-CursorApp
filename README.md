# Deploy Financeiro com Docker Compose

## Pré-requisitos
- Docker e Docker Compose instalados no LXC
- Scripts SQL em `database/init.sql` e `database/seed.sql`
- (Opcional) Cloudflare Tunnel já configurado para expor a porta 80 do LXC

## Como rodar

1. Clone o repositório no LXC:
   ```bash
   git clone <seu-repo> && cd <seu-repo>
   ```

2. Ajuste variáveis de ambiente se necessário (usuário/senha do banco, etc).

3. Rode tudo com:
   ```bash
   docker-compose up -d --build
   ```

4. Acesse o frontend em `http://<IP-do-LXC>` (ou pelo domínio do Cloudflare Tunnel).

5. O backend estará disponível em `http://<IP-do-LXC>:3001` (internamente, o frontend já consome o backend por esse endereço).

6. O banco de dados PostgreSQL estará disponível na porta 5432.

## Dicas para produção
- O frontend é servido por Nginx (mais performático).
- O backend e banco não precisam ser expostos publicamente; exponha só a porta 80 do frontend via Cloudflare Tunnel.
- Para logs, use `docker-compose logs -f backend` ou `frontend`.
- Para atualizar, basta `git pull` e `docker-compose up -d --build`.

## Segurança
- Altere as senhas padrão do banco em produção.
- Use variáveis de ambiente para segredos sensíveis.
