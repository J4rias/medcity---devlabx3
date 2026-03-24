import asyncio
from services.etl import get_siata_pm25, _siata_24h_cache

async def main():
    print("Iniciando test de SIATA...")
    res = await get_siata_pm25()
    print("get_siata_pm25() devolvió (len):", len(res))
    
    print("Esperando a que termine el task de fondo (5 segundos)...")
    await asyncio.sleep(5)
    
    if _siata_24h_cache["data"] is not None:
        print("Caché SIATA 24H actualizada con exito. Len:", len(_siata_24h_cache["data"]))
    else:
        print("Caché 24H está VACÍA. Algo falló en _bg_fetch_and_cache().")

if __name__ == "__main__":
    asyncio.run(main())
