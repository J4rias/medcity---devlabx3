import { useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { motion } from 'framer-motion'
import { useComunasGeoJSON } from '../../hooks/useIndicadores'
import { useDashboardStore } from '../../store/dashboard.store'
import 'leaflet/dist/leaflet.css'

const MEDELLIN_CENTER = [6.2442, -75.5812]
const ZOOM_INICIAL    = 13   // zoom más cercano para ver barrios

const INDICADOR_LABELS = {
  icv:       { label: 'Calidad de Vida', unit: '/100' },
  seguridad: { label: 'Seguridad',       unit: '/100' },
  aire:      { label: 'Calidad del Aire', unit: 'AQI' },
  movilidad: { label: 'Movilidad',       unit: '/100' },
  economia:  { label: 'Economía',        unit: '/100' },
}

const LEYENDA_RANGOS = [
  { color: '#16A34A', label: 'Excelente', rango: '90–100' },
  { color: '#4ADE80', label: 'Bueno',     rango: '75–89'  },
  { color: '#FACC15', label: 'Atención',  rango: '50–74'  },
  { color: '#FB923C', label: 'Riesgo',    rango: '30–49'  },
  { color: '#EF4444', label: 'Crítico',   rango: '0–29'   },
  { color: '#CBD5E1', label: 'Sin datos', rango: '—'      },
]

// Colores más saturados y con más contraste que antes
function getColorPorScore(score) {
  if (score === undefined || score === null) return '#CBD5E1'  // gris azulado visible
  if (score >= 90) return '#16A34A'   // verde fuerte
  if (score >= 75) return '#4ADE80'   // verde claro
  if (score >= 50) return '#FACC15'   // amarillo
  if (score >= 30) return '#FB923C'   // naranja
  return '#EF4444'                    // rojo
}

function ZoomAlBarrio({ barrio }) {
  const map = useMap()
  useEffect(() => {
    if (barrio?.bbox) {
      map.fitBounds(barrio.bbox, { padding: [40, 40], maxZoom: 15 })
    }
  }, [barrio, map])
  return null
}

export function MapaComunas({ indicadoresData }) {
  const { barrioActivo, setBarrio, indicadorActivo } = useDashboardStore()
  const { data: geojson, isLoading } = useComunasGeoJSON()

  const getEstilo = (feature) => {
    const id         = feature.properties?.CODIGO ?? feature.properties?.codigo
    const datos      = indicadoresData?.[id]
    const score      = datos?.[indicadorActivo] ?? null
    const estaActivo = barrioActivo?.id === id

    return {
      fillColor:   getColorPorScore(score),
      fillOpacity: estaActivo ? 0.95 : 0.78,    // más opaco que antes
      color:       estaActivo ? '#1E3A8A' : '#334155',  // borde oscuro visible
      weight:      estaActivo ? 3.5 : 1.5,       // bordes más gruesos
    }
  }

  const onCadaFeature = (feature, layer) => {
    const nombre  = feature.properties?.NOMBRE ?? feature.properties?.nombre ?? 'Barrio'
    const id      = feature.properties?.CODIGO ?? feature.properties?.codigo
    const datos   = indicadoresData?.[id] ?? {}
    const tipo    = feature.properties?.tipo ?? 'Comuna'
    const ident   = feature.properties?.identificacion ?? ''
    const score   = datos[indicadorActivo]
    const color   = getColorPorScore(score)
    const indInfo = INDICADOR_LABELS[indicadorActivo] ?? { label: indicadorActivo, unit: '' }

    layer.bindTooltip(`
      <div style="min-width:150px">
        <div style="font-weight:700;color:#1F2937;font-size:13px;margin-bottom:2px">${nombre}</div>
        <div style="color:#6B7280;font-size:11px;margin-bottom:6px">${ident || tipo}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <div style="width:12px;height:12px;border-radius:4px;background:${color};flex-shrink:0;box-shadow:0 1px 3px rgba(0,0,0,0.2)"></div>
          <span style="font-size:12px;color:#374151">
            ${indInfo.label}: <b style="color:${color}">${score ?? 'Sin datos'}</b>${score != null ? indInfo.unit : ''}
          </span>
        </div>
        ${datos.aqi !== undefined && indicadorActivo !== 'aire' ? `
          <div style="font-size:11px;color:#9CA3AF">
            AQI: <b>${datos.aqi ?? '—'}</b> ${datos.fuente_aire === 'siata_real' ? '<span style="color:#16A34A">● Real</span>' : ''}
          </div>` : ''}
      </div>
    `, { sticky: true, className: 'map-tooltip' })

    layer.on({
      click: () => setBarrio({ id, nombre, tipo, identificacion: ident, bbox: layer.getBounds() }),
      mouseover: (e) => e.target.setStyle({
        fillOpacity: 1,
        weight: 3,
        color: '#1E3A8A',
      }),
      mouseout: (e) => e.target.setStyle(getEstilo(feature)),
    })
  }

  if (isLoading) {
    return (
      <div className="w-full h-full bg-slate-100 rounded-xl animate-pulse
                      flex items-center justify-center text-slate-400 text-sm gap-2">
        <span className="w-4 h-4 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
        Cargando mapa...
      </div>
    )
  }

  const indInfo = INDICADOR_LABELS[indicadorActivo] ?? { label: indicadorActivo, unit: '' }

  return (
    <motion.div
      className="w-full h-full rounded-xl overflow-hidden relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.14)' }}
    >
      <MapContainer
        center={MEDELLIN_CENTER}
        zoom={ZOOM_INICIAL}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        minZoom={11}
        maxZoom={17}
      >
        {/* Tile: Stadia Alidade Smooth — más colorido, calles visibles, sin saturar */}
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://stadiamaps.com/">Stadia Maps</a>, © <a href="https://openmaptiles.org/">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={20}
        />

        {geojson && (
          <GeoJSON
            key={`${indicadorActivo}-${barrioActivo?.id}`}
            data={geojson}
            style={getEstilo}
            onEachFeature={onCadaFeature}
          />
        )}

        <ZoomAlBarrio barrio={barrioActivo} />
      </MapContainer>

      {/* Leyenda flotante */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-4 left-4 z-[1000]"
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(10px)',
          borderRadius: '14px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          padding: '10px 12px',
          minWidth: '148px',
          border: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        <p className="text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#00A651', display: 'inline-block', flexShrink: 0 }} />
          {indInfo.label}
        </p>
        {LEYENDA_RANGOS.map(({ color, label, rango }) => (
          <div key={label} className="flex items-center justify-between gap-2 py-0.5">
            <div className="flex items-center gap-1.5">
              <div style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: color, flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }} />
              <span className="text-xs text-gray-600">{label}</span>
            </div>
            <span className="text-xs text-gray-400 font-mono tabular-nums">{rango}</span>
          </div>
        ))}
        {barrioActivo && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5">
            <span className="text-xs">📍</span>
            <span className="text-xs font-semibold text-gray-700 truncate">{barrioActivo.nombre}</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
