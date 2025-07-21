# Finance App

## 🚀 Instalação e Deploy Completo

### 1. Pré-requisitos
- Node.js 18+ e npm
- (Opcional) Docker e Docker Compose
- PM2 instalado globalmente (`npm install -g pm2`)
- Git
- (Opcional) Cloudflare Tunnel configurado para produção

### 2. Clone o repositório
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO
```

### 3. Configuração de variáveis de ambiente

#### Backend (`backend/.env`):
```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance
DB_USER=seu_usuario
DB_PASS=sua_senha
JWT_SECRET=umasecretforte
CORS_ORIGIN=https://SEU_DOMINIO
```

#### Frontend (`frontend/.env`):
```
REACT_APP_API_URL=https://SEU_DOMINIO
```
> **Importante:** O valor de `REACT_APP_API_URL` deve ser o domínio público (ex: `https://finance.ronieruas.com.br`).

### 4. Build do frontend
```bash
cd frontend
rm -rf build
REACT_APP_API_URL=https://SEU_DOMINIO npm install
REACT_APP_API_URL=https://SEU_DOMINIO npm run build
```

### 5. Instale e rode o backend
```bash
cd ../backend
npm install
pm install -g pm2 # se ainda não tiver
pm2 start src/server.js --name finance-backend
```

### 6. Reinicie o backend após novo build do frontend
```bash
pm2 restart finance-backend --update-env
```

### 7. Crie o usuário admin inicial
```bash
cd backend
node src/scripts/seedAdmin.js
```

### 8. Acesse o sistema
Abra o navegador em `https://SEU_DOMINIO` e faça login com o admin criado.

---

## 🛠️ Troubleshooting
- **Login não funciona e erro 404 em `/auth/login`:**
  - O build do frontend está errado. Siga o passo 4 exatamente como acima.
- **Erro de porta ocupada (EADDRINUSE):**
  - Só rode UM backend por vez na porta 3001. Use apenas o PM2 para gerenciar.
  - Pare processos antigos: `pm2 stop all && pm2 delete all`
- **Variáveis de ambiente não aplicadas:**
  - Sempre rode o build do frontend com a variável no comando, ou garanta que o `.env` está correto ANTES do build.
- **Atualizar sistema:**
  ```bash
  git pull
  cd frontend && rm -rf build && REACT_APP_API_URL=https://SEU_DOMINIO npm run build
  cd ../backend && pm2 restart finance-backend --update-env
  ```
- **Ver logs do backend:**
  ```bash
  pm2 logs finance-backend
  ```

---

## 📝 Dicas finais
- Sempre limpe o cache do navegador após novo build (`Ctrl+Shift+R`).
- O backend serve o frontend build automaticamente.
- O sistema é responsivo e pode ser acessado de qualquer dispositivo.

---

Se tiver dúvidas ou problemas, consulte este README ou peça ajuda! 😃
