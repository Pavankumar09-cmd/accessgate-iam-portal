/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: 'var(--graphite)',
        steel: 'var(--steel)',
        'steel-line': 'var(--steel-line)',
        bone: 'var(--bone)',
        'bone-dim': 'var(--bone-dim)',
        'clearance-amber': 'var(--clearance-amber)',
        'denied-red': 'var(--denied-red)',
        'granted-green': 'var(--granted-green)',
      },
      fontFamily: {
        condensed: ['"IBM Plex Sans Condensed"', 'Archivo', 'sans-serif'],
        sans: ['Inter', '"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
