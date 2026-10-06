import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#0A0A0F',
        card: '#111118',
        border: '#1F1F2E',
        muted: '#181824',
        'muted-foreground': '#94A3B8',
        primary: {
          DEFAULT: '#E11D48', // Cinema Play Red (From ui-ux-pro-max OLED palette)
          hover: '#BE123C',
          foreground: '#FFFFFF'
        },
        secondary: {
          DEFAULT: '#1E1B4B',
          foreground: '#E0E7FF'
        },
        accent: '#F43F5E'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
} satisfies Config;
