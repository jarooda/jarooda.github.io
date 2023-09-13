/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif']
      },
      width: {
        'md': '768px'
      },
      keyframes: {
        typing: {
          '0%': {
            width: '0%',
            visibility: 'hidden'
          },
          '100%': {
            width: '100%'
          }
        },
        typing_md: {
          '0%': {
            width: '0%',
            visibility: 'hidden'
          },
          '100%': {
            width: '50%'
          }
        },
        blink: {
          '50%': {
            borderColor: 'transparent'
          },
          '100%': {
            borderColor: '#84cc16'
          }  
        }
      },
      animation: {
        typing: 'typing 2s steps(18) alternate, blink .7s infinite',
        typing_md: 'typing_md 2s steps(18) alternate, blink .7s infinite',
      }
    },
	},
	plugins: [],
}
