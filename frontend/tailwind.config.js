/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        milk: {
          50: 'var(--bg-farm)',
          100: '#FAF6EE', // Ivory
          200: '#F5EFE2',
          DEFAULT: '#FFFFFF',
        },
        dairy: {
          sky: 'var(--color-primary)',
          green: 'var(--color-accent)',
          gold: 'var(--color-gold)',
          coral: 'var(--color-coral)',
          text: 'var(--color-text)',
        }
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        space: ['"Space Grotesk"', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 var(--shadow-glass)',
        'glass-hover': '0 12px 40px 0 var(--shadow-glass)',
      }
    },
  },
  plugins: [],
}
