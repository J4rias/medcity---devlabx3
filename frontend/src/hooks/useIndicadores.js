import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const API = '/api'

// ─── FETCHERS ────────────────────────────────────────────────────────────────

async function fetchIndicadoresBarrio(barrioId) {
  const res = await fetch(`${API}/indicadores/${barrioId}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchComunasGeoJSON() {
  const res = await fetch(`${API}/geo/comunas`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchAPIStatus() {
  const res = await fetch(`${API}/status`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchTendencia(barrioId, indicador, rango) {
  const res = await fetch(`${API}/tendencia/${barrioId}?indicador=${indicador}&rango=${rango}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ─── HOOKS ───────────────────────────────────────────────────────────────────

// Indicadores de un barrio específico
export function useIndicadoresBarrio(barrioId) {
  return useQuery({
    queryKey:  ['indicadores', barrioId],
    queryFn:   () => fetchIndicadoresBarrio(barrioId),
    enabled:   !!barrioId,
    staleTime: 5 * 60 * 1000,
    onError:   () => toast.error('Error cargando indicadores del barrio'),
  })
}

// GeoJSON de comunas (se carga una vez)
export function useComunasGeoJSON() {
  return useQuery({
    queryKey:  ['geo', 'comunas'],
    queryFn:   fetchComunasGeoJSON,
    staleTime: Infinity,           // estático, no cambia
    cacheTime: Infinity,
  })
}

// Status de todas las APIs externas
export function useAPIStatus() {
  return useQuery({
    queryKey:      ['api-status'],
    queryFn:       fetchAPIStatus,
    refetchInterval: 2 * 60 * 1000,  // verificar cada 2 min
    staleTime:     60 * 1000,
  })
}

// Tendencia temporal de un indicador
export function useTendencia(barrioId, indicador, rango) {
  return useQuery({
    queryKey:  ['tendencia', barrioId, indicador, rango],
    queryFn:   () => fetchTendencia(barrioId, indicador, rango),
    enabled:   !!barrioId && !!indicador,
    staleTime: 10 * 60 * 1000,
  })
}

// Hook de refresh manual — reactualiza todas las fuentes
export function useRefreshAll() {
  const queryClient = useQueryClient()

  return async () => {
    const loadingToast = toast.loading('Actualizando todas las fuentes...')
    try {
      await queryClient.invalidateQueries()
      toast.success('Datos actualizados', { id: loadingToast })
    } catch {
      toast.error('Algunos datos no pudieron actualizarse', { id: loadingToast })
    }
  }
}
