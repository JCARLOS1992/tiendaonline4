/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c0ff',
          300: '#66a0ff',
          400: '#3380ff',
          500: '#007BFF', // Primary blue
          600: '#0062cc',
          700: '#004a99',
          800: '#003166',
          900: '#001833',
        },
        accent: {
          50: '#fff9e6',
          100: '#fff3cc',
          200: '#ffe799',
          300: '#ffdb66',
          400: '#ffcf33',
          500: '#FFD700', // Accent yellow
          600: '#ccac00',
          700: '#998100',
          800: '#665600',
          900: '#332b00',
        },
        success: {
          500: '#10B981', // Green
        },
        warning: {
          500: '#F59E0B', // Amber
        },
        error: {
          500: '#EF4444', // Red
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
      },
    },
  },
  plugins: [],
};