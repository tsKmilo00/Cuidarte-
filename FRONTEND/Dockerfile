# Etapa 1: Construcción
FROM node:25 AS builder

WORKDIR /app

# Argumento para la URL de la API
ARG VITE_API_URL=http://localhost:4444

# Copiar archivos de dependencias
COPY package*.json ./

# Instalación limpia (con versión fija en los paquetes extra).
# Soluciona problemas con dependencias opcionales de rollup y esbuild.
RUN rm -rf node_modules package-lock.json && \
    npm install && \
    npm install @rollup/rollup-linux-x64-gnu@4 --save-optional && \
    npm rebuild esbuild

# Copiar código fuente
COPY . .

# Establecer variable de entorno para el build
ENV VITE_API_URL=${VITE_API_URL}

# Reconstruir esbuild después de copiar todo, para asegurar compatibilidad
RUN rm -rf node_modules/.cache && npm rebuild esbuild --force

# Construir la aplicación
RUN npm run build

# Etapa 2: Producción
# Imagen oficial de nginx SIN privilegios: no corre como root y escucha en el puerto 8080
FROM nginxinc/nginx-unprivileged:1.27-alpine

# Copiar los archivos construidos desde la etapa de construcción
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
