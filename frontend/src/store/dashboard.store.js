/*
╔════════════════════════════════════════════════════════════════════════════╗
║                    Dashboard Store — Estado Global (Zustand)               ║
║                                                                            ║
║ Una sola fuente de verdad para TODO el estado de la aplicación.          ║
║ Todos los componentes leen y escriben AQUÍ, no en props.                 ║
║                                                                            ║
║ VENTAJAS:                                                                 ║
║ - No prop drilling (pasar props 5 niveles deep)                          ║
║ - Cambios reactivos: al actualizar store, todos los componentes se        ║
║   re-renderean automáticamente                                            ║
║ - DevTools: Zustand tiene integración para Redux DevTools                ║
║                                                                            ║
║ PATRÓN: Cada estado + su setter (action) están juntos                    ║
╚════════════════════════════════════════════════════════════════════════════╝
*/

import { create } from 'zustand'

// ═══════════════════════════════════════════════════════════════════════════
// TIENDA ZUSTAND — ESTADO GLOBAL DEL DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
export const useDashboardStore = create((set, get) => ({

  // ─────────────────────────────────────────────────────────────────────
  // SECCIÓN 1: CONTEXTO DEL USUARIO (Rol)
  // ─────────────────────────────────────────────────────────────────────
  // El rol define:
  // - Qué sugerencias de chat aparecen
  // - Qué KPIs se muestran en el dashboard
  // - Qué tono tiene el prompt para Gemini
  rol: 'ciudadano',          // Opciones: ciudadano, comerciante, gobierno, investigador

  setRol: (rol) => set({
    rol,
    historialChat: []      // Reset del chat al cambiar de rol (nueva persona)
  }),

  // ─────────────────────────────────────────────────────────────────────
  // SECCIÓN 2: SELECCIÓN GEOGRÁFICA
  // ─────────────────────────────────────────────────────────────────────
  // Qué barrio está seleccionado y qué indicador activo
  barrioActivo:     null,     // Objeto con { nombre, id, comuna, bbox, geom }
  indicadorActivo:  'icv',    // Qué métrica mostrar: icv, seguridad, aire, movilidad, economia
  rangoTiempo:      '30d',    // Período de análisis: 7d, 30d, 90d, 1y

  // Actions para cambiar selección
  setBarrio:    (barrio) => set({ barrioActivo: barrio }),
  setIndicador: (ind)    => set({ indicadorActivo: ind }),
  setRango:     (rango)  => set({ rangoTiempo: rango }),

  // ─────────────────────────────────────────────────────────────────────
  // SECCIÓN 3: ALERTAS ESTADÍSTICAS
  // ─────────────────────────────────────────────────────────────────────
  // Cuando el indicador cruza límites de control, se genera una alerta
  // Estructura: { id, mensaje, tipo: 'warning'|'critical', ts }
  alertasActivas: [],

  agregarAlerta: (alerta) => set(s => ({
    // Evitar duplicados: si existe con mismo id, reemplazar
    alertasActivas: [...s.alertasActivas.filter(a => a.id !== alerta.id), alerta]
  })),

  limpiarAlertas: () => set({ alertasActivas: [] }),

  // ─────────────────────────────────────────────────────────────────────
  // SECCIÓN 4: CHAT CON LLM
  // ─────────────────────────────────────────────────────────────────────
  // Historial conversacional + estado de carga
  historialChat:  [],         // Array de { rol: 'user'|'assistant', contenido, ts }
  llmCargando:    false,      // ¿Esperando respuesta de Gemini?
  llmError:       null,       // Mensaje de error si la llamada falla

  // Actions
  agregarMensaje: (mensaje) => set(s => ({
    historialChat: [...s.historialChat, mensaje]
  })),

  setLLMCargando: (val) => set({ llmCargando: val }),
  setLLMError:    (err) => set({ llmError: err }),
  limpiarChat:    ()    => set({ historialChat: [], llmError: null }),

  // ─────────────────────────────────────────────────────────────────────
  // SECCIÓN 5: GLOSARIO (Niveles de tecnicismo)
  // ─────────────────────────────────────────────────────────────────────
  // Adaptar explicaciones según el usuario
  nivelGlosario: 'simple',   // simple → explicaciones breves
                              // tecnico → definiciones estadísticas completas

  setNivelGlosario: (n) => set({ nivelGlosario: n }),

  // ─────────────────────────────────────────────────────────────────────
  // SECCIÓN 6: HELPER COMPUTED — getContextoLLM()
  // ─────────────────────────────────────────────────────────────────────
  // Esta función COMPUTA (no almacena) el contexto actual para enviar al LLM
  // Se llama cada vez que se hace una pregunta en el chat
  // Retorna: { barrio, barrio_id, comuna, rol, indicador, rango, alertas }
  getContextoLLM: () => {
    const s = get()  // Obtener estado actual
    return {
      rol:        s.rol,
      barrio:     s.barrioActivo?.nombre ?? 'No seleccionado',
      barrio_id:  s.barrioActivo?.id ?? '',
      comuna:     s.barrioActivo?.comuna ?? '-',
      indicador:  s.indicadorActivo,
      rango:      s.rangoTiempo,
      alertas:    s.alertasActivas,
    }
  }

}))
