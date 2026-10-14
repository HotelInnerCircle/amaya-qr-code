/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#23384A',
        'navy-deep': '#1D2F3F',
        limestone: '#E7D8C6',
        stone: '#D8CEC3',
        mist: '#ECE8E1',
        paper: '#FDFCFA',
        brass: '#A9825A',
        sage: '#7C8B78',
        ink: '#2F2925',
        'ink-soft': '#5D564E',
        'ink-faint': '#6B645B',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['Jost', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
