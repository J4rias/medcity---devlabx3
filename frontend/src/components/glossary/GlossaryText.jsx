import { useState } from 'react'
import { GLOSARIO } from '../../data/glosario'
import { useDashboardStore } from '../../store/dashboard.store'

// ─── TOOLTIP INDIVIDUAL ───────────────────────────────────────────────────────
function TooltipGlosario({ termino, children }) {
  const [visible, setVisible]       = useState(false)
  const [nivel, setNivel]           = useState('simple')
  const nivelGlobal                 = useDashboardStore(s => s.nivelGlosario)
  const entrada                     = GLOSARIO[termino]

  if (!entrada) return <span>{children}</span>

  const nivelActivo = nivel || nivelGlobal

  return (
    <span className="relative inline-block">
      <span
        className="glosario-term"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(v => !v)}
      >
        {children}
      </span>

      {visible && (
        <div
          className="absolute z-50 w-72 p-3 bg-white rounded-xl shadow-2xl
                     border border-gray-100 text-sm bottom-7 left-0
                     animate-slide-up pointer-events-auto"
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
        >
          {/* Header con nombre del término */}
          <p className="font-semibold text-gray-800 mb-2">{termino}</p>

          {/* Toggle nivel */}
          <div className="flex gap-1 mb-2">
            {['simple', 'tecnico'].map(n => (
              <button
                key={n}
                onClick={() => setNivel(n)}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  nivelActivo === n
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {n === 'simple' ? '👵 Simple' : '🔬 Técnico'}
              </button>
            ))}
          </div>

          {/* Definición */}
          <p className="text-gray-700 leading-snug">
            {entrada[nivelActivo]}
          </p>

          {/* Umbrales si existen */}
          {entrada.umbral && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 leading-snug">
                📏 {entrada.umbral}
              </p>
            </div>
          )}
        </div>
      )}
    </span>
  )
}

// ─── PARSER PRINCIPAL ─────────────────────────────────────────────────────────
// Convierte texto con [[T:término]] en componentes TooltipGlosario
// Uso: <GlossaryText text="El [[T:AQI]] de hoy es 87" />

export function GlossaryText({ text }) {
  if (!text || typeof text !== 'string') return <span>{text}</span>

  // Divide en partes: texto normal y términos marcados
  const partes = text.split(/\[\[T:([^\]]+)\]\]/g)

  return (
    <span>
      {partes.map((parte, i) =>
        i % 2 === 1
          ? <TooltipGlosario key={i} termino={parte}>{parte}</TooltipGlosario>
          : <span key={i}>{parte}</span>
      )}
    </span>
  )
}
