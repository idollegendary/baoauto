module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: '#0f172a',
        accent: '#b4886b'
      },
      fontFamily: {
        serif: ['Montserrat', 'sans-serif'],
        sans: ['Montserrat', 'sans-serif']
      }
    }
  },
  plugins: []
}
