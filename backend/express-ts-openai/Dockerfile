# ── STAGE 1: builder (instala todo lo necesario para compilar) ──
FROM node:18-slim AS builder

RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

# ── STAGE 2: runner (imagen final liviana, solo lo necesario) ──
FROM node:18-slim AS runner

# Solo ffmpeg, sin compiladores
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar solo lo necesario del builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

COPY . .

RUN mkdir -p uploads temp_voice && chmod 777 uploads temp_voice

EXPOSE 3000
CMD ["node", "src/services/app.js"]
