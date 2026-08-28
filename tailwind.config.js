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
        background: {
          DEFAULT: '#090D16',
          secondary: '#0F1626',
          card: 'rgba(15, 23, 42, 0.75)',
          hover: 'rgba(30, 41, 59, 0.8)',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          cyan: '#06b6d4',
          glow: '#38bdf8',
        },
        real: {
          light: '#ecfdf5',
          DEFAULT: '#10b981',
          dark: '#047857',
          glow: 'rgba(16, 185, 129, 0.4)',
        },
        fake: {
          light: '#fff1f2',
          DEFAULT: '#f43f5e',
          dark: '#be123c',
          glow: 'rgba(244, 63, 94, 0.4)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
        'glow-brand': '0 0 30px -5px rgba(99, 102, 241, 0.45)',
        'glow-real': '0 0 30px -5px rgba(16, 185, 129, 0.5)',
        'glow-fake': '0 0 30px -5px rgba(244, 63, 94, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'scan': 'scan 2.5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0%)' },
          '50%': { transform: 'translateY(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.8, transform: 'scale(1)' },
          '50%': { opacity: 0.3, transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      }
    },
  },
  plugins: [],
}
