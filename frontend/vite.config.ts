import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// `npm run dev:https` (modo "https") serve com certificado autoassinado: o
// navegador do celular só libera a câmera (leitura de QR Code) em HTTPS quando
// o acesso é pelo IP da rede. O `npm run dev` normal segue em HTTP.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'https' ? [basicSsl()] : [])],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
}));
