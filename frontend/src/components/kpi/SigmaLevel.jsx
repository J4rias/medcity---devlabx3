import { motion } from 'framer-motion'

// Convierte sigma level en configuración visual
function getSigmaConfig(sigma) {
  if (!sigma) return { color: '#9CA3AF', label: 'Sin datos', descripcion: '—' }
  if (sigma >= 5) return { color: '#059669', label: 'Clase Mundial 🏆', descripcion: `${sigma}σ` }
  if (sigma >= 4) return { color: '#10B981', label: 'Alto Desempeño',   descripcion: `${sigma}σ` }
  if (sigma >= 3) return { color: '#F59E0B', label: 'Competitivo',      descripcion: `${sigma}σ` }
  if (sigma >= 2) return { color: '#F97316', label: 'En Riesgo',        descripcion: `${sigma}σ` }
  return               { color: '#EF4444', label: 'Crítico',           descripcion: `${sigma}σ` }
}

export function SigmaLevel({ sigma, dpmo, diasDefectuosos }) {
  const config   = getSigmaConfig(sigma)
  const pct      = sigma ? Math.min((sigma / 6) * 100, 100) : 0

  return (
    <div className="bg-white ring-1 ring-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          ⚡ Sigma Level
        </span>
        <span className="text-xs font-bold" style={{ color: config.color }}>
          {config.label}
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: config.color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <div className="flex justify-between items-end">
        <span className="text-3xl font-bold" style={{ color: config.color }}>
          {sigma ? `${sigma}σ` : '—'}
        </span>
        {dpmo !== undefined && (
          <div className="text-right">
            <p className="text-xs text-gray-400">DPMO</p>
            <p className="text-sm font-semibold text-gray-600">
              {dpmo?.toLocaleString('es-CO') ?? '—'}
            </p>
          </div>
        )}
        {diasDefectuosos !== undefined && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Días críticos/año</p>
            <p className="text-sm font-semibold text-gray-600">
              {diasDefectuosos ?? '—'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
