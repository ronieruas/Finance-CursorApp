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

**Qualquer dúvida, só chamar!** 