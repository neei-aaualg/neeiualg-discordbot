FROM node:20-bookworm-slim

# Instala openssl para compatibilidade com o Prisma Query Engine em Linux
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia ficheiros de dependências e esquema do Prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instala dependências e gera o Prisma Client automaticamente
RUN npm install

# Copia o código fonte do bot
COPY . .

EXPOSE 5555

# Se a variável APP_TYPE for "studio", inicia o Prisma Studio; caso contrário, inicia o bot
CMD ["sh", "-c", "if [ \"$APP_TYPE\" = \"studio\" ]; then npm run studio:server; else npm start; fi"]
