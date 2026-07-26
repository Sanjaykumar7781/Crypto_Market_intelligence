/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#3B82F6',
        accent: '#06B6D4',
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#F59E0B',
        bgMain: '#F8FAFC',
        bgCard: '#FFFFFF',
        borderLight: '#E5E7EB',
        textMain: '#111827',
        textSecondary: '#374151',
        textValue: '#1F2937',
        textBody: '#4B5563',
        textMuted: '#6B7280',
        neutral: '#475569',
        hoverSoft: '#EEF4FF',
        cyanGlow: '#0ea5e9',
        mint: '#10b981',
        roseGlow: '#f43f5e',
        amberGlow: '#f59e0b',
      },
      boxShadow: {
        soft: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        hover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        glow: '0 0 15px rgba(14,165,233,0.3)',
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['30px', { lineHeight: '36px', fontWeight: '700' }],
        'section-title': ['22px', { lineHeight: '28px', fontWeight: '600' }],
        'card-title': ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'metric': ['36px', { lineHeight: '40px', fontWeight: '700' }],
        'normal': ['15px', { lineHeight: '24px' }],
        'small': ['13px', { lineHeight: '20px' }],
      },
      spacing: {
        '6': '24px', // Standard consistent padding
      },
      borderRadius: {
        '2xl': '16px', // Standard card radius
      },
    },
  },
  plugins: [],
};
