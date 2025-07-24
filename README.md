# Finance App

## 🚀 Instalação e Deploy Completo (Docker Compose)

### 1. Pré-requisitos
- Docker e Docker Compose
- Git
- (Opcional) Cloudflare Tunnel ou DNS apontando para a porta 80 do servidor

### 2. Clone o repositório
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO
```

### 3. Configuração de variáveis de ambiente

#### Frontend (`frontend/.env`):
```
REACT_APP_API_URL=https://SEU_DOMINIO
```
> **Importante:** O valor de `REACT_APP_API_URL` deve ser o domínio público (ex: `https://finance.ronieruas.com.br`).

#### Backend (`backend/.env`):
```
PORT=3001
DB_HOST=db
DB_PORT=5432
DB_NAME=finance
DB_USER=finance
DB_PASS=finance123
JWT_SECRET=umasecretforte
CORS_ORIGIN=https://SEU_DOMINIO
```

### 4. Build do frontend
```bash
cd frontend
rm -rf build
REACT_APP_API_URL=https://SEU_DOMINIO npm install
REACT_APP_API_URL=https://SEU_DOMINIO npm run build
cd ..
```

### 5. Limpeza total do Docker (opcional, para ambiente limpo)
```bash
docker-compose down
docker builder prune -af
docker system prune -af --volumes
```

### 6. Build e subida dos containers
```bash
docker-compose build --no-cache
docker-compose up -d
```

### 7. Crie o usuário admin inicial
```bash
docker-compose exec backend node src/scripts/seedAdmin.js
```

### 8. Acesse o sistema
Abra o navegador em `https://SEU_DOMINIO` e faça login com o admin criado.

---

## 🛠️ Troubleshooting
- **Login não funciona e erro 404/405 em `/api/auth/login`:**
  - Verifique se o bloco `location /api/` está presente no `frontend/nginx.conf` para proxy das APIs.
  - Exemplo:
    ```nginx
    location /api/ {
      proxy_pass http://finance-backend:3001/api/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
    ```
  - O build do frontend deve ser feito SEM `/api` no final da variável.
  - Se o login funciona pelo IP local mas não pelo domínio, revise o Cloudflare Tunnel ou proxy reverso.
  - Se o frontend retorna 405 para `/api/auth/login`, o proxy do Nginx provavelmente não está configurado.
  - Se o backend responde 401, verifique as credenciais ou rode o seed do admin novamente.
- **Erro de porta ocupada (EADDRINUSE):**
  - Só rode UM backend por vez na porta 3001. Use apenas Docker Compose.
  - Pare processos antigos: `docker-compose down` e `pm2 stop all && pm2 delete all` (se usou PM2 antes)
- **Variáveis de ambiente não aplicadas:**
  - Sempre rode o build do frontend com a variável no comando, ou garanta que o `.env` está correto ANTES do build.
- **Atualizar sistema:**
  ```bash
  git pull
  cd frontend && rm -rf build && REACT_APP_API_URL=https://SEU_DOMINIO npm run build
  cd ..
  docker-compose build frontend
  docker-compose up -d
  docker-compose exec backend node src/scripts/seedAdmin.js
  ```
- **Ver logs do backend:**
  ```bash
  docker-compose logs backend
  ```
- **Ver logs do frontend (Nginx):**
  ```bash
  docker-compose logs frontend
  ```
- **Testar API manualmente:**
  ```bash
  curl -X POST https://SEU_DOMINIO/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@email.com","password":"suasenha"}'
  ```

---

## 📝 Dicas finais
- Sempre limpe o cache do navegador após novo build (`Ctrl+Shift+R`).
- O backend serve apenas a API, o frontend (Nginx) serve o React e faz proxy para o backend.
- O sistema é responsivo e pode ser acessado de qualquer dispositivo.

---

Se tiver dúvidas ou problemas, consulte este README ou peça ajuda! 😃
