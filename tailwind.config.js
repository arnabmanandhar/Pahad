/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0f766e',
          dark: '#115e59',
          soft: '#d7f7f1',
        },
        ink: '#0f172a',
        mist: '#f8fafc',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(15, 118, 110, 0.15), 0 20px 35px -20px rgba(15, 118, 110, 0.45)',
      },
      backgroundImage: {
        topo: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"160\" height=\"160\" viewBox=\"0 0 160 160\" fill=\"none\"%3E%3Cpath d=\"M-20 120C10 90 20 92 48 74C67 62 84 53 101 48C124 40 147 40 182 60\" stroke=\"rgba(15,118,110,0.16)\" stroke-width=\"2\"/%3E%3Cpath d=\"M-10 145C21 117 40 116 68 98C88 86 105 79 126 78C145 77 162 83 185 99\" stroke=\"rgba(16,185,129,0.16)\" stroke-width=\"2\"/%3E%3Cpath d=\"M-18 92C18 58 46 54 83 39C111 28 137 29 177 49\" stroke=\"rgba(15,118,110,0.1)\" stroke-width=\"2\"/%3E%3C/svg%3E')",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.92)', opacity: '0.7' },
          '70%': { transform: 'scale(1.08)', opacity: '0' },
          '100%': { transform: 'scale(1.08)', opacity: '0' },
        },
      },
      animation: {
        'pulse-ring': 'pulseRing 2.4s ease-out infinite',
      },
    },
  },
  plugins: [],
};
