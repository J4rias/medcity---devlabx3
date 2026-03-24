import asyncio
import os
import httpx
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

async def test_medata():
    print("Testing MEData...")
    token = os.getenv("MEDATA_APP_TOKEN")
    headers = {"X-App-Token": token} if token else {}
    async with httpx.AsyncClient() as client:
        r = await client.get("https://www.datos.gov.co/resource/pb3w-3vmc.json?$limit=1", headers=headers)
        if r.status_code == 200:
            print("OK MEData")
        else:
            print(f"FAIL MEData: {r.status_code}")

async def test_siata():
    print("Testing SIATA...")
    async with httpx.AsyncClient(verify=False) as client:
        try:
            r = await client.get("https://siata.gov.co/EntregaData1/Datos_SIATA_Aire_pm25.json")
            if r.status_code == 200:
                print("OK SIATA")
            else:
                print(f"FAIL SIATA: {r.status_code}")
        except Exception as e:
            print(f"FAIL SIATA Exception: {e}")

def test_gemini():
    print("Testing Gemini...")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("FAIL Gemini: No API key")
        return
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel("gemini-1.5-flash") # Test using stable model
        response = model.generate_content("Hola, di OK si me entiendes.")
        if response.text:
            print("OK Gemini")
    except Exception as e:
        print(f"FAIL Gemini: {e}")

async def main():
    await test_medata()
    await test_siata()
    test_gemini()

asyncio.run(main())
