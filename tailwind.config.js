/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        eneBlue: '#4cc9f0',
        enePink: '#f72585',
        eneBg: '#0f1115',
        eneMsgUser: '#2a334a',
        eneMsgEne: '#1b2130'
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        animation: {
          fadeInUp: 'fadeInUp 0.3s ease-out',
        },
      },
    },
  },
  plugins: [],
}
