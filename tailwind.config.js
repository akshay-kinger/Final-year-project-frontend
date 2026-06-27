/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your brand colors from the old project
        primary: {
          DEFAULT: '#00ed64', // The signature bright green
          dark: '#00c050',    // Slightly darker for hover states
        },
        secondary: '#292828', // Dark gray from your old footer
        light: '#f8f9fa',     // Light gray background
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'], // Modern, clean font
      }
    },
  },
  plugins: [],
}