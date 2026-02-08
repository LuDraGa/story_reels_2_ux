import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui required tokens (for Button, etc)
        background: '#fcfcfc',
        foreground: '#404040',
        card: {
          DEFAULT: '#f5f5f5',
          foreground: '#404040',
        },
        popover: {
          DEFAULT: '#fcfcfc',
          foreground: '#404040',
        },
        primary: {
          DEFAULT: '#7ab598', // Sage - for buttons
          foreground: '#ffffff',
          // Background scale (off-white/cream)
          50: '#fefefe',
          100: '#fcfcfc',
          200: '#f9f9f9',
          300: '#f5f5f5',
          400: '#f0f0f0',
          500: '#ebebeb',
          600: '#e5e5e5',
          700: '#d4d4d4',
          800: '#c4c4c4',
          900: '#a3a3a3',
        },
        secondary: {
          DEFAULT: '#f5f5f5', // For secondary buttons
          foreground: '#404040',
          // Text scale (soft grays)
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        muted: {
          DEFAULT: '#f5f5f5',
          foreground: '#737373',
        },
        accent: {
          DEFAULT: '#7ab598', // Sage
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        border: '#e5e5e5',
        input: '#e5e5e5',
        ring: '#7ab598',
        // Custom accent colors (for explicit use)
        'accent-sage': '#7ab598',
        'accent-lavender': '#b8a1d3',
        'accent-mist-blue': '#8db9d3',
        // ACCENT (10%) - Sage (primary accent)
        sage: {
          50: '#f6f9f7',
          100: '#e8f2ed',
          200: '#d1e5da',
          300: '#a8ceb9',
          400: '#7ab598',  // Main sage
          500: '#5a9d7d',
          600: '#478165',
          700: '#3a6753',
          800: '#315244',
          900: '#2a4439',
        },
        // ACCENT - Lavender (secondary accent)
        lavender: {
          50: '#faf8fc',
          100: '#f3eff8',
          200: '#e7dff1',
          300: '#d4c5e4',
          400: '#b8a1d3',  // Main lavender
          500: '#9e81be',
          600: '#8566a6',
          700: '#6f5389',
          800: '#5d4672',
          900: '#4e3c5e',
        },
        // ACCENT - Mist Blue (tertiary accent)
        mist: {
          50: '#f6f9fb',
          100: '#ebf3f7',
          200: '#d7e7ef',
          300: '#b5d3e3',
          400: '#8db9d3',  // Main mist blue
          500: '#6fa1c4',
          600: '#5685b0',
          700: '#476c8f',
          800: '#3c5b76',
          900: '#344c62',
        },
      },
      fontFamily: {
        // HEADING font - Bold, impactful
        display: [
          'Space Grotesk',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        // BODY font - Clean, readable
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        // ACCENT font - Technical, modern
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Consolas',
          'Monaco',
          'Courier New',
          'monospace',
        ],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.5' }],
        sm: ['0.875rem', { lineHeight: '1.6' }],
        base: ['1rem', { lineHeight: '1.7' }],
        lg: ['1.125rem', { lineHeight: '1.7' }],
        xl: ['1.25rem', { lineHeight: '1.7' }],
        '2xl': ['1.5rem', { lineHeight: '1.5' }],
        '3xl': ['1.875rem', { lineHeight: '1.4' }],
        '4xl': ['2.25rem', { lineHeight: '1.3' }],
        '5xl': ['3rem', { lineHeight: '1.2' }],
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-sage': 'linear-gradient(135deg, #7ab598 0%, #5a9d7d 100%)',
        'gradient-lavender': 'linear-gradient(135deg, #b8a1d3 0%, #9e81be 100%)',
        'gradient-mist': 'linear-gradient(135deg, #8db9d3 0%, #6fa1c4 100%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgba(122, 181, 152, 0.1) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(184, 161, 211, 0.08) 0px, transparent 50%)',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
