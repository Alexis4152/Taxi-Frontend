import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// Por defecto el servidor de desarrollo sigue siendo HTTP normal (http://localhost:5173), igual
// que siempre. Poner VITE_DEV_HTTPS=true (una vez, en la terminal) activa HTTPS con un
// certificado autofirmado - solo hace falta si vas a abrir la app desde el celular por la IP de
// tu red local, porque el navegador solo permite pedir el GPS en HTTPS o en localhost.
const useHttps = process.env.VITE_DEV_HTTPS === 'true'

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(useHttps ? [basicSsl()] : [])],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    host: true, // permite entrar tambien por la IP de tu red local (ej. http://192.168.x.x:5173) para probar en otros dispositivos
    // El navegador siempre habla con este mismo origen (/api, /ws); Vite reenvia por detras al
    // backend. Si se activa VITE_DEV_HTTPS, esto ademas evita "contenido mixto" (pagina HTTPS
    // llamando a un backend HTTP).
    proxy: {
      '/api': { target: 'http://localhost:8081', changeOrigin: true },
      '/ws': { target: 'http://localhost:8081', changeOrigin: true, ws: true },
      '/uploads': { target: 'http://localhost:8081', changeOrigin: true },
    },
  },
})
