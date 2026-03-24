import asyncio
import json
import sys
import os

# Ajustar path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.services.etl import get_indicadores_barrio, get_comunas_geojson

async def main():
    print("Cargando GeoJSON...")
    geojson = await get_comunas_geojson()
    features = geojson.get("features", [])
    
    print(f"Total de barrios/comunas encontrados: {len(features)}")
    
    # Tomaremos una muestra representativa de 50 o todos si es rápido
    ids = [f["properties"].get("CODIGO", "0") for f in features]
    
    icv_total = 0
    sigma_total = 0
    n = 0
    
    print("Calculando estadisticas Six Sigma para MedCity...")
    for idx in ids[:50]:
        try:
            ind = await get_indicadores_barrio(idx)
            icv_total += ind.get("icv_score", 0)
            sigma_total += ind.get("sigma", 0)
            n += 1
        except Exception as e:
            pass

    if n > 0:
        print(f"--- Estadísticas MedCity (Muestra: {n} barrios) ---")
        print(f"ICV Promedio: {icv_total / n:.2f} / 100")
        print(f"Nivel Sigma Promedio: {sigma_total / n:.2f}σ")
    else:
        print("No se pudieron cargar indicadores.")

if __name__ == "__main__":
    asyncio.run(main())
