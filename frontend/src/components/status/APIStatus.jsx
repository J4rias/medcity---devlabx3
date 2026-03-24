import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { useAPIStatus, useRefreshAll } from '../../hooks/useIndicadores'

const BADGE = {
  online:   { color: 'bg-green-100 text-green-700',  dot: 'bg-green-500',  label: 'Online'    },
  degraded: { color: 'bg-yellow-100 text-yellow-700',dot: 'bg-yellow-500', label: 'Lento'     },
  offline:  { color: 'bg-red-100 text-red-700',      dot: 'bg-red-500',    label: 'Offline'   },
  unknown:  { color: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400',   label: 'Verificando'},
}

function BadgeEstado({ estado }) {
  const cfg = BADGE[estado] ?? BADGE.unknown
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export function APIStatus() {
  const { data, isLoading, dataUpdatedAt } = useAPIStatus()
  const refreshAll = useRefreshAll()

  const fuentes = data?.fuentes ?? []
  const ultimaActualizacion = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="bg-white ring-1 ring-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          🔌 Estado de Fuentes
        </p>
        <div className="flex items-center gap-2">
          {ultimaActualizacion && (
            <span className="text-xs text-gray-400">{ultimaActualizacion}</span>
          )}
          <button
            onClick={refreshAll}
            disabled={isLoading}
            className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Actualizar todos los datos"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {fuentes.map((f, i) => (
            <motion.div
              key={f.nombre}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-start gap-2 min-w-0">
                <div className="flex items-start gap-2 min-w-0">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-gray-600 truncate">{f.nombre}</span>
                  {f.extra && (
                    <span className="text-[10px] text-gray-400 truncate">{f.extra}</span>
                  )}
                </div>
                {f.usandoCache && (
                  <span className="text-xs text-orange-500 shrink-0 mt-0.5">📦 caché</span>
                )}
              </div>
                {f.usandoCache && (
                  <span className="text-xs text-orange-500 shrink-0 mt-0.5">📦 caché</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {f.latencia && (
                  <span className="text-xs text-gray-400">{f.latencia}ms</span>
                )}
                <BadgeEstado estado={f.estado} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
