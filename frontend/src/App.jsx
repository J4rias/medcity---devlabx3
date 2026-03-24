import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Map, BarChart2, Zap, Users } from 'lucide-react'
import { MapaComunas }    from './components/map/MapaComunas'
import { KPICard, KPICardSkeleton } from './components/kpi/KPICard'
import { SigmaLevel }     from './components/kpi/SigmaLevel'
import { LLMPanel }       from './components/llm/LLMPanel'
import { TendenciaChart } from './components/charts/TendenciaChart'
import { APIStatus }      from './components/status/APIStatus'
import { useDashboardStore } from './store/dashboard.store'
import { useIndicadoresBarrio, useRefreshAll } from './hooks/useIndicadores'
import { toast } from 'sonner'

// ─── CONFIGURACIÓN DE ROLES ───────────────────────────────────────────────────
const ROLES = [
  { id: 'ciudadano',    label: 'Ciudadano',    icono: '👵', color: 'bg-blue-600'    },
  { id: 'comerciante',  label: 'Comerciante',  icono: '🏪', color: 'bg-purple-600'  },
  { id: 'gobierno',     label: 'Gobierno',     icono: '🏛️', color: 'bg-emerald-600' },
  { id: 'investigador', label: 'Investigador', icono: '🔬', color: 'bg-red-600'     },
]

// ─── CONFIGURACIÓN DE INDICADORES ────────────────────────────────────────────
const INDICADORES = [
  { id: 'icv',       label: 'ICV',      icono: '🏙️' },
  { id: 'seguridad', label: 'Seguridad',icono: '🛡️' },
  { id: 'aire',      label: 'Aire',     icono: '🌬️' },
  { id: 'movilidad', label: 'Movilidad',icono: '🚌' },
  { id: 'economia',  label: 'Economía', icono: '💼' },
]

// ─── KPIs SEGÚN ROL ───────────────────────────────────────────────────────────
function KPIsSegunRol({ datos, rol }) {
  if (!datos) return (
    <div className="grid grid-cols-2 gap-2">
      {[1, 2, 3, 4].map(i => <KPICardSkeleton key={i} />)}
    </div>
  )

  const configs = {
    ciudadano: [
      { titulo: 'Calidad de Vida',  valor: datos.icv,       unidad: '/100',   score: datos.icv,       icono: '🏙️', tendencia: datos.tendencia_icv },
      { titulo: 'Seguridad',        valor: datos.seguridad, unidad: '/100',   score: datos.seguridad, icono: '🛡️', tendencia: datos.tendencia_seguridad },
      { titulo: 'Calidad del Aire', valor: datos.aqi,       unidad: 'AQI',    score: 100 - datos.aqi, icono: '🌬️', tendencia: datos.tendencia_aire },
      { titulo: 'Servicios',        valor: datos.servicios, unidad: '/100',   score: datos.servicios, icono: '⚡' },
    ],
    comerciante: [
      { titulo: 'Flujo Peatonal',   valor: datos.movilidad, unidad: '/100',   score: datos.movilidad, icono: '🚶', tendencia: datos.tendencia_movilidad },
      { titulo: 'Oportunidad',      valor: datos.oportunidad_negocio, unidad: '/100', score: datos.oportunidad_negocio, icono: '💰' },
      { titulo: 'Seguridad',        valor: datos.seguridad, unidad: '/100',   score: datos.seguridad, icono: '🛡️' },
      { titulo: 'Negocios/ha',      valor: datos.comercios_ha, unidad: 'neg/ha', score: Math.min(datos.comercios_ha * 5, 100), icono: '🏪' },
    ],
    gobierno: [
      { titulo: 'ICV Score',        valor: datos.icv,       unidad: '/100',   score: datos.icv,       icono: '📊', tendencia: datos.tendencia_icv },
      { titulo: 'Percentil Medellín', valor: datos.percentil, unidad: 'pct',  score: datos.percentil, icono: '📈' },
      { titulo: 'Sigma Level',      valor: datos.sigma,     unidad: 'σ',      score: (datos.sigma / 6) * 100, icono: '⚡' },
      { titulo: 'Alertas Activas',  valor: datos.alertas,   unidad: '',       score: datos.alertas === 0 ? 100 : datos.alertas > 2 ? 20 : 60, icono: '🚨' },
    ],
    investigador: [
      { titulo: 'ICV Score',        valor: datos.icv,       unidad: '/100',   score: datos.icv,       icono: '📊' },
      { titulo: 'Desv. Estándar',   valor: datos.std,       unidad: '',       score: datos.std < 10 ? 90 : 50, icono: '📉' },
      { titulo: 'DPMO',             valor: datos.dpmo?.toLocaleString('es-CO'), unidad: '', score: datos.dpmo < 6210 ? 90 : 30, icono: '🎯' },
      { titulo: 'N Observaciones',  valor: datos.n_obs,     unidad: '',       score: datos.n_obs > 30 ? 90 : 60, icono: '🔢' },
    ],
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {(configs[rol] ?? configs.ciudadano).map((kpi, i) => (
        <KPICard key={kpi.titulo} {...kpi} delay={i * 0.06} />
      ))}
    </div>
  )
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const { rol, setRol, barrioActivo, indicadorActivo, setIndicador } = useDashboardStore()
  const { data: indicadores, isLoading } = useIndicadoresBarrio(barrioActivo?.id)
  const refreshAll = useRefreshAll()
  const [showStatus, setShowStatus] = useState(false)

  const rolActual = ROLES.find(r => r.id === rol)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── PANEL IZQUIERDO: MAPA ── */}
      <div className="flex-1 flex flex-col p-4 gap-3 min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              🏙️ MedCity Dashboard
            </h1>
            <p className="text-xs text-gray-400">
              Datos Abiertos · Medellín
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de indicador */}
            <div className="flex gap-1 bg-white ring-1 ring-gray-100 rounded-xl p-1">
              {INDICADORES.map(ind => (
                <button
                  key={ind.id}
                  onClick={() => setIndicador(ind.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    indicadorActivo === ind.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {ind.icono} {ind.label}
                </button>
              ))}
            </div>

            {/* Botón status */}
            <button
              onClick={() => setShowStatus(s => !s)}
              className="p-2 rounded-xl ring-1 ring-gray-200 bg-white text-gray-500 hover:text-blue-600 transition-colors"
              title="Estado de APIs"
            >
              <Zap size={16} />
            </button>

            {/* Botón refresh */}
            <button
              onClick={refreshAll}
              className="p-2 rounded-xl ring-1 ring-gray-200 bg-white text-gray-500 hover:text-blue-600 transition-colors"
              title="Actualizar datos"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* API Status (colapsable) */}
        <AnimatePresence>
          {showStatus && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <APIStatus />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mapa */}
        <div className="flex-1 relative rounded-xl overflow-hidden">
          <MapaComunas indicadoresData={indicadores?.mapa} />
        </div>

        {/* Barrio seleccionado */}
        {barrioActivo && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white ring-1 ring-gray-100 rounded-xl px-4 py-2 flex items-center gap-3"
          >
            <Map size={16} className="text-blue-600 shrink-0" />
            <div>
              <span className="font-semibold text-gray-800 text-sm">{barrioActivo.nombre}</span>
              <span className="text-xs text-gray-400 ml-2">Comuna {barrioActivo.comuna}</span>
            </div>
            {indicadores?.icv_score && (
              <span className="ml-auto text-sm font-bold text-blue-600">
                ICV {indicadores.icv_score}/100
              </span>
            )}
          </motion.div>
        )}
      </div>

      {/* ── PANEL DERECHO: DATOS + LLM ── */}
      <div className="w-96 flex flex-col gap-3 p-4 pl-0 overflow-y-auto">

        {/* Role Switcher */}
        <div className="bg-white ring-1 ring-gray-100 rounded-xl p-1 flex gap-1">
          {ROLES.map(r => (
            <button
              key={r.id}
              onClick={() => setRol(r.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                rol === r.id
                  ? `${r.color} text-white shadow-sm`
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {r.icono} {r.label}
            </button>
          ))}
        </div>

        {/* KPIs según rol */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${rol}-${barrioActivo?.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <KPIsSegunRol datos={indicadores} rol={rol} />
          </motion.div>
        </AnimatePresence>

        {/* Sigma Level */}
        {indicadores && (
          <SigmaLevel
            sigma={indicadores.sigma}
            dpmo={indicadores.dpmo}
            diasDefectuosos={indicadores.dias_defectuosos}
          />
        )}

        {/* Gráfica de tendencia */}
        <TendenciaChart />

        {/* Panel LLM */}
        <div className="flex-1 min-h-72">
          <LLMPanel />
        </div>

      </div>
    </div>
  )
}
