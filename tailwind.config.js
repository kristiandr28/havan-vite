/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warna khusus untuk branding Havana
        havanaPink: '#EC4899',
        havanaBlue: '#3B82F6',
        havanaGray: '#1F2937',
      },
      fontFamily: {
        // Font khusus (opsional, bisa disesuaikan)
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
