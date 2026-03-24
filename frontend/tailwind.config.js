/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta semáforo del ICV
        icv: {
          excelente: '#27AE60',
          bueno:     '#2ECC71',
          atencion:  '#F39C12',
          riesgo:    '#E67E22',
          critico:   '#E74C3C',
        },
        // Colores por rol
        rol: {
          ciudadano:   '#3B82F6',
          comerciante: '#8B5CF6',
          gobierno:    '#059669',
          investigador:'#DC2626',
        }
      }
    }
  },
  plugins: []
}
