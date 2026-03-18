FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
# --- ESTA ES LA LÍNEA MÁGICA QUE FALTA ---
COPY prisma ./prisma/
RUN npx prisma generate
# -----------------------------------------
COPY . .
EXPOSE 3000
CMD ["node", "src/services/app.js"]