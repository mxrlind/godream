import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // GoDream neon palette
        neon: {
          purple: '#7c5cff',
          cyan: '#00e5ff',
          magenta: '#ff3df0',
          mint: '#34f5c5',
          gold: '#ffd166',
          orange: '#ff7a18',
        },
        surface: {
          DEFAULT: '#0e0e16',
          '1': '#13131f',
          '2': '#1a1a2e',
          '3': '#222238',
          '4': '#2a2a46',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          strong: 'rgba(255,255,255,0.15)',
        },
        text: {
          DEFAULT: '#f0f0ff',
          primary: '#f0f0ff',
          secondary: '#a0a0c0',
          dim: '#6b6b8a',
          muted: '#454565',
        },
      },
      fontFamily: {
        display: ['var(--font-syne)', 'var(--font-space-grotesk)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'xp-burst': 'xp-burst 1.2s ease-out forwards',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'streak-fire': 'streak-fire 1s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.8', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.3)' },
        },
        'xp-burst': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-60px) scale(1.2)', opacity: '0' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'streak-fire': {
          '0%, 100%': { transform: 'scale(1) rotate(-3deg)' },
          '50%': { transform: 'scale(1.1) rotate(3deg)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-neon': 'linear-gradient(135deg, #7c5cff, #00e5ff)',
        'gradient-warm': 'linear-gradient(135deg, #ff3df0, #ff7a18)',
        'gradient-surface': 'linear-gradient(180deg, #13131f 0%, #0e0e16 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(124, 92, 255, 0.4)',
        'neon-cyan': '0 0 20px rgba(0, 229, 255, 0.4)',
        'neon-magenta': '0 0 20px rgba(255, 61, 240, 0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};

export default config;
