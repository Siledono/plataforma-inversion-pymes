/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Paleta Gobierno de México */
        gov: {
          green:   '#006847',
          red:     '#CE1126',
          gold:    '#C8A951',
          dark:    '#0D1B2A',
          navy:    '#003B5C',
          blue:    '#0066CC',
          light:   '#E8F4FD',
          surface: '#F4F7FB',
          muted:   '#64748B',
          border:  '#CBD5E1',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:       '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-md':  '0 4px 12px rgba(0,0,0,0.08)',
        'card-lg':  '0 10px 30px rgba(0,59,92,0.12)',
        nav:        '0 1px 0 rgba(255,255,255,0.06)',
        glow:       '0 0 0 3px rgba(0,102,204,0.15)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      backgroundImage: {
        'tricolor': 'linear-gradient(to right, #006847 33.33%, #ffffff 33.33% 66.66%, #CE1126 66.66%)',
        'hero-grad': 'linear-gradient(135deg, #0D1B2A 0%, #003B5C 60%, #004a73 100%)',
        'card-grad': 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      },
    },
  },
  plugins: [],
}
