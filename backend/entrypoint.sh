#!/bin/sh

# ==================== SCRIPT ENTRYPOINT ====================
# Este script se ejecuta al iniciar el contenedor

echo "🚀 Iniciando ALEX Backend..."

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté disponible..."
while ! pg_isready -h db -U johndoe -d alexdb > /dev/null 2>&1; do
  echo "  Reintentando en 2 segundos..."
  sleep 2
done

echo "✅ PostgreSQL está disponible"

# Generar cliente de Prisma (importante hacerlo en el contenedor)
echo "📦 Generando cliente de Prisma..."
npx prisma generate

# Esperar un momento para que Prisma esté listo
sleep 2

# Iniciar la aplicación
echo "▶️  Iniciando servidor Express..."
exec node express-ts-openai/src/services/app.js
