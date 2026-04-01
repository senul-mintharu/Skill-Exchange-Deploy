/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          950: 'var(--color-brand-950)',
          900: 'var(--color-brand-900)',
          800: 'var(--color-brand-800)',
          700: 'var(--color-brand-700)',
          600: 'var(--color-brand-600)',
          500: 'var(--color-brand-500)',
          400: 'var(--color-brand-400)',
          300: 'var(--color-brand-300)',
          200: 'var(--color-brand-200)',
          100: 'var(--color-brand-100)',
          50: 'var(--color-brand-50)',
        },
        canvas: 'var(--color-canvas)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          muted: 'var(--color-surface-muted)',
          raised: 'var(--color-surface-raised)',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          soft: 'var(--color-ink-soft)',
          muted: 'var(--color-ink-muted)',
          subtle: 'var(--color-ink-subtle)',
        },
        line: {
          DEFAULT: 'var(--color-line)',
          strong: 'var(--color-line-strong)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          soft: 'var(--color-success-soft)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          soft: 'var(--color-warning-soft)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          soft: 'var(--color-danger-soft)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          soft: 'var(--color-info-soft)',
        },
        gold: 'var(--color-gold)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        panel: 'var(--radius-panel)',
        chip: 'var(--radius-chip)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        card: 'var(--shadow-card)',
        panel: 'var(--shadow-panel)',
        brand: 'var(--shadow-brand)',
      },
      backgroundImage: {
        'page-gradient': 'var(--gradient-page)',
        'page-glow': 'var(--gradient-page-glow)',
        'brand-gradient': 'var(--gradient-brand)',
        'brand-gradient-strong': 'var(--gradient-brand-strong)',
        'highlight-gradient': 'var(--gradient-highlight)',
        'chip-gradient': 'var(--gradient-chip)',
        'chip-muted-gradient': 'var(--gradient-chip-muted)',
        'surface-gradient': 'var(--gradient-surface)',
      },
      spacing: {
        shell: 'var(--page-shell-y)',
      },
      letterSpacing: {
        snugger: '-0.03em',
      },
      animation: {
        shimmer: 'ui-shimmer 1.6s linear infinite',
        float: 'ui-float 6s ease-in-out infinite',
      },
      keyframes: {
        'ui-shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'ui-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
