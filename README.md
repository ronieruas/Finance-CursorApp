# Finance App

## 🚀 Deploy Rápido (Docker + LXC + GitHub)

### 1. Pré-requisitos
- Docker e Docker Compose instalados
- Acesso ao repositório no GitHub
- Portas necessárias liberadas (ex: 80/443 para frontend, 3001 para backend)

### 2. Clone o repositório
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO
```

### 3. Configure variáveis de ambiente
- Edite os arquivos `.env` do backend e frontend conforme necessário.
- Exemplo para produção no frontend:
  ```
  REACT_APP_API_URL=http://SEU_IP_PUBLICO:3001
  ```

### 4. Build e deploy com Docker Compose
```bash
docker-compose build
docker-compose up -d
```

### 5. Crie o usuário admin inicial
Se for o primeiro deploy, rode o script de seed para criar o usuário admin:
```bash
docker-compose exec backend node src/scripts/seedAdmin.js
```
- O script irá mostrar no terminal o e-mail e senha do admin criados (ex: `admin@admin.com` / `admin123`).

### 6. Faça o primeiro login
- Acesse o sistema pelo navegador: `http://SEU_IP:PORTA`
- Use o e-mail e senha do admin criados no passo anterior.
- Após o login, altere a senha se desejar.

### 7. Dicas de troubleshooting
- **Erro 401 (Credenciais inválidas):** Rode o seedAdmin.js para criar o admin.
- **Erro de conexão (ERR_BLOCKED_BY_CLIENT):**
  - Desative AdBlock/Privacy Badger/uBlock.
  - Verifique se o `.env` do frontend aponta para o backend correto.
  - Certifique-se de que o backend está rodando e acessível.
- **Atualizar sistema:**
  ```bash
  git pull && docker-compose build && docker-compose up -d
  ```
- **Ver logs:**
  ```bash
  docker-compose logs -f backend
  docker-compose logs -f frontend
  ```

---

## 📱 Mobile
O sistema é responsivo, mas pode haver pequenos ajustes a fazer para experiência 100% mobile. Após os testes, otimize conforme necessário.

---

## 🛠️ Script de build/deploy sugerido
```bash
#!/bin/bash
git pull
docker-compose build
docker-compose up -d
docker-compose exec backend node src/scripts/seedAdmin.js # (apenas no primeiro deploy)
docker-compose ps
```

---

Se tiver dúvidas ou problemas, consulte este README ou peça ajuda! 😉
