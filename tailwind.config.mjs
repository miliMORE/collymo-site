// Palette (WCAG AA checked against the backgrounds they are used on):
// ink #0d0726 deep indigo base · ink-800 #1a1050 · ink-700 #2a1b6e
// vio #5b21b6 violet: accent text on light (8.6:1 on white)
// cy #22d3ee electric cyan: accent on dark (10.9:1 on ink)
// co #ff7a6b coral & mg #f472d0 magenta: highlights on dark (both > 6:1 on ink)
export default {
  content: ['./src/**/*.{astro,ts,md}'],
  theme: { extend: {
    colors: {
      ink: { DEFAULT: '#0d0726', 800: '#1a1050', 700: '#2a1b6e' },
      vio: { DEFAULT: '#5b21b6', soft: '#ede9fe' },
      cy: { DEFAULT: '#22d3ee' },
      co: { DEFAULT: '#ff7a6b' },
      mg: { DEFAULT: '#f472d0' },
      paper: '#f7f5ff',
    },
    fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'] },
  } },
};
