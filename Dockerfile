# ---- Build: compila el sitio con Vite (Vite 8 requiere Node >= 20.19) ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# VITE_API_URL / VITE_WS_URL se leen de .env.production (versionado). No se declaran como ARG a
# proposito: un build arg vacio desde Coolify sobreescribiria el valor del archivo.
RUN npm run build

# ---- Runtime: nginx sirviendo los estaticos ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
