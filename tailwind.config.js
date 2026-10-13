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
          light: 'var(--theme-chassis-light, #D6D1C2)', // Game Boy DMG-01 classic grey/cream casing
          dark: 'var(--theme-chassis-dark, #141814)',  // Game Boy Pocket Dark matrix casing
        },
        surface: {
          light: '#FFFFFF', // Game Boy crisp white cartridge / card face
          dark: '#1C231C',
        },
        surfaceElevated: {
          light: '#F8F7F3',
          dark: '#242C24',
        },
        border: {
          light: '#242A20', // Solid retro pixel contour
          dark: '#3C4A38',
        },
        gameboy: {
          shell: '#D6D1C2',
          shellDark: '#141814',
          bezel: '#363842',
          screenLight: '#9BBC0F',
          screenMid: '#8BAC0F',
          screenDark: '#306230',
          screenBlack: '#0F380F',
          btnA: '#8B1E43',
          btnB: '#8B1E43',
          dpad: '#282A36',
          battery: '#DC2626',
          stripeRed: '#8B1E43',
          stripeBlue: '#243C78',
        },
        moneyIn: {
          DEFAULT: '#306230',
          light: '#9BBC0F',
          dark: '#0F380F',
        },
        moneyOut: {
          DEFAULT: '#8B1E43',
          light: '#F8D7DF',
          dark: '#4A0D21',
        },
        moneyLend: {
          DEFAULT: '#B45309',
          light: '#FEF3C7',
          dark: '#78350F',
        },
        moneyBack: {
          DEFAULT: '#15803D',
          light: '#DCFCE7',
          dark: '#14532D',
        },
      },
      fontFamily: {
        pixel: [
          '"Press Start 2P"',
          'monospace',
        ],
        silkscreen: [
          '"Silkscreen"',
          'monospace',
        ],
        sans: [
          '"Noto Sans Thai"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        brand: [
          '"Silkscreen"',
          '"Outfit"',
          '"Noto Sans Thai"',
          'sans-serif',
        ],
      },
      borderWidth: {
        '1': '1px',
        '2': '2px',
        '3': '3px',
      },
    },
  },
  plugins: [],
}
