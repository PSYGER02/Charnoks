/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./design-system/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter Variable', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'ui-monospace', 'monospace'],
        'display': ['Instrument Serif', 'ui-serif', 'serif']
      },
      colors: {
        // Legacy support
        primary: '#ef6820',
        'text-primary': '#ffffff',
        'text-on-primary': '#ffffff',
        'background-primary': '#121212',
        'background-secondary': '#1e1e1e',
        
        // Revolutionary design system colors
        'primary': {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
          950: 'var(--color-primary-950)'
        },
        'accent': {
          50: 'var(--color-accent-50)',
          100: 'var(--color-accent-100)',
          200: 'var(--color-accent-200)',
          300: 'var(--color-accent-300)',
          400: 'var(--color-accent-400)',
          500: 'var(--color-accent-500)',
          600: 'var(--color-accent-600)',
          700: 'var(--color-accent-700)',
          800: 'var(--color-accent-800)',
          900: 'var(--color-accent-900)',
          950: 'var(--color-accent-950)'
        }
      },
      spacing: {
        '0.5': 'var(--space-0-5)',
        '1.5': 'var(--space-1-5)',
        '2.5': 'var(--space-2-5)',
        '3.5': 'var(--space-3-5)'
      },
      borderRadius: {
        'xs': 'var(--radius-sm)',
        '4xl': 'var(--radius-3xl)'
      },
      boxShadow: {
        'glass': 'var(--shadow-glass)',
        'glass-lg': 'var(--shadow-glass-lg)',
        'glow-primary': 'var(--glow-primary)',
        'glow-success': 'var(--glow-success)',
        'glow-warning': 'var(--glow-warning)',
        'glow-error': 'var(--glow-error)',
        '3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.25)',
        '4xl': '0 45px 80px -15px rgba(0, 0, 0, 0.3)',
        '5xl': '0 60px 120px -20px rgba(0, 0, 0, 0.4)'
      },
      backdropBlur: {
        'xs': '2px',
        '4xl': '72px'
      },
      animation: {
        'fade-in': 'fade-in var(--duration-normal) var(--easing-ease-out)',
        'slide-up': 'slide-up var(--duration-normal) var(--easing-ease-out)',
        'scale-in': 'scale-in var(--duration-normal) var(--easing-bounce)',
        'bounce-in': 'bounce-in var(--duration-slow) var(--easing-elastic)',
        'float': 'float 3s var(--easing-ease-in-out) infinite',
        'glass-morph': 'glass-morph 4s ease-in-out infinite',
        'glass-shimmer': 'glass-shimmer 3s infinite'
      },
      keyframes: {
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' }
        },
        'slide-up': {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        },
        'scale-in': {
          'from': { opacity: '0', transform: 'scale(0.9)' },
          'to': { opacity: '1', transform: 'scale(1)' }
        },
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        'glass-morph': {
          '0%': { 'backdrop-filter': 'blur(12px)', 'border-radius': '16px' },
          '50%': { 'backdrop-filter': 'blur(25px)', 'border-radius': '24px' },
          '100%': { 'backdrop-filter': 'blur(12px)', 'border-radius': '16px' }
        },
        'glass-shimmer': {
          '0%': { 'background-position': '-200% 0' },
          '100%': { 'background-position': '200% 0' }
        }
      }
    }
  },
  plugins: []
}
