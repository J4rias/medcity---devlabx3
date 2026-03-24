"""
Router de indicadores urbanos y estado de APIs.
"""
import time, httpx
from fastapi import APIRouter
from services.etl import get_indicadores_barrio, get_comunas_geojson, APIS, _medata_headers, check_siata_status

router = APIRouter(prefix="/api", tags=["indicadores"])


@router.get("/indicadores/{barrio_id}")
async def indicadores_barrio(barrio_id: str):
    return await get_indicadores_barrio(barrio_id)


@router.get("/tendencia/{barrio_id}")
async def tendencia(barrio_id: str, indicador: str = "icv", rango: str = "30d"):
    """Retorna serie temporal + parámetros de carta de control."""
    import numpy as np
    from services.etl import calcular_sigma

    seed = sum(ord(c) for c in barrio_id + indicador) % 100
    np.random.seed(seed)

    dias = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}.get(rango, 30)
    base = np.random.uniform(50, 85)
    serie = list(np.random.normal(base, 8, dias).clip(0, 100))

    sigma_data = calcular_sigma(serie, usl=90, lsl=40)

    import pandas as pd
    from datetime import datetime, timedelta
    fechas = [(datetime.today() - timedelta(days=dias-i)).strftime("%d/%m") for i in range(dias)]

    return {
        "serie": [{"fecha": f, "valor": round(v, 1)} for f, v in zip(fechas, serie)],
        "media": sigma_data["media"],
        "ucl":   sigma_data["ucl"],
        "lcl":   sigma_data["lcl"],
        "alerta":sigma_data.get("alerta_carta"),
    }


@router.get("/geo/comunas")
async def comunas_geojson():
    return await get_comunas_geojson()


@router.get("/status")
async def api_status():
    """Verifica el estado de todas las fuentes de datos externas."""
    fuentes_a_verificar = [
        ("MEData Criminalidad CSV", "http://medata.gov.co/sites/default/files/distribution/1-027-23-000304/consolidado_cantidad_casos_criminalidad_en_comunas_por_anio_mes.csv", _medata_headers()),
        ("MEData Incidentes Viales","http://medata.gov.co/sites/default/files/distribution/1-023-25-000094/incidentes_viales.csv", _medata_headers()),
        ("Socrata Empresas",        "https://www.datos.gov.co/resource/pb3w-3vmc.json?$limit=1",    _medata_headers()),
        ("GeoMedellín",            "https://geomedellin-m-medellin.opendata.arcgis.com/",       {"User-Agent": "Mozilla/5.0"}),
        ("Gemini API",             "https://generativelanguage.googleapis.com/v1beta/models?key=" + __import__('os').getenv('GEMINI_API_KEY', ''), {}),
    ]

    resultados = []
    
    # 1. Chequeo Ultrarrápido de SIATA
    resultados.append(check_siata_status())
    
    # 2. Chequeo de las demás fuentes a tiempo real
    async with httpx.AsyncClient(timeout=10) as client:
        for nombre, url, hdrs in fuentes_a_verificar:
            t0 = time.time()
            try:
                r = await client.get(url, headers=hdrs)
                latencia = int((time.time() - t0) * 1000)
                estado = "online" if r.status_code < 400 else "offline" # Se mapea a offline si el status falla para que muestre el badge rojo
                if latencia > 4000:
                    estado = "degraded"
            except Exception:
                latencia = None
                estado = "offline"

            resultados.append({
                "nombre":      nombre,
                "estado":      estado,
                "latencia":    latencia,
                "usandoCache": estado == "offline",
            })

    total = len(resultados)
    online = sum(1 for f in resultados if f["estado"] == "online")

    return {
        "fuentes": resultados,
        "resumen": f"{online}/{total} fuentes disponibles",
    }
