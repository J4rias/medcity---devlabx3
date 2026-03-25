import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

function getColorConfig(score) {
  if (score === null || score === undefined) return { label: 'Sin datos', dot: '⬜' }
  if (score >= 90) return { label: 'Excelente', dot: '🟢' }
  if (score >= 75) return { label: 'Bueno',     dot: '🟢' }
  if (score >= 50) return { label: 'Atención',  dot: '🟡' }
  if (score >= 30) return { label: 'Riesgo',    dot: '🟠' }
  return               { label: 'Crítico',   dot: '🔴' }
}

// Número que se anima contando desde 0 hasta el valor
function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)
  const numVal = parseFloat(value)

  useEffect(() => {
    if (isNaN(numVal)) { setDisplay(value); return }
    const start = performance.now()
    startRef.current = start

    const animate = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * numVal
      setDisplay(Number.isInteger(numVal) ? Math.round(current) : current.toFixed(1))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [numVal, duration])

  if (isNaN(numVal)) return <>{value ?? '—'}</>
  return <>{display}</>
}

export function KPICard({ titulo, valor, unidad, score, tendencia, icono, delay = 0, roleColor = '#0066CC' }) {
  const color = getColorConfig(score ?? valor)

  const tendenciaIcon  = tendencia?.includes('subiendo') || tendencia?.includes('↑') ? '↑' :
                         tendencia?.includes('bajando')  || tendencia?.includes('↓') ? '↓' :
                         tendencia?.includes('estable')  || tendencia?.includes('→') ? '→' : ''
  const tendenciaColor = tendencia?.includes('subiendo') || tendencia?.includes('↑') ? '#10B981' :
                         tendencia?.includes('bajando')  || tendencia?.includes('↓') ? '#EF4444' : '#9CA3AF'

  const roleStyle = {
    '--role-color':     roleColor,
    '--role-color-rgb': hexToRgb(roleColor),
    borderColor:        roleColor + '80',
    backgroundColor:    roleColor + '08',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      className="kpi-card p-3 flex flex-col gap-1 rounded-2xl border-2"
      style={roleStyle}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
          {icono} {titulo}
        </span>
        <span className="text-xs font-bold ml-1 shrink-0" style={{ color: roleColor }}>
          {color.dot}
        </span>
      </div>

      {/* Valor principal */}
      <div className="flex items-end gap-1 mt-1">
        <span className="kpi-value" style={{ color: roleColor }}>
          <AnimatedNumber value={valor} key={valor} />
        </span>
        {unidad && (
          <span className="text-xs text-gray-400 mb-1 ml-0.5">{unidad}</span>
        )}
        {tendenciaIcon && (
          <span className="text-sm font-bold ml-auto mb-1" style={{ color: tendenciaColor }}>
            {tendenciaIcon}
          </span>
        )}
      </div>

      {/* Label de estado */}
      <span className="text-xs font-medium" style={{ color: roleColor + 'CC' }}>
        {color.label}
      </span>

      {/* Progress bar */}
      {(score != null || valor != null) && (
        <div className="kpi-progress mt-1" style={{ '--progress': `${Math.min(score ?? valor ?? 0, 100)}%` }} />
      )}
    </motion.div>
  )
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

export function KPICardSkeleton() {
  return (
    <div className="kpi-card p-3 rounded-2xl border-2 border-gray-100 bg-white">
      <div className="skeleton h-3 w-2/3 mb-3" />
      <div className="skeleton h-7 w-1/2 mb-2" />
      <div className="skeleton h-2 w-full" />
    </div>
  )
}
