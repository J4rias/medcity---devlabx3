import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Area, AreaChart
} from 'recharts'
import { useTendencia } from '../../hooks/useIndicadores'
import { useDashboardStore } from '../../store/dashboard.store'

const ROLE_COLORS = {
  ciudadano:    '#0066CC',
  comerciante:  '#FF6B35',
  gobierno:     '#00A651',
  investigador: '#6C5CE7',
}

const INDICADOR_LABELS = {
  icv:       'ICV',
  seguridad: 'Seguridad',
  aire:      'Aire',
  movilidad: 'Movilidad',
  economia:  'Economía',
}

function TooltipCustom({ active, payload, label, color }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white ring-1 ring-gray-100 rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-gray-500 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color }}>
          {INDICADOR_LABELS[p.name] ?? p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

export function TendenciaChart() {
  const { barrioActivo, indicadorActivo, rangoTiempo, rol } = useDashboardStore()
  const { data, isLoading } = useTendencia(barrioActivo?.id, indicadorActivo, rangoTiempo)

  const roleColor = ROLE_COLORS[rol] ?? '#0066CC'

  if (!barrioActivo) {
    return (
      <div className="bg-white ring-1 ring-gray-100 rounded-xl p-4 h-36
                      flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: roleColor + '15' }}>
          <span style={{ color: roleColor, fontSize: 16 }}>📈</span>
        </div>
        <p className="text-xs text-gray-400 text-center">
          Selecciona un barrio para ver la tendencia
        </p>
      </div>
    )
  }

  if (isLoading) {
    return <div className="h-36 bg-gray-50 animate-pulse rounded-xl" />
  }

  const puntos = data?.serie ?? []
  const media  = data?.media
  const ucl    = data?.ucl
  const lcl    = data?.lcl
  const alerta = data?.alerta

  return (
    <div className="bg-white ring-1 ring-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <span style={{
            display: 'inline-block', width: 6, height: 6,
            borderRadius: '50%', backgroundColor: roleColor
          }} />
          Tendencia — {INDICADOR_LABELS[indicadorActivo] ?? indicadorActivo}
        </p>
        {alerta && (
          <span className="text-xs bg-red-50 text-red-600 ring-1 ring-red-200 px-2 py-0.5 rounded-full">
            ⚠️ {alerta}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={puntos} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={`grad-${rol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={roleColor} stopOpacity={0.15} />
              <stop offset="95%" stopColor={roleColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
          <Tooltip content={<TooltipCustom color={roleColor} />} />

          {/* Líneas de control Six Sigma */}
          {ucl   && <ReferenceLine y={ucl}   stroke="#EF4444" strokeDasharray="4 2" label={{ value: 'UCL', fontSize: 9, fill: '#EF4444' }} />}
          {lcl   && <ReferenceLine y={lcl}   stroke="#EF4444" strokeDasharray="4 2" />}
          {media && <ReferenceLine y={media} stroke="#9CA3AF" strokeDasharray="2 2" />}

          <Area
            type="monotone"
            dataKey="valor"
            stroke={roleColor}
            strokeWidth={2.5}
            fill={`url(#grad-${rol})`}
            dot={{ r: 3, fill: roleColor, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: roleColor, strokeWidth: 2, stroke: 'white' }}
            name={indicadorActivo}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
