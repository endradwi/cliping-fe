import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Color Hunt Midnight Navy: #010736, #0D1C42, #22396F, #FCF1D0
        navy: {
          950: '#010736', // Deep Obsidian Midnight canvas
          900: '#0D1C42', // Surface panel
          800: '#162854', // Hover surface
          700: '#22396F', // Elevated card & borders
          600: '#2D4B91',
          500: '#3E64BD'
        },
        cream: {
          100: '#FFFFFF',
          DEFAULT: '#FCF1D0', // Warm ivory cream text & accent
          200: '#F5E8B8',
          300: '#EBD899'
        },
        slateBlue: {
          400: '#8FA2CB',
          500: '#677FA8',
          600: '#485C80'
        },
        background: '#010736',
        surface: '#0D1C42',
        card: '#162854',
        border: '#22396F',
        muted: '#677FA8',
        'muted-foreground': '#8FA2CB',
        primary: {
          DEFAULT: '#FCF1D0',
          hover: '#F5E8B8',
          foreground: '#010736'
        },
        secondary: {
          DEFAULT: '#22396F',
          foreground: '#FCF1D0'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
} satisfies Config;
