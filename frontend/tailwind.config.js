/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        civic: {
          blue:    '#1A73E8',
          green:   '#34A853',
          yellow:  '#FBBC04',
          red:     '#EA4335',
          orange:  '#FF8C00',
          dark:    '#1C1C2E',
          surface: '#F8F9FA',
          border:  '#E8EAED',
          text:    '#202124',
          muted:   '#5F6368',
        },
        cie: {
          primary: '#1A73E8',
          secondary: '#34A853',
          accent: '#A142F4',
        }
      },
      backgroundImage: {
        'cie-gradient': 'linear-gradient(135deg, #1A73E8 0%, #A142F4 50%, #34A853 100%)',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Google Sans Display"', 'Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'xs':   ['0.75rem',    { lineHeight: '1rem' }],
        'sm':   ['0.8125rem',  { lineHeight: '1.25rem' }],
        'base': ['0.9375rem',  { lineHeight: '1.5rem' }],
        'lg':   ['1.0625rem',  { lineHeight: '1.75rem' }],
        'xl':   ['1.25rem',    { lineHeight: '1.75rem' }],
        '2xl':  ['1.5rem',     { lineHeight: '2rem' }],
        '3xl':  ['1.75rem',    { lineHeight: '2.25rem' }],
        '4xl':  ['2.25rem',    { lineHeight: '2.5rem' }],
      },
      borderRadius: {
        'card': '12px',
        'btn':  '8px',
        'pill': '20px',
      },
      boxShadow: {
        'card':  '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
        'modal': '0 8px 40px rgba(0,0,0,0.18)',
        'map':   '0 2px 8px rgba(0,0,0,0.12)',
        'cie':   '0 0 0 2px #1A73E8, 0 4px 24px rgba(26,115,232,0.15)',
        'cie-glow': '0 0 15px rgba(26,115,232,0.5), 0 0 30px rgba(161,66,244,0.3)',
      },
      animation: {
        'cie-pulse':    'cie-pulse 2s ease-in-out infinite',
        'score-fill':   'score-fill 1s ease-out forwards',
        'fade-in':      'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'cie-scan':     'cie-scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'stress-breathe': 'stress-breathe 3s ease-in-out infinite',
        'resolution-bloom': 'resolution-bloom 1.5s ease-out forwards',
      },
      keyframes: {
        'cie-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(26,115,232,0.3)' },
          '50%':      { boxShadow: '0 0 0 6px rgba(26,115,232,0)' },
        },
        'score-fill': {
          from: { width: '0%' },
          to:   { width: 'var(--target-width)' },
        },
        'fade-in': {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: 0, transform: 'translateX(16px)' },
          to:   { opacity: 1, transform: 'translateX(0)' },
        },
        'cie-scan': {
          '0%': { transform: 'translateY(-100%)', opacity: 0 },
          '10%': { opacity: 1 },
          '90%': { opacity: 1 },
          '100%': { transform: 'translateY(100%)', opacity: 0 },
        },
        'stress-breathe': {
          '0%, 100%': { backgroundColor: 'rgba(234, 67, 53, 0.02)' },
          '50%': { backgroundColor: 'rgba(234, 67, 53, 0.08)' },
        },
        'resolution-bloom': {
          '0%': { backgroundColor: 'rgba(52, 168, 83, 0.4)', transform: 'scale(0.95)', opacity: 1 },
          '100%': { backgroundColor: 'rgba(52, 168, 83, 0)', transform: 'scale(1.05)', opacity: 0 },
        },
      },
    },
  },
  plugins: [],
}
