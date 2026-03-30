/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maple: {
          50:  '#fdf4e7',
          100: '#fbe5c3',
          200: '#f7ca86',
          300: '#f3ae49',
          400: '#ef9a1f',
          500: '#e07b00',
          600: '#c46200',
          700: '#9e4d00',
          800: '#7a3c00',
          900: '#5c2e00',
        },
      },
    },
  },
  plugins: [],
}
