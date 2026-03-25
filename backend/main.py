"""
╔════════════════════════════════════════════════════════════════════════════╗
║                    MedCity Dashboard — Backend FastAPI                     ║
║                                                                            ║
║ Este es el punto de entrada principal del backend. Configura:             ║
║ 1. Carga de variables de entorno (.env)                                  ║
║ 2. Instancia de FastAPI con documentación automática                      ║
║ 3. Middleware CORS para permitir requests desde el frontend (5173)        ║
║ 4. Routers de endpoints (LLM chat + indicadores)                         ║
║                                                                            ║
║ Ejecutar: uvicorn main:app --reload --port 8000                          ║
║ Docs: http://localhost:8000/docs (Swagger UI)                            ║
╚════════════════════════════════════════════════════════════════════════════╝
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# ═══════════════════════════════════════════════════════════════════════════
# 1. CARGAR VARIABLES DE ENTORNO
# ═══════════════════════════════════════════════════════════════════════════
# Lee .env y las inyecta en os.environ
# Variables requeridas: GEMINI_API_KEY (obligatorio), MEDATA_APP_TOKEN, SIATA_TOKEN
load_dotenv()

# ═══════════════════════════════════════════════════════════════════════════
# 2. IMPORTAR ROUTERS
# ═══════════════════════════════════════════════════════════════════════════
# Estos contienen los endpoints organizados por funcionalidad
from routers import llm, indicadores

# ═══════════════════════════════════════════════════════════════════════════
# 3. CREAR INSTANCIA FASTAPI
# ═══════════════════════════════════════════════════════════════════════════
# FastAPI genera automáticamente documentación Swagger en /docs y ReDoc en /redoc
app = FastAPI(
    title="MedCity Dashboard API",
    description="Datos Abiertos de Medellín — Colombia 5.0 Hackathon",
    version="1.0.0",
)

# ═══════════════════════════════════════════════════════════════════════════
# 4. CONFIGURAR CORS (Cross-Origin Resource Sharing)
# ═══════════════════════════════════════════════════════════════════════════
# Permite que el frontend (http://localhost:5173) haga requests a este backend
# Sin CORS, el navegador bloquearía las requests por ser origen diferente
# En producción, reemplazar "localhost:5173" con el dominio real del frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",      # Dev: Frontend local (Vite)
        "http://127.0.0.1:5173",      # Dev: Alternative localhost
        # En producción, agregar: "https://medcity.vercel.app"
    ],
    allow_methods=["*"],              # Permite GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],              # Permite cualquier header (Content-Type, Authorization, etc.)
)

# ═══════════════════════════════════════════════════════════════════════════
# 5. REGISTRAR ROUTERS
# ═══════════════════════════════════════════════════════════════════════════
# Incluye los routers que definen los endpoints
# Router LLM: POST /api/llm/chat (chat contextualizado con Gemini)
# Router Indicadores: GET /api/indicadores/{id}, GET /api/tendencia/{id}, etc.
app.include_router(llm.router)
app.include_router(indicadores.router)


@app.get("/")
def root():
    return {
        "proyecto": "MedCity Dashboard",
        "evento":   "Colombia 5.0 — Hackathon Medellín",
        "estado":   "operativo",
        "docs":     "/docs",
    }
