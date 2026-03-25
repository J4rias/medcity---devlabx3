import { motion } from 'framer-motion'

// ═════════════════════════════════════════════════════════════════════════════
// Paleta de colores según score (para fallback si no hay roleColor)
// ═════════════════════════════════════════════════════════════════════════════
function getColorConfig(score) {
  if (score === null || score === undefined) return { bg: 'bg-gray-50', text: 'text-gray-400', ring: 'ring-gray-200', label: 'Sin datos', dot: '⬜' }
  if (score >= 90) return { bg: 'bg-emerald-50',  text: 'text-emerald-700', ring: 'ring-emerald-200', label: 'Excelente', dot: '🟢' }
  if (score >= 75) return { bg: 'bg-green-50',    text: 'text-green-700',   ring: 'ring-green-200',   label: 'Bueno',     dot: '🟢' }
  if (score >= 50) return { bg: 'bg-yellow-50',   text: 'text-yellow-700',  ring: 'ring-yellow-200',  label: 'Atención',  dot: '🟡' }
  if (score >= 30) return { bg: 'bg-orange-50',   text: 'text-orange-700',  ring: 'ring-orange-200',  label: 'Riesgo',    dot: '🟠' }
  return               { bg: 'bg-red-50',      text: 'text-red-700',     ring: 'ring-red-200',     label: 'Crítico',   dot: '🔴' }
}

// ═════════════════════════════════════════════════════════════════════════════
// KPI CARD — Componente mejorado con colores dinámicos por rol
// Props:
// - titulo: Nombre del KPI
// - valor: Número a mostrar
// - unidad: Unidad de medida (ej: /100)
// - score: Valor para colorear (0-100)
// - icono: Emoji
// - tendencia: Texto de tendencia
// - delay: Para animación staggered
// - roleColor: Color hex del rol actual (ej: #0066CC)
// ═════════════════════════════════════════════════════════════════════════════
export function KPICard({ titulo, valor, unidad, score, tendencia, icono, delay = 0, roleColor = '#0066CC' }) {
  const color = getColorConfig(score ?? valor)

  const tendenciaIcon = tendencia?.includes('subiendo') || tendencia?.includes('↑')   ? '↑' :
                        tendencia?.includes('bajando') || tendencia?.includes('↓')    ? '↓' :
                        tendencia?.includes('estable') || tendencia?.includes('→')    ? '→' : ''
  const tendenciaColor = tendencia?.includes('subiendo') || tendencia?.includes('↑')  ? 'text-emerald-600' :
                         tendencia?.includes('bajando') || tendencia?.includes('↓')   ? 'text-red-500' : 'text-gray-400'

  // Inline styles para aplicar el color dinámico del rol
  const roleStyle = {
    '--role-color': roleColor,
    borderColor: roleColor,
    backgroundColor: roleColor + '10',  // 10% opacity
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0, 0, 0, 0.1)' }}
      className="kpi-card p-4 flex flex-col gap-1 rounded-2xl border-2 transition-all"
      style={roleStyle}
    >
      {/* Header: Título + Status */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {icono} {titulo}
        </span>
        <span className="text-xs font-semibold" style={{ color: roleColor }}>
          {color.dot} {color.label}
        </span>
      </div>

      {/* Valor principal */}
      <div className="flex items-end gap-1 mt-2">
        <span className="kpi-value" style={{ color: roleColor }}>
          {valor ?? '—'}
        </span>
        {unidad && (
          <span className="text-sm text-gray-400 mb-1">{unidad}</span>
        )}
        {tendencia && (
          <span className={`text-lg font-bold ml-auto mb-1 ${tendenciaColor}`}>
            {tendenciaIcon}
          </span>
        )}
      </div>

      {/* Progress bar (si hay score) */}
      {(score || valor) && (
        <div className="kpi-progress mt-3" style={{ '--progress': `${Math.min(score || valor, 100)}%` }}>
        </div>
      )}
    </motion.div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// SKELETON — Mientras carga el dato
// ═════════════════════════════════════════════════════════════════════════════
export function KPICardSkeleton() {
  return (
    <div className="kpi-card p-4 rounded-2xl border-2 border-gray-200 bg-gray-50 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-1.5 bg-gray-200 rounded w-full" />
    </div>
  )
}
