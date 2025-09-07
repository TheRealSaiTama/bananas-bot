import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem'
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.06)'
      }
    }
  },
  plugins: [],
}

export default config

