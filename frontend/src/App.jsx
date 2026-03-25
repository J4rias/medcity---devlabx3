import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Settings, Moon, ChevronRight } from 'lucide-react'
import { MapaComunas }    from './components/map/MapaComunas'
import { KPICard, KPICardSkeleton } from './components/kpi/KPICard'
import { SigmaLevel }     from './components/kpi/SigmaLevel'
import { LLMPanel }       from './components/llm/LLMPanel'
import { TendenciaChart } from './components/charts/TendenciaChart'
import { APIStatus }      from './components/status/APIStatus'
import { useDashboardStore } from './store/dashboard.store'
import { useIndicadoresBarrio, useRefreshAll } from './hooks/useIndicadores'

// ─── ROLES ────────────────────────────────────────────────────────────────────
const ROLES = [
  { id: 'ciudadano',    label: 'Ciudadano',    icono: '👤', colorHex: '#0066CC', light: '#E3F2FD', desc: 'Calidad de vida' },
  { id: 'comerciante',  label: 'Comerciante',  icono: '🏪', colorHex: '#FF6B35', light: '#FFE5D9', desc: 'Oportunidades' },
  { id: 'gobierno',     label: 'Gobierno',     icono: '🏛️', colorHex: '#00A651', light: '#E8F5E9', desc: 'Gestión pública' },
  { id: 'investigador', label: 'Investigador', icono: '🔬', colorHex: '#6C5CE7', light: '#F3E5F5', desc: 'Análisis sigma' },
]

// ─── INDICADORES ──────────────────────────────────────────────────────────────
const INDICADORES = [
  { id: 'icv',       label: 'ICV',       icono: '🏙️' },
  { id: 'seguridad', label: 'Seguridad', icono: '🛡️' },
  { id: 'aire',      label: 'Aire',      icono: '🌬️' },
  { id: 'movilidad', label: 'Movilidad', icono: '🚌' },
  { id: 'economia',  label: 'Economía',  icono: '💼' },
]

// ─── ROLE SELECTOR 2×2 ────────────────────────────────────────────────────────
function RoleSelector({ rol, setRol }) {
  return (
    <div className="bg-white ring-1 ring-gray-100 rounded-xl p-3">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-1">
        Perfil de usuario
      </p>
      <div className="grid grid-cols-2 gap-2">
        {ROLES.map((r, i) => {
          const activo = rol === r.id
          return (
            <motion.button
              key={r.id}
              onClick={() => setRol(r.id)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="relative p-3 rounded-xl text-left transition-all overflow-hidden"
              style={{
                backgroundColor: activo ? r.colorHex : r.light,
                border: `2px solid ${activo ? r.colorHex : r.colorHex + '30'}`,
                boxShadow: activo ? `0 4px 14px ${r.colorHex}35` : 'none',
              }}
            >
              {/* Círculo decorativo de fondo */}
              <div className="absolute -top-3 -right-3 w-14 h-14 rounded-full opacity-20"
                style={{ backgroundColor: activo ? 'white' : r.colorHex }} />

              <div className="text-xl mb-1">{r.icono}</div>
              <div className="font-semibold text-sm leading-tight"
                style={{ color: activo ? 'white' : r.colorHex }}>
                {r.label}
              </div>
              <div className="text-xs mt-0.5"
                style={{ color: activo ? 'rgba(255,255,255,0.75)' : '#9CA3AF' }}>
                {r.desc}
              </div>
              {activo && (
                <motion.div
                  layoutId="role-active-dot"
                  className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white opacity-80"
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ─── KPIs SEGÚN ROL ───────────────────────────────────────────────────────────
function KPIsSegunRol({ datos, rol }) {
  if (!datos) return (
    <div className="grid grid-cols-2 gap-2">
      {[1, 2, 3, 4].map(i => <KPICardSkeleton key={i} />)}
    </div>
  )

  const configs = {
    ciudadano: [
      { titulo: 'Calidad de Vida',  valor: datos.icv_score, unidad: '/100',    score: datos.icv_score, icono: '🏙️', tendencia: datos.tendencia_icv },
      { titulo: 'Seguridad',        valor: datos.seguridad, unidad: '/100',    score: datos.seguridad, icono: '🛡️', tendencia: datos.tendencia_seguridad },
      { titulo: 'Calidad del Aire', valor: datos.aqi,       unidad: 'AQI',     score: 100 - datos.aqi, icono: '🌬️', tendencia: datos.tendencia_aire },
      { titulo: 'Servicios',        valor: datos.servicios, unidad: '/100',    score: datos.servicios, icono: '⚡' },
    ],
    comerciante: [
      { titulo: 'Flujo Peatonal',  valor: datos.movilidad,           unidad: '/100',   score: datos.movilidad,                       icono: '🚶', tendencia: datos.tendencia_movilidad },
      { titulo: 'Oportunidad',     valor: datos.oportunidad_negocio, unidad: '/100',   score: datos.oportunidad_negocio,              icono: '💰' },
      { titulo: 'Seguridad',       valor: datos.seguridad,           unidad: '/100',   score: datos.seguridad,                       icono: '🛡️' },
      { titulo: 'Negocios/ha',     valor: datos.comercios_ha,        unidad: 'neg/ha', score: Math.min(datos.comercios_ha * 5, 100), icono: '🏪' },
    ],
    gobierno: [
      { titulo: 'ICV Score',         valor: datos.icv_score, unidad: '/100', score: datos.icv_score,          icono: '📊', tendencia: datos.tendencia_icv },
      { titulo: 'Percentil Medellín',valor: datos.percentil, unidad: 'pct',  score: datos.percentil,          icono: '📈' },
      { titulo: 'Sigma Level',       valor: datos.sigma,     unidad: 'σ',    score: (datos.sigma / 6) * 100,  icono: '⚡' },
      { titulo: 'Alertas Activas',   valor: datos.alertas,   unidad: '',     score: datos.alertas === 0 ? 100 : datos.alertas > 2 ? 20 : 60, icono: '🚨' },
    ],
    investigador: [
      { titulo: 'ICV Score',       valor: datos.icv_score,                    unidad: '/100', score: datos.icv_score,            icono: '📊' },
      { titulo: 'Desv. Estándar',  valor: datos.std,                          unidad: '',     score: datos.std < 10 ? 90 : 50,  icono: '📉' },
      { titulo: 'DPMO',            valor: datos.dpmo?.toLocaleString('es-CO'), unidad: '',    score: datos.dpmo < 6210 ? 90 : 30,icono: '🎯' },
      { titulo: 'N Observaciones', valor: datos.n_obs,                        unidad: '',     score: datos.n_obs > 30 ? 90 : 60, icono: '🔢' },
    ],
  }

  const roleColor = ROLES.find(r => r.id === rol)?.colorHex

  return (
    <div className="grid grid-cols-2 gap-2">
      {(configs[rol] ?? configs.ciudadano).map((kpi, i) => (
        <KPICard key={kpi.titulo} {...kpi} delay={i * 0.07} roleColor={roleColor} />
      ))}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  const { rol, setRol, barrioActivo, indicadorActivo, setIndicador } = useDashboardStore()
  const { data: indicadores, isLoading } = useIndicadoresBarrio(barrioActivo?.id)
  const [showStatus, setShowStatus] = useState(false)

  const rolActual  = ROLES.find(r => r.id === rol)
  const icvValue   = indicadores?.icv_score || 62.4
  const roleColor  = rolActual?.colorHex ?? '#0066CC'
  const roleLight  = rolActual?.light ?? '#E3F2FD'

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden" data-role={rol}>

      {/* ═══════════════ NAVBAR ═══════════════════════════════════════════════ */}
      <nav className="navbar-gradient h-16 px-5 flex items-center justify-between shadow-lg shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center font-bold text-emerald-600 shadow-sm">
            🏢
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-none">MedCity</h1>
            <p className="text-white text-xs opacity-70 leading-none mt-0.5">Gobernanza Urbana</p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-white text-xs">
          <span className="opacity-60">{rolActual?.icono}</span>
          <span className="opacity-70">{rolActual?.label}</span>
          <ChevronRight size={12} className="opacity-40" />
          <span className="opacity-70">Medellín</span>
          {barrioActivo && (
            <>
              <ChevronRight size={12} className="opacity-40" />
              <span className="font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                {barrioActivo.nombre}
              </span>
            </>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-white/20 rounded-xl transition-colors" title="Notificaciones">
            <Bell size={16} className="text-white" />
          </button>
          <button className="p-2 hover:bg-white/20 rounded-xl transition-colors" title="Tema">
            <Moon size={16} className="text-white" />
          </button>
          <button className="p-2 hover:bg-white/20 rounded-xl transition-colors" title="Configuración">
            <Settings size={16} className="text-white" />
          </button>
        </div>
      </nav>

      {/* ═══════════════ HERO SECTION ═════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="hero-section mx-3 mt-2 mb-1 rounded-2xl px-5 py-3 text-white shrink-0"
      >
        <div className="relative z-10 flex items-center justify-between gap-4">
          {/* Left: Título + ICV */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold tracking-tight leading-none">Medellín en Datos</h2>
            <p className="text-xs opacity-70 mt-0.5 mb-2">Gobernanza inteligente & datos verificados</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-400 leading-none">
                {icvValue.toFixed(1)}
              </span>
              <span className="text-base opacity-70">/100 ICV</span>
            </div>
            <div className="progress-bar mt-2" style={{ '--width': `${icvValue}%` }} />
          </div>

          {/* Right: Selector de indicadores vertical */}
          <div className="flex flex-col gap-1 shrink-0">
            {INDICADORES.map((ind) => (
              <button
                key={ind.id}
                onClick={() => setIndicador(ind.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  backgroundColor: indicadorActivo === ind.id ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.15)',
                  color:           indicadorActivo === ind.id ? '#065F46'                 : 'rgba(255,255,255,0.85)',
                  fontWeight:      indicadorActivo === ind.id ? 700                       : 500,
                }}
              >
                <span>{ind.icono}</span>
                <span>{ind.label}</span>
                {indicadorActivo === ind.id && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ═══════════════ CONTENIDO PRINCIPAL ═════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* PANEL IZQUIERDO: MAPA */}
        <div className="flex-1 flex flex-col p-3 gap-2 min-w-0">
          <div className="flex-1 relative rounded-xl overflow-hidden min-h-0">
            <MapaComunas indicadoresData={indicadores?.mapa} />
          </div>

          {/* Barrio seleccionado */}
          <AnimatePresence>
            {barrioActivo && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0"
                style={{
                  backgroundColor: roleLight,
                  border: `1.5px solid ${roleColor}30`,
                }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: roleColor }}>
                  <span className="text-white text-xs">📍</span>
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-gray-800 text-sm">{barrioActivo.nombre}</span>
                  <span className="text-xs text-gray-400 ml-2">· {barrioActivo.tipo} {barrioActivo.identificacion}</span>
                </div>
                {indicadores?.icv_score && (
                  <span className="ml-auto text-sm font-bold shrink-0" style={{ color: roleColor }}>
                    ICV {indicadores.icv_score}/100
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PANEL DERECHO: DATOS + LLM */}
        <div className="w-[380px] flex flex-col gap-2 p-3 pl-0 overflow-y-auto shrink-0">

          {/* Role Selector 2x2 */}
          <RoleSelector rol={rol} setRol={setRol} />

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

          {/* API Status toggle */}
          <button
            onClick={() => setShowStatus(s => !s)}
            className="py-1.5 rounded-xl ring-1 ring-gray-200 bg-white text-gray-400
                       hover:text-gray-600 transition-colors text-center text-xs font-medium"
          >
            {showStatus ? '✓ APIs OK' : 'Ver estado APIs'}
          </button>
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
    </div>
  )
}
