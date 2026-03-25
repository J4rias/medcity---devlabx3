import { motion } from 'framer-motion'
import { useDashboardStore } from '../../store/dashboard.store'

const ROLE_COLORS = {
  ciudadano:    '#0066CC',
  comerciante:  '#FF6B35',
  gobierno:     '#00A651',
  investigador: '#6C5CE7',
}

function getSigmaConfig(sigma) {
  if (!sigma) return { color: '#9CA3AF', label: 'Sin datos', descripcion: '—' }
  if (sigma >= 5) return { color: '#059669', label: 'Clase Mundial 🏆', descripcion: `${sigma}σ` }
  if (sigma >= 4) return { color: '#10B981', label: 'Alto Desempeño',   descripcion: `${sigma}σ` }
  if (sigma >= 3) return { color: '#F59E0B', label: 'Competitivo',      descripcion: `${sigma}σ` }
  if (sigma >= 2) return { color: '#F97316', label: 'En Riesgo',        descripcion: `${sigma}σ` }
  return               { color: '#EF4444', label: 'Crítico',           descripcion: `${sigma}σ` }
}

export function SigmaLevel({ sigma, dpmo, diasDefectuosos }) {
  const { rol } = useDashboardStore()
  const roleColor = ROLE_COLORS[rol] ?? '#0066CC'
  const config = getSigmaConfig(sigma)
  const pct    = sigma ? Math.min((sigma / 6) * 100, 100) : 0

  return (
    <div className="bg-white ring-1 ring-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <span style={{
            display: 'inline-block', width: 6, height: 6,
            borderRadius: '50%', backgroundColor: roleColor
          }} />
          Sigma Level
        </span>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ color: config.color, backgroundColor: config.color + '15' }}>
          {config.label}
        </span>
      </div>

      {/* Barra de progreso segmentada */}
      <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        {/* Fondo segmentado (6 secciones) */}
        <div className="absolute inset-0 flex">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="flex-1 border-r border-white/60 last:border-0" />
          ))}
        </div>
        <motion.div
          className="h-full rounded-full relative z-10"
          style={{ backgroundColor: config.color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      {/* Etiquetas sigma */}
      <div className="flex justify-between mb-3">
        {[1,2,3,4,5,6].map(n => (
          <span key={n} className="text-xs font-mono"
            style={{ color: (sigma ?? 0) >= n ? config.color : '#D1D5DB' }}>
            {n}σ
          </span>
        ))}
      </div>

      <div className="flex justify-between items-end">
        <div>
          <span className="text-3xl font-extrabold" style={{ color: config.color }}>
            {sigma ? `${sigma}σ` : '—'}
          </span>
          <p className="text-xs text-gray-400 mt-0.5">de 6σ máximo</p>
        </div>
        <div className="flex gap-4 text-right">
          {dpmo !== undefined && (
            <div>
              <p className="text-xs text-gray-400">DPMO</p>
              <p className="text-sm font-semibold" style={{ color: roleColor }}>
                {dpmo?.toLocaleString('es-CO') ?? '—'}
              </p>
            </div>
          )}
          {diasDefectuosos !== undefined && (
            <div>
              <p className="text-xs text-gray-400">Días críticos</p>
              <p className="text-sm font-semibold" style={{ color: roleColor }}>
                {diasDefectuosos ?? '—'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
