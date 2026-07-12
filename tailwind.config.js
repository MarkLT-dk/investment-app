/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background:   'var(--color-bg)',
        surface:      'var(--color-surface)',
        'surface-2':  'var(--color-surface-2)',
        border:       'var(--color-border)',
        muted:        'var(--color-muted)',
        slate: {
          100: 'var(--slate-100)',
          200: 'var(--slate-200)',
          300: 'var(--slate-300)',
          400: 'var(--slate-400)',
        },
        ink:  'var(--slate-100)',
        ink2: 'var(--slate-300)',
        blue: {
          300: 'var(--blue-300)',
          400: 'var(--blue-400)',
          900: 'var(--blue-900)',
          950: 'var(--blue-950)',
        },
        green: {
          400: 'var(--green-400)',
          950: 'var(--green-950)',
        },
        red: {
          400: 'var(--red-400)',
          950: 'var(--red-950)',
        },
        yellow: {
          400: 'var(--yellow-400)',
          950: 'var(--yellow-950)',
        },
        purple: {
          300: 'var(--purple-300)',
          950: 'var(--purple-950)',
        },
      },
    },
  },
  plugins: [],
}
