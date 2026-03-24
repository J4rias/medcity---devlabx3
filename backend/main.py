"""
MedCity Dashboard — Backend FastAPI
Ejecutar: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import llm, indicadores

app = FastAPI(
    title="MedCity Dashboard API",
    description="Datos Abiertos de Medellín — Colombia 5.0 Hackathon",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
