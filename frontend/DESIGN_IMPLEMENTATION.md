# 🎨 MedCity Frontend — Guía de Implementación Práctica

Ejemplos de código listos para copiar & pegar. Mejora visual + funcionalidad.

---

## 1️⃣ NAVBAR CORPORATIVO CON GRADIENTE

### HTML Estructura (App.jsx)
```jsx
// Reemplazar el header actual con esto:

export default function App() {
  const { rol, barrioActivo } = useDashboardStore()
  const rolActual = ROLES.find(r => r.id === rol)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* NAVBAR CORPORATIVO */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <nav className="navbar-gradient h-20 px-6 flex items-center justify-between shadow-lg">
        {/* BRAND */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-lg text-emerald-600">
            🏢
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">MedCity</h1>
            <p className="text-white text-xs opacity-85">Gobernanza Urbana Inteligente</p>
          </div>
        </div>

        {/* BREADCRUMB / CONTEXTO */}
        <div className="flex items-center gap-2 text-white text-sm">
          <span className="opacity-75">{rolActual?.label}</span>
          <span className="opacity-50">›</span>
          <span className="opacity-75">Medellín</span>
          {barrioActivo && (
            <>
              <span className="opacity-50">›</span>
              <span className="font-medium">{barrioActivo.nombre}</span>
            </>
          )}
        </div>

        {/* ACCIONES */}
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-white/20 rounded-lg transition-colors" title="Notificaciones">
            🔔
          </button>
          <button className="p-2 hover:bg-white/20 rounded-lg transition-colors" title="Settings">
            ⚙️
          </button>
          <button className="p-2 hover:bg-white/20 rounded-lg transition-colors" title="Tema">
            🌙
          </button>
        </div>
      </nav>

      {/* REST OF APP */}
      <div className="flex h-[calc(100vh-80px)] overflow-hidden">
        {/* ... */}
      </div>
    </div>
  )
}
```

### CSS (index.css)
```css
/* Navbar Gradient */
.navbar-gradient {
  background: linear-gradient(90deg,
    #00A651 0%,
    #0066CC 50%,
    #003d99 100%);
  box-shadow: 0 4px 16px rgba(0, 166, 81, 0.15);
}

.navbar-gradient::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 400px; height: 80px;
  background: radial-gradient(circle at top-right,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 70%);
  pointer-events: none;
}
```

---

## 2️⃣ HERO SECTION IMPACTANTE

### Componente React (src/components/hero/HeroSection.jsx)
```jsx
import { motion } from 'framer-motion'

export function HeroSection({ icvData, onExplore }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  const progressVariants = {
    hidden: { width: 0 },
    visible: { width: `${icvData?.icv_score || 62.4}%`, transition: { duration: 1.2, ease: 'easeOut' } },
  }

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="hero-section relative overflow-hidden rounded-2xl p-8 md:p-12 bg-gradient-to-br from-emerald-500 via-blue-500 to-blue-900 text-white mb-6"
    >
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -ml-40 -mb-40"></div>

      {/* Content */}
      <div className="relative z-10">
        <motion.div variants={itemVariants}>
          <h1 className="text-5xl md:text-6xl font-black mb-2 leading-tight">
            Medellín en Datos
          </h1>
          <p className="text-xl md:text-2xl font-light opacity-95 mb-8">
            Gobernanza urbana inteligente & datos verificados
          </p>
        </motion.div>

        {/* ICV Highlight */}
        <motion.div variants={itemVariants} className="my-8">
          <p className="text-sm font-semibold opacity-85 mb-3 uppercase tracking-widest">
            Índice de Calidad de Vida (ICV)
          </p>
          <div className="flex items-baseline gap-4">
            <span className="text-7xl font-black text-amber-300">
              {icvData?.icv_score || 62.4}
            </span>
            <span className="text-2xl opacity-80">/ 100</span>
          </div>
          <p className="text-sm opacity-85 mt-2">Por encima del promedio de Medellín</p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div variants={itemVariants} className="my-6">
          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(icvData?.icv_score || 62.4)}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-amber-400 to-amber-300"
            />
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div variants={itemVariants} className="mt-8">
          <button
            onClick={onExplore}
            className="px-8 py-3 bg-white text-blue-900 font-bold rounded-xl hover:shadow-2xl transition-all hover:scale-105 text-lg"
          >
            Explorar tu barrio →
          </button>
        </motion.div>

        {/* Indicator Selector */}
        <motion.div variants={itemVariants} className="mt-8">
          <p className="text-sm opacity-75 mb-3">O selecciona un indicador:</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'icv', label: 'ICV', icon: '🏙️' },
              { id: 'seguridad', label: 'Seguridad', icon: '🛡️' },
              { id: 'aire', label: 'Aire', icon: '🌬️' },
              { id: 'movilidad', label: 'Movilidad', icon: '🚌' },
              { id: 'economia', label: 'Economía', icon: '💼' },
            ].map(ind => (
              <button
                key={ind.id}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl font-medium text-sm transition-all"
              >
                {ind.icon} {ind.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}
```

### CSS (index.css)
```css
.hero-section {
  box-shadow: 0 20px 60px rgba(0, 166, 81, 0.2);
  position: relative;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: -50%; right: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(circle at center,
    rgba(255, 255, 255, 0.05) 0%,
    transparent 70%);
}
```

---

## 3️⃣ ROLE SELECTOR GRID 2x2

### Componente React (src/components/role/RoleSelector.jsx)
```jsx
import { motion } from 'framer-motion'
import { useDashboardStore } from '../../store/dashboard.store'

const ROLES_CONFIG = [
  {
    id: 'ciudadano',
    label: 'Ciudadano',
    icon: '👤',
    description: 'Información personal',
    color: 'bg-blue-600',
    colorLight: 'bg-blue-50',
  },
  {
    id: 'comerciante',
    label: 'Comerciante',
    icon: '🏪',
    description: 'Negocios & flujos',
    color: 'bg-orange-600',
    colorLight: 'bg-orange-50',
  },
  {
    id: 'gobierno',
    label: 'Gobierno',
    icon: '🏛️',
    description: 'Política pública',
    color: 'bg-emerald-600',
    colorLight: 'bg-emerald-50',
  },
  {
    id: 'investigador',
    label: 'Investigador',
    icon: '🔬',
    description: 'Análisis estadístico',
    color: 'bg-purple-600',
    colorLight: 'bg-purple-50',
  },
]

export function RoleSelector() {
  const { rol, setRol } = useDashboardStore()
  const roleColor = {
    ciudadano: { bg: 'from-blue-50 to-white', border: 'border-blue-200', text: 'text-blue-700', primary: '#0066CC' },
    comerciante: { bg: 'from-orange-50 to-white', border: 'border-orange-200', text: 'text-orange-700', primary: '#FF6B35' },
    gobierno: { bg: 'from-emerald-50 to-white', border: 'border-emerald-200', text: 'text-emerald-700', primary: '#00A651' },
    investigador: { bg: 'from-purple-50 to-white', border: 'border-purple-200', text: 'text-purple-700', primary: '#6C5CE7' },
  }

  const currentRole = ROLES_CONFIG.find(r => r.id === rol)

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-100 mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Selecciona tu rol</h2>

      <div className="grid grid-cols-2 gap-4">
        {ROLES_CONFIG.map((role, i) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setRol(role.id)}
            className={`relative overflow-hidden p-4 rounded-xl border-2 transition-all duration-300 group ${
              rol === role.id
                ? `${roleColor[role.id].border} bg-gradient-to-br ${roleColor[role.id].bg} shadow-lg`
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            {/* Decorative circle */}
            {rol === role.id && (
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-white/30 rounded-full blur-2xl"></div>
            )}

            {/* Content */}
            <div className="relative z-10">
              <div className="text-4xl mb-2">{role.icon}</div>
              <h3 className={`font-bold text-lg mb-1 ${rol === role.id ? roleColor[role.id].text : 'text-gray-900'}`}>
                {role.label}
              </h3>
              <p className={`text-sm ${rol === role.id ? roleColor[role.id].text : 'text-gray-500'} opacity-80`}>
                {role.description}
              </p>

              {/* Active indicator */}
              {rol === role.id && (
                <motion.div
                  layoutId="activeRoleIndicator"
                  className="absolute bottom-2 right-2 w-3 h-3 bg-current rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
```

---

## 4️⃣ KPI CARD CON GRADIENTE

### Componente React (src/components/kpi/KPICard.jsx)
```jsx
import { motion } from 'framer-motion'

export function KPICard({ titulo, valor, unidad, score, icon, tendencia, delay, roleColor }) {
  const progressPercent = Math.min(score || 0, 100)
  const isPositive = tendencia && !tendencia.includes('-')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0, 0, 0, 0.1)' }}
      className="relative overflow-hidden rounded-2xl border-2 p-4 bg-gradient-to-br transition-all duration-300"
      style={{
        borderColor: roleColor,
        backgroundImage: `linear-gradient(to bottom right, rgba(${roleColor}, 0.1), white)`,
      }}
    >
      {/* Decorative corner circle */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/30 rounded-full blur-xl"></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Title */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
              {titulo}
            </p>
            <div className="text-3xl font-black" style={{ color: roleColor }}>
              {typeof valor === 'number' ? valor.toFixed(1) : valor}
              <span className="text-sm font-medium text-gray-600 ml-1">{unidad}</span>
            </div>
          </div>
          <div className="text-2xl">{icon}</div>
        </div>

        {/* Progress Bar */}
        <div className="my-3">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${roleColor}, rgba(${roleColor}, 0.5))`,
              }}
            />
          </div>
        </div>

        {/* Status Text */}
        <p className="text-xs text-gray-600 mb-2">
          {progressPercent > 75 ? '✅ Excelente' : progressPercent > 50 ? '⚠️ Bueno' : '❌ Requiere atención'}
        </p>

        {/* Tendencia */}
        {tendencia && (
          <div className={`text-xs font-semibold flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? '↑' : '↓'} {tendencia}
          </div>
        )}
      </div>
    </motion.div>
  )
}
```

---

## 5️⃣ ACTUALIZAR tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        'brand-green': '#00A651',
        'brand-blue': '#0066CC',
        'brand-orange': '#FF6B35',
        'brand-purple': '#6C5CE7',

        // Semantic
        'success': '#27AE60',
        'warning': '#F39C12',
        'danger': '#E74C3C',
        'info': '#3498DB',
      },
      boxShadow: {
        'brand-sm': '0 2px 8px rgba(0, 166, 81, 0.08)',
        'brand-md': '0 8px 24px rgba(0, 166, 81, 0.12)',
        'brand-lg': '0 20px 60px rgba(0, 166, 81, 0.2)',
      },
      animation: {
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

---

## 6️⃣ ACTUALIZAR index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  font-family: 'Inter', 'system-ui', sans-serif;
}

/* ═════════════════════════════════════════════════════════════ */
/* GLOBAL STYLES */
/* ═════════════════════════════════════════════════════════════ */

html {
  scroll-behavior: smooth;
}

body {
  @apply bg-gray-50;
}

/* ═════════════════════════════════════════════════════════════ */
/* ROLE-BASED CSS VARIABLES */
/* ═════════════════════════════════════════════════════════════ */

[data-role="ciudadano"] {
  --role-color: #0066CC;
  --role-color-light: #E3F2FD;
  --role-color-rgb: 0, 102, 204;
}

[data-role="comerciante"] {
  --role-color: #FF6B35;
  --role-color-light: #FFE5D9;
  --role-color-rgb: 255, 107, 53;
}

[data-role="gobierno"] {
  --role-color: #00A651;
  --role-color-light: #E8F5E9;
  --role-color-rgb: 0, 166, 81;
}

[data-role="investigador"] {
  --role-color: #6C5CE7;
  --role-color-light: #F3E5F5;
  --role-color-rgb: 108, 92, 231;
}

/* ═════════════════════════════════════════════════════════════ */
/* ANIMATIONS */
/* ═════════════════════════════════════════════════════════════ */

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ═════════════════════════════════════════════════════════════ */
/* COMPONENTS */
/* ═════════════════════════════════════════════════════════════ */

.btn-primary {
  @apply px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-105;
}

.btn-secondary {
  @apply px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all;
}

.card {
  @apply bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md;
}

.text-gradient {
  background: linear-gradient(135deg, #00A651 0%, #0066CC 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Glosario tooltip */
.glosario-term {
  @apply border-b border-dashed border-blue-400 text-blue-600 cursor-help hover:bg-blue-50 px-0.5;
}

/* LLM cursor */
.llm-cursor::after {
  content: '▌';
  animation: blink 1s infinite;
  color: #0066CC;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Leaflet overrides */
.leaflet-container {
  border-radius: 1.5rem;
}

.leaflet-popup-content-wrapper {
  border-radius: 1rem !important;
  border: none !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
}

.leaflet-popup-tip {
  background: white !important;
}

/* ═════════════════════════════════════════════════════════════ */
/* SCROLLBAR */
/* ═════════════════════════════════════════════════════════════ */

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #00A651;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #0066CC;
}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

```markdown
### PASO 1: ACTUALIZAR TAILWIND Y CSS
- [ ] Copiar nuevo `tailwind.config.js`
- [ ] Copiar nuevo `index.css`
- [ ] Actualizar colores en `dashboard.store.js`

### PASO 2: CREAR COMPONENTES NUEVOS
- [ ] `src/components/hero/HeroSection.jsx`
- [ ] `src/components/role/RoleSelector.jsx`
- [ ] Actualizar `src/components/kpi/KPICard.jsx`

### PASO 3: ACTUALIZAR App.jsx
- [ ] Agregar navbar corporativo
- [ ] Importar HeroSection
- [ ] Importar RoleSelector
- [ ] Usar CSS variables por rol

### PASO 4: TESTING
- [ ] Verificar colores en todos los roles
- [ ] Testear responsividad en mobile
- [ ] Verificar animaciones suaves
- [ ] Validar accesibilidad (contrast ratios)

### PASO 5: DEPLOY
- [ ] Build: `npm run build`
- [ ] Verificar en prod
- [ ] Medir engagement antes/después
```

---

**Total tiempo estimado:** 4-5 horas para FASE 1 completa

Después puedes hacer FASE 2 y FASE 3 incremental.

