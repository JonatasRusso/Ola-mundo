# Estágio de build para instalar dependências e buildar o projeto
FROM node:24-alpine AS builder

WORKDIR /app

# Copia package.json e package-lock.json (ou yarn.lock)
COPY package.json package-lock.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código
COPY . .

# Comando de build do Next.js
RUN npm run build

# Estágio de produção para servir a aplicação
FROM node:24-alpine AS runner

WORKDIR /app

# Variáveis de ambiente de produção
ENV NODE_ENV=production

# Copia arquivos necessários do estágio de build
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Expõe a porta que o Next.js irá escutar
EXPOSE 3000

# Comando para iniciar a aplicação Next.js
CMD ["npm", "start"]