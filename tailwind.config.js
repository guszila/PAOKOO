/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          light: '#F8F9FA',
          dark: '#121316',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1C1D22',
        },
        surfaceElevated: {
          light: '#F4F5F7',
          dark: '#24262E',
        },
        border: {
          light: '#E5E7EB',
          dark: '#2E313A',
        },
        moneyIn: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
          dark: '#14532D',
        },
        moneyOut: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
          dark: '#7F1D1D',
        },
        moneyLend: {
          DEFAULT: '#E11D48',
          light: '#FFE4E6',
          dark: '#881337',
        },
        moneyBack: {
          DEFAULT: '#059669',
          light: '#D1FAE5',
          dark: '#064E3B',
        },
      },
      fontFamily: {
        sans: [
          '"Noto Sans Thai"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      borderWidth: {
        '1': '1px',
      },
    },
  },
  plugins: [],
}
