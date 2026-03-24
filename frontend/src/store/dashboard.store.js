import { create } from 'zustand'

// ─── ESTADO GLOBAL DEL DASHBOARD ─────────────────────────────────────────────
// Una sola fuente de verdad. Todos los componentes leen/escriben aquí.

export const useDashboardStore = create((set, get) => ({

  // ── Contexto del usuario ──────────────────────────────────────────────────
  rol: 'ciudadano',          // ciudadano | comerciante | gobierno | investigador
  setRol: (rol) => set({ rol, historialChat: [] }), // reset chat al cambiar rol

  // ── Selección geográfica ──────────────────────────────────────────────────
  barrioActivo:  null,       // objeto con { nombre, comuna, id, bbox }
  indicadorActivo: 'icv',   // icv | seguridad | aire | movilidad | economia
  rangoTiempo: '30d',       // 7d | 30d | 90d | 1y

  setBarrio:     (barrio)    => set({ barrioActivo: barrio }),
  setIndicador:  (ind)       => set({ indicadorActivo: ind }),
  setRango:      (rango)     => set({ rangoTiempo: rango }),

  // ── Estado de alertas ─────────────────────────────────────────────────────
  alertasActivas: [],
  agregarAlerta: (alerta) => set(s => ({
    alertasActivas: [...s.alertasActivas.filter(a => a.id !== alerta.id), alerta]
  })),
  limpiarAlertas: () => set({ alertasActivas: [] }),

  // ── LLM Chat ─────────────────────────────────────────────────────────────
  historialChat:  [],
  llmCargando:    false,
  llmError:       null,

  agregarMensaje: (mensaje) => set(s => ({
    historialChat: [...s.historialChat, mensaje]
  })),
  setLLMCargando: (val)   => set({ llmCargando: val }),
  setLLMError:    (err)   => set({ llmError: err }),
  limpiarChat:    ()      => set({ historialChat: [], llmError: null }),

  // ── Glosario ──────────────────────────────────────────────────────────────
  nivelGlosario: 'simple',   // simple | tecnico (se adapta al rol)
  setNivelGlosario: (n) => set({ nivelGlosario: n }),

  // ── Computed: contexto completo para el LLM ───────────────────────────────
  // Se llama desde el hook useLLM para construir el context prompt
  getContextoLLM: () => {
    const s = get()
    return {
      rol:             s.rol,
      barrio:          s.barrioActivo?.nombre ?? 'No seleccionado',
      comuna:          s.barrioActivo?.comuna ?? '-',
      indicador:       s.indicadorActivo,
      rango:           s.rangoTiempo,
      alertas:         s.alertasActivas,
    }
  }
}))
