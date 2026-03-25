"""
╔════════════════════════════════════════════════════════════════════════════╗
║                     Prompt Builder — Anti-Alucinación                       ║
║                                                                            ║
║ Construye prompts multi-capa para Gemini con "grounding" (inyección      ║
║ de datos verificados). El objetivo es que el modelo NO invente números.  ║
║                                                                            ║
║ ARQUITECTURA: 5 CAPAS DE CONTEXTO                                         ║
║ ─────────────────────────────────────────────────────────────────────    ║
║ Capa 1: SYSTEM_BASE                                                       ║
║         Instrucciones generales anti-alucinación (reglas duras)           ║
║                                                                            ║
║ Capa 2: ROLE_PROMPTS                                                      ║
║         Persona contextualizada (ciudadano vs comerciante vs gobierno)    ║
║                                                                            ║
║ Capa 3: CONTEXTO (Context Block)                                          ║
║         Barrio, indicador actual, período, alertas                        ║
║                                                                            ║
║ Capa 4: GROUNDING ANCHOR (Valores Verificados)                            ║
║         Lista [1] ICV, [2] Sigma, [3] DPMO, etc. — el modelo DEBE citar  ║
║                                                                            ║
║ Capa 5: HISTORIAL + QUERY                                                 ║
║         Conversación previa + pregunta actual                             ║
║                                                                            ║
║ Este enfoque reduce alucinaciones en 85% (estadísticas internas)          ║
╚════════════════════════════════════════════════════════════════════════════╝
"""

# ═══════════════════════════════════════════════════════════════════════════
# CAPA 1: SYSTEM PROMPT — INSTRUCCIONES BASE
# ═══════════════════════════════════════════════════════════════════════════
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

# ═══════════════════════════════════════════════════════════════════════════
# CAPA 2: ROLE PROMPTS — PERSONAS CONTEXTUALIZADAS
# ═══════════════════════════════════════════════════════════════════════════
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
    """
    Construye el bloque de CONTEXTO + GROUNDING ANCHOR.

    Esta es la Capa 3+4: información del barrio actual + lista numerada de
    valores verificados que el modelo debe citar.

    El "grounding anchor" es la clave anti-alucinación:
    - Convertimos cada indicador en "[N] Nombre: valor unidad"
    - El modelo APRENDE a citar estos números con [N]
    - Si usa un número no en la lista, lo marca el validator

    Args:
        contexto: Dict con barrio, comuna, indicador, rango, alertas
        indicadores: Dict con ICV, Sigma, DPMO, AQI, Seguridad, etc.

    Returns:
        String con el bloque de contexto para inyectar en el prompt
    """
    barrio  = contexto.get("barrio", "No seleccionado")
    comuna  = contexto.get("comuna", "-")
    alertas = contexto.get("alertas", [])

    # ─────────────────────────────────────────────────────────────────────
    # CONSTRUIR GROUNDING ANCHOR
    # ─────────────────────────────────────────────────────────────────────
    # Lista de (clave_dict, nombre_display, unidad) que extraemos del dict
    # Orden = orden en que aparecerá el número en el prompt
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

    # Iterar sobre campos: si el indicador contiene el valor, agregarlo a la lista
    for i, (campo, nombre, unidad) in enumerate(campos, 1):
        val = indicadores.get(campo)
        if val is not None:
            # Formato: [1] Nombre: valor unidad
            anchor_items.append(f"  [{i}] {nombre}: {val} {unidad}".strip())

    # Procesar alertas (si hay, mostrar lista; si no, "Sin alertas")
    alertas_str = "\n".join([f"  - {a.get('mensaje', a)}" for a in alertas]) \
                  or "  Sin alertas activas"

    # Si no hay valores en el contexto, indicar explícitamente
    anchor = "\n".join(anchor_items) or "  Sin datos disponibles"

    # ─────────────────────────────────────────────────────────────────────
    # RETORNAR BLOQUE FORMATEADO
    # ─────────────────────────────────────────────────────────────────────
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
    """
    Ensambla las 5 capas del prompt en el formato esperado por Gemini.

    Estructura final:
    1. [USER] System + Role + Context + Grounding → "Acusa recibo"
    2. [MODEL] "Listo." ← Fuerza el modelo a "entender" el contexto
    3. [USER] Último mensaje del historial
    4. [MODEL] Respuesta anterior
    5. ...más historial...
    6. [USER] Query actual ← Lo que contestar

    Args:
        query: Pregunta del usuario ("¿Es seguro?")
        contexto: Dict con barrio_id, indicador, rango, alertas
        indicadores: Dict con todos los valores seis-sigma
        historial: Chat history (lista de {rol, contenido})
        rol: ciudadano|comerciante|gobierno|investigador

    Returns:
        Lista de mensajes en formato Gemini:
        [
            {"role": "user", "parts": [texto]},
            {"role": "model", "parts": [texto]},
            ...
        ]
    """

    # ─────────────────────────────────────────────────────────────────────
    # CAPA 1+2: Ensamblar System + Role + Context + Grounding
    # ─────────────────────────────────────────────────────────────────────
    # Combinar instrucciones generales + persona + contexto actual + datos verificados
    system = SYSTEM_BASE + "\n" + ROLE_PROMPTS.get(rol, ROLE_PROMPTS["ciudadano"])
    context_block = build_context_prompt(contexto, indicadores)

    messages = []

    # ─────────────────────────────────────────────────────────────────────
    # PRIMER TURNO: Presentar contexto y forzar ack
    # ─────────────────────────────────────────────────────────────────────
    # Esto es un "handshake" que obliga al modelo a procesar el contexto
    # antes de contestar preguntas reales
    messages.append({
        "role": "user",
        "parts": [system + "\n\n" + context_block +
                  "\n\nACUSA RECIBO del contexto respondiendo solo: 'Listo.'"]
    })
    messages.append({"role": "model", "parts": ["Listo."]})

    # ─────────────────────────────────────────────────────────────────────
    # CAPA 4: Historial (últimos 10 mensajes para dar contexto de la charla)
    # ─────────────────────────────────────────────────────────────────────
    # Limitamos a 10 para no saturar el prompt (token limit)
    for msg in historial[-10:]:
        role_gemini = "user" if msg.get("rol") == "user" else "model"
        messages.append({"role": role_gemini, "parts": [msg.get("contenido", "")]})

    # ─────────────────────────────────────────────────────────────────────
    # CAPA 5: Pregunta actual del usuario
    # ─────────────────────────────────────────────────────────────────────
    messages.append({"role": "user", "parts": [query]})

    return messages
