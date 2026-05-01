/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fdf8f0",
          100: "#f9edd9",
          200: "#f2d7a8",
          300: "#e8bc6e",
          400: "#dea040",
          500: "#c8822a",
          600: "#b06620",
          700: "#8e4d1c",
          800: "#743f1e",
          900: "#60351c",
          950: "#371a0c",
        },
      },
    },
  },
  plugins: [],
};
