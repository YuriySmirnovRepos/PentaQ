/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gate: {
          x: '#ff4d4f',
          y: '#722ed1',
          z: '#13c2c2',
          h: '#52c41a',
          s: '#1890ff',
          t: '#fa8c16',
          cnot: '#eb2f96',
          swap: '#f5222d',
          rx: '#2f54eb',
          ry: '#a0d911',
          rz: '#fa541c',
          measure: '#595959',
        },
        wire: {
          default: '#d9d9d9',
          active: '#1890ff',
          selected: '#52c41a',
        },
      },
      animation: {
        'pulse-gate': 'pulse-gate 0.3s ease-in-out',
      },
      keyframes: {
        'pulse-gate': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};
