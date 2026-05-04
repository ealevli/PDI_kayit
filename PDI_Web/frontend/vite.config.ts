import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    // Dev modda tarayıcı cache'i devre dışı bırak
    headers: {
      'Cache-Control': 'no-store',
    },
  },
})
