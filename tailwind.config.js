/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1677ff',
        danger: '#ff4d4f',
        warning: '#faad14',
        success: '#52c41a',
        dark: '#001529',
      }
    },
  },
  plugins: [],
}
