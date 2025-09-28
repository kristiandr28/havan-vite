import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 👇 tambahkan babel setting supaya .js juga di-parse JSX
export default defineConfig({
  plugins: [
    react({
      babel: {
        presets: ['@babel/preset-react'],
      },
      // ⬇️ force Vite treat .js files as JSX
      jsxRuntime: 'automatic',
      include: ['**/*.jsx', '**/*.js'],
    }),
  ],
})
