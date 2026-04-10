/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Kích hoạt chế độ tối dựa trên class 'dark'
  content: [
    "./index.html",
   "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9', // Màu xanh chủ đạo
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}