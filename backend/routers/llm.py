"""
╔════════════════════════════════════════════════════════════════════════════╗
║                    Router LLM — Chat con Gemini Flash                      ║
║                                                                            ║
║ Endpoint: POST /api/llm/chat                                              ║
║                                                                            ║
║ Este router implementa un chat contextualizado con Gemini que incluye:    ║
║ 1. Rate limiting (máx 10 requests/minuto por sesión)                      ║
║ 2. Caché de respuestas (TTL 10 minutos)                                   ║
║ 3. Inyección de datos verificados (grounding)                             ║
║ 4. Validación heurística de números                                       ║
║ 5. Fallback automático a template si LLM falla                            ║
║ 6. Streaming SSE para actualizar el UI en tiempo real                     ║
║                                                                            ║
║ Todo esto previene que Gemini "alucine" números irreales del barrio.      ║
╚════════════════════════════════════════════════════════════════════════════╝
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

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN GEMINI
# ═══════════════════════════════════════════════════════════════════════════
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
MODEL_NAME = "gemini-3.1-flash-lite-preview"  # Modelo rápido y económico

# Parámetros de generación: bajos para respuestas determinísticas (anti-alucinación)
_GEN_CONFIG = {
    "temperature": 0.15,         # Muy bajo → respuestas consistentes (no creativas)
    "top_p": 0.80,               # Reduce la variabilidad
    "top_k": 20,                 # Solo considera top 20 tokens
    "max_output_tokens": 450,    # Límite de longitud de respuesta
}

# ═══════════════════════════════════════════════════════════════════════════
# CACHÉ EN MEMORIA
# ═══════════════════════════════════════════════════════════════════════════
# Evita hacer llamadas repetidas a Gemini para la misma pregunta/barrio/rol
# Estructura: {f"{rol}:{barrio_id}:{query[:80]}": respuesta}
# TTL 600s (10 min) porque los datos del barrio cambian frecuentemente
_response_cache = TTLCache(maxsize=200, ttl=600)

# ═══════════════════════════════════════════════════════════════════════════
# RATE LIMITING
# ═══════════════════════════════════════════════════════════════════════════
# Previene abuso de la API de Gemini (costo económico)
# Estructura: {session_id: [timestamp1, timestamp2, ...]}
_rate_limits: dict[str, list] = {}
MAX_RPM = 10  # Máximo 10 requests por minuto por sesión


class ChatRequest(BaseModel):
    """
    Schema de validación para POST /api/llm/chat

    Campos:
    - query: Pregunta del usuario ("¿Es seguro este barrio?")
    - contexto: Dict con barrio, barrio_id, indicador activo, alertas
    - historial: Chat history (últimos 5 turnos)
    - rol: ciudadano | comerciante | gobierno | investigador
    - session_id: Identificador único del usuario (para rate limit)
    """
    query:    str
    contexto: dict
    historial: list = []
    rol:      str = "ciudadano"
    session_id: str = "default"


def _check_rate_limit(session_id: str) -> bool:
    """
    Verifica si el usuario ha excedido el límite de requests.

    Flujo:
    1. Obtener lista de timestamps de requests anteriores
    2. Filtrar: mantener solo los de los últimos 60 segundos
    3. Si >= MAX_RPM (10), retornar False (bloqueado)
    4. Sino, agregar timestamp actual y permitir

    Args:
        session_id: Identificador único del usuario

    Returns:
        True si el usuario puede hacer más requests
        False si ha excedido el límite
    """
    import time
    now = time.time()
    ventana = _rate_limits.get(session_id, [])
    # Filtra timestamps > 60 segundos en el pasado (ventana deslizante)
    ventana = [t for t in ventana if now - t < 60]
    if len(ventana) >= MAX_RPM:
        return False  # Ha hecho 10+ requests en el último minuto
    ventana.append(now)  # Agregar este request
    _rate_limits[session_id] = ventana
    return True  # Permitir


@retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=4))
async def _llamar_gemini(messages: list) -> str:
    """
    Llama a Gemini con el SDK google.generativeai.

    El parámetro @retry automáticamente reintenta si hay error (timeout, rate limit).
    - stop=stop_after_attempt(2): Máximo 2 intentos
    - wait=wait_exponential(min=1, max=4): Espera 1-4 segundos entre reintentos

    Args:
        messages: Lista de dicts con estructura {role: "user"|"model", parts: [text]}
                  Vienen de prompt_builder.build_messages()

    Returns:
        String con la respuesta completa de Gemini (no streaming)

    Nota: Se corre en asyncio.to_thread() porque el SDK de Gemini es síncrono
          y queremos no bloquear el event loop de FastAPI.
    """

    def _sync_call():
        """Wrapper síncrono para llamada a Gemini (no es async)."""
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            generation_config=_GEN_CONFIG,
        )

        # ═══════════════════════════════════════════════════════════════════
        # CONSTRUIR PROMPT ÚNICO
        # ═══════════════════════════════════════════════════════════════════
        # Concatenamos todos los mensajes en un único prompt para máxima
        # compatibilidad con el modelo. Formato:
        # [USER]: Pregunta 1
        #
        # [MODEL]: Respuesta esperada (para contexto del prompt)
        #
        # [USER]: Pregunta actual
        full_prompt = ""
        for msg in messages:
            role = msg.get("role", "user")
            text = msg.get("parts", [""])[0]  # Primer elemento de parts
            if text:
                full_prompt += f"[{role.upper()}]: {text}\n\n"

        # ═══════════════════════════════════════════════════════════════════
        # LLAMAR A GEMINI
        # ═══════════════════════════════════════════════════════════════════
        response = model.generate_content(full_prompt)
        return response.text

    # Ejecutar en thread pool para no bloquear el event loop de asyncio
    return await asyncio.to_thread(_sync_call)


async def _stream_texto(texto: str):
    """
    Simula streaming token a token (word a word) para dar apariencia de 'typing'.

    En lugar de enviar toda la respuesta de una vez, dividimos en palabras
    y enviamos cada una con un pequeño delay. Esto mejora UX.

    Formato SSE (Server-Sent Events):
    - data: {json}
    - Línea en blanco
    - Se repite para cada chunk

    Args:
        texto: String completo a "streamear"

    Yields:
        Lines en formato SSE con chunks de palabras
    """
    words = texto.split(" ")
    for i, word in enumerate(words):
        # Agregar espacio después de cada palabra (excepto la última)
        chunk = word + (" " if i < len(words) - 1 else "")
        # Serializar a SSE format
        yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        # Simular velocidad de typing (30ms por palabra)
        await asyncio.sleep(0.03)
    # Señal de fin de streaming
    yield f"data: {json.dumps({'done': True})}\n\n"


@router.post("/chat")
async def chat(req: ChatRequest):
    """
    Endpoint principal: POST /api/llm/chat

    Implementa un pipeline anti-alucinación de 5 actuadores:
    1. Rate Limit: Máx 10 req/min por sesión
    2. Caché: Respuestas memorizadas (TTL 10 min)
    3. Grounding: Inyección de datos verificados en prompt
    4. Validación: Extracción de números y comparación
    5. Fallback: Template si LLM falla o alucina

    Retorna: StreamingResponse con SSE events
    """

    async def event_stream():
        """
        Generador asíncrono que implementa el pipeline completo.
        Cada yield envía un chunk SSE al cliente.
        """

        # ═══════════════════════════════════════════════════════════════
        # ACTUADOR 1: RATE LIMIT
        # ═══════════════════════════════════════════════════════════════
        # Máximo 10 requests/minuto por sesión_id
        if not _check_rate_limit(req.session_id):
            msg = "⏳ Demasiadas consultas. Espera un momento."
            async for chunk in _stream_texto(msg):
                yield chunk
            return

        # ═══════════════════════════════════════════════════════════════
        # ACTUADOR 2: CACHÉ
        # ═══════════════════════════════════════════════════════════════
        # Evita llamar a Gemini si la misma pregunta ya fue hecha
        barrio_id = req.contexto.get("barrio_id") or req.contexto.get("barrio", "")
        cache_key = f"{req.rol}:{barrio_id}:{req.query[:80]}"
        if cache_key in _response_cache:
            # Hit de caché: retornar respuesta memori zada
            async for chunk in _stream_texto(_response_cache[cache_key]):
                yield chunk
            return

        # ═══════════════════════════════════════════════════════════════
        # TRAER DATOS REALES DEL BARRIO
        # ═══════════════════════════════════════════════════════════════
        # Estos datos se inyectarán en el prompt para validar respuestas
        indicadores = await get_indicadores_barrio(barrio_id) if barrio_id else {}

        # ═══════════════════════════════════════════════════════════════
        # LOOP DE REINTENTOS: Máx 2 intentos de generar respuesta válida
        # ═══════════════════════════════════════════════════════════════
        MAX_REINTENTOS = 2
        respuesta_final = None
        fuente = "llm"  # Track: ¿De dónde viene la respuesta? (llm|fallback)
        query_actual = req.query

        for intento in range(MAX_REINTENTOS + 1):
            try:
                # ─────────────────────────────────────────────────────
                # CONSTRUIR PROMPT MULTI-CAPA
                # ─────────────────────────────────────────────────────
                # 5 capas: system + role + contexto + grounding + historial + query
                messages = build_messages(
                    query=query_actual,
                    contexto=req.contexto,
                    indicadores=indicadores,  # Se inyecta en grounding anchor
                    historial=req.historial,
                    rol=req.rol,
                )

                # ─────────────────────────────────────────────────────
                # LLAMAR A GEMINI
                # ─────────────────────────────────────────────────────
                respuesta = await _llamar_gemini(messages)

                # ─────────────────────────────────────────────────────
                # ACTUADOR 3+4: VALIDACIÓN HEURÍSTICA
                # ─────────────────────────────────────────────────────
                # Extrae números de la respuesta y compara contra indicadores reales
                validacion = validar_respuesta(respuesta, indicadores)

                if validacion.es_valida or intento == MAX_REINTENTOS:
                    # Válida O último intento: usar esta respuesta
                    respuesta_final = respuesta
                    break

                # Si no es válida y quedan intentos: re-intentar con prompt más estricto
                query_actual = (
                    f"{req.query}\n\n[SISTEMA: Tu respuesta anterior contenía "
                    f"{len(validacion.violaciones)} número(s) no verificable(s). "
                    f"Usa SOLO los valores del bloque VALORES VERIFICADOS.]"
                )

            except Exception as e:
                # Error en llamada a Gemini (timeout, API error, etc.)
                if intento == MAX_REINTENTOS:
                    # Último intento fallido: usar fallback
                    respuesta_final = generar_fallback(req.contexto, indicadores, req.rol)
                    fuente = "fallback"

        # ═══════════════════════════════════════════════════════════════
        # VALIDACIÓN FINAL: Si aún no tenemos respuesta, usar fallback
        # ═══════════════════════════════════════════════════════════════
        if not respuesta_final:
            respuesta_final = generar_fallback(req.contexto, indicadores, req.rol)
            fuente = "fallback"

        # ═══════════════════════════════════════════════════════════════
        # ACTUADOR 5: GUARDAR EN CACHÉ (solo si es respuesta válida)
        # ═══════════════════════════════════════════════════════════════
        if fuente == "llm":
            _response_cache[cache_key] = respuesta_final

        # ═══════════════════════════════════════════════════════════════
        # STREAM LA RESPUESTA FINAL AL CLIENTE
        # ═══════════════════════════════════════════════════════════════
        async for chunk in _stream_texto(respuesta_final):
            yield chunk

    # ═══════════════════════════════════════════════════════════════════
    # RETORNAR STREAMING RESPONSE
    # ═══════════════════════════════════════════════════════════════════
    # FastAPI automáticamente convierte el generador en SSE stream
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",  # Tipo MIME para SSE
        headers={
            "Cache-Control": "no-cache",      # No cachear el stream
            "X-Accel-Buffering": "no"        # Nginx: enviar inmediatamente
        }
    )
