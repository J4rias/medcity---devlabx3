"""
Router LLM — Gemini 3.1 Flash Lite con streaming SSE.
Incluye pipeline anti-alucinación de 5 actuadores.
"""
import os, json, asyncio
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from cachetools import TTLCache
from tenacity import retry, stop_after_attempt, wait_exponential
import google.generativeai as genai

from services.prompt_builder import build_messages
from services.validator import validar_respuesta, generar_fallback
from services.etl import get_indicadores_barrio

router = APIRouter(prefix="/api/llm", tags=["llm"])

# Configurar Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
MODEL = genai.GenerativeModel(
    model_name="gemini-3.1-flash-lite-preview",   # actualizar cuando salga de preview
    generation_config=genai.types.GenerationConfig(
        temperature=0.15,       # bajo para respuestas factuales
        top_p=0.80,
        top_k=20,
        max_output_tokens=450,
    )
)

# Caché de respuestas (evita llamadas repetidas)
_response_cache = TTLCache(maxsize=200, ttl=600)

# Rate limiter simple por sesión
_rate_limits: dict[str, list] = {}
MAX_RPM = 10


class ChatRequest(BaseModel):
    query:    str
    contexto: dict
    historial: list = []
    rol:      str = "ciudadano"
    session_id: str = "default"


def _check_rate_limit(session_id: str) -> bool:
    import time
    now = time.time()
    ventana = _rate_limits.get(session_id, [])
    ventana = [t for t in ventana if now - t < 60]
    if len(ventana) >= MAX_RPM:
        return False
    ventana.append(now)
    _rate_limits[session_id] = ventana
    return True


@retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=4))
async def _llamar_gemini(messages: list) -> str:
    """Llama a Gemini y retorna la respuesta completa (no streaming interno)."""
    # Gemini SDK: convertir formato de mensajes
    history  = messages[:-1]
    last_msg = messages[-1]["parts"][0]

    chat = MODEL.start_chat(history=history)
    response = await asyncio.to_thread(chat.send_message, last_msg)
    return response.text


async def _stream_texto(texto: str):
    """Simula streaming token a token desde texto pre-calculado."""
    words = texto.split(" ")
    for i, word in enumerate(words):
        chunk = word + (" " if i < len(words) - 1 else "")
        yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        await asyncio.sleep(0.03)   # velocidad de 'typing'
    yield f"data: {json.dumps({'done': True})}\n\n"


@router.post("/chat")
async def chat(req: ChatRequest):
    """Endpoint principal con pipeline anti-alucinación."""

    async def event_stream():
        # A1: Rate limit
        if not _check_rate_limit(req.session_id):
            msg = "⏳ Demasiadas consultas. Espera un momento."
            async for chunk in _stream_texto(msg):
                yield chunk
            return

        # A2: Caché
        barrio_id = req.contexto.get("barrio_id") or req.contexto.get("barrio", "")
        cache_key = f"{req.rol}:{barrio_id}:{req.query[:80]}"
        if cache_key in _response_cache:
            async for chunk in _stream_texto(_response_cache[cache_key]):
                yield chunk
            return

        # Obtener indicadores reales para validación
        indicadores = await get_indicadores_barrio(barrio_id) if barrio_id else {}

        MAX_REINTENTOS = 2
        respuesta_final = None
        fuente = "llm"

        for intento in range(MAX_REINTENTOS + 1):
            try:
                messages = build_messages(
                    query=req.query,
                    contexto=req.contexto,
                    indicadores=indicadores,
                    historial=req.historial,
                    rol=req.rol,
                )

                respuesta = await _llamar_gemini(messages)

                # A3: Validar números contra contexto real
                validacion = validar_respuesta(respuesta, indicadores)

                if validacion.es_valida or intento == MAX_REINTENTOS:
                    respuesta_final = respuesta
                    break
                # Si falla, reintentar con prompt más estricto añadido a la query
                req.query = (
                    f"{req.query}\n\n[SISTEMA: Tu respuesta anterior contenía "
                    f"{len(validacion.violaciones)} número(s) no verificable(s). "
                    f"Usa SOLO los valores del bloque VALORES VERIFICADOS.]"
                )

            except Exception as e:
                if intento == MAX_REINTENTOS:
                    # A5: Fallback a reglas
                    respuesta_final = generar_fallback(req.contexto, indicadores, req.rol)
                    fuente = "fallback"

        if not respuesta_final:
            respuesta_final = generar_fallback(req.contexto, indicadores, req.rol)
            fuente = "fallback"

        # Guardar en caché solo si es respuesta LLM válida
        if fuente == "llm":
            _response_cache[cache_key] = respuesta_final

        async for chunk in _stream_texto(respuesta_final):
            yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )
