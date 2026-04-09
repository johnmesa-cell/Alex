FROM node:18-slim

# Instalar dependencias del sistema para gTTS (Python es necesario por gTTS en algunas versiones de node-gtts)
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm install
# --- ESTA ES LA LÍNEA MÁGICA QUE FALTA ---
COPY prisma ./prisma/
RUN npx prisma generate
# -----------------------------------------
COPY . .

# Crear las carpetas para evitar errores de permisos
RUN mkdir -p uploads temp_voice && chmod 777 uploads temp_voice

EXPOSE 3000
CMD ["node", "src/services/app.js"]
