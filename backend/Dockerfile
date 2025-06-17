# Imagem base
FROM node:24-alpine

# Define o diretório de trabalho no container
WORKDIR /app

# Copia os arquivos de definição de dependência e instala
COPY package*.json ./
RUN npm install --omit=dev # Instala apenas as dependências de produção

# Copia todo o código fonte
COPY . .

# Expõe a porta que a aplicação irá escutar
EXPOSE 5000

# Comando para iniciar a aplicação
CMD ["npm", "start"]