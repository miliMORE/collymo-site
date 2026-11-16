// Palette (WCAG AA checked against the backgrounds they are used on):
// ink #151b24 dark slate blue-grey base · ink-800 #1e2632 · ink-700 #2a3442
// vio #334155 slate (used only in gradients); site is dark throughout
// cy #22d3ee electric cyan: accent on dark (9.6:1 on ink)
// co #ff7a6b coral & mg #f472d0 magenta: highlights on dark (6.8:1 and 6.7:1 on ink)
export default {
  content: ['./src/**/*.{astro,ts,md}'],
  theme: { extend: {
    colors: {
      ink: { DEFAULT: '#151b24', 800: '#1e2632', 700: '#2a3442' },
      vio: { DEFAULT: '#334155', soft: '#e2e8f0' },
      cy: { DEFAULT: '#22d3ee' },
      co: { DEFAULT: '#ff7a6b' },
      mg: { DEFAULT: '#f472d0' },
      paper: '#f1f5f9',
    },
    fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'] },
  } },
};
