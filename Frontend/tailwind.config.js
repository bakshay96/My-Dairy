/** @type {import('tailwindcss').Config} */
const {nextui} = require("@nextui-org/react");
require('@tailwindcss/forms')
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",

  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A',
        secondary: '#9333EA',
        background: '#F3F4F6',
        darkBackground: '#1F2937',
        modalBg: 'rgba(0, 0, 0, 0.5)',
      },
    },
  },
  darkMode: "class",
  plugins: [nextui(),require('@tailwindcss/forms')],
}