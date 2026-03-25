import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Settings, ChevronRight, Sun, Moon, LayoutDashboard, X } from 'lucide-react'
import { MapaComunas }    from './components/map/MapaComunas'
import { KPICard, KPICardSkeleton } from './components/kpi/KPICard'
import { SigmaLevel }     from './components/kpi/SigmaLevel'
import { LLMPanel }       from './components/llm/LLMPanel'
import { TendenciaChart } from './components/charts/TendenciaChart'
import { APIStatus }      from './components/status/APIStatus'
import { useDashboardStore } from './store/dashboard.store'
import { useIndicadoresBarrio } from './hooks/useIndicadores'
import { useDarkMode } from './hooks/useDarkMode'

// ─── ROLES ────────────────────────────────────────────────────────────────────
const ROLES = [
  { id: 'ciudadano',    label: 'Ciudadano',    icono: '👤', colorHex: '#0066CC', light: '#E3F2FD', desc: 'Calidad de vida' },
  { id: 'comerciante',  label: 'Comerciante',  icono: '🏪', colorHex: '#FF6B35', light: '#FFE5D9', desc: 'Oportunidades'   },
  { id: 'gobierno',     label: 'Gobierno',     icono: '🏛️', colorHex: '#00A651', light: '#E8F5E9', desc: 'Gestión pública' },
  { id: 'investigador', label: 'Investigador', icono: '🔬', colorHex: '#6C5CE7', light: '#F3E5F5', desc: 'Análisis sigma'  },
]

const INDICADORES = [
  { id: 'icv',       label: 'ICV',       icono: '🏙️' },
  { id: 'seguridad', label: 'Seguridad', icono: '🛡️' },
  { id: 'aire',      label: 'Aire',      icono: '🌬️' },
  { id: 'movilidad', label: 'Movilidad', icono: '🚌' },
  { id: 'economia',  label: 'Economía',  icono: '💼' },
]

// ─── DARK MODE TOGGLE ─────────────────────────────────────────────────────────
function DarkToggle({ dark, toggle }) {
  return (
    <button
      onClick={toggle}
      className="dark-toggle btn-ripple"
      style={{ backgroundColor: dark ? '#6C5CE7' : 'rgba(255,255,255,0.3)' }}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
      aria-label="Toggle dark mode"
    >
      <div className={`dark-toggle-thumb flex items-center justify-center ${dark ? 'active' : ''}`}
        style={{ transform: dark ? 'translateX(18px)' : 'translateX(0)' }}>
        {dark
          ? <Moon size={9} style={{ color: '#6C5CE7' }} />
          : <Sun  size={9} style={{ color: '#F59E0B' }} />
        }
      </div>
    </button>
  )
}

// ─── ROLE SELECTOR 2×2 ────────────────────────────────────────────────────────
function RoleSelector({ rol, setRol }) {
  return (
    <div className="bg-white rounded-xl p-3 ring-1 ring-gray-100">
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
              whileHover={{ y: -2, transition: { duration: 0.12 } }}
              whileTap={{ scale: 0.96 }}
              className="relative p-3 rounded-xl text-left overflow-hidden btn-ripple"
              style={{
                backgroundColor: activo ? r.colorHex : r.light,
                border:     `2px solid ${activo ? r.colorHex : r.colorHex + '35'}`,
                boxShadow:  activo ? `0 4px 16px ${r.colorHex}40` : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-15"
                style={{ backgroundColor: activo ? 'white' : r.colorHex }} />

              <div className="text-xl mb-1 relative z-10">{r.icono}</div>
              <div className="font-bold text-sm leading-tight relative z-10"
                style={{ color: activo ? 'white' : r.colorHex }}>
                {r.label}
              </div>
              <div className="text-xs mt-0.5 relative z-10"
                style={{ color: activo ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }}>
                {r.desc}
              </div>

              {activo && (
                <motion.div
                  layoutId="role-dot"
                  className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white"
                  style={{ opacity: 0.85 }}
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
      {[1,2,3,4].map(i => <KPICardSkeleton key={i} />)}
    </div>
  )

  const roleColor = ROLES.find(r => r.id === rol)?.colorHex

  const configs = {
    ciudadano: [
      { titulo: 'Calidad de Vida',  valor: datos.icv_score, unidad: '/100',    score: datos.icv_score, icono: '🏙️', tendencia: datos.tendencia_icv        },
      { titulo: 'Seguridad',        valor: datos.seguridad, unidad: '/100',    score: datos.seguridad, icono: '🛡️', tendencia: datos.tendencia_seguridad  },
      { titulo: 'Calidad del Aire', valor: datos.aqi,       unidad: 'AQI',     score: 100-datos.aqi,   icono: '🌬️', tendencia: datos.tendencia_aire       },
      { titulo: 'Servicios',        valor: datos.servicios, unidad: '/100',    score: datos.servicios, icono: '⚡'                                          },
    ],
    comerciante: [
      { titulo: 'Flujo Peatonal', valor: datos.movilidad,           unidad: '/100',   score: datos.movilidad,                       icono: '🚶', tendencia: datos.tendencia_movilidad },
      { titulo: 'Oportunidad',    valor: datos.oportunidad_negocio, unidad: '/100',   score: datos.oportunidad_negocio,              icono: '💰' },
      { titulo: 'Seguridad',      valor: datos.seguridad,           unidad: '/100',   score: datos.seguridad,                       icono: '🛡️' },
      { titulo: 'Negocios/ha',    valor: datos.comercios_ha,        unidad: 'neg/ha', score: Math.min(datos.comercios_ha * 5, 100), icono: '🏪' },
    ],
    gobierno: [
      { titulo: 'ICV Score',          valor: datos.icv_score, unidad: '/100', score: datos.icv_score,         icono: '📊', tendencia: datos.tendencia_icv },
      { titulo: 'Percentil Medellín', valor: datos.percentil, unidad: 'pct',  score: datos.percentil,         icono: '📈' },
      { titulo: 'Sigma Level',        valor: datos.sigma,     unidad: 'σ',    score: (datos.sigma/6)*100,     icono: '⚡' },
      { titulo: 'Alertas Activas',    valor: datos.alertas,   unidad: '',     score: datos.alertas === 0 ? 100 : datos.alertas > 2 ? 20 : 60, icono: '🚨' },
    ],
    investigador: [
      { titulo: 'ICV Score',       valor: datos.icv_score,                     unidad: '/100', score: datos.icv_score,             icono: '📊' },
      { titulo: 'Desv. Estándar',  valor: datos.std,                           unidad: '',     score: datos.std < 10 ? 90 : 50,   icono: '📉' },
      { titulo: 'DPMO',            valor: datos.dpmo?.toLocaleString('es-CO'), unidad: '',     score: datos.dpmo < 6210 ? 90 : 30, icono: '🎯' },
      { titulo: 'N Observaciones', valor: datos.n_obs,                         unidad: '',     score: datos.n_obs > 30 ? 90 : 60,  icono: '🔢' },
    ],
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {(configs[rol] ?? configs.ciudadano).map((kpi, i) => (
        <KPICard key={kpi.titulo} {...kpi} delay={i * 0.07} roleColor={roleColor} />
      ))}
    </div>
  )
}

// ─── PANEL DE DATOS (reutilizable en desktop y mobile drawer) ─────────────────
function DataPanel({ rol, setRol, indicadores, showStatus, setShowStatus }) {
  return (
    <div className="flex flex-col gap-2 p-3">
      <RoleSelector rol={rol} setRol={setRol} />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${rol}-${indicadores?.barrio_id}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <KPIsSegunRol datos={indicadores} rol={rol} />
        </motion.div>
      </AnimatePresence>

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

      {indicadores && (
        <SigmaLevel
          sigma={indicadores.sigma}
          dpmo={indicadores.dpmo}
          diasDefectuosos={indicadores.dias_defectuosos}
        />
      )}

      <TendenciaChart />

      <div className="min-h-72">
        <LLMPanel />
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  const { rol, setRol, barrioActivo, indicadorActivo, setIndicador } = useDashboardStore()
  const { data: indicadores } = useIndicadoresBarrio(barrioActivo?.id)
  const { dark, toggle: toggleDark } = useDarkMode()
  const [showStatus, setShowStatus]   = useState(false)
  const [mobileOpen, setMobileOpen]   = useState(false)

  const rolActual = ROLES.find(r => r.id === rol)
  const icvValue  = indicadores?.icv_score || 62.4
  const roleColor = rolActual?.colorHex ?? '#0066CC'
  const roleLight = rolActual?.light     ?? '#E3F2FD'

  return (
    <div className="flex flex-col h-screen overflow-hidden" data-role={rol}
      style={{ backgroundColor: dark ? '#0F1117' : '#F9FAFB' }}>

      {/* ═══════════════ NAVBAR ═══════════════════════════════════════════════ */}
      <nav className="navbar-gradient h-14 px-4 flex items-center justify-between shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
            🏢
          </div>
          <div className="hidden sm:block">
            <h1 className="text-white font-bold text-sm leading-none">MedCity</h1>
            <p className="text-white text-xs opacity-60 leading-none mt-0.5">Gobernanza Urbana</p>
          </div>
        </div>

        {/* Breadcrumb — oculto en móvil muy pequeño */}
        <div className="hidden sm:flex items-center gap-1.5 text-white text-xs">
          <span className="opacity-60">{rolActual?.icono}</span>
          <span className="opacity-75">{rolActual?.label}</span>
          <ChevronRight size={11} className="opacity-40" />
          <span className="opacity-75">Medellín</span>
          <AnimatePresence>
            {barrioActivo && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1"
              >
                <ChevronRight size={11} className="opacity-40" />
                <span className="font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                  {barrioActivo.nombre}
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          <DarkToggle dark={dark} toggle={toggleDark} />
          <button className="p-2 hover:bg-white/20 rounded-xl transition-colors hidden sm:flex" title="Notificaciones">
            <Bell size={15} className="text-white" />
          </button>
          <button className="p-2 hover:bg-white/20 rounded-xl transition-colors hidden sm:flex" title="Configuración">
            <Settings size={15} className="text-white" />
          </button>
          {/* Botón mobile para abrir panel */}
          <button
            className="p-2 hover:bg-white/20 rounded-xl transition-colors md:hidden ml-1"
            onClick={() => setMobileOpen(true)}
            title="Ver datos"
          >
            <LayoutDashboard size={15} className="text-white" />
          </button>
        </div>
      </nav>

      {/* ═══════════════ HERO SECTION ═════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="hero-section mx-2 mt-2 mb-1 rounded-2xl px-4 py-3 text-white shrink-0"
      >
        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* ICV */}
          <div className="flex-1 min-w-0">
            <p className="text-xs opacity-60 font-medium uppercase tracking-wider">Medellín en Datos</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <motion.span
                key={icvValue}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-extrabold text-amber-400 leading-none"
              >
                {icvValue.toFixed(1)}
              </motion.span>
              <span className="text-sm opacity-60">/100 ICV</span>
            </div>
            <div className="progress-bar mt-2" style={{ '--width': `${icvValue}%` }} />
          </div>

          {/* Selector de indicadores */}
          <div className="flex flex-col gap-0.5 shrink-0">
            {INDICADORES.map((ind) => {
              const activo = indicadorActivo === ind.id
              return (
                <motion.button
                  key={ind.id}
                  onClick={() => setIndicador(ind.id)}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all"
                  style={{
                    backgroundColor: activo ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.12)',
                    color:           activo ? '#065F46'                 : 'rgba(255,255,255,0.8)',
                    fontWeight:      activo ? 700 : 500,
                  }}
                >
                  <span>{ind.icono}</span>
                  <span className="hidden sm:inline">{ind.label}</span>
                  {activo && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 hidden sm:block" />}
                </motion.button>
              )
            })}
          </div>
        </div>
      </motion.section>

      {/* ═══════════════ CONTENIDO PRINCIPAL ═════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* PANEL IZQUIERDO: MAPA */}
        <div className="flex-1 flex flex-col p-2 gap-2 min-w-0">
          <div className="flex-1 relative rounded-xl overflow-hidden min-h-0">
            <MapaComunas indicadoresData={indicadores?.mapa} />
          </div>

          {/* Barrio seleccionado */}
          <AnimatePresence>
            {barrioActivo && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="rounded-xl px-3 py-2 flex items-center gap-2.5 shrink-0"
                style={{
                  backgroundColor: dark ? roleColor + '18' : roleLight,
                  border: `1.5px solid ${roleColor}30`,
                }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white text-sm"
                  style={{ backgroundColor: roleColor }}>
                  📍
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-gray-800 text-sm block truncate">
                    {barrioActivo.nombre}
                  </span>
                  <span className="text-xs text-gray-400">
                    {barrioActivo.tipo} {barrioActivo.identificacion}
                  </span>
                </div>
                {indicadores?.icv_score && (
                  <motion.span
                    key={indicadores.icv_score}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-sm font-bold shrink-0"
                    style={{ color: roleColor }}
                  >
                    ICV {indicadores.icv_score}
                  </motion.span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PANEL DERECHO — DESKTOP */}
        <div className="hidden md:flex w-[375px] flex-col overflow-y-auto shrink-0 pr-2">
          <DataPanel
            rol={rol}
            setRol={setRol}
            indicadores={indicadores}
            showStatus={showStatus}
            setShowStatus={setShowStatus}
          />
        </div>
      </div>

      {/* ═══════════════ MOBILE DRAWER ════════════════════════════════════════ */}
      {/* Overlay */}
      <div
        className={`mobile-overlay md:hidden ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer */}
      <div className={`mobile-panel md:hidden ${mobileOpen ? 'open' : ''}`}
        style={{ backgroundColor: dark ? '#1A1D27' : 'white' }}>
        <div className="mobile-handle" />
        {/* Encabezado del drawer */}
        <div className="flex items-center justify-between px-4 pb-2">
          <p className="text-sm font-bold text-gray-700">Panel de Datos</p>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <DataPanel
          rol={rol}
          setRol={setRol}
          indicadores={indicadores}
          showStatus={showStatus}
          setShowStatus={setShowStatus}
        />
      </div>

    </div>
  )
}
