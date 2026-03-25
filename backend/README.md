# 🔧 Backend - MedCity Dashboard

**FastAPI + Six Sigma ETL + Gemini LLM Anti-Alucinación**

---

## 📋 Descripción

Backend de MedCity que:
- Consume APIs abiertas de Medellín (MEData, SIATA, OpenStreetMap)
- Calcula indicadores Six Sigma (ICV, Sigma Level, DPMO, cartas de control)
- Integra Gemini LLM con anti-alucinación mediante grounding
- Implementa resiliencia con fallback a datos mocks válidos estadísticamente
- Proporciona streaming SSE para chat contextualizado en tiempo real

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| **Framework** | FastAPI | ^0.104 |
| **Servidor** | Uvicorn | ^0.24 |
| **LLM** | Google Generative AI (Gemini) | ^0.3+ |
| **HTTP Client** | HTTPX (async) | ^0.25 |
| **Data Processing** | Pandas + NumPy | ^2.0 / ^1.24 |
| **Caché** | Cachetools | ^5.3 |
| **Validación** | Pydantic | ^2.0 |
| **Reintentos** | Tenacity | ^8.2 |
| **Geoespacial** | Overpy + GeoJSON | ^0.18 / ^3.1 |
| **Python** | 3.11+ | - |

---

## 📁 Estructura

```
backend/
├── README.md                           # Este archivo
├── main.py                             # Entrypoint FastAPI
├── requirements.txt                    # Dependencias
├── .env.example                        # Template variables entorno
├── .env                                # Variables reales (NO git)
│
├── routers/
│   ├── indicadores.py                  # GET /api/indicadores/{barrio_id}
│   │                                   # GET /api/indicadores/
│   │                                   # GET /api/tendencia/{barrio_id}
│   │                                   # GET /api/geo/comunas
│   │                                   # GET /api/status
│   │
│   └── llm.py                          # POST /api/llm/chat (SSE streaming)
│                                       # 5-layer prompt pipeline
│
├── services/
│   ├── etl.py                          # ETL principal
│   │                                   # - fetch_indicadores_barrio()
│   │                                   # - get_indicadores_barrio() [cached]
│   │                                   # - fetch_siata_aire()
│   │                                   # - fetch_medata_csv()
│   │                                   # - calcular_six_sigma()
│   │                                   # - IDW interpolation
│   │
│   ├── prompt_builder.py               # Construcción de prompts multi-capa
│   │                                   # - build_context_prompt()
│   │                                   # - build_messages()
│   │                                   # - SYSTEM_BASE
│   │                                   # - ROLE_PROMPTS
│   │
│   └── validator.py                    # Anti-alucinación heurístico
│                                       # - validar_respuesta()
│                                       # - generar_fallback()
│                                       # - Extracción de números
│
└── data/
    ├── comunas.geojson                 # GeoJSON original (~4MB)
    └── comunas_wgs84.geojson           # WGS84 reprojectado (~6MB)
```

---

## 🚀 Setup Local

### 1. Requisitos
```bash
Python 3.11+
pip >= 23.0
```

### 2. Crear Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# o
venv\Scripts\activate     # Windows
```

### 3. Instalar Dependencias
```bash
pip install -r requirements.txt
```

### 4. Configurar Variables de Entorno
```bash
cp .env.example .env
# Editar .env y llenar:
# - GEMINI_API_KEY (requerido)
# - MEDATA_APP_TOKEN (opcional)
# - SIATA_TOKEN (opcional)
# - ENVIRONMENT (development | production)
```

### 5. Iniciar Servidor
```bash
# Modo desarrollo (con auto-reload)
uvicorn main:app --reload --port 8000

# Modo producción
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Documentación interactiva:** http://localhost:8000/docs (Swagger)

---

## 📡 Endpoints

### Status & Salud
```bash
GET /api/status
# { "backend": "ok", "siata": "ok", "medata": "ok", "gemini": "ok" }
```

### Indicadores
```bash
# Obtener indicadores de un barrio
GET /api/indicadores/{barrio_id}
# Query params: ?rango=30d|7d|1d

# Ejemplo:
curl http://localhost:8000/api/indicadores/04?rango=30d
```

**Response:**
```json
{
  "barrio": "La Candelaria",
  "barrio_id": "04",
  "comuna": 1,
  "icv_score": 58.2,
  "sigma": 3.15,
  "dpmo": 45230,
  "percentil": 42,
  "seguridad": 45,
  "aqi": 62,
  "aqi_categoria": "Moderado",
  "movilidad": 55,
  "comercios_ha": 12.5,
  "informal_mediana": 280,
  "tendencia_icv": "↓ -2.1%"
}
```

### Tendencias (Cartas de Control)
```bash
GET /api/tendencia/{barrio_id}
# Query params: ?indicador=icv|seguridad|aire|movilidad&rango=30d|7d

# Ejemplo:
curl http://localhost:8000/api/tendencia/04?indicador=icv&rango=30d
```

**Response:**
```json
{
  "barrio_id": "04",
  "indicador": "icv",
  "puntos": [
    {"fecha": "2026-03-01", "valor": 60.1, "ucl": 68.5, "lcl": 55.2},
    ...
  ],
  "ucl": 68.5,
  "lcl": 55.2,
  "promedio": 61.8
}
```

### Geospatial
```bash
GET /api/geo/comunas
# Retorna GeoJSON de las 21 comunas con propiedades dinámicas
```

### LLM Chat (SSE Streaming)
```bash
POST /api/llm/chat
Content-Type: application/json

{
  "query": "¿Es seguro este barrio?",
  "contexto": {
    "barrio": "La Candelaria",
    "barrio_id": "04",
    "comuna": 1,
    "indicador": "seguridad",
    "rango": "30d",
    "alertas": []
  },
  "historial": [
    { "rol": "user", "contenido": "Hola" },
    { "rol": "assistant", "contenido": "Hola, soy el asistente MedCity..." }
  ],
  "rol": "ciudadano",
  "session_id": "uuid-or-identifier"
}
```

**Response (SSE Stream):**
```
data: {"chunk": "Sí, "}
data: {"chunk": "La "}
data: {"chunk": "Candelaria "}
...
data: {"done": true}
```

**Roles disponibles:** `ciudadano`, `comerciante`, `gobierno`, `investigador`

---

## 🔐 Variables de Entorno

```bash
# .env.example

# ═══════════════════════════════════════════════════════════
# GEMINI LLM (REQUERIDO)
# ═══════════════════════════════════════════════════════════
GEMINI_API_KEY=your_google_gemini_api_key_here

# ═══════════════════════════════════════════════════════════
# APIS EXTERNAS (OPCIONALES — con fallback a mocks)
# ═══════════════════════════════════════════════════════════
MEDATA_APP_TOKEN=your_medata_token_here
SIATA_TOKEN=your_siata_token_here

# ═══════════════════════════════════════════════════════════
# APLICACIÓN
# ═══════════════════════════════════════════════════════════
ENVIRONMENT=development  # development | production
```

**Cómo obtener tokens:**
- **Gemini:** https://ai.google.dev/tutorials/setup
- **MEData:** https://datos.gov.co/ (requiere registro)
- **SIATA:** https://siata.gov.co/ (API pública, token opcional)

---

## 🧠 Módulos Core

### `etl.py` — Pipeline de Datos

**Flujo:**
```
1. fetch_siata_aire()           → JSON 21 estaciones
2. fetch_medata_csv()           → CSV criminalidad/movilidad
3. fetch_osm_comercios()        → Overpass query de negocios
4. calcular_six_sigma()         → ICV, Sigma, DPMO
5. interpolar_idw()             → AQI en todos los barrios
6. _response_cache.set()        → Cache con TTL
```

**Funciones principales:**
- `get_indicadores_barrio(barrio_id)` — Indicadores cached con TTL 5 min
- `calcular_six_sigma(data, indicador)` — Cálculo de desviaciones
- `interpolar_idw(puntos, pesos, ubicacion)` — Interpolación Distancia Inversa

**Fallback automático:**
- Si SIATA cae → Datos mocks válidos estadísticamente
- Si MEData cae → CSV embebidos o mocks
- Si OSM cae → Estimación simple por densidad

### `prompt_builder.py` — Construcción de Prompts Multi-capa

**5 Capas:**
1. **SYSTEM_BASE** — Instrucciones generales anti-alucinación
2. **ROLE_PROMPTS** — Personas por rol (ciudadano/comerciante/gobierno/investigador)
3. **CONTEXT_BLOCK** — Datos del barrio actual (nombre, comuna, alertas)
4. **GROUNDING_ANCHOR** — Valores verificados con referencias [N]
5. **HISTORIAL** — Últimos 10 turnos de chat
6. **QUERY ACTUAL** — Pregunta del usuario

```python
from services.prompt_builder import build_messages

messages = build_messages(
    query="¿Es seguro?",
    contexto={"barrio": "La Candelaria", "barrio_id": "04"},
    indicadores={"icv_score": 58.2, "sigma": 3.15},
    historial=[],
    rol="ciudadano"
)
# → Lista de dicts con role/parts para Gemini SDK
```

### `validator.py` — Anti-Alucinación Heurístico

**Validación en 3 pasos:**

1. **Extracción de números**
   ```python
   numeros = extraer_numeros("El ICV es 58.2")
   # → [58.2]
   ```

2. **Comparación contra indicadores reales**
   ```python
   validacion = validar_respuesta(
       respuesta="La Candelaria tiene ICV 58.2",
       indicadores={"icv_score": 58.2, "sigma": 3.15}
   )
   # → ValidationResult(es_valida=True, violaciones=[])
   ```

3. **Fallback si falla**
   ```python
   if not validacion.es_valida:
       respuesta = generar_fallback(contexto, indicadores, rol)
       # → Template template basado en datos reales
   ```

---

## 📊 Cálculos Six Sigma

### ICV (Índice de Calidad de Vida)
```python
ICV = (seguridad*0.25 + aire*0.25 + movilidad*0.25 + servicios*0.25)
# Escala 0-100
```

### Sigma Level
```python
sigma = (valor - media) / desv_std
# Interpretación:
# 3σ → DPMO ≈ 66,810 (básico)
# 4σ → DPMO ≈ 6,210 (bueno)
# 6σ → DPMO ≈ 3.4 (excelencia)
```

### Carta I-MR (Individual-Moving Range)
```python
UCL_I = media + (2.66 * MR_media)
LCL_I = media - (2.66 * MR_media)
# Detecta tendencias y anomalías
```

### IDW (Inverse Distance Weighting)
```python
valor_interpolado = Σ(w_i * v_i) / Σ(w_i)
donde w_i = 1 / distancia^2

# Usado para interpolar AQI desde 21 estaciones SIATA a 249 barrios
```

---

## 🔄 Flujo LLM Chat

```
1. Cliente POST /api/llm/chat
   ↓
2. Validar rate limit (MAX_RPM=10)
   ↓
3. Verificar caché (TTL=600s)
   ↓
4. get_indicadores_barrio() → Datos reales del barrio
   ↓
5. build_messages() → Prompt multi-capa con grounding
   ↓
6. genai.GenerativeModel.generate_content() → Llamada a Gemini
   ↓
7. validar_respuesta() → ¿Números reales o alucinación?
   ↓
8. Si válida → devolver respuesta LLM
   Si inválida → reintentar con prompt más estricto (máx 2 intentos)
   Si sigue fallando → generar_fallback()
   ↓
9. _stream_texto() → Simular streaming token a token (SSE)
   ↓
10. Guardar en caché + historial
```

---

## 🧪 Testing

### Test Manual de APIs
```bash
# Backend health
curl http://localhost:8000/api/status

# Indicadores
curl http://localhost:8000/api/indicadores/04

# Tendencia
curl http://localhost:8000/api/tendencia/04?indicador=icv&rango=30d

# Chat
curl -X POST http://localhost:8000/api/llm/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "¿Es seguro?",
    "contexto": {"barrio": "La Candelaria", "barrio_id": "04"},
    "rol": "ciudadano"
  }'
```

### Test de SIATA
```bash
python backend/test_siata.py
# Valida disponibilidad y parseo de datos
```

---

## 🔒 Seguridad

| Aspecto | Medida |
|--------|--------|
| **API Keys** | Variables .env (nunca en código) |
| **Rate Limiting** | 10 req/min por session_id |
| **CORS** | Configurado en main.py |
| **Validación Input** | Pydantic schemas en routers |
| **SQL Injection** | No hay DB — datos de APIs públicas |
| **Timeouts** | httpx.AsyncClient con timeout=30s |

---

## 📈 Performance & Caché

| Dato | TTL | Razón |
|------|-----|-------|
| Indicadores barrio | 5 min | Datos casi estáticos |
| Respuestas LLM | 10 min | Reutilización de consultas frecuentes |
| SIATA aire | 30 min | Actualiza cada 30 min en SIATA |
| MEData | 24 horas | Datos históricos, cambian lentamente |

**Caché en memoria:** Cachetools TTLCache (500 items máx)

---

## 🚨 Manejo de Errores

```python
# Reintentos automáticos
@retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=4))

# Fallback a datos mocks si API falla
try:
    data = await fetch_siata_aire()
except Exception:
    data = SIATA_MOCKS  # Datos válidos estadísticamente
```

---

## 🔧 Debugging

```bash
# Logs detallados
uvicorn main:app --reload --log-level debug

# Variables debug
ENVIRONMENT=development

# FastAPI docs
http://localhost:8000/docs      # Swagger UI
http://localhost:8000/redoc     # ReDoc
```

---

## 🌍 APIs Externas Integradas

### SIATA (Calidad del Aire)
```
GET https://siata.gov.co/EntregaData1/Datos_SIATA_Aire_pm25.json
Parámetros: Ninguno (datos públicos)
Respuesta: JSON con 21 estaciones + PM2.5
```

### MEData (Medellin Datos Abiertos)
```
GET http://medata.gov.co/sites/default/files/distribution/*/...csv
Archivos:
- Criminalidad por mes/año
- Incidentes viales
- Homicidios
- NUSE-123 (llamadas emergencia)
```

### OpenStreetMap (Overpass API)
```
POST https://overpass-api.de/api/interpreter
Query: bbox + amenity/shop filters
Respuesta: GeoJSON de comercios
```

### Google Gemini LLM
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
Headers: x-goog-api-key
Body: Prompt multi-capa + chat history
```

---

## 📚 Estructura de Datos Key

### IndicadorBarrio (Response)
```python
{
    "barrio": str,
    "barrio_id": str,
    "comuna": int,
    "icv_score": float,        # 0-100
    "sigma": float,            # Desviaciones estándar
    "dpmo": int,               # Defectos por millón
    "percentil": int,          # 0-100
    "seguridad": float,        # 0-100
    "aqi": float,              # 0-500
    "aqi_categoria": str,      # "Bueno", "Moderado", etc.
    "movilidad": float,        # 0-100
    "comercios_ha": float,     # Negocios por hectárea
    "informal_mediana": int,   # Estimado
    "tendencia_icv": str       # "↑ +2.1%" o "↓ -2.1%"
}
```

### ChatRequest (Input)
```python
{
    "query": str,
    "contexto": {
        "barrio": str,
        "barrio_id": str,
        "comuna": int,
        "indicador": str,      # icv|seguridad|aire|movilidad
        "rango": str,          # 30d|7d|1d
        "alertas": list
    },
    "historial": list,         # Mensajes previos
    "rol": str,                # ciudadano|comerciante|gobierno|investigador
    "session_id": str
}
```

---

## 🔗 Links Útiles

- **FastAPI:** https://fastapi.tiangolo.com/
- **Pydantic:** https://docs.pydantic.dev/
- **HTTPX:** https://www.python-httpx.org/
- **Gemini SDK:** https://ai.google.dev/tutorials/python_quickstart
- **SIATA:** https://siata.gov.co/
- **MEData:** https://datos.gov.co/

---

## 📝 Notas de Desarrollo

- **No hay base de datos:** Todo es en-memoria o APIs externas
- **Async-first:** FastAPI + asyncio para concurrencia
- **Stateless:** Cada request es independiente
- **Idempotente:** Llamadas repetidas devuelven el mismo resultado (caché)

---

**Desarrollado por:** DevLabX3 para Hackathon Colombia 5.0
**Última actualización:** Marzo 2026