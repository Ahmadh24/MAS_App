/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/tabs/index.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./src/**/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
    backgroundImage: {
      'custom-gradient':
        'linear-gradient(50deg, rgba(255, 0, 132, 0.20) 15.3%, rgba(255, 62, 9, 0.20) 85.24%), linear-gradient(142deg, #7D09FF 14.66%, #B9244E 85.82%)',
    },
  },
}

