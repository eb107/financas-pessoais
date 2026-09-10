import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Por padrão o Vite rejeita requisições com um Host desconhecido
    // (proteção contra DNS rebinding). URLs do Cloudflare Tunnel (modo
    // rápido, sem domínio fixo) sempre terminam em .trycloudflare.com,
    // mesmo mudando a cada execução — liberar só esse sufixo é mais
    // seguro que liberar qualquer host.
    allowedHosts: ['.trycloudflare.com'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
