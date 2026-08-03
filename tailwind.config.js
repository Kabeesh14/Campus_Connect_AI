/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'sans-serif'],
        brand: ['Poppins', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#6366F1',
          50: '#EEF0FF', 100: '#E0E3FF', 200: '#C7CCFE', 300: '#A5ACFC',
          400: '#8189F8', 500: '#6366F1', 600: '#4F46E5', 700: '#4338CA',
          800: '#3730A3', 900: '#312E81',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          50: '#F5F3FF', 100: '#EDE9FE', 200: '#DDD6FE', 300: '#C4B5FD',
          400: '#A78BFA', 500: '#8B5CF6', 600: '#7C3AED', 700: '#6D28D9',
          800: '#5B21B6', 900: '#4C1D95',
        },
        accent: {
          DEFAULT: '#06B6D4',
          50: '#ECFEFF', 100: '#CFFAFE', 200: '#A5F3FC', 300: '#67E8F9',
          400: '#22D3EE', 500: '#06B6D4', 600: '#0891B2', 700: '#0E7490',
        },
        success: { DEFAULT: '#10B981' },
        warning: { DEFAULT: '#F59E0B' },
        danger: { DEFAULT: '#EF4444' },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        'gradient-brand': 'linear-gradient(135deg, #6366F1 0%, #06B6D4 100%)',
        'gradient-aurora': 'linear-gradient(120deg, #6366F1 0%, #8B5CF6 40%, #06B6D4 100%)',
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(99, 102, 241, 0.5)',
        'glow-lg': '0 0 60px -15px rgba(139, 92, 246, 0.6)',
        soft: '0 4px 24px -6px rgba(15, 23, 42, 0.08)',
        'soft-lg': '0 20px 60px -12px rgba(15, 23, 42, 0.12)',
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem', '4xl': '2rem' },
      keyframes: {
        aurora: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)', opacity: '0.55' },
          '33%': { transform: 'translate(6%, -4%) scale(1.1)', opacity: '0.75' },
          '66%': { transform: 'translate(-4%, 6%) scale(0.95)', opacity: '0.6' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '70%': { transform: 'scale(1.3)', opacity: '0' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        aurora: 'aurora 18s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
        'gradient-pan': 'gradient-pan 6s ease infinite',
        marquee: 'marquee 28s linear infinite',
      },
    },
  },
  plugins: [],
};
