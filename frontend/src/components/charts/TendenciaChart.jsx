import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend
} from 'recharts'
import { useTendencia } from '../../hooks/useIndicadores'
import { useDashboardStore } from '../../store/dashboard.store'

const COLORES_INDICADOR = {
  icv:       '#3B82F6',
  seguridad: '#8B5CF6',
  aire:      '#10B981',
  movilidad: '#F59E0B',
  economia:  '#EC4899',
}

// Tooltip personalizado del gráfico
function TooltipCustom({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white ring-1 ring-gray-100 rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-gray-600 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

export function TendenciaChart() {
  const { barrioActivo, indicadorActivo, rangoTiempo } = useDashboardStore()
  const { data, isLoading } = useTendencia(barrioActivo?.id, indicadorActivo, rangoTiempo)

  const color = COLORES_INDICADOR[indicadorActivo] ?? '#6B7280'

  if (!barrioActivo) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-gray-400">
        Selecciona un barrio para ver la tendencia
      </div>
    )
  }

  if (isLoading) {
    return <div className="h-32 bg-gray-50 animate-pulse rounded-xl" />
  }

  const puntos  = data?.serie ?? []
  const media   = data?.media
  const ucl     = data?.ucl
  const lcl     = data?.lcl
  const alerta  = data?.alerta

  return (
    <div className="bg-white ring-1 ring-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          📈 Tendencia — {indicadorActivo.toUpperCase()}
        </p>
        {alerta && (
          <span className="text-xs bg-red-50 text-red-600 ring-1 ring-red-200 px-2 py-0.5 rounded-full">
            ⚠️ {alerta}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={puntos} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis
            dataKey="fecha"
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<TooltipCustom />} />

          {/* Líneas de control Six Sigma */}
          {ucl && <ReferenceLine y={ucl} stroke="#EF4444" strokeDasharray="4 2" className="control-chart-ucl" label={{ value: 'UCL', fontSize: 9, fill: '#EF4444' }} />}
          {lcl && <ReferenceLine y={lcl} stroke="#EF4444" strokeDasharray="4 2" className="control-chart-lcl" />}
          {media && <ReferenceLine y={media} stroke="#9CA3AF" strokeDasharray="2 2" className="control-chart-mean" />}

          <Line
            type="monotone"
            dataKey="valor"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
            name={indicadorActivo}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
