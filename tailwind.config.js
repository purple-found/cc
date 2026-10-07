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
        concert: {
          50: '#fbf9f5',
          100: '#f5f0e6',
          200: '#ebdcc5',
          300: '#dec29d',
          400: '#cfa272',
          500: '#b88648',
          600: '#9b6c38',
          700: '#7d522c',
          800: '#5f3d23',
          900: '#3d2616',
        },
        hall: {
          950: '#0c0f17',
          900: '#121724',
          850: '#171e2e',
          800: '#1f293d',
          700: '#2d3a54',
          600: '#3f4f70'
        }
      },
      fontFamily: {
        serif: ['"Noto Serif KR"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Pretendard"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
