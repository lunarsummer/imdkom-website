/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.html",
    "./assets/js/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1a3c5e', light: '#2a5a7a', dark: '#c2410c' },
        success: { DEFAULT: '#059669', light: '#10b981', dark: '#047857' },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}