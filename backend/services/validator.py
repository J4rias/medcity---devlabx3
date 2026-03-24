"""
Actuador 3 — Validador de alucinaciones numéricas.
Verifica que cada número en la respuesta exista en el contexto real.
"""
import re
import math
from dataclasses import dataclass, field


@dataclass
class ValidationResult:
    es_valida:        bool
    violaciones:      list = field(default_factory=list)
    score_confianza:  float = 1.0


def _aplanar_numericos(d: dict, prefijo="") -> list[float]:
    """Extrae recursivamente todos los valores numéricos del contexto."""
    vals = []
    for v in d.values():
        if isinstance(v, (int, float)) and not math.isnan(v):
            vals.append(float(v))
        elif isinstance(v, dict):
            vals.extend(_aplanar_numericos(v))
        elif isinstance(v, list):
            for item in v:
                if isinstance(item, (int, float)):
                    vals.append(float(item))
    return vals


def validar_respuesta(respuesta: str, indicadores: dict) -> ValidationResult:
    """
    Verifica que los números en la respuesta coincidan con el contexto.
    Tolerancia ±3% para números derivados/redondeados.
    """
    if not respuesta or not indicadores:
        return ValidationResult(es_valida=True)

    valores_permitidos = _aplanar_numericos(indicadores)
    violaciones = []

    # Extraer todos los números de la respuesta (ignora años y porcentajes de contexto)
    patron = r'\b(\d{1,3}(?:[.,]\d{1,3})?)\b'
    matches = re.finditer(patron, respuesta)

    for m in matches:
        raw  = m.group().replace(',', '.')
        num  = float(raw)

        # Ignorar números pequeños (1, 2, 3...) y muy grandes (años)
        if num < 5 or num > 10_000_000:
            continue

        # Verificar si existe en los valores permitidos (±3%)
        encontrado = any(
            abs(num - v) / max(abs(v), 1) <= 0.03
            for v in valores_permitidos
        )

        if not encontrado:
            contexto_frase = respuesta[max(0, m.start()-40):m.end()+40]
            violaciones.append({
                "numero":  num,
                "frase":   contexto_frase.strip(),
                "tipo":    "NUMERO_NO_ENCONTRADO_EN_CONTEXTO",
            })

    score = max(0.0, 1.0 - len(violaciones) * 0.2)

    return ValidationResult(
        es_valida=len(violaciones) == 0,
        violaciones=violaciones,
        score_confianza=score,
    )


def generar_fallback(contexto: dict, indicadores: dict, rol: str) -> str:
    """Respuesta basada en reglas cuando el LLM falla — siempre entrega valor."""
    barrio = contexto.get("barrio", "el barrio seleccionado")
    icv    = indicadores.get("icv_score", "—")
    sigma  = indicadores.get("sigma", "—")
    alertas_raw = indicadores.get("alertas", 0)
    alertas = alertas_raw if isinstance(alertas_raw, int) else len(alertas_raw) if isinstance(alertas_raw, list) else 0

    templates = {
        "ciudadano": (
            f"En {barrio}, el [[T:ICV]] es {icv}/100. "
            f"{'⚠️ Hay alertas activas — revisa los indicadores en pantalla.' if alertas else '✅ Sin alertas activas en este momento.'}"
        ),
        "comerciante": (
            f"Flujo peatonal en {barrio}: {indicadores.get('movilidad', '—')}/100. "
            f"Densidad comercial: {indicadores.get('comercios_ha', '—')} negocios/ha. "
            f"Seguridad: {indicadores.get('seguridad', '—')}/100."
        ),
        "gobierno": (
            f"{barrio} — [[T:ICV]]: {icv}/100 · [[T:Sigma Level]]: {sigma}σ · "
            f"Alertas activas: {alertas}. "
            f"Percentil Medellín: {indicadores.get('percentil', '—')}."
        ),
        "investigador": (
            f"[[T:ICV]] = {icv}/100 · σ = {sigma} · [[T:DPMO]] = {indicadores.get('dpmo', '—')} · "
            f"n = {indicadores.get('n_obs', '—')} observaciones. "
            f"Desv. estándar: {indicadores.get('std', '—')}."
        ),
    }

    return templates.get(rol, templates["ciudadano"])
