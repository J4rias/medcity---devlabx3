# 🏙️ MedCity Dashboard

**Dashboard de análisis urbano Six Sigma para Medellín con inteligencia artificial contextualizada y resiliencia en tiempo real.**

---

## 📋 Descripción del Proyecto

MedCity es un dashboard interactivo de gobernanza urbana que integra datos abiertos de Medellín (MEData, SIATA) con análisis estadístico Six Sigma y un asistente IA (Gemini LLM) anti-alucinación. Proporciona indicadores de calidad de vida (ICV), seguridad, calidad del aire y movilidad por barrio, con fallback automático a datos válidos estadísticamente cuando las APIs externas fallan.

Ganador del **Hackathon Colombia 5.0** (Medellín).

---

## 🎯 Para Qué Sirve

### Ciudadanos
- Consultar seguridad, calidad del aire y calidad de vida de su barrio
- Recibir recomendaciones contextualizadas basadas en datos verificados

### Comerciantes
- Analizar flujo de clientes, horarios pico y competencia en sus zonas
- Evaluar oportunidades de negocio basadas en datos de economía informal

### Gobierno
- Identificar brechas de equidad entre comunas
- Tomar decisiones de inversión basadas en alertas estadísticas Six Sigma
- Monitorear cumplimiento del Plan de Desarrollo de Medellín

### Investigadores
- Acceder a correlaciones, anomalías estadísticas y metodología Six Sigma
- Explorar datos con control de calidad integrado

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** — UI interactiva
- **Vite** — Build tool ultrarrápido
- **Leaflet + React-Leaflet** — Mapas interactivos con datos georreferenciados
- **Zustand** — State management compacto
- **React Query (@tanstack/react-query)** — Fetching y caching de datos
- **Framer Motion** — Animaciones fluidas
- **Recharts** — Gráficos de tendencias y cartas de control estadístico
- **Tailwind CSS** — Diseño responsivo
- **Radix UI** — Componentes accesibles (Tooltip, Tabs, Dialog, Select, Switch)
- **Lucide React** — Iconografía consistente
- **React Markdown** — Renderizado de respuestas LLM

### Backend
- **FastAPI** — API REST asíncrona de alto rendimiento
- **Uvicorn** — Servidor ASGI
- **Python 3.11+** — Lenguaje principal

#### Librerías Core
- **Pandas + NumPy** — Procesamiento de datos y cálculos Six Sigma (ICV, Sigma Level, DPMO, control límits)
- **Google Generative AI** — Integración con Gemini LLM
- **HTTPX** — Cliente HTTP asíncrono para APIs MEData/SIATA
- **Pydantic** — Validación de datos y schemas
- **Tenacity** — Reintentos automáticos con backoff exponencial (APIs flaky)
- **Cachetools** — Caché en memoria con TTL
- **Overpy** — Consultas a OpenStreetMap para datos de economía informal
- **GeoJSON** — Manejo de datos geoespaciales

### APIs Externas
- **MEData** (Medellin) — Datos abiertos: criminalidad, incidentes viales, homicidios, NUSE-123
- **SIATA** — Calidad del aire (PM2.5), 21 estaciones con interpolación IDW
- **Google Gemini LLM** — Respuestas contextualizadas con grounding anti-alucinación
- **OpenStreetMap** — Datos de comercios y economía informal
- **ArcGIS Open Data** — Geometría de comunas (GeoJSON)

### DevOps & CI/CD
- **Git** — Control de versiones
- **GitHub** — Repositorio (rama `main` con hotfixes de `chat` + `api-status`)

---

## 📊 Características Principales

### 1. **Dashboard Interactivo**
- Mapa temático de 21 comunas de Medellín
- Selección dinámica de indicador activo (ICV, Seguridad, Aire, Movilidad)
- Colores dinámicos basados en percentiles

### 2. **Indicadores Six Sigma por Barrio**
- **ICV (Índice de Calidad de Vida):** /100
- **Sigma Level:** Desviaciones estándar de anomalía
- **DPMO:** Defectos por millón de oportunidades (tasa de anomalía)
- **Percentil en Medellín:** Posición relativa
- **Seguridad:** Score de criminalidad + homicidios
- **AQI (Calidad del Aire):** PM2.5 interpolado vía IDW desde 21 estaciones SIATA
- **Movilidad:** Score de incidentes viales
- **Economía Informal:** Estimación de comercios informales con IC 90%

### 3. **Cartas de Control Estadístico**
- Gráfico I-MR (Individual-Moving Range)
- Límites de control dinámicos (UCL/LCL)
- Detección automática de anomalías

### 4. **Asistente IA Contextualizado (Gemini LLM)**
- Respuestas específicas por barrio, indicador y rol
- **Anti-alucinación:** Inyección de `VALORES VERIFICADOS` en prompt oculto
- Validación heurística de números antes de responder
- Fallback automático a respuestas template si Gemini falla
- Caché de respuestas (TTL 10 minutos)
- Rate limiting (10 req/min por sesión)
- Historial de chat persistente

### 5. **Resiliencia (SRE)**
- Fallback a datos Mocks válidos estadísticamente (IDW) si MEData/SIATA caen
- Proxy y caching dinámico
- Reintentos automáticos con backoff exponencial
- Mode sin internet con datos embebidos

### 6. **Roles Contextualizados**
- **Ciudadano:** Lenguaje cotidiano, seguridad/aire/servicios
- **Comerciante:** Orientado a negocios, flujo de clientes, competencia
- **Gobierno:** Técnico, comparativas inter-comunas, prioridades de inversión
- **Investigador:** Estadístico, anomalías, limitaciones metodológicas

---

## 🚀 Quick Start

### Requisitos
- **Node.js LTS** (v18+)
- **Python 3.11+**
- **Variables de entorno:**
  - `GEMINI_API_KEY` — API key de Google Gemini
  - `MEDATA_APP_TOKEN` — Token MEData (opcional, requiere registro)
  - `SIATA_TOKEN` — Token SIATA (opcional)

### Setup Local

#### 1. Clonar y Entrar
```bash
git clone https://github.com/J4rias/medcity---devlabx3.git
cd medcity---devlabx3
```

#### 2. Backend
```bash
cd backend

# Copiar template y configurar env
cp .env.example .env
# Editar .env y añadir GEMINI_API_KEY

# Instalar dependencias Python
pip install -r requirements.txt

# Iniciar servidor FastAPI
uvicorn main:app --reload --port 8000
# Docs: http://localhost:8000/docs
```

#### 3. Frontend
```bash
cd frontend

# Instalar dependencias Node
npm install

# Iniciar dev server
npm run dev
# App: http://localhost:5173
```

### Verificación
```bash
# Backend health
curl http://localhost:8000/api/status

# Indicadores de un barrio
curl http://localhost:8000/api/indicadores/04  # Comuna 4 (La Candelaria)

# Chat LLM
curl -X POST http://localhost:8000/api/llm/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "¿Es seguro este barrio?",
    "contexto": {"barrio": "La Candelaria", "barrio_id": "04", "rol": "ciudadano"},
    "rol": "ciudadano"
  }'
```

---

## 📁 Estructura del Proyecto

```
medcity---devlabx3/
├── README.md                           # Este archivo
├── pitch_medcity.md                    # Deck de presentación hackathon
├── plan_ejecucion.md                   # Timeline 4 horas ejecución
├── setup_rapido.md                     # Quick start minimalista
│
├── backend/
│   ├── main.py                         # Entrypoint FastAPI
│   ├── requirements.txt                # Dependencias Python
│   ├── .env.example                    # Template variables entorno
│   ├── routers/
│   │   ├── indicadores.py              # GET /api/indicadores/{barrio_id}
│   │   └── llm.py                      # POST /api/llm/chat (streaming SSE)
│   ├── services/
│   │   ├── etl.py                      # ETL: MEData/SIATA + mock fallback + Six Sigma
│   │   ├── prompt_builder.py           # Construcción de prompts multi-capa con grounding
│   │   └── validator.py                # Validador heurístico anti-alucinación
│   └── data/
│       ├── comunas.geojson             # GeoJSON original (~4MB)
│       └── comunas_wgs84.geojson       # Reprojectado WGS84 (~6MB)
│
└── frontend/
    ├── package.json                    # Dependencias Node
    ├── vite.config.js                  # Configuración Vite
    ├── tailwind.config.js              # Configuración Tailwind
    ├── src/
    │   ├── App.jsx                     # Root component
    │   ├── main.jsx                    # React entry point
    │   ├── components/
    │   │   ├── map/
    │   │   │   └── MapaComunas.jsx     # Leaflet map con temas dinámicos
    │   │   ├── kpi/
    │   │   │   ├── KPICard.jsx         # Tarjeta de métrica
    │   │   │   └── SigmaLevel.jsx      # Indicador Sigma
    │   │   ├── charts/
    │   │   │   └── TendenciaChart.jsx  # Recharts con cartas de control
    │   │   ├── llm/
    │   │   │   └── LLMPanel.jsx        # Chat con streaming SSE
    │   │   ├── status/
    │   │   │   └── APIStatus.jsx       # Status de APIs externas
    │   │   └── glossary/
    │   │       └── GlossaryText.jsx    # Tooltips de términos técnicos
    │   ├── hooks/
    │   │   ├── useIndicadores.js       # React Query hook ETL
    │   │   └── useLLM.js               # React Query hook LLM
    │   ├── store/
    │   │   └── dashboard.store.js      # Zustand global state
    │   ├── data/
    │   │   └── glosario.js             # Definiciones de términos técnicos
    │   └── index.css                   # Estilos base + cursor LLM
```

---

## 🔄 Flujo de Datos

```
┌─────────────────────────────────────┐
│  Frontend (React)                   │
│  - Mapa interactivo (Leaflet)       │
│  - Selección de barrio/indicador    │
│  - Input de chat                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  FastAPI Backend                    │
│  ┌─────────────────────────────────┐│
│  │ Router: /api/indicadores/{id}  ││
│  │ → ETL → Cache → JSON           ││
│  └──────────┬──────────────────────┘│
│  ┌──────────▼──────────────────────┐│
│  │ Router: /api/llm/chat (SSE)    ││
│  │ → Prompt Builder               ││
│  │ → Gemini LLM                   ││
│  │ → Validator                    ││
│  │ → Stream chunks                ││
│  └─────────────────────────────────┘│
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │  APIs Externas       │
    │  - MEData (CSV)      │
    │  - SIATA (JSON)      │
    │  - OSM (Overpass)    │
    │  - Gemini (LLM)      │
    └──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Cache en Memoria    │
    │  (TTL según tipo)    │
    └──────────────────────┘
```

---

## 📊 Cálculos Six Sigma

### ICV (Índice de Calidad de Vida)
- Agregación ponderada de: seguridad, aire, movilidad, acceso a servicios
- Escala 0-100
- Calculado por barrio mensualmente

### Sigma Level
- Desviaciones estándar respecto a la media de Medellín
- Interpretación:
  - **3σ:** Competencia básica (DPMO ≈ 66,810)
  - **4σ:** Buen desempeño (DPMO ≈ 6,210)
  - **6σ:** Excelencia (DPMO ≈ 3.4)

### DPMO (Defectos Por Millón de Oportunidades)
- Tasa de anomalías detectadas en cartas de control I-MR
- Triggers de alerta automática

### Cartas de Control I-MR
- **I:** Valor individual por período
- **MR:** Moving Range (rango móvil) para detección de tendencias
- **UCL/LCL:** Límites superiores/inferiores dinámicos

---

## 🤖 Anti-Alucinación en LLM

El backend implementa un pipeline de 5 actuadores para evitar que Gemini invente datos:

1. **Rate Limit:** Máx 10 req/min por sesión
2. **Caché:** Respuestas pre-calculadas (TTL 10 min)
3. **Grounding:** Inyección de `VALORES VERIFICADOS` en prompt oculto
4. **Validación Heurística:** Extracción de números y comparación contra indicadores reales
5. **Fallback:** Template de respuesta si validación falla o LLM cae

**Prompt Structure:**
```
[CAPA 1] SYSTEM + ROLE PERSONA
[CAPA 2] CONTEXT BLOCK (Barrio, Comuna, Alertas)
[CAPA 3] GROUNDING ANCHOR (Números verificados con [N])
[CAPA 4] HISTORIAL (Últimos 5 turnos de chat)
[CAPA 5] QUERY ACTUAL
```

---

## 🌍 Despliegue Multi-ciudad

Roadmap para expandir a otras ciudades colombianas:

### Bogotá
- Usar IDECA para geometría + datos abiertos
- MEData proporciona datos consolidados nacionales

### Cali
- Datos abiertos municipales (datosabiertos.cali.gov.co)
- SIATA cubre región

**Parametrización:** El mapa se adapta vía GeoJSON y configuración de APIs por ciudad.

---

## 📝 Notas de Desarrollo

### Rama Main
- **main:** Rama de producción con hotfixes integrados
- **chat:** Rama de features (feedback del hackathon)
- **api-status:** Rama de stabilidad y status APIs

### Hooks Git
- Pre-commit: Validación de código (opcional)
- Pre-push: Tests (opcional)

### Environment
```bash
# .env (no subir a git)
GEMINI_API_KEY=YOUR_KEY_HERE
MEDATA_APP_TOKEN=YOUR_TOKEN_HERE  # opcional
SIATA_TOKEN=YOUR_TOKEN_HERE       # opcional
ENVIRONMENT=development
```

### Testing
```bash
# Backend
pytest backend/

# Frontend
npm test

# APIs
python backend/test_apis.py
```

---

## 🎓 Conceptos Clave

| Término | Significado |
|---------|------------|
| **ICV** | Índice de Calidad de Vida (0-100) |
| **Sigma** | Desviaciones estándar del promedio |
| **DPMO** | Defectos por millón de oportunidades |
| **IDW** | Interpolación Distancia Inversa (para AQI) |
| **AQI** | Air Quality Index (Índice de Calidad del Aire) |
| **SSE** | Server-Sent Events (streaming HTTP) |
| **ETL** | Extract-Transform-Load (pipeline de datos) |
| **Grounding** | Inyección de datos verificados en LLM |

---

## 🔗 Links Útiles

- **Repositorio:** https://github.com/J4rias/medcity---devlabx3
- **MEData API:** https://datos.gov.co/
- **SIATA:** https://siata.gov.co/
- **Gemini Docs:** https://ai.google.dev/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **React Docs:** https://react.dev/

---

## 📜 Licencia

Proyecto desarrollado para **Hackathon Colombia 5.0 (Medellín)** por **DevLabX3**.

---

## 👥 Equipo

- **Frontend:** Desarrollo con React 18, Leaflet, Framer Motion
- **Backend:** ETL, Six Sigma, LLM Integration
- **Data:** MEData, SIATA, OpenStreetMap, Gemini

---

**Última actualización:** Marzo 2026
**Estado:** En desarrollo, rama main con código estable 🚀
