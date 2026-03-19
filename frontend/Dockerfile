FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
# Comando para Vite (el --host es vital para Docker)
CMD ["npm", "run", "dev", "--", "--host"]
