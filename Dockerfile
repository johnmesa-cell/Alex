# 1. Usamos una imagen ligera de Node.js
FROM node:18-alpine

# 2. Creamos y definimos el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiamos solo los archivos de dependencias primero 
# (Esto ayuda a que Docker cachee las librerías y no las reinstale si no cambian)
COPY backend/package*.json ./

# 4. Instalamos las dependencias de forma limpia
RUN npm install --omit=dev

# 5. Copiamos todo el código del backend al contenedor
COPY backend/ .

# 6. Exponemos el puerto que usa tu app (por defecto suele ser 3000 o 4000)
EXPOSE 3000

# 7. Comando profesional para arrancar la aplicación
CMD ["node", "index.js"]