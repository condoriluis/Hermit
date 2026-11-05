import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0e14',
        panel: '#111722',
        'panel-2': '#18212f',
        line: '#263244',
        'line-strong': '#3a4a63',
        text: '#e6edf7',
        'text-2': '#c5d0df',
        muted: '#94a3b8',
        placeholder: '#64748b',
        accent: {
          DEFAULT: '#4f8cff',
          hover: '#6ea8fe',
          soft: 'rgba(79, 140, 255, 0.12)',
          border: 'rgba(79, 140, 255, 0.4)',
        },
        ok: '#4ade80',
        warn: '#fbbf24',
        bad: '#f87171',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 35px -5px rgba(79, 140, 255, 0.35)',
        card: '0 8px 30px rgba(0, 0, 0, 0.5)',
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.02em',
      },
    },
  },
  plugins: [],
}

export default config
