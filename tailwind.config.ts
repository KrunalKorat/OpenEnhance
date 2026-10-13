import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          canvas: '#101218',
          sidebar: '#151922',
          surface: '#1A202B',
          elevated: '#222A38',
        },
        border: {
          subtle: '#30394A',
        },
        text: {
          primary: '#F4F6FA',
          secondary: '#A9B2C2',
          muted: '#7D8798',
        },
        accent: {
          primary: '#7C8CFF',
          'primary-hover': '#6A7BF5',
          secondary: '#48C6D9',
        },
        status: {
          success: '#49C995',
          warning: '#F2B45D',
          error: '#FF727C',
        },
      },
      borderRadius: {
        control: '8px',
        panel: '12px',
        card: '16px',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
