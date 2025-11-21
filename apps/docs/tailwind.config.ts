import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{md,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        'ds-background': '#F4F5F7',
        'ds-surface': '#FFFFFF',
        'ds-border': '#DFE1E6',
        'ds-primary': '#0052CC',
        'ds-primary-dark': '#0747A6',
        'ds-muted': '#42526E'
      },
      fontFamily: {
        sans: ['"Noto Sans"', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      }
    }
  },
  plugins: [typography]
};

export default config;
