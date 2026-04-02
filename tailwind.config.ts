import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#818CF8',
          dark: '#6366F1',
        },
        background: {
          DEFAULT: '#09090b',
          card: '#18181b',
          hover: '#27272a',
        },
        border: {
          DEFAULT: '#3f3f46',
          hover: '#71717a',
        },
        text: {
          primary: '#fafafa',
          secondary: '#a1a1aa',
        },
        upvote: '#818CF8',
        downvote: '#7193ff',
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      screens: {
        xs: '475px',
      },
    },
  },
  plugins: [],
}

export default config
