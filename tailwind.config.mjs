export default {
  content: ['./src/**/*.{astro,ts,md}'],
  theme: { extend: {
    colors: { ink: { DEFAULT: '#0b1220', 800: '#111b2e', 700: '#1b2740' }, sky: { brand: '#0082ba' }, lime: { brand: '#84bd00' } },
    fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'] },
  } },
};
