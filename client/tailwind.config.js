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
        // WhatsApp-inspired color palette
        'wa-dark': {
          primary: '#111b21',
          secondary: '#202c33',
          tertiary: '#2a3942',
          border: '#2a3942',
          'message-sent': '#005c4b',
          'message-received': '#202c33',
        },
        'wa-light': {
          primary: '#f0f2f5',
          secondary: '#ffffff',
          tertiary: '#f9f9f9',
          border: '#d1d9db',
          'message-sent': '#dcf8c6',
          'message-received': '#ffffff',
        },
        'wa-accent': '#00a884',
        'wa-text': {
          primary: '#e9edef',
          secondary: '#8796a1',
          tertiary: '#667781',
        },
        'wa-text-light': {
          primary: '#111b21',
          secondary: '#667781',
          tertiary: '#8696a6',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-green': 'pulseGreen 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGreen: {
          '0%, 100%': { backgroundColor: '#00a884' },
          '50%': { backgroundColor: '#00d4aa' },
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        'mobile': {'max': '767px'},
        'tablet': {'min': '768px', 'max': '1023px'},
        'desktop': {'min': '1024px'},
      }
    },
  },
  plugins: [],
}