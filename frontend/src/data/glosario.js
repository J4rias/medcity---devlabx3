// ─── GLOSARIO DE TÉRMINOS TÉCNICOS ───────────────────────────────────────────
// Cada término tiene definición simple (ciudadanos) y técnica (gobierno/investigadores)
// El LLM marca términos con [[T:término]] y GlossaryText.jsx los convierte en tooltips

export const GLOSARIO = {
  'AQI': {
    simple:  'Índice de Calidad del Aire. Escala 0–500: menor es mejor. Por encima de 100 puede afectar tu salud.',
    tecnico: 'Air Quality Index: índice compuesto de PM2.5, PM10, O₃, NO₂, SO₂ y CO según estándares EPA/IDEAM.',
    umbral:  '0–50 Bueno · 51–100 Moderado · 101–150 Dañino grupos sensibles · 151–200 Dañino · >200 Muy dañino',
  },
  'PM2.5': {
    simple:  'Partículas microscópicas en el aire que vienen de carros y fábricas. Pueden entrar a los pulmones.',
    tecnico: 'Material particulado de diámetro aerodinámico ≤ 2.5 μm. Red SIATA: 16 estaciones en Medellín.',
    umbral:  'OMS: <15 μg/m³ anual · Colombia (Res. 2254/2017): <25 μg/m³ anual',
  },
  'ICV': {
    simple:  'Índice de Calidad de Vida. Un número del 0 al 100 que resume qué tan buenas son las condiciones de un barrio.',
    tecnico: 'Índice compuesto ponderado: seguridad 30%, movilidad 25%, calidad del aire 25%, servicios públicos 20%.',
    umbral:  '<50 Crítico · 50–74 En atención · 75–89 Bueno · 90–100 Excelente',
  },
  'Sigma Level': {
    simple:  'Escala del 1 al 6 que mide qué tan bien funciona un proceso. Un barrio con 4σ o más está en buen nivel.',
    tecnico: 'Número de desviaciones estándar entre la media del proceso y el límite de especificación más cercano. Basado en Six Sigma (Motorola, 1986).',
    umbral:  '1σ = 69% defectos · 3σ = 0.27% · 4σ = 0.0063% · 6σ = 0.00034%',
  },
  'DPMO': {
    simple:  'Días con problemas por millón de oportunidades. Cuanto menor, mejor calidad de vida en el barrio.',
    tecnico: 'Defects Per Million Opportunities. Métrica Six Sigma: DPMO = (1 - Φ(Cpk × 3)) × 1,000,000.',
    umbral:  '<3,400 = 4σ (objetivo) · <233 = 5σ · <3.4 = 6σ (clase mundial)',
  },
  'I-MR': {
    simple:  'Gráfica que detecta cuando algo cambia de forma anormal durante varios días seguidos.',
    tecnico: 'Carta de Control Individual - Rango Móvil (Shewhart). Detecta causas especiales de variación. UCL/LCL = X̄ ± 3σ.',
    umbral:  'Alarma: punto fuera de UCL/LCL · Tendencia: 7 puntos consecutivos en una dirección',
  },
  'Cpk': {
    simple:  'Qué tan bien cumple un barrio con los estándares de calidad de vida. Más alto es mejor.',
    tecnico: 'Índice de capacidad de proceso centrado. Cpk = min((USL-μ)/3σ, (μ-LSL)/3σ). Cpk ≥ 1.33 es aceptable.',
    umbral:  '<1.0 Incapaz · 1.0–1.33 Marginal · 1.33–1.67 Capaz · >1.67 Excelente',
  },
  'UCL': {
    simple:  'Límite superior de control. Si un indicador supera esta línea, hay algo inusual que revisar.',
    tecnico: 'Upper Control Limit: X̄ + 3σ. En carta I-MR: UCL = X̄ + 2.66 × MR̄.',
    umbral:  null,
  },
  'Percentil': {
    simple:  'Posición de un barrio respecto a todos los demás. Percentil 80 = mejor que el 80% de Medellín.',
    tecnico: 'Medida de posición que indica el porcentaje de observaciones que quedan por debajo del valor.',
    umbral:  null,
  },
  'Monte Carlo': {
    simple:  'Técnica que simula miles de escenarios posibles para estimar un rango de valores cuando no hay datos exactos.',
    tecnico: 'Método estadístico de simulación estocástica. Se ejecutan N iteraciones con distribuciones de probabilidad calibradas para generar intervalos de confianza.',
    umbral:  null,
  },
  'OSM': {
    simple:  'OpenStreetMap: mapa colaborativo donde voluntarios registran negocios, calles y lugares, incluyendo locales informales.',
    tecnico: 'Proyecto cartográfico open-source con licencia ODbL. API Overpass disponible sin autenticación.',
    umbral:  null,
  },
}
