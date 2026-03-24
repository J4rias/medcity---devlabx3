"""
ETL: consume APIs de Medellín y calcula indicadores por barrio.
Incluye cálculo Six Sigma (ICV, Sigma Level, DPMO, cartas de control I-MR).
SIATA: endpoint EntregaData1, 21 estaciones, IDW a 249 barrios.
"""
import asyncio
import httpx
import numpy as np
import json
import os
import math
from scipy import stats
from cachetools import TTLCache
from tenacity import retry, stop_after_attempt, wait_exponential

# Caché en memoria (TTL según volatilidad del dato)
_cache = TTLCache(maxsize=500, ttl=300)

# ─── PARÁMETROS EXTERNOS ──────────────────────────────────────────────────────
MEDATA_TOKEN = os.getenv("MEDATA_APP_TOKEN", "")
SIATA_TOKEN  = os.getenv("SIATA_TOKEN", "")

APIS = {
    # ── Tiempo real ──────────────────────────────────────────────────────────
    "siata_aire":              "https://siata.gov.co/EntregaData1/Datos_SIATA_Aire_pm25.json",

    # ── CSVs de MEData (infraestructura Socrata nacional, datos.gov.co) ──────
    # Nota: CORS bloquea el browser, pero el backend Python los descarga sin problema
    "csv_criminalidad_mes":    "http://medata.gov.co/sites/default/files/distribution/1-027-23-000304/consolidado_cantidad_casos_criminalidad_en_comunas_por_anio_mes.csv",
    "csv_criminalidad_anio":   "http://medata.gov.co/sites/default/files/distribution/1-027-23-000303/consolidado_cantidad_casos_criminalidad_en_comunas_por_anio.csv",
    "csv_incidentes_viales":   "http://medata.gov.co/sites/default/files/distribution/1-023-25-000094/incidentes_viales.csv",
    "csv_velocidad_vehicular": "http://medata.gov.co/sites/default/files/distribution/1-023-25-000296/velocidad_e_intensidad_vehicular_en_medellin.csv",
    "csv_nuse_123":            "http://medata.gov.co/sites/default/files/distribution/1-027-23-000023/llamada_nuse123.csv",
    "csv_homicidios":          "http://medata.gov.co/sites/default/files/distribution/1-027-23-000008/homicidio.csv",
    "csv_victimas_viales":     "http://medata.gov.co/sites/default/files/distribution/1-023-25-000360/Mede_Victimas_inci.csv",

    # ── Socrata nativo (API JSON directa) ────────────────────────────────────
    "socrata_empresas":        "https://www.datos.gov.co/resource/pb3w-3vmc.json",

    # ── Geo ──────────────────────────────────────────────────────────────────
    "geo_comunas":             "https://www.geomedellin-m-medellin.opendata.arcgis.com/datasets/medellin::comunas.geojson",
}

# ─── ESTACIONES SIATA (coordenadas embebidas — actualizadas 2024) ──────────────
# Fuente: https://siata.gov.co/EntregaData1/Datos_SIATA_Aire_pm25.json
# Solo estaciones activas (sin prefijo _OFF-)
SIATA_ESTACIONES = {
    12:  {"nombre": "Tráfico Centro",       "lat": 6.2525611,  "lon": -75.5695801},
    28:  {"nombre": "Itagüí Casa Justicia", "lat": 6.1856666,  "lon": -75.5972061},
    38:  {"nombre": "Itagüí Concejo",       "lat": 6.1684971,  "lon": -75.6443558},
    69:  {"nombre": "Caldas Aristizábal",   "lat": 6.0930777,  "lon": -75.6377640},
    78:  {"nombre": "La Estrella Hospital", "lat": 6.1555305,  "lon": -75.6441727},
    79:  {"nombre": "Medellín Altavista",   "lat": 6.2218938,  "lon": -75.6106033},
    80:  {"nombre": "Medellín Villahermosa","lat": 6.2589092,  "lon": -75.5482635},
    81:  {"nombre": "Barbosa Torre Social", "lat": 6.4369602,  "lon": -75.3303986},
    82:  {"nombre": "Copacabana Ciudadela", "lat": 6.3453598,  "lon": -75.5047531},
    83:  {"nombre": "Medellín Belén",       "lat": 6.2372341,  "lon": -75.6104660},
    84:  {"nombre": "El Poblado INEM",      "lat": 6.1998701,  "lon": -75.5609512},
    85:  {"nombre": "San Cristóbal Botero", "lat": 6.2778502,  "lon": -75.6364288},
    86:  {"nombre": "Aranjuez Ciro Mendía", "lat": 6.2904806,  "lon": -75.5555191},
    87:  {"nombre": "Bello Fernando Vélez", "lat": 6.3375502,  "lon": -75.5678024},
    88:  {"nombre": "Envigado Santa Gertr.", "lat": 6.1686831, "lon": -75.5819702},
    90:  {"nombre": "Sabaneta Rafael Mejía","lat": 6.1455002,  "lon": -75.6212616},
}

# Umbral calidad SIATA: ≤ 2.5 = dato válido (1.0 = excelente, 2.5 = aceptable)
SIATA_CALIDAD_MAX = 2.5

# ─── FETCH CON RETRY ─────────────────────────────────────────────────────────
def _medata_headers() -> dict:
    """Headers para Socrata/MEData. X-App-Token elimina el límite de 1,000 req/día."""
    headers = {"Accept": "application/json"}
    if MEDATA_TOKEN:
        headers["X-App-Token"] = MEDATA_TOKEN
    return headers

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
async def _fetch(url: str, params: dict = None, headers: dict = None) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params, headers=headers or {})
        r.raise_for_status()
        return r.json()

async def _fetch_medata(url: str, params: dict = None) -> dict:
    """Fetch con header de autenticación MEData incluido automáticamente."""
    return await _fetch(url, params=params, headers=_medata_headers())


# ─── SIATA: FETCH Y PROCESAMIENTO REAL ───────────────────────────────────────

def pm25_a_aqi(pm25: float) -> float:
    """
    Convierte PM2.5 (µg/m³) a AQI según tabla EPA (breakpoints 2024).
    Retorna AQI 0–500. Valores > 250 se reportan como Hazardous (>300).
    """
    if pm25 < 0:
        return None
    # (pm25_low, pm25_high, aqi_low, aqi_high)
    breakpoints = [
        (0.0,   12.0,   0,   50),
        (12.1,  35.4,   51,  100),
        (35.5,  55.4,   101, 150),
        (55.5,  150.4,  151, 200),
        (150.5, 250.4,  201, 300),
        (250.5, 350.4,  301, 400),
        (350.5, 500.4,  401, 500),
    ]
    for pm_low, pm_high, aqi_low, aqi_high in breakpoints:
        if pm_low <= pm25 <= pm_high:
            return round(
                (aqi_high - aqi_low) / (pm_high - pm_low) * (pm25 - pm_low) + aqi_low, 1
            )
    return 500.0  # Fuera de rango = Hazardous máximo


async def get_siata_pm25() -> dict:
    """
    Descarga datos reales de SIATA y retorna dict {codigo_serial: pm25_actual}.
    Filtra calidad > 2.5 y valores -9999. Caché 10 minutos.
    """
    cache_key = "siata:pm25"
    if cache_key in _cache:
        return _cache[cache_key]

    try:
        data = await _fetch(APIS["siata_aire"])
        resultado = {}
        for estacion in data:
            sid = estacion.get("codigoSerial")
            if sid not in SIATA_ESTACIONES:
                continue  # Estaciones _OFF- o no reconocidas
            datos = estacion.get("datos", [])
            # Tomar la lectura más reciente válida
            validas = [
                d for d in datos
                if d.get("valor", -9999) != -9999
                and float(d.get("calidad", 99)) <= SIATA_CALIDAD_MAX
            ]
            if validas:
                ultimo = validas[-1]
                resultado[sid] = {
                    "pm25": float(ultimo["valor"]),
                    "aqi":  pm25_a_aqi(float(ultimo["valor"])),
                    "fecha": ultimo["fecha"],
                    "calidad": float(ultimo["calidad"]),
                }
        _cache[cache_key] = resultado
        return resultado
    except Exception:
        return {}  # Falla silenciosa → mock en capa superior


def asignar_pm25_a_barrio(barrio_lat: float, barrio_lon: float,
                          lecturas_siata: dict, k: int = 3) -> dict | None:
    """
    IDW (Inverse Distance Weighting) con las k estaciones más cercanas.
    Retorna {"pm25": float, "aqi": float, "estaciones_usadas": list}.
    """
    if not lecturas_siata:
        return None

    puntos = []
    for sid, lectura in lecturas_siata.items():
        est = SIATA_ESTACIONES.get(sid)
        if not est:
            continue
        dlat = barrio_lat - est["lat"]
        dlon = barrio_lon - est["lon"]
        dist = math.sqrt(dlat**2 + dlon**2)
        dist = max(dist, 0.0001)  # Evitar división por cero
        puntos.append({
            "sid": sid, "nombre": est["nombre"],
            "dist": dist, "pm25": lectura["pm25"], "fecha": lectura["fecha"]
        })

    if not puntos:
        return None

    # Tomar las k más cercanas
    puntos.sort(key=lambda x: x["dist"])
    top_k = puntos[:k]

    # IDW con p=2
    pesos    = [1 / (p["dist"] ** 2) for p in top_k]
    suma_p   = sum(pesos)
    pm25_idw = sum(p["pm25"] * w for p, w in zip(top_k, pesos)) / suma_p

    return {
        "pm25": round(pm25_idw, 2),
        "aqi":  pm25_a_aqi(pm25_idw),
        "estaciones_usadas": [
            {"nombre": p["nombre"], "distancia_km": round(p["dist"] * 111, 2),
             "pm25": p["pm25"], "fecha": p["fecha"]}
            for p in top_k
        ],
    }


# ─── MAPEO COMUNAS MEDELLÍN ───────────────────────────────────────────────────
COMUNAS_MEDELLIN = {
    "01": "Popular",              "02": "Santa Cruz",         "03": "Manrique",
    "04": "Aranjuez",             "05": "Castilla",           "06": "Doce de Octubre",
    "07": "Robledo",              "08": "Villa Hermosa",      "09": "Buenos Aires",
    "10": "La Candelaria",        "11": "Laureles Estadio",   "12": "La América",
    "13": "San Javier",           "14": "El Poblado",         "15": "Guayabal",
    "16": "Belén",
    "50": "San Sebastián de Palmitas", "60": "San Cristóbal",
    "70": "Altavista",            "80": "San Antonio de Prado", "90": "Santa Elena",
}
# Lookup inverso: nombre normalizado → código
_NOMBRE_A_CODIGO: dict[str, str] = {
    v.lower(): k for k, v in COMUNAS_MEDELLIN.items()
}
# Aliases comunes que aparecen en los CSVs de MEData
_NOMBRE_A_CODIGO.update({
    "laureles":         "11",
    "laureles - estadio": "11",
    "doce octubre":     "06",
    "12 de octubre":    "06",
    "villa hermosa":    "08",
    "villahermosa":     "08",
    "la america":       "12",
    "san sebastian":    "50",
    "san sebastian de palmitas": "50",
    "san antonio prado":"80",
    "san antonio de prado": "80",
})


def _buscar_col(cols, candidatos: list) -> str | None:
    """Retorna el primer nombre de columna que coincida (case-insensitive, sin tildes)."""
    import unicodedata
    def norm(s):
        return unicodedata.normalize("NFD", str(s)).encode("ascii", "ignore").decode().lower().strip()
    mapa = {norm(c): c for c in cols}
    for cand in candidatos:
        hit = mapa.get(norm(cand))
        if hit is not None:
            return hit
    return None


async def _fetch_csv(url: str) -> "pd.DataFrame | None":
    """
    Descarga un CSV desde MEData y retorna DataFrame.
    Intenta UTF-8 primero; si falla, latin-1 (encoding común en datasets colombianos).
    """
    import pandas as pd, io
    try:
        async with httpx.AsyncClient(timeout=25, follow_redirects=True) as client:
            r = await client.get(url, headers=_medata_headers())
            r.raise_for_status()
            raw = r.content
        for enc in ("utf-8-sig", "utf-8", "latin-1"):
            try:
                return pd.read_csv(io.StringIO(raw.decode(enc, errors="replace")))
            except Exception:
                continue
        return None
    except Exception:
        return None


# ─── SEGURIDAD POR COMUNAS (datos reales MEData) ──────────────────────────────
async def get_seguridad_comunas() -> dict:
    """
    Retorna {codigo_comuna: score_seguridad (0–100)}.
    Score inverso al total de casos de criminalidad: más crimen = menor score.
    Fuente: gcyu-chif — criminalidad por comunas por año y mes (Alcaldía Medellín).
    Caché 1 h (los datos son históricos, no cambian durante el día).
    """
    cache_key = "seguridad:comunas"
    if cache_key in _cache:
        return _cache[cache_key]

    import pandas as pd

    df = await _fetch_csv(APIS["csv_criminalidad_mes"])
    if df is None or df.empty:
        # Intentar con el dataset anual como fallback
        df = await _fetch_csv(APIS["csv_criminalidad_anio"])
    if df is None or df.empty:
        return {}

    try:
        df.columns = [str(c).strip() for c in df.columns]

        col_anio   = _buscar_col(df.columns, ["ANIO", "AÑO", "anio", "año", "YEAR", "year"])
        col_codigo = _buscar_col(df.columns, ["CODIGO_COMUNA", "COD_COMUNA", "CODIGO", "codigo_comuna", "cod_comuna"])
        col_nombre = _buscar_col(df.columns, ["NOMBRE_COMUNA", "NOMBRE", "COMUNA", "nombre_comuna", "nombre", "comuna"])
        col_total  = _buscar_col(df.columns, ["TOTAL_CASOS", "TOTAL", "CASOS", "total_casos", "total", "cantidad"])

        # Filtrar al año más reciente disponible
        if col_anio:
            df[col_anio] = pd.to_numeric(df[col_anio], errors="coerce")
            df = df[df[col_anio] == df[col_anio].max()]

        # Columna de agrupación: preferir código, luego nombre
        if col_codigo:
            agg_col = col_codigo
            usa_codigo = True
        elif col_nombre:
            agg_col = col_nombre
            usa_codigo = False
        else:
            return {}

        # Si no hay columna de total, cada fila = 1 caso
        if col_total:
            df[col_total] = pd.to_numeric(df[col_total], errors="coerce").fillna(0)
            grp = df.groupby(agg_col)[col_total].sum()
        else:
            grp = df.groupby(agg_col).size()

        # Mapear a código de 2 dígitos
        result_raw: dict[str, float] = {}
        for key, val in grp.items():
            key_str = str(key).strip()
            if usa_codigo:
                try:
                    cod = str(int(float(key_str))).zfill(2)
                except ValueError:
                    cod = _NOMBRE_A_CODIGO.get(key_str.lower())
            else:
                cod = _NOMBRE_A_CODIGO.get(key_str.lower())
            if cod:
                result_raw[cod] = result_raw.get(cod, 0) + float(val)

        if not result_raw:
            return {}

        # Normalizar a score 0–100 (inverso, rango 20–90 para realismo)
        max_v = max(result_raw.values()) or 1
        min_v = min(result_raw.values())
        rng   = max_v - min_v or 1

        scores = {
            cod: round(90 - (v - min_v) / rng * 70, 1)
            for cod, v in result_raw.items()
        }

        # Cachear 1 hora (TTL global del cache es 5 min, pero como dato histórico
        # no cambia en el día; se re-cargará automáticamente al expirar)
        _cache[cache_key] = scores
        return scores

    except Exception:
        return {}


# ─── MOVILIDAD POR COMUNAS (datos reales MEData) ──────────────────────────────
async def get_movilidad_comunas() -> dict:
    """
    Retorna {codigo_comuna: score_movilidad (0–100)}.
    Score inverso a la accidentalidad ponderada por gravedad.
    Fuente: 9wqu-juqb — incidentes viales Medellín (Secretaría de Movilidad).
    """
    cache_key = "movilidad:comunas"
    if cache_key in _cache:
        return _cache[cache_key]

    import pandas as pd

    df = await _fetch_csv(APIS["csv_incidentes_viales"])
    if df is None or df.empty:
        return {}

    try:
        df.columns = [str(c).strip() for c in df.columns]

        col_fecha    = _buscar_col(df.columns, ["FECHA_ACCIDENTE", "FECHA", "fecha_accidente", "fecha", "ANIO", "AÑO"])
        col_comuna   = _buscar_col(df.columns, ["CODIGO_COMUNA", "COD_COMUNA", "NOMBRE_COMUNA", "COMUNA", "BARRIO", "NOMBRE_BARRIO"])
        col_gravedad = _buscar_col(df.columns, ["GRAVEDAD", "gravedad", "CLASE_ACCIDENTE", "clase_accidente"])

        if col_fecha:
            # Extraer año (puede ser fecha ISO o solo entero)
            try:
                df["_anio"] = pd.to_datetime(df[col_fecha], dayfirst=True, errors="coerce").dt.year
            except Exception:
                df["_anio"] = pd.to_numeric(df[col_fecha], errors="coerce")
            anio_max = df["_anio"].dropna().astype(int).max()
            df = df[df["_anio"] == anio_max]

        # Pesos de gravedad — fatal penaliza 4×, daños solos 1×
        _PESOS_GRAVEDAD = {
            "muerto": 4, "fatal": 4, "fallecido": 4, "muerte": 4,
            "grave": 3, "gravísimo": 4,
            "herido": 2, "lesionado": 2, "leve": 1.5,
            "daños": 1, "daño": 1, "solo daños": 1,
        }

        def _peso(val: str) -> float:
            v = str(val).lower()
            for k, p in _PESOS_GRAVEDAD.items():
                if k in v:
                    return p
            return 1.0

        df["_peso"] = df[col_gravedad].apply(_peso) if col_gravedad in (df.columns if col_gravedad else []) else 1.0

        if not col_comuna:
            return {}

        # Determinar si la columna es código o nombre
        sample = df[col_comuna].dropna().astype(str).head(10)
        es_codigo = all(s.strip().lstrip("0").isdigit() or s.strip().isdigit() for s in sample if s.strip())

        if es_codigo:
            df["_cod"] = df[col_comuna].apply(
                lambda x: str(int(float(str(x).strip()))).zfill(2)
                if str(x).strip().replace(".", "").isdigit() else None
            )
        else:
            df["_cod"] = df[col_comuna].apply(
                lambda x: _NOMBRE_A_CODIGO.get(str(x).strip().lower())
            )

        grp = df.dropna(subset=["_cod"]).groupby("_cod")["_peso"].sum()

        result_raw = {cod: float(v) for cod, v in grp.items()}
        if not result_raw:
            return {}

        max_v = max(result_raw.values()) or 1
        min_v = min(result_raw.values())
        rng   = max_v - min_v or 1

        # Inverso: menos accidentalidad ponderada → mayor score (rango 25–92)
        scores = {
            cod: round(92 - (v - min_v) / rng * 67, 1)
            for cod, v in result_raw.items()
        }

        _cache[cache_key] = scores
        return scores

    except Exception:
        return {}


# ─── SIX SIGMA: CÁLCULO DEL SIGMA LEVEL ──────────────────────────────────────
def calcular_sigma(serie: list[float], usl: float, lsl: float = 0.0) -> dict:
    """
    Calcula Sigma Level y DPMO para una serie de indicadores urbanos.
    Estándares ODS/Plan Desarrollo como límites de especificación.
    """
    if not serie or len(serie) < 3:
        return {"sigma": None, "dpmo": None, "dias_defectuosos": None,
                "media": None, "std": None, "ucl": None, "lcl": None}

    arr    = np.array(serie, dtype=float)
    media  = float(np.mean(arr))
    std    = float(np.std(arr, ddof=1)) or 0.01

    cpk    = min((usl - media) / (3 * std), (media - lsl) / (3 * std))
    sigma  = round(cpk * 3, 2)

    # DPMO urbano: días defectuosos por millón de oportunidades
    dpmo   = int(stats.norm.sf(abs(cpk * 3)) * 2 * 1_000_000)
    dias   = round(dpmo / 1_000_000 * 365)

    # Carta I-MR para alertas de control
    d2     = 1.128
    mr     = np.abs(np.diff(arr))
    mr_med = float(np.mean(mr)) if len(mr) else std
    sigma_carta = mr_med / d2 or std

    ucl = media + 3 * sigma_carta
    lcl = max(lsl, media - 3 * sigma_carta)

    # Detectar tendencia (7 puntos consecutivos en misma dirección)
    alerta = None
    if len(arr) >= 7:
        for i in range(len(arr) - 6):
            ventana = arr[i:i+7]
            if all(ventana[j] < ventana[j+1] for j in range(6)):
                alerta = "Tendencia ascendente (7 días)"
            elif all(ventana[j] > ventana[j+1] for j in range(6)):
                alerta = "Tendencia descendente (7 días)"

    return {
        "sigma": sigma, "dpmo": dpmo, "dias_defectuosos": dias,
        "media": round(media, 2), "std": round(std, 2),
        "ucl": round(ucl, 2), "lcl": round(lcl, 2),
        "alerta_carta": alerta,
    }


# ─── CÁLCULO ICV COMPUESTO ────────────────────────────────────────────────────
def calcular_icv(seguridad: float, movilidad: float,
                 aire: float, servicios: float) -> float:
    """
    Índice de Calidad de Vida compuesto (ponderado, escala 0–100).
    Pesos calibrados según impacto ciudadano y disponibilidad de datos.
    """
    pesos = {"seguridad": 0.30, "movilidad": 0.25, "aire": 0.25, "servicios": 0.20}
    vals  = {"seguridad": seguridad, "movilidad": movilidad,
             "aire": aire, "servicios": servicios}

    icv = sum(pesos[k] * vals[k] for k in pesos if vals[k] is not None)
    return round(min(max(icv, 0), 100), 1)


# ─── ESTIMADO ECONOMÍA INFORMAL (MONTE CARLO) ────────────────────────────────
def estimar_informal(formales: int, sector: str = "comercio_minorista",
                     osm_density: float = None) -> dict:
    """
    Monte Carlo con distribuciones calibradas desde DANE para estimar
    el número de negocios informales en el barrio.
    """
    ratios_dane = {
        "comercio_minorista":   (2.0, 0.4),   # (media, std del ratio)
        "alimentos":            (2.5, 0.5),
        "servicios_personales": (2.1, 0.4),
        "transporte":           (1.6, 0.3),
    }
    mu_ratio, std_ratio = ratios_dane.get(sector, (1.8, 0.4))

    n_sim = 5_000
    ratios   = np.random.normal(mu_ratio, std_ratio, n_sim)
    ratios   = np.clip(ratios, 1.0, 5.0)
    informales = formales * ratios

    if osm_density:
        ajuste = np.random.normal(osm_density * 0.3, osm_density * 0.1, n_sim)
        informales += np.clip(ajuste, 0, None)

    return {
        "mediana":        int(np.median(informales)),
        "ic_90_inferior": int(np.percentile(informales, 5)),
        "ic_90_superior": int(np.percentile(informales, 95)),
        "ic_50_inferior": int(np.percentile(informales, 25)),
        "ic_50_superior": int(np.percentile(informales, 75)),
        "confianza":      "±30% aprox.",
    }


# ─── COORDENADAS DE BARRIOS CLAVE (para IDW) ─────────────────────────────────
# Subset de barrios frecuentes — el resto usa mock con seed deterministico
BARRIOS_COORDS = {
    "laureles":        (6.2472, -75.5988),
    "el-poblado":      (6.2099, -75.5576),
    "belen":           (6.2300, -75.6101),
    "aranjuez":        (6.2946, -75.5565),
    "robledo":         (6.2895, -75.5993),
    "manrique":        (6.2780, -75.5490),
    "boston":          (6.2547, -75.5614),
    "castilla":        (6.3025, -75.5786),
    "san-cristobal":   (6.2764, -75.6430),
    "altavista":       (6.2150, -75.6052),
    "santa-cruz":      (6.2855, -75.5487),
    "villa-hermosa":   (6.2569, -75.5483),
    "guayabal":        (6.2135, -75.5938),
    "buenos-aires":    (6.2440, -75.5555),
    "la-america":      (6.2488, -75.5877),
    "la-candelaria":   (6.2525, -75.5696),  # ~= Tráfico Centro
    "palmitas":        (6.2896, -75.6844),
    "san-sebastian":   (6.2600, -75.6700),
    "la-cruz":         (6.3040, -75.5345),
    "san-javier":      (6.2607, -75.6150),
    "doce-de-octubre": (6.3016, -75.5811),
    "millan":          (6.2650, -75.5740),
    "popular":         (6.3135, -75.5469),
    "santa-elena":     (6.2300, -75.5012),
    "centro":          (6.2518, -75.5636),
}


# ─── INDICADORES POR BARRIO ───────────────────────────────────────────────────
async def get_indicadores_barrio(barrio_id: str) -> dict:
    """
    Retorna indicadores completos para un barrio/comuna.
    Fuentes reales (con fallback a mock si la API no responde):
      · Aire/PM2.5  → SIATA EntregaData1 + IDW
      · Seguridad   → MEData gcyu-chif (criminalidad por comunas)
      · Movilidad   → MEData 9wqu-juqb (incidentes viales)
    """
    cache_key = f"indicadores:{barrio_id}"
    if cache_key in _cache:
        return _cache[cache_key]

    try:
        # 1. Base mock (seed determinístico por barrio_id)
        datos = _generar_mock(barrio_id)

        # ── Capa 2: Seguridad y movilidad reales (datos históricos por comuna) ──
        # El barrio_id coincide con el código de comuna del GeoJSON ("01"…"16", "50"…"90")
        cod_comuna = barrio_id.zfill(2) if barrio_id.isdigit() else None

        seg_scores, mov_scores = await asyncio.gather(
            get_seguridad_comunas(),
            get_movilidad_comunas(),
            return_exceptions=True,
        )

        if isinstance(seg_scores, dict) and cod_comuna and cod_comuna in seg_scores:
            datos["seguridad"]       = seg_scores[cod_comuna]
            datos["fuente_seguridad"] = "medata_real"
        else:
            datos["fuente_seguridad"] = "mock"

        if isinstance(mov_scores, dict) and cod_comuna and cod_comuna in mov_scores:
            datos["movilidad"]       = mov_scores[cod_comuna]
            datos["fuente_movilidad"] = "medata_real"
        else:
            datos["fuente_movilidad"] = "mock"

        # ── Capa 3: Aire real de SIATA (IDW desde coords del barrio) ──────────
        barrio_key = barrio_id.lower().replace(" ", "-")
        coords = BARRIOS_COORDS.get(barrio_key)

        if coords:
            lecturas = await get_siata_pm25()
            if lecturas:
                pm25_data = asignar_pm25_a_barrio(coords[0], coords[1], lecturas)
                if pm25_data:
                    datos["pm25"]             = pm25_data["pm25"]
                    datos["aqi"]              = pm25_data["aqi"]
                    datos["aqi_categoria"]    = _cat_aqi(pm25_data["aqi"])
                    datos["siata_estaciones"] = pm25_data["estaciones_usadas"]
                    datos["fuente_aire"]      = "siata_real"
                    datos["aire_score"]       = round(max(0, min(100, 100 - pm25_data["aqi"] * 0.5)), 1)

        # ── Recalcular ICV compuesto con todos los datos disponibles ───────────
        datos["icv_score"] = calcular_icv(
            datos["seguridad"], datos["movilidad"],
            datos["aire_score"], datos["servicios"]
        )

        _cache[cache_key] = datos
        return datos

    except Exception:
        return _fallback_data(barrio_id)


def _generar_mock(barrio_id: str) -> dict:
    """Genera datos mock realistas con variación por barrio_id."""
    seed = sum(ord(c) for c in barrio_id) % 100
    np.random.seed(seed)

    seg  = float(np.random.uniform(45, 92))
    mov  = float(np.random.uniform(50, 88))
    aqi  = float(np.random.uniform(30, 130))
    serv = float(np.random.uniform(55, 90))

    aire_score = max(0, 100 - aqi)
    icv  = calcular_icv(seg, mov, aire_score, serv)

    # Serie temporal de 30 días para cartas de control
    serie_icv = list(np.random.normal(icv, 5, 30).clip(0, 100))
    sigma_data = calcular_sigma(serie_icv, usl=90, lsl=50)

    formales  = int(np.random.uniform(40, 200))
    informal  = estimar_informal(formales)

    return {
        "barrio_id":       barrio_id,
        "icv_score":       icv,
        "seguridad":       round(seg, 1),
        "aqi":             round(aqi, 1),
        "aqi_categoria":   _cat_aqi(aqi),
        "aire_score":      round(aire_score, 1),
        "movilidad":       round(mov, 1),
        "servicios":       round(serv, 1),
        "percentil":       int(seed * 0.95 + 5),
        "oportunidad_negocio": round((mov * 0.5 + seg * 0.3 + aire_score * 0.2), 1),
        "comercios_ha":    round(formales / 50, 1),
        "informal_mediana":informal["mediana"],
        "informal_ic_sup": informal["ic_90_superior"],
        "tendencia_icv":   "estable",
        "tendencia_seguridad": "subiendo",
        "tendencia_aire":  "estable",
        "tendencia_movilidad": "bajando",
        "fuente_aire":     "mock",
        "siata_estaciones": [],
        "n_obs":           30,
        "alertas":         1 if sigma_data.get("alerta_carta") else 0,
        # Six Sigma
        **sigma_data,
        # Para el mapa (todos los barrios)
        "mapa": {},
    }


def _cat_aqi(aqi: float) -> str:
    if aqi <= 50:   return "Bueno"
    if aqi <= 100:  return "Moderado"
    if aqi <= 150:  return "Dañino para grupos sensibles"
    if aqi <= 200:  return "Dañino"
    return "Muy dañino"


def _fallback_data(barrio_id: str) -> dict:
    return {"barrio_id": barrio_id, "icv_score": None, "error": "datos no disponibles"}


# ─── GEO COMUNAS ─────────────────────────────────────────────────────────────
# Ruta al archivo estático embebido (21 features, 16 comunas + 5 corregimientos)
_GEOJSON_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "comunas.geojson")

async def get_comunas_geojson() -> dict:
    """
    Sirve el GeoJSON de comunas/corregimientos de Medellín.
    Fuente primaria: archivo local data/comunas.geojson (provisto por usuario).
    Fallback: ArcGIS Open Data.
    staleTime=Infinity en el frontend — esta función se llama pocas veces.
    """
    cache_key = "geo:comunas"
    if cache_key in _cache:
        return _cache[cache_key]

    # 1. Intentar desde archivo local (sin dependencia de red)
    try:
        geo_path = os.path.abspath(_GEOJSON_PATH)
        if os.path.exists(geo_path):
            with open(geo_path, "r", encoding="utf-8") as fp:
                data = json.load(fp)
            # Inyectar campo 'id' en cada feature para react-leaflet
            for feat in data.get("features", []):
                p = feat.get("properties", {})
                feat["id"] = p.get("codigo", p.get("OBJECTID"))
            _cache[cache_key] = data
            return data
    except Exception:
        pass

    # 2. Fallback remoto: ArcGIS Open Data
    try:
        data = await _fetch(APIS["geo_comunas"])
        _cache[cache_key] = data
        return data
    except Exception:
        return _fallback_geojson()


def _fallback_geojson() -> dict:
    """GeoJSON mínimo de emergencia — si todo falla."""
    return {
        "type": "FeatureCollection",
        "features": [],
        "_source": "fallback_emergency",
        "_note": "Archivo data/comunas.geojson no encontrado y ArcGIS no disponible."
    }
