/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ═════════════════════════════════════════════════════════════
        // BRAND COLORS — Identidad corporativa MedCity
        // ═════════════════════════════════════════════════════════════
        'brand-green': '#00A651',    // Verde Medellín (confianza)
        'brand-blue': '#0066CC',     // Azul corporativo (seguridad)
        'brand-orange': '#FFA800',   // Naranja (energía, alertas)

        // ═════════════════════════════════════════════════════════════
        // SEMANTIC COLORS — Señales universales
        // ═════════════════════════════════════════════════════════════
        'success': '#27AE60',
        'warning': '#F39C12',
        'danger': '#E74C3C',
        'info': '#3498DB',

        // ═════════════════════════════════════════════════════════════
        // PALETA SEMÁFORO DEL ICV (niveles de calidad de vida)
        // ═════════════════════════════════════════════════════════════
        icv: {
          excelente: '#27AE60',      // Verde: >75
          bueno:     '#2ECC71',      // Verde claro: 50-75
          atencion:  '#F39C12',      // Naranja: 25-50
          riesgo:    '#E67E22',      // Naranja oscuro: 10-25
          critico:   '#E74C3C',      // Rojo: <10
        },

        // ═════════════════════════════════════════════════════════════
        // COLORES POR ROL (para UI elements)
        // ═════════════════════════════════════════════════════════════
        rol: {
          ciudadano:    '#0066CC',   // Azul: informativo, confiable
          comerciante:  '#FF6B35',   // Naranja: dinámico, acción
          gobierno:     '#00A651',   // Verde: estabilidad, política pública
          investigador: '#6C5CE7',   // Púrpura: científico, analítico
        }
      },

      // ═════════════════════════════════════════════════════════════
      // BOX SHADOWS mejorados (MedCity branded)
      // ═════════════════════════════════════════════════════════════
      boxShadow: {
        'brand-sm': '0 2px 8px rgba(0, 166, 81, 0.08)',
        'brand-md': '0 8px 24px rgba(0, 166, 81, 0.12)',
        'brand-lg': '0 20px 60px rgba(0, 166, 81, 0.2)',
      },

      // ═════════════════════════════════════════════════════════════
      // ANIMACIONES
      // ═════════════════════════════════════════════════════════════
      animation: {
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'pulse-brand': 'pulseBrand 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        pulseBrand: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    }
  },
  plugins: []
}
