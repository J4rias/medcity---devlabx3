import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { GLOSARIO } from '../../data/glosario'
import { useDashboardStore } from '../../store/dashboard.store'

// ─── TOOLTIP INDIVIDUAL ───────────────────────────────────────────────────────
export function TooltipGlosario({ termino, children }) {
  const [visible, setVisible]       = useState(false)
  const [nivel, setNivel]           = useState('simple')
  const [pos, setPos]               = useState({ top: 0, left: 0 })
  const spanRef                     = useRef(null)
  
  const nivelGlobal                 = useDashboardStore(s => s.nivelGlosario)
  const entrada                     = GLOSARIO[termino]

  if (!entrada) return <span>{children}</span>

  const nivelActivo = nivel || nivelGlobal

  const onEnter = () => {
    if (spanRef.current) {
        const rect = spanRef.current.getBoundingClientRect()
        let leftPos = rect.left
        const tooltipWidth = 296 // w-74 approx 296px
        if (leftPos + tooltipWidth > window.innerWidth - 16) {
             leftPos = window.innerWidth - tooltipWidth - 16
        }
        const bottomPos = window.innerHeight - rect.top + 8
        setPos({ bottom: bottomPos, left: leftPos })
    }
    setVisible(true)
  }

  return (
    <span className="relative inline-block" ref={spanRef}>
      <span
        className="glosario-term cursor-help"
        onMouseEnter={onEnter}
        onMouseLeave={() => setVisible(false)}
        onClick={() => { setVisible(v => !v); onEnter() }}
      >
        {children}
      </span>

      {visible && createPortal(
        <div style={{ position: 'fixed', bottom: pos.bottom, left: pos.left, zIndex: 9999999, pointerEvents: 'none' }}>
            <div
              style={{ backgroundColor: '#ffffff', opacity: 1, pointerEvents: 'auto' }}
              className="w-72 p-3 flex flex-col rounded-xl shadow-2xl
                         border border-gray-200 text-sm
                         ring-1 ring-black/5"
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
        </div>,
        document.body
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
