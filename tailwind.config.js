// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        'ritual-dark': '#050505',
        'ritual-accent': '#22c55e', // El verde neón/gótico
      },
      animation: {
        'flicker': 'flicker 0.2s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      fontFamily: {
        'ritual-title': ['RitualTitle', 'serif'],
        'ritual-body': ['RitualBody', 'sans'],
      },
    },
  },
}