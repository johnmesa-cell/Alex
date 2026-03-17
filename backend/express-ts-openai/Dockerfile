FROM node:18-alpine
WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./
RUN npm install --omit=dev

# Copiamos el resto del código (incluyendo la carpeta src)
COPY . .

EXPOSE 3000

# Ejecutamos el punto de entrada de JavaScript
CMD ["node", "/app/src/services/app.js"]