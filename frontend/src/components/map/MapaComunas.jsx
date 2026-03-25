import { useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { motion } from 'framer-motion'
import { useComunasGeoJSON } from '../../hooks/useIndicadores'
import { useDashboardStore } from '../../store/dashboard.store'
import 'leaflet/dist/leaflet.css'

const MEDELLIN_CENTER = [6.2442, -75.5812]
const ZOOM_INICIAL    = 12

const INDICADOR_LABELS = {
  icv:       { label: 'Calidad de Vida', unit: '/100' },
  seguridad: { label: 'Seguridad',       unit: '/100' },
  aire:      { label: 'Calidad del Aire', unit: 'AQI' },
  movilidad: { label: 'Movilidad',       unit: '/100' },
  economia:  { label: 'Economía',        unit: '/100' },
}

const LEYENDA_RANGOS = [
  { color: '#059669', label: 'Excelente', rango: '90–100' },
  { color: '#10B981', label: 'Bueno',     rango: '75–89'  },
  { color: '#F59E0B', label: 'Atención',  rango: '50–74'  },
  { color: '#F97316', label: 'Riesgo',    rango: '30–49'  },
  { color: '#EF4444', label: 'Crítico',   rango: '0–29'   },
  { color: '#E5E7EB', label: 'Sin datos', rango: '—'      },
]

function getColorPorScore(score) {
  if (score === undefined || score === null) return '#E5E7EB'
  if (score >= 90) return '#059669'
  if (score >= 75) return '#10B981'
  if (score >= 50) return '#F59E0B'
  if (score >= 30) return '#F97316'
  return '#EF4444'
}

function ZoomAlBarrio({ barrio }) {
  const map = useMap()
  useEffect(() => {
    if (barrio?.bbox) {
      map.fitBounds(barrio.bbox, { padding: [30, 30] })
    }
  }, [barrio, map])
  return null
}

export function MapaComunas({ indicadoresData }) {
  const { barrioActivo, setBarrio, indicadorActivo } = useDashboardStore()
  const { data: geojson, isLoading } = useComunasGeoJSON()

  const getEstilo = (feature) => {
    const id    = feature.properties?.CODIGO ?? feature.properties?.codigo
    const datos = indicadoresData?.[id]
    const score = datos?.[indicadorActivo] ?? null
    const estaActivo = barrioActivo?.id === id

    return {
      fillColor:   getColorPorScore(score),
      fillOpacity: estaActivo ? 0.92 : 0.68,
      color:       estaActivo ? '#1D4ED8' : '#FFFFFF',
      weight:      estaActivo ? 3 : 0.8,
    }
  }

  const onCadaFeature = (feature, layer) => {
    const nombre = feature.properties?.NOMBRE ?? feature.properties?.nombre ?? 'Barrio'
    const id     = feature.properties?.CODIGO ?? feature.properties?.codigo
    const datos  = indicadoresData?.[id] ?? {}
    const tipo   = feature.properties?.tipo ?? 'Comuna'
    const ident  = feature.properties?.identificacion ?? ''

    const score  = datos[indicadorActivo]
    const color  = getColorPorScore(score)
    const indInfo = INDICADOR_LABELS[indicadorActivo] ?? { label: indicadorActivo, unit: '' }

    layer.bindTooltip(`
      <div style="min-width:140px">
        <div style="font-weight:600; color:#1F2937; font-size:13px; margin-bottom:2px">${nombre}</div>
        <div style="color:#9CA3AF; font-size:11px; margin-bottom:6px">${ident || tipo}</div>
        <div style="display:flex; align-items:center; gap:6px">
          <div style="width:10px;height:10px;border-radius:3px;background:${color};flex-shrink:0"></div>
          <span style="font-size:12px;color:#374151">
            ${indInfo.label}: <b style="color:${color}">${score ?? '—'}</b>${score ? indInfo.unit : ''}
          </span>
        </div>
        ${datos.aqi !== undefined && indicadorActivo !== 'aire' ? `
          <div style="font-size:11px;color:#9CA3AF;margin-top:4px">
            AQI: ${datos.aqi ?? '—'} ${datos.fuente_aire === 'siata_real' ? '🟢' : ''}
          </div>` : ''}
      </div>
    `, { sticky: true, className: 'map-tooltip' })

    layer.on({
      click: () => setBarrio({
        id,
        nombre,
        tipo,
        identificacion: ident,
        bbox: layer.getBounds(),
      }),
      mouseover: (e) => e.target.setStyle({ fillOpacity: 0.92, weight: 2.5 }),
      mouseout:  (e) => e.target.setStyle(getEstilo(feature)),
    })
  }

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl animate-pulse
                      flex items-center justify-center text-gray-400 text-sm">
        Cargando mapa...
      </div>
    )
  }

  const indInfo = INDICADOR_LABELS[indicadorActivo] ?? { label: indicadorActivo, unit: '' }

  return (
    <motion.div
      className="w-full h-full rounded-xl overflow-hidden shadow-sm relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MapContainer
        center={MEDELLIN_CENTER}
        zoom={ZOOM_INICIAL}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://carto.com/">CARTO</a>'
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

      {/* Leyenda flotante mejorada */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 left-4 z-[1000]"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: '14px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          padding: '12px 14px',
          minWidth: '150px',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-1.5">
          <span style={{
            display: 'inline-block',
            width: 6, height: 6,
            borderRadius: '50%',
            backgroundColor: '#00A651',
            flexShrink: 0
          }} />
          {indInfo.label}
        </p>
        {LEYENDA_RANGOS.map(({ color, label, rango }) => (
          <div key={label} className="flex items-center justify-between gap-3 py-0.5">
            <div className="flex items-center gap-1.5">
              <div style={{
                width: 10, height: 10,
                borderRadius: 3,
                backgroundColor: color,
                flexShrink: 0,
              }} />
              <span className="text-xs text-gray-600">{label}</span>
            </div>
            <span className="text-xs text-gray-400 font-mono">{rango}</span>
          </div>
        ))}

        {/* Barrio activo en la leyenda */}
        {barrioActivo && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 truncate">
              📍 <span className="font-medium text-gray-700">{barrioActivo.nombre}</span>
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
