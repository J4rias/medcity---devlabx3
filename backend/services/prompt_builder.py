"""
Construye el prompt completo en 5 capas para Gemini 3.1 Flash Lite.
Incluye grounding anchor para prevenir alucinaciones.
"""

SYSTEM_BASE = """
Eres el asistente de análisis urbano del MedCity Dashboard de Medellín.

REGLAS CRÍTICAS — ANTI-ALUCINACIÓN:
1. SOLO usa números del bloque VALORES VERIFICADOS. Nunca inventes cifras.
2. Envuelve CADA término técnico en [[T:término]] (AQI, ICV, DPMO, Sigma Level, I-MR, PM2.5, Cpk, percentil, Monte Carlo, OSM).
3. Si un dato no está disponible, di explícitamente "no tengo ese dato".
4. Máximo 3 recomendaciones numeradas por respuesta.
5. Responde siempre en español colombiano.
6. Cita el número de referencia [N] cuando uses un valor del contexto.
"""

ROLE_PROMPTS = {
    "ciudadano": """
ROL: Asistente vecinal amigable.
- Lenguaje cotidiano, sin jerga técnica (aunque SÍ marcas términos con [[T:]]).
- Tono cercano, como vecino informado del barrio.
- Prioriza: seguridad personal, calidad del aire, servicios cercanos.
- Respuestas cortas y prácticas con 1–2 números clave.
""",
    "comerciante": """
ROL: Asesor de negocios para pymes de Medellín.
- Enfócate en: flujo de clientes, horarios pico, competencia, seguridad del negocio.
- Usa cifras de negocio accionables.
- Tono: directo y orientado a resultados.
""",
    "gobierno": """
ROL: Analista técnico para tomadores de decisiones públicas.
- Lenguaje técnico-político. Incluye comparativas entre comunas.
- Enfócate en: brechas de equidad, prioridad de inversión, alertas de política pública.
- Incluye referencia al Plan de Desarrollo de Medellín cuando sea pertinente.
""",
    "investigador": """
ROL: Científico de datos urbanos.
- Terminología estadística completa. Menciona limitaciones metodológicas.
- Señala correlaciones, anomalías, sesgos potenciales.
- Sugiere análisis adicionales cuando sea relevante.
""",
}


def build_context_prompt(contexto: dict, indicadores: dict) -> str:
    """Construye el context prompt con grounding anchor numerado."""
    barrio  = contexto.get("barrio", "No seleccionado")
    comuna  = contexto.get("comuna", "-")
    alertas = contexto.get("alertas", [])

    # Grounding anchor: lista numerada que el LLM debe citar
    anchor_items = []
    campos = [
        ("icv_score",          "ICV Score",                "/100"),
        ("sigma",              "Sigma Level",              "σ"),
        ("dpmo",               "DPMO",                     ""),
        ("percentil",          "Percentil en Medellín",    "%"),
        ("seguridad",          "Score Seguridad",          "/100"),
        ("aqi",                "AQI Calidad Aire",         ""),
        ("aqi_categoria",      "Categoría AQI",            ""),
        ("movilidad",          "Score Movilidad",          "/100"),
        ("comercios_ha",       "Negocios/ha formal",       ""),
        ("informal_mediana",   "Negocios informales est.", "(mediana)"),
        ("informal_ic_sup",    "IC 90% informal superior", ""),
        ("tendencia_icv",      "Tendencia ICV 30 días",    ""),
    ]

    for i, (campo, nombre, unidad) in enumerate(campos, 1):
        val = indicadores.get(campo)
        if val is not None:
            anchor_items.append(f"  [{i}] {nombre}: {val} {unidad}".strip())

    alertas_str = "\n".join([f"  - {a.get('mensaje', a)}" for a in alertas]) \
                  or "  Sin alertas activas"

    anchor = "\n".join(anchor_items) or "  Sin datos disponibles"

    return f"""
CONTEXTO ACTUAL DEL DASHBOARD:
  Barrio: {barrio} (Comuna {comuna})
  Indicador activo: {contexto.get('indicador', 'icv')}
  Período analizado: {contexto.get('rango', '30d')}

VALORES VERIFICADOS — CITAR CON [N] AL USARLOS:
{anchor}

ALERTAS ESTADÍSTICAS ACTIVAS:
{alertas_str}
"""


def build_messages(query: str, contexto: dict, indicadores: dict,
                   historial: list, rol: str) -> list:
    """Ensambla las 5 capas del prompt en formato Gemini."""
    system = SYSTEM_BASE + "\n" + ROLE_PROMPTS.get(rol, ROLE_PROMPTS["ciudadano"])
    context_block = build_context_prompt(contexto, indicadores)

    messages = []

    # Capa 1+2: system + role (primer turno de usuario ficticio para Gemini)
    messages.append({
        "role": "user",
        "parts": [system + "\n\n" + context_block +
                  "\n\nACUSA RECIBO del contexto respondiendo solo: 'Listo.'"]
    })
    messages.append({"role": "model", "parts": ["Listo."]})

    # Capa 4: historial (últimos 5 turnos)
    for msg in historial[-10:]:
        role_gemini = "user" if msg.get("rol") == "user" else "model"
        messages.append({"role": role_gemini, "parts": [msg.get("contenido", "")]})

    # Capa 5: query actual
    messages.append({"role": "user", "parts": [query]})

    return messages
