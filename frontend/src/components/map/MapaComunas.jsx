import { useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { motion } from 'framer-motion'
import { useComunasGeoJSON } from '../../hooks/useIndicadores'
import { useDashboardStore } from '../../store/dashboard.store'
import 'leaflet/dist/leaflet.css'

// Medellín centrado
const MEDELLIN_CENTER = [6.2442, -75.5812]
const ZOOM_INICIAL    = 12

// Colorea cada barrio según el indicador activo y su score
function getColorPorScore(score) {
  if (score === undefined || score === null) return '#E5E7EB'
  if (score >= 90) return '#059669'
  if (score >= 75) return '#10B981'
  if (score >= 50) return '#F59E0B'
  if (score >= 30) return '#F97316'
  return '#EF4444'
}

// Componente para hacer zoom a barrio seleccionado
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

  // Estilo dinámico por feature
  const getEstilo = (feature) => {
    const id    = feature.properties?.CODIGO ?? feature.properties?.codigo
    const datos = indicadoresData?.[id]
    const score = datos?.[indicadorActivo] ?? null

    const estaActivo = barrioActivo?.id === id

    return {
      fillColor:   getColorPorScore(score),
      fillOpacity: estaActivo ? 0.9 : 0.65,
      color:       estaActivo ? '#1D4ED8' : '#FFFFFF',
      weight:      estaActivo ? 2.5 : 0.8,
    }
  }

  // Eventos por barrio (hover + click)
  const onCadaFeature = (feature, layer) => {
    const nombre = feature.properties?.NOMBRE ?? feature.properties?.nombre ?? 'Barrio'
    const id     = feature.properties?.CODIGO ?? feature.properties?.codigo
    const datos  = indicadoresData?.[id] ?? {}

    const tipo  = feature.properties?.tipo ?? 'Comuna'
    const ident = feature.properties?.identificacion ?? ''
    layer.bindTooltip(`
      <div class="font-semibold text-gray-800">${nombre}</div>
      <div class="text-xs text-gray-400 mb-1">${ident || tipo}</div>
      <div class="text-xs text-gray-600">
        ICV: <b>${datos.icv_score ?? '—'}</b>/100 &nbsp;|&nbsp;
        AQI: <b>${datos.aqi ?? '—'}</b>
        ${datos.fuente_aire === 'siata_real' ? ' 🟢' : ''}
      </div>
    `, { sticky: true, className: 'rounded-lg shadow-lg border-0' })

    layer.on({
      click: () => setBarrio({
        id,
        nombre,
        tipo,
        identificacion: ident,
        bbox:    layer.getBounds(),
      }),
      mouseover: (e) => e.target.setStyle({ fillOpacity: 0.9, weight: 2 }),
      mouseout:  (e) => e.target.setStyle(getEstilo(feature)),
    })
  }

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl animate-pulse
                      flex items-center justify-center text-gray-400">
        Cargando mapa...
      </div>
    )
  }

  return (
    <motion.div
      className="w-full h-full rounded-xl overflow-hidden shadow-sm"
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

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm
                      rounded-xl p-3 shadow-md text-xs space-y-1 z-[1000]">
        <p className="font-semibold text-gray-600 mb-1.5">
          {indicadorActivo.toUpperCase()}
        </p>
        {[
          { color: '#059669', label: '90–100 Excelente' },
          { color: '#10B981', label: '75–89 Bueno' },
          { color: '#F59E0B', label: '50–74 Atención' },
          { color: '#F97316', label: '30–49 Riesgo' },
          { color: '#EF4444', label: '0–29 Crítico' },
          { color: '#E5E7EB', label: 'Sin datos' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
