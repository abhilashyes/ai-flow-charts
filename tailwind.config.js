/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        vsm: {
          process: '#fef9c3',
          processBorder: '#ca8a04',
          inventory: '#fee2e2',
          inventoryBorder: '#dc2626',
          entity: '#e0e7ff',
          entityBorder: '#4f46e5',
          control: '#dcfce7',
          controlBorder: '#16a34a',
          kaizen: '#fce7f3',
          kaizenBorder: '#db2777',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
