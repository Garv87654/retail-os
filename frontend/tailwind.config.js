/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#badffd',
          300: '#7cc4fc',
          400: '#38a5f8',
          500: '#0e8be4',
          600: '#026fc3',
          700: '#03589e',
          800: '#074c82',
          900: '#0c406d',
          950: '#082949',
        }
      }
    },
  },
  plugins: [],
}
