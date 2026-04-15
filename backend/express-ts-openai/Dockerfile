FROM node:18-slim

# Instalar dependencias del sistema para gTTS (Python es necesario por gTTS y ffmpeg en algunas versiones de node-gtts)

RUN apt-get update && apt-get install -y python3 make g++ ffmpeg && rm -rf /var/lib/apt/lists/*

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
