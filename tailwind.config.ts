/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'selector',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // extend: {
    //   fontFamily: {
    //     sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
    //   },
    // },
    transitionDuration: {
      DEFAULT: '200ms',
    },
    extend: {
      keyframes: {
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(350%)' },
        },
      },
      animation: {
        'progress-indeterminate':
          'progress-indeterminate 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
