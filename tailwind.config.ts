import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Color Hunt Palette: #6D0808, #2D0000, #757D6F, #EEEAD7
        maroon: {
          950: '#150000',
          900: '#2D0000', // Base dark surface
          800: '#3D0404',
          700: '#520707',
          600: '#6D0808', // Primary brand crimson
          500: '#870E0E',
          400: '#A81818'
        },
        sage: {
          800: '#474D43',
          700: '#5E6559',
          600: '#757D6F', // Muted slate olive
          500: '#8E9787',
          400: '#A9B3A1',
          300: '#C7D0BF'
        },
        cream: {
          100: '#FFFFFF',
          DEFAULT: '#EEEAD7', // High contrast ivory text
          200: '#DDD8C1',
          300: '#C7C1A7'
        },
        background: '#150000',
        surface: '#2D0000',
        card: '#220000',
        border: '#450707',
        muted: '#757D6F',
        'muted-foreground': '#A9B3A1',
        primary: {
          DEFAULT: '#6D0808',
          hover: '#870E0E',
          foreground: '#EEEAD7'
        },
        secondary: {
          DEFAULT: '#757D6F',
          foreground: '#EEEAD7'
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
