import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 1010,
    host: "0.0.0.0"
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
