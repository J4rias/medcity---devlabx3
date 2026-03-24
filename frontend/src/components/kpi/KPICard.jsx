import { motion } from 'framer-motion'

// Paleta de colores según score ICV
function getColorConfig(score) {
  if (score === null || score === undefined) return { bg: 'bg-gray-50', text: 'text-gray-400', ring: 'ring-gray-200', label: 'Sin datos', dot: '⬜' }
  if (score >= 90) return { bg: 'bg-emerald-50',  text: 'text-emerald-700', ring: 'ring-emerald-200', label: 'Excelente', dot: '🟢' }
  if (score >= 75) return { bg: 'bg-green-50',    text: 'text-green-700',   ring: 'ring-green-200',   label: 'Bueno',     dot: '🟢' }
  if (score >= 50) return { bg: 'bg-yellow-50',   text: 'text-yellow-700',  ring: 'ring-yellow-200',  label: 'Atención',  dot: '🟡' }
  if (score >= 30) return { bg: 'bg-orange-50',   text: 'text-orange-700',  ring: 'ring-orange-200',  label: 'Riesgo',    dot: '🟠' }
  return               { bg: 'bg-red-50',      text: 'text-red-700',     ring: 'ring-red-200',     label: 'Crítico',   dot: '🔴' }
}

export function KPICard({ titulo, valor, unidad, score, tendencia, icono, delay = 0 }) {
  const color = getColorConfig(score ?? valor)

  const tendenciaIcon = tendencia === 'subiendo'   ? '↑' :
                        tendencia === 'bajando'    ? '↓' :
                        tendencia === 'estable'    ? '→' : ''
  const tendenciaColor = tendencia === 'subiendo'  ? 'text-green-600' :
                         tendencia === 'bajando'   ? 'text-red-500' : 'text-gray-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className={`${color.bg} ring-1 ${color.ring} rounded-xl p-4 flex flex-col gap-1`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {icono} {titulo}
        </span>
        <span className={`text-xs font-semibold ${color.text}`}>
          {color.dot} {color.label}
        </span>
      </div>

      <div className="flex items-end gap-1 mt-1">
        <span className={`text-3xl font-bold ${color.text}`}>
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
    </motion.div>
  )
}

// ── Skeleton mientras carga ───────────────────────────────────────────────────
export function KPICardSkeleton() {
  return (
    <div className="bg-gray-50 ring-1 ring-gray-200 rounded-xl p-4 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/2" />
    </div>
  )
}
