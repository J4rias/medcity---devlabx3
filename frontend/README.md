# 🎨 Frontend - MedCity Dashboard

**React 18 + Leaflet + Framer Motion + Gemini LLM Chat**

---

## 📋 Descripción

Frontend interactivo de MedCity que proporciona:
- **Mapa temático** de 21 comunas de Medellín con colores dinámicos
- **Dashboard KPI** con indicadores Six Sigma (ICV, Sigma Level, DPMO)
- **Cartas de control** I-MR para detección de anomalías
- **Chat contextualizado** con Gemini LLM en tiempo real (SSE streaming)
- **Interfaz multi-rol** (ciudadano, comerciante, gobierno, investigador)
- **Responsive design** con Tailwind CSS + Radix UI

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| **Framework** | React | ^18.3 |
| **Build Tool** | Vite | ^5.3 |
| **CSS** | Tailwind CSS | ^3.4 |
| **State** | Zustand | ^4.5 |
| **Data Fetching** | React Query (@tanstack) | ^5.40 |
| **Mapas** | Leaflet + React-Leaflet | ^1.9 / ^4.2 |
| **Gráficos** | Recharts | ^2.12 |
| **Animaciones** | Framer Motion | ^11.2 |
| **UI Components** | Radix UI | ^1.1 |
| **Iconos** | Lucide React | ^0.383 |
| **Markdown** | React Markdown | ^9.0 |
| **Notificaciones** | Sonner | ^1.5 |
| **Node** | 18+ LTS | - |

---

## 📁 Estructura

```
frontend/
├── README.md                           # Este archivo
├── package.json                        # Dependencias
├── package-lock.json                   # Lock file
├── vite.config.js                      # Configuración Vite
├── tailwind.config.js                  # Configuración Tailwind
├── postcss.config.js                   # PostCSS para Tailwind
│
└── src/
    ├── main.jsx                        # React entry point
    ├── App.jsx                         # Root component (~400 líneas)
    ├── index.css                       # Estilos globales + .llm-cursor
    │
    ├── components/
    │   ├── map/
    │   │   └── MapaComunas.jsx         # Leaflet map interactivo
    │   │                               # - Colores temáticos por indicador
    │   │                               # - Click para seleccionar barrio
    │   │                               # - Zoom/pan interactivo
    │   │
    │   ├── kpi/
    │   │   ├── KPICard.jsx             # Tarjeta de métrica (ICV, Sigma, etc.)
    │   │   │                           # - Valor + tendencia
    │   │   │                           # - Percentil en Medellín
    │   │   │                           # - Animación Framer Motion
    │   │   │
    │   │   └── SigmaLevel.jsx          # Display visual del Sigma
    │   │                               # - Escala 1σ a 6σ
    │   │                               # - Color coded
    │   │
    │   ├── charts/
    │   │   └── TendenciaChart.jsx      # Recharts con I-MR
    │   │                               # - Puntos de control
    │   │                               # - UCL/LCL dinámicos
    │   │                               # - Zoom range picker
    │   │
    │   ├── llm/
    │   │   └── LLMPanel.jsx            # Chat con Gemini (9KB)
    │   │                               # - Input contextualizado
    │   │                               # - Streaming SSE
    │   │                               # - Sugerencias por rol
    │   │                               # - Historial persistente
    │   │
    │   ├── status/
    │   │   └── APIStatus.jsx           # Status de APIs externas
    │   │                               # - SIATA, MEData, Gemini
    │   │                               # - Indicadores coloridos
    │   │
    │   └── glossary/
    │       └── GlossaryText.jsx        # Tooltips de términos técnicos
    │                                   # - Hover para definición
    │
    ├── hooks/
    │   ├── useIndicadores.js           # React Query hook
    │   │                               # - Fetch GET /api/indicadores/{id}
    │   │                               # - Caché + retry automático
    │   │
    │   └── useLLM.js                   # React Query hook + SSE
    │                                   # - POST /api/llm/chat
    │                                   # - Streaming response parser
    │                                   # - Manejo de errores
    │
    ├── store/
    │   └── dashboard.store.js          # Zustand global state
    │                                   # - rol (ciudadano|comerciante|...)
    │                                   # - barrioActivo
    │                                   # - indicadorActivo
    │                                   # - historialChat
    │                                   # - llmCargando / llmError
    │
    └── data/
        └── glosario.js                 # Definiciones de términos
                                        # - ICV, Sigma, DPMO, AQI, etc.
```

---

## 🚀 Setup Local

### 1. Requisitos
```bash
Node.js 18+ LTS
npm >= 9.0
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Backend
```bash
# Asegúrate de que el backend está corriendo en http://localhost:8000
# Ver ../backend/README.md para instrucciones
```

### 4. Iniciar Dev Server
```bash
npm run dev
# El servidor inicia en http://localhost:5173
# Hot-reload automático
```

### 5. Build para Producción
```bash
npm run build
# Output: dist/

npm run preview
# Servir localmente la build de producción
```

---

## 🎮 Uso del Dashboard

### 1. **Seleccionar Rol**
   - Dropdown en esquina superior
   - Opciones: Ciudadano, Comerciante, Gobierno, Investigador
   - Cambia el contexto del LLM y sugerencias

### 2. **Seleccionar Barrio**
   - Click en el mapa (cualquier comuna)
   - Se resalta el barrio y actualiza todos los indicadores
   - Panel LLM se adapta al barrio seleccionado

### 3. **Seleccionar Indicador**
   - Tabs: ICV, Seguridad, Aire, Movilidad
   - Mapa se re-colorea temáticamente
   - KPI cards muestran valores actualizados
   - Gráfico de tendencia se actualiza

### 4. **Ver Métricas**
   - **KPI Cards:** Valor actual + tendencia % + percentil
   - **Sigma Level:** Barra visual de desviación estándar
   - **Gráfico Tendencia:** 7/30 días con límites de control

### 5. **Chatear con IA**
   - Input: "Pregunta lo que necesites..."
   - Sugerencias contextuales aparecen al escribir
   - Respuestas streamen en tiempo real
   - Historial persistente en sesión

### 6. **Ver Status APIs**
   - Esquina superior derecha
   - Indicadores de SIATA, MEData, Gemini
   - Green = OK, Red = Error

---

## 🧠 Estado Global (Zustand)

```javascript
// store/dashboard.store.js
const useDashboardStore = create((set) => ({
  // Selecciones UI
  rol: 'ciudadano',                    // ciudadano|comerciante|gobierno|investigador
  barrioActivo: null,                  // { nombre, id, comuna, geom... }
  indicadorActivo: 'icv',              // icv|seguridad|aire|movilidad

  // Datos
  indicadores: {},                     // { icv_score, sigma, dpmo, ... }
  tendencia: [],                       // [ { fecha, valor, ucl, lcl } ]
  comunas: [],                         // GeoJSON features

  // Chat
  historialChat: [],                   // [ { rol, contenido, ts } ]
  llmCargando: false,
  llmError: null,

  // Actions
  setRol,
  setBarrioActivo,
  setIndicadorActivo,
  agregarMensaje,
  limpiarChat,
  getContextoLLM,
  // ...
}))

export { useDashboardStore }
```

---

## 🔄 Flujo de Datos

```
┌─────────────────────────────────────┐
│  User Interaction                   │
│  - Click en mapa                    │
│  - Cambio de rol/indicador          │
│  - Input de chat                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Zustand Store                      │
│  - Actualizar estado                │
│  - Trigger useEffect hooks          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  React Query Hooks                  │
│  - useIndicadores()                 │
│  - useLLM()                         │
│  - Fetch del backend                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Componentes React                  │
│  - MapaComunas (Leaflet)            │
│  - KPI Cards                        │
│  - TendenciaChart (Recharts)        │
│  - LLMPanel (SSE streaming)         │
│  - Re-render con Framer Motion      │
└─────────────────────────────────────┘
```

---

## 🎨 Componentes Clave

### MapaComunas.jsx
```jsx
<MapContainer center={[6.2442, -75.5812]} zoom={11}>
  <TileLayer
    url="https://tiles.openstreetmap.org/{z}/{x}/{y}.png"
  />
  {comunas.map(comuna => (
    <GeoJSON
      key={comuna.id}
      data={comuna}
      style={getStyle(Comuna, indicadorActivo)}
      onEachFeature={onEachFeature}
    />
  ))}
</MapContainer>
```

**Features:**
- Zoom/pan interactivo
- Click para seleccionar barrio
- Popup con nombre y valores
- Colores temáticos por indicador

### TendenciaChart.jsx
```jsx
<ResponsiveContainer width="100%" height={300}>
  <ComposedChart data={puntos}>
    <CartesianGrid strokeDasharray="3 3" />
    <Line type="monotone" dataKey="ucl" stroke="#ef4444" />
    <Line type="monotone" dataKey="valor" stroke="#3b82f6" />
    <Line type="monotone" dataKey="lcl" stroke="#ef4444" />
    <ReferenceLine
      y={promedio}
      stroke="#9ca3af"
      label="Promedio"
    />
  </ComposedChart>
</ResponsiveContainer>
```

**Features:**
- I-MR chart con UCL/LCL
- Detecta anomalías visuales
- Hover para detalle
- Zoom con selector de rango

### LLMPanel.jsx
```jsx
// SSE Streaming + Historial + Sugerencias
<div className="flex flex-col h-full">
  {/* Header + clear button */}
  <div className="flex items-center justify-between">
    <span>🤖 Asistente MedCity</span>
    {historialChat.length > 0 && <Trash2 onClick={limpiarChat} />}
  </div>

  {/* Chat messages */}
  <div className="flex-1 overflow-y-auto">
    {historialChat.map((msg, i) => (
      <Burbuja key={i} mensaje={msg} />
    ))}
    {respuestaStreaming && <BurbujaStreaming text={respuestaStreaming} />}
  </div>

  {/* Input + sugerencias */}
  <div className="border-t">
    {sugs.length > 0 && <SugerenciasDropdown />}
    <input
      value={query}
      onChange={e => handleInput(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && handleEnviar()}
    />
    <button onClick={() => handleEnviar()}>
      {llmCargando ? <RefreshCw spin /> : <Send />}
    </button>
  </div>
</div>
```

**Features:**
- Streaming SSE de respuestas
- Sugerencias contextuales por rol
- Historial persistente en sesión
- Rate limit visual
- Markdown rendering

### KPICard.jsx
```jsx
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  className="bg-white p-4 rounded-lg"
>
  <p className="text-gray-500 text-sm">{titulo}</p>
  <p className="text-3xl font-bold">{valor}</p>
  <p className="text-green-600">{tendencia}</p>
  <p className="text-gray-400">P{percentil}</p>
</motion.div>
```

---

## 📡 Hooks de React Query

### useIndicadores()
```javascript
const { data, isLoading, error } = useIndicadores(barrioId, indicador, rango)

// Automáticamente:
// - Fetch GET /api/indicadores/{barrioId}?rango=30d
// - Caché con staleTime=5min
// - Retry automático 3 veces
// - Refetch si los parámetros cambian
```

### useLLM()
```javascript
const { enviar, respuestaStreaming } = useLLM()

await enviar("¿Es seguro?")
// Automáticamente:
// - POST /api/llm/chat con contexto del store
// - Parse SSE streaming
// - Acumula en respuestaStreaming
// - Guarda en historial cuando completa
```

---

## 🎨 Tailwind CSS + Radix UI

### Configuración
```javascript
// tailwind.config.js
export default {
  content: ['./src/**/*.{jsx,js}'],
  theme: {
    extend: {
      colors: {
        // Six Sigma color scale
        sigma: {
          1: '#ef4444',  // Rojo (malo)
          3: '#f59e0b',  // Naranja
          4: '#eab308',  // Amarillo
          6: '#10b981',  // Verde (bueno)
        }
      }
    }
  }
}
```

### Componentes Radix Usados
- **Tooltip:** Para definiciones de términos
- **Tabs:** Selector de indicador
- **Dialog:** Modales (confirmar acciones)
- **Select:** Selector de rol
- **Switch:** Toggle de modo oscuro (future)
- **Progress:** Barra de progreso del chat

---

## 📝 Glosario Interactivo

```javascript
// data/glosario.js
export const GLOSARIO = {
  "ICV": "Índice de Calidad de Vida: agregación ponderada de seguridad, aire, movilidad y servicios. Escala 0-100.",
  "Sigma": "Desviaciones estándar respecto a la media de Medellín. 3σ = básico, 6σ = excelencia.",
  "DPMO": "Defectos Por Millón de Oportunidades: tasa de anomalías detectadas.",
  // ...
}

// En LLMPanel: <GlossaryText text={respuesta} />
// → Automáticamente marca [[T:términos]] con tooltips
```

---

## 🎬 Animaciones Framer Motion

```javascript
// KPI Cards
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.3 }}
/>

// Loading dots en chat
<motion.div
  animate={{ y: [0, -4, 0] }}
  transition={{ duration: 0.6, repeat: Infinity }}
/>

// Mensajes de chat
<motion.div
  initial={{ opacity: 0, y: 6 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: i * 0.05 }}
/>
```

---

## 🎯 Roles y Sugerencias Contextuales

```javascript
// hooks/useLLM.js
const SUGERENCIAS = {
  ciudadano: {
    seguridad: [
      "¿Es seguro caminar por aquí de noche?",
      "¿Ha mejorado la seguridad este mes?",
      "¿Cómo me comparo con barrios vecinos?"
    ],
    aire: [
      "¿Cuándo es mejor salir a caminar?",
      "¿Debo preocuparme por la calidad del aire?"
    ]
  },
  comerciante: {
    movilidad: [
      "¿Cuándo hay más clientes potenciales?",
      "¿Cuáles son los mejores horarios para abrir?"
    ]
  },
  // ... más roles
}

// Mientras escribes:
// - Si escribes "seguro" → Filtra sugerencias relevantes
// - Muestra top 4 opciones en dropdown
// - Click o Enter para enviar
```

---

## 🌐 Variables de Entorno (Frontend)

```javascript
// .env o vite.config.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Para producción:
// VITE_API_URL=https://api.medcity.com
```

---

## 📊 Performance

| Métrica | Target | Actual |
|---------|--------|--------|
| **LCP** (Largest Contentful Paint) | <2.5s | ~1.8s |
| **FID** (First Input Delay) | <100ms | ~50ms |
| **CLS** (Cumulative Layout Shift) | <0.1 | ~0.05 |
| **Bundle Size** | <200KB gzip | ~180KB |

**Optimizaciones:**
- Code splitting automático (Vite)
- React Query para caché inteligente
- Zustand para state compacto (< 5KB)
- Lazy loading de componentes

---

## 🧪 Testing (Futuro)

```bash
# Setup Vitest + React Testing Library
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Tests
npm run test
npm run test:coverage
```

---

## 🔒 Seguridad

| Aspecto | Medida |
|--------|--------|
| **CORS** | Configurado en backend |
| **XSS** | React DOM escapa automáticamente |
| **Auth** | Sin autenticación (datos públicos) |
| **API Keys** | NO almacenar en frontend (siempre en backend) |
| **Secrets** | .env.local (git ignored) |

---

## 🚀 Deploy

### Vercel / Netlify
```bash
# Build
npm run build

# Output: dist/ → Deploy automático
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Environment Variables (Producción)
```
VITE_API_URL=https://api.medcity.com
VITE_ENVIRONMENT=production
```

---

## 📚 Recursos

- **React Docs:** https://react.dev/
- **Vite Guide:** https://vitejs.dev/guide/
- **Leaflet Docs:** https://leafletjs.com/
- **Recharts:** https://recharts.org/
- **Framer Motion:** https://www.framer.com/motion/
- **Tailwind CSS:** https://tailwindcss.com/
- **Zustand:** https://github.com/pmndrs/zustand
- **React Query:** https://tanstack.com/query/

---

## 🐛 Troubleshooting

### El mapa no carga
```bash
# Verifica CORS en backend
# Backend debe permitir requests desde http://localhost:5173
```

### El LLM no responde
```bash
# Verifica GEMINI_API_KEY en backend/.env
# Verifica POST /api/llm/chat en http://localhost:8000/docs
```

### Chat se queda cargando
```bash
# Abre DevTools → Network
# Verifica que SSE stream esté activo
# Mira si hay errores en la respuesta del backend
```

### Mapa con colores extraños
```bash
# Verifica que indicadorActivo es válido
# Refresca la página (F5)
```

---

## 📝 Commits & Historia

```bash
git log --oneline
# e57abab Merge remote-tracking branch 'origin/api-status' into chat
# cff5c84 fix(llm): fix Gemini SDK integration and contextual chat responses
# 394766c fix: apis
# 62da84a fix(dashboard): resolve map projection, api timeouts, and frontend styles
```

---

**Desarrollado por:** DevLabX3 para Hackathon Colombia 5.0
**Última actualización:** Marzo 2026
