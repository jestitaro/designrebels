/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8b5cf6',
          light: '#ede9fe',
          dark: '#6d28d9',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
      },
      boxShadow: {
        card: '0 4px 30px rgba(221,224,255,.54)',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
