/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#070a13',
        surface: '#0f1626',
        'surface-hover': '#151e33',
        primary: '#3b82f6',
        'primary-hover': '#2563eb',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        'glass-border': 'rgba(255, 255, 255, 0.05)',
      }
    },
  },
  plugins: [],
}
