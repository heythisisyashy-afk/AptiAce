/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0f172a',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          50: '#f8fafc',
        }
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
        mono: ['Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        lg: '0 10px 25px rgba(0, 0, 0, 0.3)',
        xl: '0 20px 50px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
}
