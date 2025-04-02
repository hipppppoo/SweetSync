/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#FFC1CC', // Light pink
          DEFAULT: '#FF99AA', // Medium pink
          dark: '#FF7788', // Dark pink
        },
        secondary: {
          light: '#E6E6FA', // Lavender
          DEFAULT: '#D4F4DD', // Mint
          dark: '#FFDAB9', // Peach
        },
      },
      fontFamily: {
        display: ['Dancing Script', 'cursive'],
        body: ['Lato', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 