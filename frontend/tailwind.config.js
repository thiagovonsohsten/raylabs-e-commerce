/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lexend', 'system-ui', 'sans-serif'],
      },
      colors: {
        ray: {
          black: '#000000',
          surface: '#0a0a0a',
          card: '#141414',
          elevated: '#1e1e1e',
          border: '#2e2e2e',
          muted: '#71717a',
        },
      },
      backgroundImage: {
        'ray-gradient': 'linear-gradient(to right, #c77dff, #9d4edd)',
        'ray-gradient-hover': 'linear-gradient(to right, #d4a3ff, #a855f0)',
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(157, 78, 221, 0.35)',
      },
    },
  },
  plugins: [],
};
