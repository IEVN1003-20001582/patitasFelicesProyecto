/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Aquí le decimos a Tailwind: "Busca clases en todos mis archivos HTML y TS"
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      // 2. Tus Colores Personalizados
      colors: {
        'primary-dark': '#2C3E50', 
        'secondary-teal': '#48C9B0', 
        'accent-yellow': '#F4D03F', 
        'light-bg': '#F4F6F6',
        'light-red': '#E74C3C',
        'light-green': '#2ECC71',
      },
      // 3. Tu Fuente
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      // 4. Tus Animaciones (Copiadas de tu paginaDeBienvenida.html)
      keyframes: {
        fadeAndScale: {
            '0%': { opacity: '1', transform: 'scale(0.8)' },
            '100%': { opacity: '0', transform: 'scale(1.5)' },
        },
   
      },
      animation: {
        'paw-print': 'fadeAndScale 1s ease-out forwards',
        'walk': 'walkAcross 20s linear infinite',
      }
    },
  },
  plugins: [],
}