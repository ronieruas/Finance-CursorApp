# Use a imagem oficial do Node.js como base
FROM node:18-alpine

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copie os arquivos package.json e package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instale as dependências do projeto
RUN npm install

# Copie o restante do código da aplicação para o diretório de trabalho
COPY . .

# Construa a aplicação React para produção
RUN npm run build

# Use uma imagem Nginx leve para servir os arquivos estáticos
FROM nginx:alpine

# Copie a configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie os arquivos de build da aplicação React para o diretório de serviço do Nginx
COPY --from=0 /app/build /usr/share/nginx/html

# Exponha a porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]