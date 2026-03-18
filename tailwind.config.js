/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        red: { DEFAULT: '#e50914', hover: '#cc0812' },
        card: '#111111',
        bg: '#050505',
      }
    },
  },
  plugins: [],
}