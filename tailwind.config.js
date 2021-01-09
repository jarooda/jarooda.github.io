module.exports = {
  purge: {
    content: ['./public/**/*.html', './src/**/*.vue'],
    options: {
      whitelistPatterns: [ 
    /-(leave|enter|appear)(|-(to|from|active))$/, 
    /^(?!(|.*?:)cursor-move).+-move$/,
        /^router-link(|-exact)-active$/
      ],
    }
 },
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      backgroundColor: theme => ({
        ...theme('colors'),
        'dark-green': '#006400'
      }),
      borderColor: theme => ({
        ...theme('colors'),
        'dark-green': '#006400'
      }),
      gradientColorStops: theme => ({
        ...theme('colors'),
        'dark-green': '#006400'
      }),
      textColor: theme => ({
        ...theme('colors'),
        'dark-green': '#006400'
      }),
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('tailwind-scrollbar')
  ],
}
