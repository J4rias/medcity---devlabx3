import { useState, useCallback } from 'react'
import { useDashboardStore } from '../store/dashboard.store'
import { toast } from 'sonner'

const API = '/api'

// ─── SUGERENCIAS CONTEXTUALES POR ROL E INDICADOR ────────────────────────────
export const SUGERENCIAS = {
  ciudadano: {
    seguridad:  ['¿Es seguro caminar por aquí de noche?', '¿Ha mejorado la seguridad este mes?', '¿Cómo me comparo con barrios vecinos?'],
    aire:       ['¿Cuándo es mejor salir a caminar o ejercitarme?', '¿Debo preocuparme hoy por la calidad del aire?', '¿Qué días son más contaminados?'],
    movilidad:  ['¿Cuáles son los horarios de más tráfico?', '¿Hay buena conectividad de transporte?'],
    icv:        ['¿Qué tan bueno es mi barrio comparado con Medellín?', '¿Qué está mejorando y qué está empeorando?'],
    economia:   ['¿Hay muchos negocios informales cerca?', '¿Qué tipo de comercio predomina?'],
  },
  comerciante: {
    movilidad:  ['¿Cuándo hay más clientes potenciales pasando?', '¿Cuáles son los mejores horarios para abrir?', '¿Qué días de la semana tienen más flujo?'],
    seguridad:  ['¿Es seguro tener un negocio aquí?', '¿En qué horarios hay más riesgo?'],
    economia:   ['¿Hay mucha competencia del mismo tipo de negocio?', '¿Dónde hay más oportunidad de negocio?', '¿Cuál es el potencial de la economía informal?'],
    icv:        ['¿Este barrio es atractivo para mis clientes objetivo?', '¿Vale la pena invertir aquí?'],
  },
  gobierno: {
    icv:        ['¿Qué comunas necesitan más inversión urgente?', '¿Cuáles son las brechas de equidad más críticas?', 'Genera un argumento para priorizar inversión aquí.'],
    seguridad:  ['¿Hay alertas estadísticas activas?', '¿Qué intervención reduciría más los incidentes?'],
    aire:       ['¿Qué zonas tienen AQI crónicamente alto?', '¿Cuál es el costo de salud estimado?'],
    movilidad:  ['¿Dónde se necesita más infraestructura de transporte?'],
  },
  investigador: {
    icv:        ['¿Hay correlación entre movilidad y seguridad?', '¿Qué indicador tiene mayor varianza entre barrios?', '¿Cuáles son las anomalías estadísticas del mes?'],
    aire:       ['¿Hay estacionalidad en el AQI de este barrio?', '¿Cómo se compara con el promedio latinoamericano?'],
    economia:   ['¿Cuál es la incertidumbre del estimado de economía informal?', 'Describe las limitaciones metodológicas del ICV.'],
  },
}

// ─── HOOK PRINCIPAL LLM ───────────────────────────────────────────────────────
export function useLLM() {
  const { rol, getContextoLLM, historialChat, agregarMensaje, setLLMCargando, setLLMError } = useDashboardStore()
  const [respuestaStreaming, setRespuestaStreaming] = useState('')

  const enviar = useCallback(async (query) => {
    if (!query.trim()) return

    setLLMCargando(true)
    setLLMError(null)
    setRespuestaStreaming('')

    // Agregar mensaje del usuario al historial
    agregarMensaje({ rol: 'user', contenido: query, ts: Date.now() })

    try {
      const response = await fetch(`${API}/llm/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          contexto:  getContextoLLM(),
          historial: historialChat.slice(-10), // últimos 5 turnos
          rol,
        }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      // ── Streaming SSE ──
      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let   full    = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split('\n\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.done) break
            if (data.chunk) {
              full += data.chunk
              setRespuestaStreaming(full)
            }
          } catch { /* chunk parcial, ignorar */ }
        }
      }

      // Guardar respuesta completa en historial
      agregarMensaje({ rol: 'assistant', contenido: full, ts: Date.now() })
      setRespuestaStreaming('')

    } catch (err) {
      const msg = err.message.includes('429')
        ? 'Demasiadas consultas. Espera 30 segundos.'
        : 'El asistente no está disponible. Revisa el estado de las APIs.'
      setLLMError(msg)
      toast.error(msg)
    } finally {
      setLLMCargando(false)
    }
  }, [rol, historialChat, getContextoLLM, agregarMensaje, setLLMCargando, setLLMError])

  return { enviar, respuestaStreaming }
}
