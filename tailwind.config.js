/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#050816',
        panel: '#0b1022',
        panelSoft: '#111936',
        cyanGlow: '#28d7ff',
        mint: '#2ff4a6',
        roseGlow: '#ff4d8d',
        amberGlow: '#ffc857',
      },
      boxShadow: {
        glow: '0 24px 80px rgba(40, 215, 255, 0.18)',
        card: '0 18px 45px rgba(0, 0, 0, 0.28)',
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        mesh: 'radial-gradient(circle at top left, rgba(40, 215, 255, 0.18), transparent 34%), radial-gradient(circle at top right, rgba(47, 244, 166, 0.12), transparent 36%), linear-gradient(135deg, #050816 0%, #0b1022 48%, #080a14 100%)',
      },
    },
  },
  plugins: [],
};
