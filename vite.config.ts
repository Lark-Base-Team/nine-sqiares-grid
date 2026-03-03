import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { semiTheming } from 'vite-plugin-semi-theming'
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
      react(),
      svgr(),
      semiTheming({
        theme: "@semi-bot/semi-theme-feishu-dashboard"
      })
  ],
  server: {
    host: "0.0.0.0",
  },
  test: {
    environment: 'jsdom',
  },
})
