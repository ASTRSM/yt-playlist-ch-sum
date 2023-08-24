/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': '#141414',
        'gray': '#BDBDBD',
        'dark-gray': '#333333',
        'transparent-gray': 'rgba(0, 0, 0, 0.808)',
      },  
    },
  },
  plugins: [],
}

